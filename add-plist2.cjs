const xcode = require('xcode');
const fs = require('fs');

const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parseSync();
const filePath = 'App/GoogleService-Info.plist';

// We just need it to be added to the Resources Build Phase.
// xcode's addResourceFile tries to add it to 'Resources' group by default, but we can pass second parameter.
// Wait, looking at the code for addResourceFile(path, opt):
// if opt.plugin is true, it does something else.
myProj.addResourceFile(filePath, { target: myProj.getFirstTarget().uuid });

fs.writeFileSync(projectPath, myProj.writeSync());
console.log('Done!');
