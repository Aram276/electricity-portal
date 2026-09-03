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

const LOGS_DOC_REF = doc(db, 'portal_data', 'activity_logs');

/**
 * Subscribe to Live Activity Logs from Firestore Cloud and local updates.
 */
export function subscribeToActivityLogs(onUpdateCallback) {
  try {
    // Immediate callback from cache if available
    try {
      const cached = JSON.parse(localStorage.getItem('electricity_activity_logs') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        onUpdateCallback(cached);
      }
    } catch (e) {}

    // In-app immediate update listener
    const handleLocalUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        onUpdateCallback(e.detail);
      }
    };
    window.addEventListener('activity_log_updated', handleLocalUpdate);

    // Live Cloud Subscription
    const unsubscribe = onSnapshot(LOGS_DOC_REF, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.logs)) {
          localStorage.setItem('electricity_activity_logs', JSON.stringify(data.logs));
          onUpdateCallback(data.logs);
          return;
        }
      }
      try {
        const cached = JSON.parse(localStorage.getItem('electricity_activity_logs') || '[]');
        onUpdateCallback(cached);
      } catch (e) {
        onUpdateCallback([]);
      }
    }, (err) => {
      console.warn('Activity logs subscription error:', err);
      try {
        const cached = JSON.parse(localStorage.getItem('electricity_activity_logs') || '[]');
        onUpdateCallback(cached);
      } catch (e) {
        onUpdateCallback([]);
      }
    });

    return () => {
      window.removeEventListener('activity_log_updated', handleLocalUpdate);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  } catch (err) {
    console.error('Failed to subscribe to activity logs:', err);
    return () => {};
  }
}

/**
 * Log an activity permanently to Firestore Cloud.
 */
export async function logActivity(type, title, details = {}) {
  try {
    let cloudLogs = [];
    try {
      const snap = await getDoc(LOGS_DOC_REF);
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.logs)) {
          cloudLogs = data.logs;
        }
      }
    } catch (e) {
      console.warn('Could not read existing cloud logs:', e);
    }

    let localLogs = [];
    try {
      localLogs = JSON.parse(localStorage.getItem('electricity_activity_logs') || '[]');
    } catch (e) {}

    // Deduplicate and combine logs
    const logMap = new Map();
    cloudLogs.forEach(l => { if (l?.id) logMap.set(l.id, l); });
    localLogs.forEach(l => { if (l?.id) logMap.set(l.id, l); });

    const activeStaff = JSON.parse(localStorage.getItem('electricity_active_staff') || 'null');
    const userName = activeStaff?.name ? `${activeStaff.name} (${activeStaff.title || 'ژووری ١٩'})` : 'کارمەندی ژووری ١٩';

    const newLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      type, // 'STATUS_CHANGE' | 'CREATE' | 'DELETE' | 'EXCEL_IMPORT' | 'WHATSAPP_BROADCAST' | 'DELIVERY'
      title,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: userName
    };

    const combined = [newLog, ...Array.from(logMap.values())].slice(0, 1000); // Retain up to 1,000 logs
    localStorage.setItem('electricity_activity_logs', JSON.stringify(combined));
    window.dispatchEvent(new CustomEvent('activity_log_updated', { detail: combined }));

    await setDoc(LOGS_DOC_REF, {
      logs: combined,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to log activity to cloud:', err);
  }
}

const STAFF_DOC_REF = doc(db, 'portal_data', 'staff_accounts');

export const DEFAULT_STAFF = [
  { id: 'staff-1', username: 'aram', name: 'ئارام', role: 'ADMIN', pin: '075075', title: 'بەڕێوەبەری سەرەکی' },
  { id: 'staff-2', username: 'raad', name: 'ڕەعد', role: 'STAFF', pin: '1919', title: 'فەرمانبەری ژووری ١٩' }
];

/**
 * Subscribe to Staff accounts list from Firestore Cloud.
 */
export function subscribeToStaffAccounts(onUpdateCallback) {
  try {
    const unsubscribe = onSnapshot(STAFF_DOC_REF, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.staff) && data.staff.length > 0) {
          localStorage.setItem('electricity_staff_list', JSON.stringify(data.staff));
          onUpdateCallback(data.staff);
          return;
        }
      }
      try {
        const cached = JSON.parse(localStorage.getItem('electricity_staff_list') || 'null');
        onUpdateCallback(cached || DEFAULT_STAFF);
      } catch (e) {
        onUpdateCallback(DEFAULT_STAFF);
      }
    }, (err) => {
      console.warn('Staff accounts subscription error:', err);
      try {
        const cached = JSON.parse(localStorage.getItem('electricity_staff_list') || 'null');
        onUpdateCallback(cached || DEFAULT_STAFF);
      } catch (e) {
        onUpdateCallback(DEFAULT_STAFF);
      }
    });

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to staff accounts:', err);
    return () => {};
  }
}

/**
 * Save staff accounts to Firestore Cloud.
 */
export async function saveStaffAccountsToCloud(staffList) {
  try {
    localStorage.setItem('electricity_staff_list', JSON.stringify(staffList));
    await setDoc(STAFF_DOC_REF, {
      staff: staffList,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to save staff accounts to cloud:', err);
  }
}


