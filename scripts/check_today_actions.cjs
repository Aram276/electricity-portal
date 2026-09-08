const fs = require('fs');
const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));

console.log('=== CHECKING ALL ACTIONS TODAY (2026-09-08) ===');
const todayLogs = logs.filter(l => l.timestamp && l.timestamp.includes('2026-09-08'));
console.log('Total actions logged today:', todayLogs.length);

const actionsByFile = {};
todayLogs.forEach(l => {
  const f = l.details?.fileNumber;
  if (!f) return;
  if (!actionsByFile[f]) actionsByFile[f] = [];
  actionsByFile[f].push(l);
});

console.log('Unique files modified today:', Object.keys(actionsByFile).length);
console.log('Files list:', Object.keys(actionsByFile).sort((a,b) => parseInt(a) - parseInt(b)));
