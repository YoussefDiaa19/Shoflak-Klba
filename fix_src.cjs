const fs = require('fs');
const glob = require('glob'); // Note: we might not have glob, let's just use child_process or read the output of grep

const { execSync } = require('child_process');

try {
  const files = execSync('grep -l "src={" components/*.tsx').toString().trim().split('\n');
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // regex to match src={something}
    // we should be careful not to match too much.
    // src={pet.images[0]}
    // src={owner?.avatar}
    content = content.replace(/src=\{([^}]+)\}/g, (match, p1) => {
      if (p1.includes('|| undefined')) return match;
      return `src={${p1} || undefined}`;
    });
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  });
} catch (e) {
  console.error(e);
}
