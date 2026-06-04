const fs = require('fs');
const path = require('path');

function search(dir, depth = 0) {
  if (depth > 5) return;
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = path.join(dir, f);
      if (f.toLowerCase().includes('bundle') || f.includes('\\')) {
        console.log(`Matched (in /app): ${full}`);
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

search('/app');
