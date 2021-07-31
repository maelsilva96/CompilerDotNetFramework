const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');
const fs = require('fs');
const exec = require('@actions/exec');

async function run () {
    try {
        const urlFileVsWhere = "https://github.com/microsoft/vswhere/releases/download/2.8.4/vswhere.exe";
        const pathFileVsWhere = "C:\\VsWhere\\vswhere.exe";
        const pathFolderMainProject = core.getInput('pathFolderMainProject');
        const projectFilePathAndName = core.getInput('projectFilePathAndName');
        const typeConfiguration = core.getInput('typeConfiguration');
        const typePlatform = core.getInput('typePlatform');
        const extCommand = core.getInput('extCommand');
        const compactFile = core.getInput('compactFile');
        const nameFileCompact = core.getInput('nameFileCompact');
    
        await exec.exec('mkdir C:\\VsWhere');
        console.log(`Result Create VsWhere Folder, command: mkdir C:\\VsWhere`);

        console.log(`Download file vswhere.exe`);
        const file = fs.createWriteStream(pathFileVsWhere);
        https.get(urlFileVsWhere, function(response) {
          response.pipe(file);
        });

        core.addPath("C:\\VsWhere");
        core.exportVariable('vswhere', 'C:\\VsWhere\\vswhere.exe');
    
        await exec.exec('vswhere.exe', ['-latest', '-requires Microsoft.Component.MSBuild', '-find MSBuild\\**\\Bin\\MSBuild.exe']);
        console.log(`Result get last MSBuild, command: ./VsWhere.exe -latest -requires Microsoft.Component.MSBuild -find MSBuild\\**\\Bin\\MSBuild.exe`);
    
        core.addPath('C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\MSBuild\\Current\\bin');
        core.exportVariable('MSBuild', 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\MSBuild\\Current\\bin\\MSBuild.exe');
        
        await exec.exec('mkdir C:\\_build');
        console.log(`Result Create Build Folder, command: mkdir mkdir C:\\_build`);
    
        await exec.exec('mkdir C:\\App');
        console.log(`Result Create App Folder, command: mkdir C:\\App`);
    
        await exec.exec(`Xcopy ${pathFolderMainProject} C:\\App /E /H /C /I`);
        console.log(`Result Copy Files, command: \nXcopy ${pathFolderMainProject} C:\\App /E /H /C /I`);
    
        await exec.exec(`nuget restore C:\\App\\${projectFilePathAndName}`);
        console.log(`Result Restore Project, command: nuget restore C:\\App\\${projectFilePathAndName}`);
    
        await exec.exec(`|\nMSBuild.exe /t:build /p:Configuration=${typeConfiguration} /p:Platform="${typePlatform}" ${extCommand} /p:OutDir="C:\_build" "C:\\App\\${projectFilePathAndName}"`);
        console.log(`Result Build Project, command: MSBuild.exe /t:build /p:Configuration=${typeConfiguration} /p:Platform="${typePlatform}" ${extCommand} /p:OutDir="C:\_build" "C:\\App\\${projectFilePathAndName}"`);
    
        if (compactFile == true || compactFile == 'true') {
            await exec.exec(`powershell Compress-Archive C:\\_build\* .\\${nameFileCompact}`);
            console.log(`Result Compress, command: powershell Compress-Archive C:\\_build\* .\\${nameFileCompact}`);
        } else {
            await exec.exec(`mkdir .\\_build`);
            console.log(`Result Create Build Folder, command: mkdir _build`);
    
            await exec.exec(`|\nXcopy C:\\_build .\\_build /E /H /C /I`);
            console.log(`Result Build to Build Folder, command: Xcopy C:\\_build .\\_build /E /H /C /I`);
        }
    
        await exec.exec('rmdir /Q /S C:\\_build');
        console.log(`Result Remove Build Folder, command: rmdir /Q /S C:\\_build`);
    
        await exec.exec('rmdir /Q /S C:\\App');
        console.log(`Result Remove App Folder, command: rmdir /Q /S C:\\App`);
    
        console.log(`Success compiler!`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();