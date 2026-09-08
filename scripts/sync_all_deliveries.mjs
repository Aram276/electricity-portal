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

async function syncAllDeliveries() {
  console.log('🔄 Syncing all delivered files to Firestore...');

  const mainDocRef = doc(db, 'portal_data', 'electricity_records');
  const snap = await getDoc(mainDocRef);
  if (!snap.exists()) {
    console.error('Document does not exist!');
    return;
  }

  const records = snap.data().records || [];
  const logs = JSON.parse(fs.readFileSync('public/cloud_logs_dump.json', 'utf8'));

  const recordsMap = new Map();
  records.forEach(r => recordsMap.set(String(r.fileNumber), { ...r }));

  // Sort logs chronologically (oldest to newest)
  const sortedLogs = [...logs].reverse();

  let deliveredCount = 0;

  sortedLogs.forEach(l => {
    const f = l.details?.fileNumber;
    if (!f || !recordsMap.has(String(f))) return;
    const rec = recordsMap.get(String(f));

    if (l.type === 'DELIVERY' || (l.type === 'STATUS_CHANGE' && (l.title.includes('تەسلیم') || l.details?.status === 'DELIVERED'))) {
      rec.status = 'DELIVERED';
      if (l.details?.receiverName) {
        rec.receiverName = l.details.receiverName;
      }
      if (l.details?.date) {
        rec.deliveredDate = l.details.date;
      } else if (!rec.deliveredDate) {
        rec.deliveredDate = l.timestamp ? l.timestamp.slice(0, 16) : '2026-09-08';
      }
      deliveredCount++;
    }
  });

  const updatedRecords = Array.from(recordsMap.values()).sort((a, b) => {
    const numA = parseInt(a.fileNumber, 10) || 0;
    const numB = parseInt(b.fileNumber, 10) || 0;
    return numA - numB;
  });

  const allDelivered = updatedRecords.filter(r => r.status === 'DELIVERED');
  console.log(`\n✅ Total files with status DELIVERED: ${allDelivered.length}`);
  allDelivered.forEach(r => {
    console.log(`File #${r.fileNumber}: ${r.citizenName} | Receiver: ${r.receiverName || 'نیە'} | Date: ${r.deliveredDate || 'نیە'}`);
  });

  // Save to Firestore
  await setDoc(mainDocRef, {
    records: updatedRecords,
    updatedAt: new Date().toISOString()
  });

  fs.writeFileSync('public/final_restored_records.json', JSON.stringify(updatedRecords, null, 2));
  console.log('\n🎉 Successfully updated all delivered files in Firestore!');
}

syncAllDeliveries().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
