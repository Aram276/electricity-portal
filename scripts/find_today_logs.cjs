const fs = require('fs');
const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));

console.log('=== ALL LOGS FROM TODAY (2026-09-08) ===');
const todayLogs = logs.filter(l => l.timestamp && l.timestamp.includes('2026-09-08'));
console.log('Count:', todayLogs.length);
todayLogs.forEach((l, i) => {
  console.log(`${i+1}. [${l.timestamp}] ${l.type} - ${l.title}`);
  if (l.details) console.log('   Details:', JSON.stringify(l.details));
});
