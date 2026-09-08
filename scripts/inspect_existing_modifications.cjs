const fs = require('fs');
const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));

const existingFiles = ['2', '141', '205', '232', '296', '302', '305', '433', '440', '538', '712', '722', '751'];

console.log('=== ACTIONS ON EXISTING FILES TODAY ===');
logs.filter(l => l.timestamp && l.timestamp.includes('2026-09-08')).forEach(l => {
  if (existingFiles.includes(String(l.details?.fileNumber))) {
    console.log(`[${l.timestamp}] File #${l.details?.fileNumber} | ${l.type} - ${l.title}`);
    if (l.details) console.log('   Details:', JSON.stringify(l.details));
  }
});
