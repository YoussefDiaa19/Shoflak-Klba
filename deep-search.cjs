const fs = require('fs');
const path = require('path');

function search(dir, depth = 0) {
  if (depth > 6) return;
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = path.join(dir, f);
      if (f.includes('\\') || f.includes('bundle') || f.includes('icon.png') || f.includes('screen.png')) {
        console.log(`Matched: ${full}`);
      }
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          search(full, depth + 1);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('--- Search starting at /app/applet ---');
search('/app/applet');
console.log('--- Search starting at / ---');
try {
  const rootFiles = fs.readdirSync('/');
  for (const f of rootFiles) {
    if (f.includes('\\') || f.includes('bundle')) {
      console.log(`Root file: ${f}`);
    }
  }
} catch (e) {}
