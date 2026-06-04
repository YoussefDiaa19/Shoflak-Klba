const fs = require('fs');
const path = require('path');

function findBackslashFiles(dir) {
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = path.join(dir, f);
      // Check if filename literally contains backslash
      if (f.includes('\\')) {
        console.log(`Found Backslash File/Folder: ${full} (${fs.statSync(full).size} bytes)`);
      }
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          findBackslashFiles(full);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('--- Scanning for Backslashes in current workspace ---');
findBackslashFiles('.');
