const fs = require('fs');
const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));
const currentRecords = JSON.parse(fs.readFileSync('public/final_restored_records.json', 'utf8'));

console.log('=== CHECKING DELIVERED / پێدراوەتەوە FILES ===');

// Check current delivered files in dataset
const deliveredInDataset = currentRecords.filter(r => r.status === 'DELIVERED' || r.receiverName || r.deliveredDate);
console.log(`Delivered files in dataset: ${deliveredInDataset.length}`);
deliveredInDataset.forEach(r => {
  console.log(`File #${r.fileNumber}: Name: ${r.citizenName} | Receiver: ${r.receiverName || 'دیارینەکراو'} | Delivered Date: ${r.deliveredDate || 'دیارینەکراو'} | Status: ${r.status}`);
});

console.log('\n=== CHECKING ALL DELIVERY LOGS ===');
const deliveryLogs = logs.filter(l => 
  l.type === 'DELIVERY' || 
  (l.type === 'STATUS_CHANGE' && (l.title.includes('تەسلیم') || l.details?.status === 'DELIVERED'))
);
console.log(`Total delivery events in logs: ${deliveryLogs.length}`);
deliveryLogs.forEach(l => {
  console.log(`[${l.timestamp}] File #${l.details?.fileNumber} | ${l.title} | Receiver: ${l.details?.receiverName || ''} | Date: ${l.details?.date || ''}`);
});
