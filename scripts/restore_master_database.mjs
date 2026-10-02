import fs from 'fs';

const PROJECT_ID = 'electric-froshiry-wza2';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/portal_data`;

// Convert Firestore REST format to JS Object
function decodeFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const res = {};
    const fields = val.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      res[k] = decodeFirestoreValue(fields[k]);
    }
    return res;
  }
  return val;
}

function decodeFirestoreDoc(doc) {
  if (!doc || !doc.fields) return {};
  const res = {};
  for (const k of Object.keys(doc.fields)) {
    res[k] = decodeFirestoreValue(doc.fields[k]);
  }
  return res;
}

// Convert JS Object to Firestore REST format
function encodeFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const k of Object.keys(val)) {
      fields[k] = encodeFirestoreValue(val[k]);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function encodeFirestoreDoc(obj) {
  const fields = {};
  for (const k of Object.keys(obj)) {
    fields[k] = encodeFirestoreValue(obj[k]);
  }
  return { fields };
}

async function fetchDoc(docId) {
  const res = await fetch(`${BASE_URL}/${docId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${docId}: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return decodeFirestoreDoc(json);
}

async function writeDoc(docId, data) {
  const body = JSON.stringify(encodeFirestoreDoc(data));
  const res = await fetch(`${BASE_URL}/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to write ${docId}: ${res.status} ${errText}`);
  }
  console.log(`Saved doc ${docId} successfully`);
}

async function runFullRestore() {
  console.log('Fetching backup and logs from Firestore REST API...');
  const backupData = await fetchDoc('electricity_records_backup');
  const logsData = await fetchDoc('activity_logs');

  const backupRecords = Array.isArray(backupData.records) ? backupData.records : [];
  const logs = Array.isArray(logsData.logs) ? logsData.logs : [];

  console.log(`Backup records count: ${backupRecords.length}`);
  console.log(`Logs count: ${logs.length}`);

  const regularMap = new Map();
  const specialMap = new Map();

  // 1. Seed from backup
  backupRecords.forEach(r => {
    if (!r) return;
    const fStr = String(r.fileNumber || '').trim();
    if (r.isSpecial) {
      specialMap.set(fStr || r.id, { ...r, isSpecial: true });
    } else {
      if (fStr) regularMap.set(fStr, { ...r, isSpecial: false });
    }
  });

  // 2. Process all created logs
  const createdLogs = logs.filter(l => l.type === 'CREATE' || l.type === 'ADD_RECORD');
  console.log(`Processing ${createdLogs.length} CREATE logs...`);
  createdLogs.forEach(l => {
    const isSpec = Boolean(l.details?.isSpecial || l.title.includes('کاک سالار'));
    const f = l.details?.fileNumber || (l.title.match(/\(([0-9]+)\)/) ? l.title.match(/\(([0-9]+)\)/)[1] : null);
    if (!f) return;
    const fStr = String(f).trim();

    if (isSpec) {
      const existing = specialMap.get(fStr) || {
        id: l.details?.id || ('sp-' + fStr),
        fileNumber: fStr,
        fileType: l.details?.fileType || 'PAPER',
        accountNumber: l.details?.accountNumber || '',
        citizenName: l.details?.citizenName || 'دۆسیەی تایبەت',
        hasRealName: Boolean(l.details?.citizenName && l.details?.citizenName !== 'هاوبەشی کارەبا'),
        phoneNumber: l.details?.phoneNumber || 'نیە',
        department: 'دابەشکردنی کارەبا - فایلەکانی کاک سالار',
        transactionType: 'پڕۆژەی ڕووناکی - پێوەری زیرەک',
        status: l.details?.status || 'IN_PROGRESS',
        archiveLocation: 'سندوقی ' + fStr,
        submissionDate: l.timestamp ? l.timestamp.split(' ')[0] : '2026-09-20',
        completionDate: '',
        deliveredDate: '',
        receiverName: '',
        handledBy: l.user || 'ئارام',
        isSpecial: true,
        isKycDone: true,
        kycStatus: 'DONE_BY_US'
      };
      if (l.details) Object.assign(existing, l.details);
      specialMap.set(fStr, existing);
    } else {
      const existing = regularMap.get(fStr) || {
        id: l.details?.id || ('rec-' + fStr),
        fileNumber: fStr,
        fileType: l.details?.fileType || 'YELLOW_FOLDER',
        accountNumber: l.details?.accountNumber || '',
        citizenName: l.details?.citizenName || 'هاوبەشی کارەبا',
        hasRealName: Boolean(l.details?.citizenName && l.details?.citizenName !== 'هاوبەشی کارەبا'),
        phoneNumber: l.details?.phoneNumber || 'نیە',
        department: 'فرۆشیاری وزە ٢ (هەولێر)',
        transactionType: 'بەستنی پێوەری نوێ (اشتراك جديد)',
        status: l.details?.status || 'IN_PROGRESS',
        archiveLocation: 'سندوقی ' + fStr,
        submissionDate: l.timestamp ? l.timestamp.split(' ')[0] : '2026-09-29',
        completionDate: '',
        deliveredDate: '',
        receiverName: '',
        handledBy: l.user || 'هۆبەی پەیوەندیدار',
        notes: '',
        isSpecial: false
      };
      if (l.details) Object.assign(existing, l.details);
      regularMap.set(fStr, existing);
    }
  });

  // 3. Process status & delivery logs chronologically
  logs.slice().reverse().forEach(l => {
    const isSpec = Boolean(l.details?.isSpecial || l.title.includes('کاک سالار'));
    const f = l.details?.fileNumber || (l.title.match(/\(([0-9]+)\)/) ? l.title.match(/\(([0-9]+)\)/)[1] : null);
    if (!f) return;
    const fStr = String(f).trim();
    const targetMap = isSpec ? specialMap : regularMap;
    if (targetMap.has(fStr)) {
      const rec = targetMap.get(fStr);
      if (l.details?.citizenName && l.details.citizenName !== 'هاوبەشی کارەبا') {
        rec.citizenName = l.details.citizenName;
        rec.hasRealName = true;
      }
      if (l.details?.status) rec.status = l.details.status;
      if (l.details?.deliveredDate) rec.deliveredDate = l.details.deliveredDate;
      if (l.details?.receiverName) rec.receiverName = l.details.receiverName;
      if (l.details?.accountNumber) rec.accountNumber = l.details.accountNumber;
      if (l.details?.phoneNumber) rec.phoneNumber = l.details.phoneNumber;
      if (l.details?.kycStatus) rec.kycStatus = l.details.kycStatus;
    }
  });

  const finalRegular = Array.from(regularMap.values()).sort((a,b) => (parseInt(a.fileNumber)||0) - (parseInt(b.fileNumber)||0));
  const finalSpecial = Array.from(specialMap.values()).sort((a,b) => (parseInt(a.fileNumber)||0) - (parseInt(b.fileNumber)||0));
  const allMerged = [...finalRegular, ...finalSpecial];

  console.log(`Fully Recovered: ${finalRegular.length} Regular files (up to #${finalRegular[finalRegular.length-1].fileNumber})`);
  console.log(`Fully Recovered: ${finalSpecial.length} Special files (up to #${finalSpecial[finalSpecial.length-1].fileNumber})`);
  console.log(`Total Restored Database: ${allMerged.length} records!`);

  // 4. Save to Firestore via REST API
  console.log('Writing to Firestore cloud via REST API...');
  await writeDoc('electricity_records', {
    records: allMerged,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'MasterRestore',
    count: allMerged.length
  });

  await writeDoc('electricity_special_records', {
    records: finalSpecial,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'MasterRestore',
    count: finalSpecial.length
  });

  await writeDoc('electricity_records_backup', {
    records: allMerged,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'MasterRestore',
    count: allMerged.length
  });

  // 5. Save master JSON dumps
  fs.writeFileSync('public/cloud_records_dump.json', JSON.stringify(allMerged, null, 2), 'utf8');
  fs.writeFileSync('public/master_records_backup.json', JSON.stringify(allMerged, null, 2), 'utf8');

  // 6. Update initialData.js in all 3 portals!
  const initialDataCode = 'export const INITIAL_RECORDS = ' + JSON.stringify(allMerged, null, 2) + ';\n';
  fs.writeFileSync('admin-portal/src/data/initialData.js', initialDataCode, 'utf8');
  fs.writeFileSync('src/data/initialData.js', initialDataCode, 'utf8');
  fs.writeFileSync('citizen-portal/src/data/initialData.js', initialDataCode, 'utf8');

  console.log('🎉 Full Master Restoration Complete!');
  process.exit(0);
}

runFullRestore().catch(e => {
  console.error('Fatal restore error:', e);
  process.exit(1);
});
