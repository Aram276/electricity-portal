import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function checkSize() {
  const snap = await getDoc(doc(db, 'portal_data', 'electricity_records'));
  const data = snap.data();
  const records = data.records || [];
  const sanitized = records.map(sanitizeRecordForCloud).filter(Boolean);
  const payload = JSON.stringify({
    records: sanitized,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Admin',
    count: sanitized.length
  });
  const bytes = Buffer.byteLength(payload, 'utf8');
  console.log(`Document payload size: ${bytes} bytes (${(bytes / 1024).toFixed(2)} KB)`);
  console.log(`Max Firestore limit: 1,048,576 bytes (1024 KB)`);
  if (bytes > 1048576) {
    console.log('❌ EXCEEDS 1MB FIRESTORE LIMIT!');
  } else {
    console.log('✅ Under 1MB limit');
  }
}

checkSize().catch(console.error);
