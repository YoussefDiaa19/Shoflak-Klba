const xcode = require('xcode');
const fs = require('fs');

const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parseSync();

const fileRefUuid = myProj.generateUuid();
const buildFileUuid = myProj.generateUuid();
const filePath = 'GoogleService-Info.plist';

// 1. Add to PBXFileReference section
myProj.hash.project.objects.PBXFileReference[fileRefUuid] = {
    isa: 'PBXFileReference',
    fileEncoding: 4,
    isa: 'PBXFileReference',
    lastKnownFileType: 'text.plist.xml',
    name: 'GoogleService-Info.plist',
    path: 'GoogleService-Info.plist',
    sourceTree: '"<group>"'
};
myProj.hash.project.objects.PBXFileReference[fileRefUuid + '_comment'] = 'GoogleService-Info.plist';

// 2. Add to PBXBuildFile section
myProj.hash.project.objects.PBXBuildFile[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: fileRefUuid,
    fileRef_comment: 'GoogleService-Info.plist'
};
myProj.hash.project.objects.PBXBuildFile[buildFileUuid + '_comment'] = 'GoogleService-Info.plist in Resources';

// 3. Add to the 'App' PBXGroup (UUID: 504EC3061FED79650016851F)
const appGroup = myProj.hash.project.objects.PBXGroup['504EC3061FED79650016851F'];
appGroup.children.push({
    value: fileRefUuid,
    comment: 'GoogleService-Info.plist'
});

// 4. Add to the PBXResourcesBuildPhase section (to ensure it gets copied into the bundle)
const resourcesPhase = Object.values(myProj.hash.project.objects.PBXResourcesBuildPhase)[0];
if (!resourcesPhase) throw new Error("No PBXResourcesBuildPhase found");

resourcesPhase.files.push({
    value: buildFileUuid,
    comment: 'GoogleService-Info.plist in Resources'
});

fs.writeFileSync(projectPath, myProj.writeSync());
console.log('Successfully injected GoogleService-Info.plist!');
