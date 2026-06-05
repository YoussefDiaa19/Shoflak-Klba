const xcode = require('xcode');
const fs = require('fs');

const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parse(function (err) {
    if (err) {
        console.error('Error parsing project:', err);
        process.exit(1);
    }
    
    const filePath = 'App/GoogleService-Info.plist';
    
    myProj.addResourceFile(filePath);
    
    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('Successfully added GoogleService-Info.plist to Xcode project');
});
