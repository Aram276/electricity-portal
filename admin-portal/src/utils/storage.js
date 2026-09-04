import { INITIAL_RECORDS } from '../data/initialData';

const STORAGE_KEY = 'electricity_portal_records_v2_real';
const ADMIN_KEY = 'electricity_portal_admin_session';

export function getStoredRecords() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    const parsed = JSON.parse(data);
    if (!parsed || !parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load from storage, using fallback:', error);
    return INITIAL_RECORDS;
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

export function resetToDemoRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
  return INITIAL_RECORDS;
}

export function markAsDelivered(recordId, receiverName = '', customDate = null, isKycDone = true, nationalId = '') {
  const records = getStoredRecords();
  const now = customDate || new Date().toISOString().slice(0, 10);
  
  const updated = records.map(r => {
    if (r.id === recordId) {
      return {
        ...r,
        status: 'DELIVERED',
        deliveredDate: now,
        receiverName: receiverName || (r.hasRealName ? r.citizenName : 'هاوبەشی کارەبا'),
        isKycDone: isKycDone ?? true,
        kycStatus: isKycDone ? 'DONE' : 'PENDING',
        nationalId: nationalId || r.nationalId || '',
        notes: (r.notes ? r.notes + ' | ' : '') + `تەسلیم کرایەوە لە [${now}]`
      };
    }
    return r;
  });

  saveRecords(updated);
  return updated;
}

export function isAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function setAdminAuthenticated(val) {
  sessionStorage.setItem(ADMIN_KEY, val ? 'true' : 'false');
}
