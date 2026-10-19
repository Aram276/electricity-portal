import { INITIAL_RECORDS } from '../data/initialData';
import { getKurdistanDateTime, toLatinDigits } from './dateUtils';

const STORAGE_KEY = 'electricity_portal_records_v2_real';
const SPECIAL_STORAGE_KEY = 'electricity_portal_special_records_v1';
const ADMIN_KEY = 'electricity_portal_admin_session';

/**
 * Get stored special records from dedicated local storage key
 */
export function getStoredSpecialRecords() {
  try {
    const data = localStorage.getItem(SPECIAL_STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const trash = getStoredTrash();
    const trashFiles = new Set(trash.map(t => String(t.fileNumber || '').trim()).filter(Boolean));
    const trashIds = new Set(trash.map(t => String(t.id || '').trim()).filter(Boolean));

    const initialSpecials = INITIAL_RECORDS.filter(r => {
      if (!r || r.isSpecial !== true || r.isDeleted) return false;
      const f = String(r.fileNumber || '').trim();
      const id = String(r.id || '').trim();
      if (f && trashFiles.has(f)) return false;
      if (id && trashIds.has(id)) return false;
      return true;
    });

    const map = new Map();
    initialSpecials.forEach(r => map.set(String(r.fileNumber || r.id).trim(), r));
    if (Array.isArray(parsed)) {
      parsed.forEach(r => {
        if (!r || r.isDeleted) return;
        const f = String(r.fileNumber || '').trim();
        const id = String(r.id || '').trim();
        if (f && trashFiles.has(f)) return false;
        if (id && trashIds.has(id)) return false;
        map.set(String(r.fileNumber || r.id).trim(), r);
      });
    }
    return Array.from(map.values());
  } catch (e) {
    return INITIAL_RECORDS.filter(r => r && r.isSpecial === true);
  }
}

/**
 * Save special records directly to dedicated local storage key
 */
export function saveSpecialRecords(specialRecords) {
  try {
    const list = Array.isArray(specialRecords) ? specialRecords : [];
    localStorage.setItem(SPECIAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save special records to storage:', e);
  }
}

/**
 * Check if a file number is a real, assigned numeric file number.
 * Returns false for placeholder strings like 'نیە', 'نادیار', '-', '0', empty strings, etc.
 */
export function isValidRealFile(fileNum) {
  if (fileNum === null || fileNum === undefined) return false;
  const s = String(fileNum).trim();
  if (!s) return false;
  const latin = toLatinDigits(s).toLowerCase();
  if (['نیە', 'نادیار', 'نەزانراو', 'وەجبە', '-', '--', 'none', 'null', 'undefined', '0', '00', ''].includes(latin)) {
    return false;
  }
  const parsed = parseInt(latin, 10);
  if (!isNaN(parsed) && parsed === 0) return false;
  return true;
}

/**
 * Deduplicate records array by id and fileNumber, ensuring both regular records and special records
 * coexist cleanly, never dropping active files and preserving the latest updates.
 */
export function deduplicateRecords(records) {
  if (!Array.isArray(records)) records = [];

  const regularMap = new Map(); // key -> record
  const specialMap = new Map(); // key -> record
  const seenIds = new Set();

  for (const raw of records) {
    if (!raw || raw.isDeleted) continue;
    const rawFile = String(raw.fileNumber || '').trim();
    const fileStr = toLatinDigits(rawFile).trim();
    const isRealFile = isValidRealFile(fileStr);
    const r = { ...raw, fileNumber: fileStr || raw.fileNumber };
    const isSpecial = Boolean(r.isSpecial);

    const getRecTime = (item) => {
      if (!item) return 0;
      if (typeof item.updatedAt === 'number') return item.updatedAt;
      if (item.updatedAt) {
        const parsed = Date.parse(item.updatedAt);
        if (!isNaN(parsed)) return parsed;
      }
      return 0;
    };

    if (isSpecial) {
      if (!r.id || r.id.startsWith('rec-')) {
        r.id = 'sp-' + (r.id ? r.id : (Date.now() + '-' + Math.random().toString(36).slice(2, 7)));
      }
      // Only group by fileNumber if it is an actual assigned file number!
      // Otherwise isolate by record ID so citizens without file numbers never collide or vanish!
      const key = isRealFile ? ('f_' + fileStr) : ('id_' + (r.id || Math.random()));
      if (!specialMap.has(key)) {
        specialMap.set(key, r);
      } else {
        const existing = specialMap.get(key);
        const tExist = getRecTime(existing);
        const tNew = getRecTime(r);
        // If the incoming record is newer, it takes precedence
        if (tNew > tExist) {
          const merged = { ...existing, ...r };
          if (r.status === 'IN_PROGRESS') {
            delete merged.deliveredDate;
            delete merged.completionDate;
            delete merged.receiverName;
            delete merged.deliveredBy;
          }
          specialMap.set(key, merged);
        } else if (tExist > tNew) {
          const merged = { ...r, ...existing };
          if (existing.status === 'IN_PROGRESS') {
            delete merged.deliveredDate;
            delete merged.completionDate;
            delete merged.receiverName;
            delete merged.deliveredBy;
          }
          specialMap.set(key, merged);
        }
      }
    } else {
      if (!r.id) {
        r.id = 'rec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      }
      // Only group by fileNumber if it is an actual assigned file number!
      const key = isRealFile ? ('f_' + fileStr) : ('id_' + (r.id || Math.random()));
      if (!regularMap.has(key)) {
        regularMap.set(key, r);
      } else {
        const existing = regularMap.get(key);
        const tExist = getRecTime(existing);
        const tNew = getRecTime(r);
        // If incoming record is newer, it takes precedence
        if (tNew > tExist) {
          const merged = { ...existing, ...r };
          if (r.status === 'IN_PROGRESS') {
            delete merged.deliveredDate;
            delete merged.completionDate;
            delete merged.receiverName;
            delete merged.deliveredBy;
          }
          regularMap.set(key, merged);
        } else if (tExist > tNew) {
          const merged = { ...r, ...existing };
          if (existing.status === 'IN_PROGRESS') {
            delete merged.deliveredDate;
            delete merged.completionDate;
            delete merged.receiverName;
            delete merged.deliveredBy;
          }
          regularMap.set(key, merged);
        }
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
    // If INITIAL_RECORDS has more records than local storage (e.g. codebase updated with records up to 1400)
    if (Array.isArray(INITIAL_RECORDS) && INITIAL_RECORDS.length > parsed.length) {
      const mergedWithInitial = deduplicateRecords([...INITIAL_RECORDS, ...parsed]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedWithInitial));
      return mergedWithInitial;
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
    
    // Automatically persist all special records to dedicated key
    const specials = cleaned.filter(r => r && r.isSpecial === true);
    localStorage.setItem(SPECIAL_STORAGE_KEY, JSON.stringify(specials));
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
  const nowTs = Date.now();
  
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
        updatedAt: nowTs,
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

