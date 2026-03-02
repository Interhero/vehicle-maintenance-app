const fs = require('fs');
const lines = fs.readFileSync('server.log', 'utf8').split('\n');
const reqs = lines.filter(l => l.includes('Sample Yamaha Row:'));
fs.writeFileSync('yamaha_rows.txt', reqs.join('\n'));
console.log('Done mapping yamaha rows');
