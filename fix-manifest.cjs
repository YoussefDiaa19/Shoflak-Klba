const fs = require('fs');
let content = fs.readFileSync('public/manifest.json', 'utf8');
content = content.replace(/\.\.\/icons\//g, '/icons/');
content = content.replace(/"type": "image\/png"/g, '"type": "image/webp"');
fs.writeFileSync('public/manifest.json', content);
