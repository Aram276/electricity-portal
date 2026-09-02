import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { INITIAL_RECORDS } from '../data/initialData';
import { getStoredRecords, saveRecords } from './storage';

const DOC_REF = doc(db, 'portal_data', 'electricity_records');

/**
 * Listen to real-time changes from Firestore Cloud.
 * Whenever admin edits or adds a file from ANY device,
 * this callback fires on ALL devices in real time.
 */
export function subscribeToCloudRecords(onUpdateCallback) {
  try {
    const unsubscribe = onSnapshot(DOC_REF, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.records) && data.records.length > 0) {
          saveRecords(data.records); // also cache in local storage
          onUpdateCallback(data.records);
          return;
        }
      }

      // If cloud document does not exist yet, initialize it with current local/initial data
      const current = getStoredRecords();
      saveRecordsToCloud(current);
      onUpdateCallback(current);
    }, (error) => {
      console.warn('Firestore real-time subscription error, using local storage:', error);
      onUpdateCallback(getStoredRecords());
    });

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to cloud records:', err);
    onUpdateCallback(getStoredRecords());
    return () => {};
  }
}

/**
 * Save updated records to Firestore Cloud so all connected users see the update.
 */
export async function saveRecordsToCloud(records) {
  try {
    saveRecords(records); // save locally first
    await setDoc(DOC_REF, {
      records: records,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Admin'
    });
  } catch (error) {
    console.error('Failed to save records to Firestore Cloud:', error);
  }
}
