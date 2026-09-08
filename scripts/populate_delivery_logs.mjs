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

async function populateDeliveryLogs() {
  console.log('🔄 Ensuring ALL delivered files have clear entries in Activity Logs...');

  const logsDocRef = doc(db, 'portal_data', 'activity_logs');
  const snap = await getDoc(logsDocRef);
  let currentLogs = [];
  if (snap.exists() && snap.data().logs) {
    currentLogs = snap.data().logs;
  }

  const records = JSON.parse(fs.readFileSync('public/final_restored_records.json', 'utf8'));
  const deliveredRecords = records.filter(r => r.status === 'DELIVERED' || r.receiverName);

  console.log(`Total delivered records in dataset: ${deliveredRecords.length}`);

  // Find which fileNumbers already have a DELIVERY log
  const existingDeliveryFileNums = new Set();
  currentLogs.forEach(l => {
    if (l.type === 'DELIVERY' && l.details?.fileNumber) {
      existingDeliveryFileNums.add(String(l.details.fileNumber));
    }
  });

  const newLogs = [];

  deliveredRecords.forEach(r => {
    const fNum = String(r.fileNumber);
    // If not logged as a delivery or if missing receiver info in existing logs
    const receiver = r.receiverName || (r.citizenName && r.citizenName !== 'هاوبەشی کارەبا' ? r.citizenName : 'هاوبەشی کارەبا');
    const dateStr = r.deliveredDate || (r.submissionDate ? `${r.submissionDate} 12:00` : '2026-09-08 12:00');

    // Create or format a clean delivery log
    const logEntry = {
      id: `delivery-log-f${fNum}`,
      type: 'DELIVERY',
      title: `تەسلیمکردنەوەی فایلی (${fNum}) بە (${receiver}) (لەلایەن: ئارام)`,
      user: 'ئارام (بەڕێوەبەری سەرەکی)',
      timestamp: dateStr.includes(':') ? (dateStr.length === 16 ? `${dateStr}:00` : dateStr) : `${dateStr} 12:00:00`,
      details: {
        fileNumber: fNum,
        citizenName: r.citizenName,
        receiverName: r.receiverName || receiver,
        date: r.deliveredDate || dateStr,
        accountNumber: r.accountNumber || '',
        phoneNumber: r.phoneNumber || 'نیە',
        status: 'DELIVERED'
      }
    };

    newLogs.push(logEntry);
  });

  // Combine and deduplicate logs
  const combinedMap = new Map();

  // Add the newly formatted complete delivery logs
  newLogs.forEach(l => combinedMap.set(`delivery-${l.details.fileNumber}`, l));

  // Add existing logs
  currentLogs.forEach(l => {
    const key = l.type === 'DELIVERY' && l.details?.fileNumber ? `delivery-${l.details.fileNumber}` : l.id;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, l);
    }
  });

  // Sort logs by timestamp descending (newest first)
  const finalLogs = Array.from(combinedMap.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp?.replace(' ', 'T')).getTime() || 0;
    const timeB = new Date(b.timestamp?.replace(' ', 'T')).getTime() || 0;
    return timeB - timeA;
  });

  console.log(`✅ Total combined activity logs: ${finalLogs.length}`);
  const deliveryCount = finalLogs.filter(l => l.type === 'DELIVERY').length;
  console.log(`✅ Total DELIVERY logs in system: ${deliveryCount}`);

  // Save to Firestore
  await setDoc(logsDocRef, {
    logs: finalLogs,
    lastUpdated: new Date().toISOString()
  });

  fs.writeFileSync('public/cloud_logs_dump.json', JSON.stringify(finalLogs, null, 2));
  console.log('🎉 Successfully saved all delivery logs to Firestore and public/cloud_logs_dump.json!');
}

populateDeliveryLogs().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
