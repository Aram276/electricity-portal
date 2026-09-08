const fs = require('fs');
const records = JSON.parse(fs.readFileSync('public/cloud_records_dump.json', 'utf8'));
const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));

console.log('--- RECENT ACTIVITY LOGS ---');
logs.slice(0, 30).forEach(l => {
  console.log(`[${l.timestamp}] ${l.type} - ${l.title} (User: ${l.user})`);
  if (l.details) console.log('   Details:', JSON.stringify(l.details));
});

console.log('\n--- RECORDS SUBMITTED TODAY ---');
const todayRecords = records.filter(r => 
  (r.submissionDate && r.submissionDate.includes('2026-09-08')) || 
  (r.deliveredDate && r.deliveredDate.includes('2026-09-08')) || 
  (r.completionDate && r.completionDate.includes('2026-09-08')) ||
  (r.createdAt && r.createdAt.includes('2026-09-08'))
);
console.log('Records matching 2026-09-08:', todayRecords.length);
todayRecords.forEach(r => {
  console.log(`File: #${r.fileNumber} | Name: ${r.citizenName} | Acc: ${r.accountNumber} | Phone: ${r.phoneNumber} | Status: ${r.status}`);
});

console.log('\n--- HIGHEST FILE NUMBERS ---');
const fileNums = records.map(r => ({ num: parseInt(r.fileNumber), raw: r.fileNumber, name: r.citizenName, id: r.id })).filter(x => !isNaN(x.num)).sort((a,b) => b.num - a.num);
console.log('Top 15 highest file numbers in cloud:', fileNums.slice(0, 15));

console.log('\n--- CREATED ENTRIES IN LOGS ---');
const createdLogs = logs.filter(l => l.type === 'CREATE' || l.type === 'ADD_RECORD');
console.log('Total Created Logs:', createdLogs.length);
createdLogs.slice(0, 20).forEach(l => {
  console.log(`[${l.timestamp}] ${l.title}`);
  if (l.details) console.log('   Details:', JSON.stringify(l.details));
});
