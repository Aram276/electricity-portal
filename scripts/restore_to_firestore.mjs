import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBY7IGuVdtH6AXxl_HKLCSaIwv-5BZvOhE",
  authDomain: "electric-froshiry-wza2.firebaseapp.com",
  projectId: "electric-froshiry-wza2",
  storageBucket: "electric-froshiry-wza2.firebasestorage.app",
  messagingSenderId: "885666164805",
  appId: "1:885666164805:web:c42ba0551d6fcedd7c732c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restoreData() {
  console.log('🔄 Starting Full Data Restoration & Synchronization...');

  // 1. Load current cloud records
  const currentRecords = JSON.parse(fs.readFileSync('public/cloud_records_dump.json', 'utf8'));
  const reconstructedNew = JSON.parse(fs.readFileSync('public/reconstructed_files.json', 'utf8'));
  const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));

  console.log(`Current cloud records: ${currentRecords.length}`);
  console.log(`Reconstructed new files (934-972): ${reconstructedNew.length}`);

  // Create a map by fileNumber
  const recordsMap = new Map();
  currentRecords.forEach(r => {
    recordsMap.set(String(r.fileNumber), { ...r });
  });

  // Add all reconstructed files 934-972
  reconstructedNew.forEach(r => {
    recordsMap.set(String(r.fileNumber), { ...r });
  });

  // Apply today's updates on existing files from logs
  const todayLogs = logs.filter(l => l.timestamp && l.timestamp.includes('2026-09-08')).reverse(); // oldest to newest
  todayLogs.forEach(l => {
    const f = l.details?.fileNumber;
    if (!f || !recordsMap.has(String(f))) return;
    const rec = recordsMap.get(String(f));

    if (l.details?.citizenName && l.details.citizenName !== 'هاوبەشی کارەبا') {
      rec.citizenName = l.details.citizenName;
      rec.hasRealName = true;
    }
    if (l.details?.status) {
      rec.status = l.details.status;
      if (l.details.status === 'COMPLETED' && !rec.completionDate) {
        rec.completionDate = l.timestamp ? l.timestamp.split(' ')[0] : '2026-09-08';
      }
    }
    if (l.details?.receiverName) {
      rec.receiverName = l.details.receiverName;
      rec.status = 'DELIVERED';
    }
    if (l.details?.date) {
      rec.deliveredDate = l.details.date;
    }
    if (l.details?.kycStatus) {
      rec.kycStatus = l.details.kycStatus;
      rec.isKycDone = l.details.kycStatus === 'DONE_BY_US' || l.details.kycStatus === 'PRE_VERIFIED';
    }
  });

  // Convert map to array and sort numerically
  const finalRecords = Array.from(recordsMap.values()).sort((a, b) => {
    const numA = parseInt(a.fileNumber, 10) || 0;
    const numB = parseInt(b.fileNumber, 10) || 0;
    return numA - numB;
  });

  console.log(`\n✅ Total merged records ready: ${finalRecords.length}`);
  console.log(`Min fileNumber: ${finalRecords[0]?.fileNumber}, Max fileNumber: ${finalRecords[finalRecords.length - 1]?.fileNumber}`);

  // Inspect sample of high records
  console.log('\nSample of restored top records:');
  finalRecords.slice(-10).forEach(r => {
    console.log(`File #${r.fileNumber}: ${r.citizenName} | Status: ${r.status} | KYC: ${r.kycStatus} | Date: ${r.submissionDate}`);
  });

  // 2. Backup current Firestore to portal_data/electricity_records_backup
  console.log('\n☁️ Writing backup to Firestore...');
  const backupDocRef = doc(db, 'portal_data', 'electricity_records_backup');
  await setDoc(backupDocRef, {
    timestamp: new Date().toISOString(),
    description: 'Automatic backup created before 2026-09-08 data recovery restoration',
    records: currentRecords
  });
  console.log('✅ Backup saved successfully to Firestore!');

  // 3. Write final restored records to portal_data/electricity_records
  console.log('☁️ Writing restored dataset to Firestore (portal_data/electricity_records)...');
  const mainDocRef = doc(db, 'portal_data', 'electricity_records');
  await setDoc(mainDocRef, {
    updatedAt: new Date().toISOString(),
    records: finalRecords
  });
  console.log('🎉 Successfully saved 100% of records to Firestore!');

  // 4. Also add a restoration log to activity_logs
  console.log('📝 Logging restoration activity...');
  const logsDocRef = doc(db, 'portal_data', 'activity_logs');
  const logsSnap = await getDoc(logsDocRef);
  let currentLogs = [];
  if (logsSnap.exists() && logsSnap.data().logs) {
    currentLogs = logsSnap.data().logs;
  }
  const restorationLog = {
    id: `log-restore-${Date.now()}`,
    type: 'SYSTEM_RESTORE',
    title: `گەڕاندنەوەی سەرکەوتووانەی سەرجەم داتاکانی ئەمڕۆ (${reconstructedNew.length} فایلی نوێ + نوێکردنەوەکان)`,
    user: 'سیستەم (Antigravity Recovery)',
    timestamp: new Date().toLocaleString('sv-SE').replace('T', ' '),
    details: {
      totalRecords: finalRecords.length,
      recoveredNewFiles: reconstructedNew.length,
      maxFileNumber: finalRecords[finalRecords.length - 1]?.fileNumber
    }
  };
  await setDoc(logsDocRef, {
    logs: [restorationLog, ...currentLogs]
  });
  console.log('✅ Restoration log added to Firestore!');

  // Save copy locally for safety
  fs.writeFileSync('public/final_restored_records.json', JSON.stringify(finalRecords, null, 2));
  console.log('💾 Local backup saved to public/final_restored_records.json');
}

restoreData().then(() => {
  console.log('🎉 ALL RESTORATION TASKS COMPLETE!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error during restoration:', err);
  process.exit(1);
});
