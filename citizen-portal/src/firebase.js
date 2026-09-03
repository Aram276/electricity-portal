import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD-placeholder",
  authDomain: "electricity-portal-krd.firebaseapp.com",
  projectId: "electricity-portal-krd",
  storageBucket: "electricity-portal-krd.appspot.com",
  messagingSenderId: "109823478912",
  appId: "1:109823478912:web:98abc76ef12345"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
