import { INITIAL_RECORDS } from '../data/initialData';
import { getKurdistanDateTime } from './dateUtils';

const STORAGE_KEY = 'electricity_portal_records_v2_real';
const ADMIN_KEY = 'electricity_portal_admin_session';

/**
 * Deduplicate records array by id and fileNumber, ensuring both regular records and special records
 * coexist without colliding, and recovering missing initial regular records.
 */
export function deduplicateRecords(records) {
  if (!Array.isArray(records)) records = [];

  const regularMap = new Map(); // fileStr -> record
  const specialMap = new Map(); // fileStr -> record
  const seenIds = new Set();

  for (const raw of records) {
    if (!raw) continue;
    const r = { ...raw };
    const isSpecial = Boolean(r.isSpecial);
    const fileStr = String(r.fileNumber || '').trim();

    // Ensure special IDs start with 'sp-' and regular IDs don't collide
    if (isSpecial) {
      if (!r.id || r.id.startsWith('rec-')) {
        r.id = 'sp-' + (r.id ? r.id : (Date.now() + '-' + Math.random().toString(36).slice(2, 7)));
      }
      if (fileStr && !specialMap.has(fileStr)) {
        specialMap.set(fileStr, r);
      } else if (!fileStr) {
        specialMap.set('no_file_sp_' + (r.id || Math.random()), r);
      }
    } else {
      if (!r.id) {
        r.id = 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      }
      if (fileStr && !regularMap.has(fileStr)) {
        regularMap.set(fileStr, r);
      } else if (!fileStr) {
        regularMap.set('no_file_reg_' + (r.id || Math.random()), r);
      }
    }
  }

  // Restore any missing base regular records from INITIAL_RECORDS (e.g. files 2, 3, 4, 5, etc.)
  if (Array.isArray(INITIAL_RECORDS)) {
    for (const initRec of INITIAL_RECORDS) {
      const fileStr = String(initRec.fileNumber || '').trim();
      if (fileStr && !regularMap.has(fileStr)) {
        regularMap.set(fileStr, { ...initRec, isSpecial: false });
      }
    }
  }

  // Combine both regular and special records
  const allRecords = [...regularMap.values(), ...specialMap.values()];

  // Ensure unique IDs across all records
  const finalRecords = [];
  for (const r of allRecords) {
    let id = String(r.id || '').trim();
    if (!id || seenIds.has(id)) {
      id = (r.isSpecial ? 'sp-' : 'rec-') + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      r.id = id;
    }
    seenIds.add(id);
    finalRecords.push(r);
  }

  // Sort numerically: Regular files first (sorted by fileNumber), then Special files (sorted by fileNumber)
  return finalRecords.sort((a, b) => {
    if (Boolean(a.isSpecial) !== Boolean(b.isSpecial)) {
      return a.isSpecial ? 1 : -1;
    }
    const numA = parseInt(a.fileNumber, 10) || 0;
    const numB = parseInt(b.fileNumber, 10) || 0;
    return numA - numB;
  });
}

export function getStoredRecords() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const initial = deduplicateRecords(INITIAL_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(data);
    if (!parsed || !parsed.length) {
      const initial = deduplicateRecords(INITIAL_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return deduplicateRecords(parsed);
  } catch (error) {
    console.error('Failed to load from storage, using fallback:', error);
    return deduplicateRecords(INITIAL_RECORDS);
  }
}

export function saveRecords(records) {
  try {
    const cleaned = deduplicateRecords(records);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

export function resetToDemoRecords() {
  const initial = deduplicateRecords(INITIAL_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function markAsDelivered(recordId, receiverName = '', customDate = null, isKycDone = true, nationalId = '') {
  const records = getStoredRecords();
  const now = customDate || getKurdistanDateTime(false);
  
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

  const cleaned = deduplicateRecords(updated);
  saveRecords(cleaned);
  return cleaned;
}

const TRASH_STORAGE_KEY = 'electricity_portal_trash_records_v1';

export function getStoredTrash() {
  try {
    const data = localStorage.getItem(TRASH_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load trash from storage:', error);
    return [];
  }
}

export function saveTrash(trashRecords) {
  try {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashRecords || []));
  } catch (error) {
    console.error('Failed to save trash to storage:', error);
  }
}

export function isAdminAuthenticated() {
  try {
    return (
      sessionStorage.getItem(ADMIN_KEY) === 'true' || 
      localStorage.getItem(ADMIN_KEY) === 'true' || 
      Boolean(localStorage.getItem('electricity_active_staff'))
    );
  } catch (e) {
    return false;
  }
}

export function setAdminAuthenticated(val) {
  try {
    if (val) {
      sessionStorage.setItem(ADMIN_KEY, 'true');
      localStorage.setItem(ADMIN_KEY, 'true');
    } else {
      sessionStorage.removeItem(ADMIN_KEY);
      localStorage.removeItem(ADMIN_KEY);
      localStorage.removeItem('electricity_active_staff');
    }
  } catch (e) {}
}

