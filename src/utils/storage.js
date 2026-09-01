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

    // Map initial real records by fileNumber and accountNumber
    const initialMap = new Map();
    INITIAL_RECORDS.forEach(r => {
      if (r.fileNumber) initialMap.set(String(r.fileNumber).trim(), r.fileType);
      if (r.accountNumber) initialMap.set(String(r.accountNumber).trim(), r.fileType);
    });

    // Sync fileType accurately based on Excel data
    const synced = parsed.map(r => {
      const fileKey = String(r.fileNumber || '').trim();
      const accKey = String(r.accountNumber || '').trim();
      const exactType = initialMap.get(fileKey) || (accKey ? initialMap.get(accKey) : null) || r.fileType || 'PAPER';
      return {
        ...r,
        fileType: exactType
      };
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
    return synced;
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

export function markAsDelivered(recordId, receiverName = '', customDate = null) {
  const records = getStoredRecords();
  const now = customDate || new Date().toISOString().slice(0, 10);
  
  const updated = records.map(r => {
    if (r.id === recordId) {
      return {
        ...r,
        status: 'DELIVERED',
        deliveredDate: now,
        receiverName: receiverName || (r.hasRealName ? r.citizenName : 'هاوبەشی کارەبا'),
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
  if (val) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_KEY);
  }
}
