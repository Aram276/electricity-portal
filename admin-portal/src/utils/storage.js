import { INITIAL_RECORDS } from '../data/initialData';

const STORAGE_KEY = 'electricity_portal_records_v2_real';
const ADMIN_KEY = 'electricity_portal_admin_session';

/**
 * Deduplicate records array by id and fileNumber and sort numerically
 */
export function deduplicateRecords(records) {
  if (!Array.isArray(records)) return [];
  const seenIds = new Set();
  const seenFiles = new Set();
  const cleaned = [];

  for (const r of records) {
    if (!r) continue;
    let id = String(r.id || '').trim();
    const fileStr = String(r.fileNumber || '').trim();

    if (!id) {
      id = 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      r.id = id;
    }

    if (seenIds.has(id)) {
      if (fileStr && seenFiles.has(fileStr)) {
        continue; // Exact duplicate, skip
      }
      // Different file but duplicate ID - assign new unique ID
      id = 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      r.id = id;
    }

    if (fileStr && seenFiles.has(fileStr)) {
      continue; // Duplicate file number, skip
    }

    seenIds.add(id);
    if (fileStr) seenFiles.add(fileStr);
    cleaned.push(r);
  }

  // Sort numerically in ascending order by fileNumber
  return cleaned.sort((a, b) => {
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

  const cleaned = deduplicateRecords(updated);
  saveRecords(cleaned);
  return cleaned;
}

export function isAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function setAdminAuthenticated(val) {
  sessionStorage.setItem(ADMIN_KEY, val ? 'true' : 'false');
}

