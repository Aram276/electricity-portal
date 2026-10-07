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

function sanitizeRecordForCloud(record) {
  if (!record || typeof record !== 'object') return null;
  const clean = {};
  for (const [key, val] of Object.entries(record)) {
    if (val !== undefined && val !== null && val !== '') {
      clean[key] = val;
    }
  }
  return clean;
}

async function sync() {
  const snap = await getDoc(doc(db, 'portal_data', 'electricity_records'));
  if (!snap.exists()) {
    console.log('Document not found');
    return;
  }
  const data = snap.data();
  const records = data.records || [];
  
  const idx = records.findIndex(r => String(r.fileNumber).trim() === '1281');
  if (idx !== -1) {
    records[idx] = {
      ...records[idx],
      status: 'DELIVERED',
      deliveredDate: '2026-10-08 01:05',
      receiverName: records[idx].receiverName || 'ئارام عباس',
      handledBy: 'ئارام عباس',
      kycStatus: 'PRE_VERIFIED',
      kycType: 'PRE_VERIFIED',
      isKycDone: true
    };
    console.log('Updated record 1281:', records[idx]);
  } else {
    console.log('Record 1281 not found in array, adding it');
    records.push({
      id: 'rec-1791410219828-bqczb',
      fileNumber: '1281',
      fileType: 'YELLOW_FOLDER',
      accountNumber: '63971631',
      citizenName: 'ئارام عباس',
      hasRealName: true,
      phoneNumber: '07519561214',
      status: 'DELIVERED',
      deliveredDate: '2026-10-08 01:05',
      receiverName: 'ئارام عباس',
      handledBy: 'ئارام عباس',
      kycStatus: 'PRE_VERIFIED',
      kycType: 'PRE_VERIFIED',
      isKycDone: true,
      department: 'بەڕێوەبەرایەتی دابەشکردنی کارەبای هەولێر',
      transactionType: 'پاکتاوکردنی قەرز و ئەژمار',
      archiveLocation: 'سندوقی 1281',
      submissionDate: '2026-10-08'
    });
  }

  const sanitized = records.map(sanitizeRecordForCloud).filter(Boolean);
  await setDoc(doc(db, 'portal_data', 'electricity_records'), {
    records: sanitized,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Admin',
    count: sanitized.length
  });

  console.log('✅ Successfully synced Firestore cloud document!');
}

sync().catch(console.error);
