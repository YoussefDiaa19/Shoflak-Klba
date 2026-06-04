const fs = require('fs');

console.log('--- System-wide Root (/) directories ---');
try {
  fs.readdirSync('/').forEach(f => {
    console.log(`- /${f}`);
  });
} catch(e) {
  console.log('Error reading /:', e.message);
}

console.log('--- Contents of /app ---');
try {
  fs.readdirSync('/app').forEach(f => {
    console.log(`- /app/${f}`);
  });
} catch(e) {
  console.log('Error reading /app:', e.message);
}
