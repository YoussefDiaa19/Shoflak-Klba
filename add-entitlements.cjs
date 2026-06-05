const xcode = require('xcode');
const fs = require('fs');

const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parseSync();

const fileRefUuid = myProj.generateUuid();
const filePath = 'App.entitlements';

// 1. Add to PBXFileReference section
myProj.hash.project.objects.PBXFileReference[fileRefUuid] = {
    isa: 'PBXFileReference',
    lastKnownFileType: 'text.plist.entitlements',
    name: 'App.entitlements',
    path: 'App.entitlements',
    sourceTree: '"<group>"'
};
myProj.hash.project.objects.PBXFileReference[fileRefUuid + '_comment'] = 'App.entitlements';

// 2. Add to the 'App' PBXGroup (UUID: 504EC3061FED79650016851F)
const appGroup = myProj.hash.project.objects.PBXGroup['504EC3061FED79650016851F'];
appGroup.children.push({
    value: fileRefUuid,
    comment: 'App.entitlements'
});

// 3. Add CODE_SIGN_ENTITLEMENTS to all build configurations
const configs = myProj.hash.project.objects.XCBuildConfiguration;
for (const key in configs) {
    if (configs[key].buildSettings) {
        configs[key].buildSettings['CODE_SIGN_ENTITLEMENTS'] = '"App/App.entitlements"';
    }
}

fs.writeFileSync(projectPath, myProj.writeSync());
console.log('Successfully injected App.entitlements!');
