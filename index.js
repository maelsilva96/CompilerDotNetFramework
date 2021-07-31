const core = require('@actions/core');
const github = require('@actions/github');
const https = require('https');
const fs = require('fs');
const exec = require('@actions/exec');

async function run () {
    try {
        const urlFileVsWhere = "https://github.com/microsoft/vswhere/releases/download/2.8.4/vswhere.exe";
        const pathFileVsWhere = "./VsWhere.exe";
        const pathFolderMainProject = core.getInput('pathFolderMainProject');
        const projectFilePathAndName = core.getInput('projectFilePathAndName');
        const typeConfiguration = core.getInput('typeConfiguration');
        const typePlatform = core.getInput('typePlatform');
        const extCommand = core.getInput('extCommand');
        const compactFile = core.getInput('compactFile');
        const nameFileCompact = core.getInput('nameFileCompact');
    
        console.log(`Download file vswhere.exe`);
        const file = fs.createWriteStream(pathFileVsWhere);
        https.get(urlFileVsWhere, function(response) {
          response.pipe(file);
        });
    
        const resultGetLastMsBuild = await exec.exec('./VsWhere.exe -latest -requires Microsoft.Component.MSBuild -find MSBuild\\**\\Bin\\MSBuild.exe');
        console.log(`Result get last MSBuild: ${resultGetLastMsBuild}`);
    
        core.addPath('C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\MSBuild\\Current\\bin');
        core.exportVariable('MSBuild', 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\MSBuild\\Current\\bin\\MSBuild.exe');
        
        const resultCreateBuildFolder = await exec.exec('mkdir C:\\_build');
        console.log(`Result Create Build Folder: ${resultCreateBuildFolder}, command: mkdir mkdir C:\\_build`);
    
        const resultCreateAppFolder = await exec.exec('mkdir C:\\App');
        console.log(`Result Create App Folder: ${resultCreateAppFolder}, command: mkdir C:\\App`);
    
        const resultCopyFilesToAppFolder = await exec.exec(`|\nXcopy ${pathFolderMainProject} C:\\App /E /H /C /I`);
        console.log(`Result Copy Files: ${resultCopyFilesToAppFolder}, command: \nXcopy ${pathFolderMainProject} C:\\App /E /H /C /I`);
    
        const resultRestoreProject = await exec.exec(`nuget restore C:\\App\\${projectFilePathAndName}`);
        console.log(`Result Restore Project: ${resultRestoreProject}, command: nuget restore C:\\App\\${projectFilePathAndName}`);
    
        const resultBuildProject = await exec.exec(`|\nMSBuild.exe /t:build /p:Configuration=${typeConfiguration} /p:Platform="${typePlatform}" ${extCommand} /p:OutDir="C:\_build" "C:\\App\\${projectFilePathAndName}"`);
        console.log(`Result Build Project: ${resultBuildProject}, command: MSBuild.exe /t:build /p:Configuration=${typeConfiguration} /p:Platform="${typePlatform}" ${extCommand} /p:OutDir="C:\_build" "C:\\App\\${projectFilePathAndName}"`);
    
        if (compactFile == true || compactFile == 'true') {
            const resultCompress = await exec.exec(`powershell Compress-Archive C:\\_build\* .\\${nameFileCompact}`);
            console.log(`Result Compress: ${resultCompress}, command: powershell Compress-Archive C:\\_build\* .\\${nameFileCompact}`);
        } else {
            const resultCreateBuildFolder = await exec.exec(`mkdir .\\_build`);
            console.log(`Result Create Build Folder: ${resultCreateBuildFolder}, command: mkdir _build`);
    
            const resultCopyFolder = await exec.exec(`|\nXcopy C:\\_build .\\_build /E /H /C /I`);
            console.log(`Result Build to Build Folder: ${resultCopyFolder}, command: Xcopy C:\\_build .\\_build /E /H /C /I`);
        }
    
        const resultRemoveBuildFolder = await exec.exec('rmdir /Q /S C:\\_build');
        console.log(`Result Remove Build Folder: ${resultRemoveBuildFolder}, command: rmdir /Q /S C:\\_build`);
    
        const resultRemoveAppFolder =  await exec.exec('rmdir /Q /S C:\\App');
        console.log(`Result Remove App Folder: ${resultRemoveAppFolder}, command: rmdir /Q /S C:\\App`);
    
        console.log(`Success compiler!`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();