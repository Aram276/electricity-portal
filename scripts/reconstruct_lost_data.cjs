const fs = require('fs');
const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));

// Filter all CREATE / ADD_RECORD / EDIT_RECORD logs
const relevantLogs = logs.filter(l => 
  l.type === 'CREATE' || 
  l.type === 'ADD_RECORD' || 
  l.type === 'EDIT_RECORD' ||
  l.type === 'STATUS_CHANGE' ||
  l.type === 'DELIVERY'
);

console.log('Total relevant logs:', relevantLogs.length);

// Map to reconstruct records
const reconstructed = {};

// Sort logs chronologically (oldest to newest)
const sortedLogs = [...logs].reverse();

sortedLogs.forEach(l => {
  const fileNum = l.details?.fileNumber;
  if (!fileNum) return;

  if (!reconstructed[fileNum]) {
    reconstructed[fileNum] = {
      id: `rec-restored-${fileNum}`,
      fileNumber: String(fileNum),
      citizenName: l.details?.citizenName || 'هاوبەشی کارەبا',
      hasRealName: Boolean(l.details?.citizenName && l.details.citizenName !== 'هاوبەشی کارەبا'),
      accountNumber: l.details?.accountNumber || '',
      phoneNumber: l.details?.phoneNumber || 'نیە',
      fileType: l.details?.fileType || 'YELLOW_FOLDER',
      status: l.details?.status || 'IN_PROGRESS',
      submissionDate: l.timestamp ? l.timestamp.split(' ')[0] : '2026-09-08',
      completionDate: l.details?.status === 'COMPLETED' ? (l.timestamp ? l.timestamp.split(' ')[0] : '2026-09-08') : null,
      deliveredDate: l.details?.date || null,
      receiverName: l.details?.receiverName || '',
      department: 'بەڕێوەبەرایەتی دابەشکردنی کارەبا',
      transactionType: 'پڕۆژەی ڕووناکی - پێوەری زیرەک',
      archiveLocation: `سندوقی ${fileNum}`,
      handledBy: l.user || 'هۆبەی پەیوەندیدار',
      notes: 'داتای گەڕێنراوە لە لۆگ',
      kycStatus: l.details?.kycStatus || 'PENDING',
      kycType: l.details?.kycStatus || 'PENDING',
      isKycDone: l.details?.kycStatus === 'DONE_BY_US' || l.details?.kycStatus === 'PRE_VERIFIED'
    };
  }

  // Update with latest log info
  if (l.details?.citizenName && l.details.citizenName !== 'هاوبەشی کارەبا') {
    reconstructed[fileNum].citizenName = l.details.citizenName;
    reconstructed[fileNum].hasRealName = true;
  }
  if (l.details?.status) {
    reconstructed[fileNum].status = l.details.status;
    if (l.details.status === 'COMPLETED' && !reconstructed[fileNum].completionDate) {
      reconstructed[fileNum].completionDate = l.timestamp ? l.timestamp.split(' ')[0] : '2026-09-08';
    }
  }
  if (l.details?.receiverName) {
    reconstructed[fileNum].receiverName = l.details.receiverName;
    reconstructed[fileNum].status = 'DELIVERED';
  }
  if (l.details?.date) {
    reconstructed[fileNum].deliveredDate = l.details.date;
  }
  if (l.details?.fileType) {
    reconstructed[fileNum].fileType = l.details.fileType;
  }
  if (l.details?.kycStatus) {
    reconstructed[fileNum].kycStatus = l.details.kycStatus;
    reconstructed[fileNum].isKycDone = l.details.kycStatus === 'DONE_BY_US' || l.details.kycStatus === 'PRE_VERIFIED';
  }
});

console.log('=== ALL RECONSTRUCTED FILES > 933 ===');
const newFiles = Object.values(reconstructed)
  .filter(r => parseInt(r.fileNumber) > 933)
  .sort((a,b) => parseInt(a.fileNumber) - parseInt(b.fileNumber));

console.log(`Found ${newFiles.length} files entered today:`);
newFiles.forEach(f => {
  console.log(`File #${f.fileNumber}: ${f.citizenName} | Status: ${f.status} | KYC: ${f.kycStatus} | Date: ${f.submissionDate}`);
});

fs.writeFileSync('public/reconstructed_files.json', JSON.stringify(newFiles, null, 2));
