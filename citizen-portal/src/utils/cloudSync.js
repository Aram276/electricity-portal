import { db } from '../firebase';
import { 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { INITIAL_RECORDS } from '../data/initialData';

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
    const unsubscribe = onSnapshot(DOC_REF, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.records) && data.records.length > 0) {
          localStorage.setItem('electricity_portal_records', JSON.stringify(data.records));
          onUpdateCallback(data.records);
          return;
        }
      }
      try {
        const cached = JSON.parse(localStorage.getItem('electricity_portal_records') || 'null');
        onUpdateCallback(cached || INITIAL_RECORDS);
      } catch (e) {
        onUpdateCallback(INITIAL_RECORDS);
      }
    }, (error) => {
      console.warn('Firestore subscription error:', error);
      try {
        const cached = JSON.parse(localStorage.getItem('electricity_portal_records') || 'null');
        onUpdateCallback(cached || INITIAL_RECORDS);
      } catch (e) {
        onUpdateCallback(INITIAL_RECORDS);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to cloud records:', error);
    return () => {};
  }
}

/**
 * Subscribe to Footer live settings from Firestore Cloud.
 */
export function subscribeToFooterSettings(onUpdateCallback) {
  try {
    const unsubscribe = onSnapshot(FOOTER_DOC_REF, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          localStorage.setItem('footer_description', data.description || DEFAULT_FOOTER.description);
          localStorage.setItem('footer_hotline', data.hotline || DEFAULT_FOOTER.hotline);
          localStorage.setItem('footer_phone', data.phone || DEFAULT_FOOTER.phone);
          localStorage.setItem('footer_hours', data.hours || DEFAULT_FOOTER.hours);
          localStorage.setItem('footer_location', data.location || DEFAULT_FOOTER.location);
          localStorage.setItem('footer_website_name', data.websiteName || DEFAULT_FOOTER.websiteName);
          localStorage.setItem('footer_website_url', data.websiteUrl || DEFAULT_FOOTER.websiteUrl);
          localStorage.setItem('footer_copyright', data.copyright || DEFAULT_FOOTER.copyright);
          localStorage.setItem('footer_bottom_note', data.bottomNote || DEFAULT_FOOTER.bottomNote);
          onUpdateCallback(data);
          return;
        }
      }
      onUpdateCallback(DEFAULT_FOOTER);
    }, (err) => {
      console.warn('Footer subscription error:', err);
      onUpdateCallback(DEFAULT_FOOTER);
    });

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to footer settings:', err);
    return () => {};
  }
}
