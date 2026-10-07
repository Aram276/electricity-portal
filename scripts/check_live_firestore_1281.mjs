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

async function check() {
  const snap = await getDoc(doc(db, 'portal_data', 'electricity_records'));
  if (!snap.exists()) {
    console.log('Doc does not exist!');
    return;
  }
  const data = snap.data();
  console.log('Records count in Firestore:', data.records?.length);
  const rec1281 = data.records?.find(r => String(r.fileNumber).trim() === '1281');
  console.log('Record 1281 in Firestore:', rec1281);
}

check().catch(console.error);
