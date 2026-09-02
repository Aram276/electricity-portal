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
const FOOTER_DOC_REF = doc(db, 'portal_data', 'footer_settings');

const DEFAULT_FOOTER = {
  description: 'پڕۆژەی نیشتمانیی ڕووناکی؛ پڕۆژەی حکومەتی هەرێمی کوردستان و وەزارەتی کارەبا بۆ دابینکردنی کارەبای ٢٤ کاتژمێری و مۆدێرنکردنی خزمەتگوزارییەکانی هاووڵاتیان.',
  hotline: '1992',
  phone: 'نیە',
  hours: 'یەکشەممە - پێنجشەممە (٨:٣٠ بەیانی - ١:٣٠ پاشنیوەڕۆ)',
  location: 'هەرێمی کوردستان - هەولێر - فرۆشیاری وزە ٢',
  websiteName: 'runaki.gov.krd',
  websiteUrl: 'https://runaki.gov.krd',
  copyright: `مافی ئەم سیستەمە پارێزراوە بۆ پڕۆژەی ڕووناکی - حکومەتی هەرێمی کوردستان © ${new Date().getFullYear()}`,
  bottomNote: 'سیستەمی ئەلیکترۆنی پشکنین و بەڕێوەبردنی دۆسیەکانی هاوبەشان'
};

/**
 * Listen to real-time changes for records from Firestore Cloud.
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

/**
 * Subscribe to Live Footer Settings from Cloud Firestore.
 */
export function subscribeToFooterSettings(onUpdateCallback) {
  try {
    const unsubscribe = onSnapshot(FOOTER_DOC_REF, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          const merged = { ...DEFAULT_FOOTER, ...data };
          localStorage.setItem('footer_description', merged.description || '');
          localStorage.setItem('footer_hotline', merged.hotline || '');
          localStorage.setItem('footer_phone', merged.phone || '');
          localStorage.setItem('footer_hours', merged.hours || '');
          localStorage.setItem('footer_location', merged.location || '');
          localStorage.setItem('footer_website_name', merged.websiteName || '');
          localStorage.setItem('footer_website_url', merged.websiteUrl || '');
          localStorage.setItem('footer_copyright', merged.copyright || '');
          localStorage.setItem('footer_bottom_note', merged.bottomNote || '');
          onUpdateCallback(merged);
          return;
        }
      }

      // Fallback
      onUpdateCallback(DEFAULT_FOOTER);
    }, (err) => {
      console.warn('Footer cloud sync error:', err);
      onUpdateCallback(DEFAULT_FOOTER);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to footer settings:', err);
    onUpdateCallback(DEFAULT_FOOTER);
    return () => {};
  }
}

/**
 * Save updated footer settings to Firestore Cloud for all users.
 */
export async function saveFooterSettingsToCloud(settings) {
  try {
    localStorage.setItem('footer_description', settings.description || '');
    localStorage.setItem('footer_hotline', settings.hotline || '');
    localStorage.setItem('footer_phone', settings.phone || '');
    localStorage.setItem('footer_hours', settings.hours || '');
    localStorage.setItem('footer_location', settings.location || '');
    localStorage.setItem('footer_website_name', settings.websiteName || '');
    localStorage.setItem('footer_website_url', settings.websiteUrl || '');
    localStorage.setItem('footer_copyright', settings.copyright || '');
    localStorage.setItem('footer_bottom_note', settings.bottomNote || '');
    window.dispatchEvent(new Event('footer_settings_updated'));

    await setDoc(FOOTER_DOC_REF, {
      ...settings,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to save footer settings to cloud:', error);
  }
}
