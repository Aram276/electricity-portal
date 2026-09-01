import * as XLSX from 'xlsx';
import { STATUS_CONFIG } from '../constants/status';

function normalizeHeader(header) {
  if (!header) return '';
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[\s\-_/\\:]+/g, '');
}

export function detectColumnMapping(headers) {
  const mapping = {
    accountNumber: null,
    phoneNumber: null,
    citizenName: null,
    fileNumber: null,
    status: null,
    department: null,
    transactionType: null,
    archiveLocation: null,
    submissionDate: null,
    completionDate: null,
    deliveredDate: null,
    receiverName: null,
    notes: null
  };

  headers.forEach(h => {
    const raw = String(h).trim();
    const clean = normalizeHeader(raw);

    // ID / Account Number
    if (clean === 'id' || clean === 'account' || clean === 'accountnumber' || clean.includes('ئەژمار') || clean.includes('حساب')) {
      if (!mapping.accountNumber) mapping.accountNumber = raw;
    }
    // Phone Number
    else if (clean === 'phonenumber' || clean === 'phone' || clean === 'mobile' || clean.includes('مۆبایل') || clean.includes('تەلەفۆن') || clean.includes('هاتف')) {
      if (!mapping.phoneNumber) mapping.phoneNumber = raw;
    }
    // File Number
    else if (clean === 'numberfile' || clean === 'filenumber' || clean === 'fileno' || clean === 'file' || clean.includes('ژمارەیفایل') || clean.includes('فایل') || clean.includes('ملف')) {
      if (!mapping.fileNumber) mapping.fileNumber = raw;
    }
    // Name
    else if (clean === 'name' || clean.includes('ناو') || clean.includes('اسم')) {
      if (!mapping.citizenName) mapping.citizenName = raw;
    }
    // Status
    else if (clean === 'status' || clean.includes('دۆخ') || clean.includes('حالة')) {
      if (!mapping.status) mapping.status = raw;
    }
    // Date / Delivery Date
    else if (clean === 'date' || clean.includes('بەروار') || clean.includes('تاريخ')) {
      if (!mapping.deliveredDate) mapping.deliveredDate = raw;
    }
    // Receiver Name
    else if (clean === 'nameofrecive' || clean === 'receiver' || clean.includes('وەرگر') || clean.includes('مستلم')) {
      if (!mapping.receiverName) mapping.receiverName = raw;
    }
    // Archive Location
    else if (clean.includes('شوێن') || clean.includes('ئەرشیف') || clean.includes('سندوق') || clean.includes('archive')) {
      if (!mapping.archiveLocation) mapping.archiveLocation = raw;
    }
    // Notes
    else if (clean.includes('تێبینی') || clean.includes('notes') || clean.includes('comment')) {
      if (!mapping.notes) mapping.notes = raw;
    }
  });

  return mapping;
}

export function normalizeStatus(val, dateVal, receiveVal) {
  if (receiveVal || dateVal) {
    return 'DELIVERED';
  }
  if (!val) return 'IN_PROGRESS';
  const str = String(val).trim().toLowerCase();

  if (str === 'done' || str.includes('تەواو') || str.includes('complete') || str.includes('ناجح')) {
    return 'COMPLETED';
  }
  if (str === 'not done' || str.includes('چاوەڕێ') || str.includes('progress') || str.includes('قيد')) {
    return 'IN_PROGRESS';
  }
  if (str.includes('تەسلیم') || str.includes('delivered') || str.includes('مستلم')) {
    return 'DELIVERED';
  }
  return 'IN_PROGRESS';
}

export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pick 'Records' sheet if exists, otherwise first sheet
        const sheetName = workbook.SheetNames.includes('Records') ? 'Records' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (!rawJson || rawJson.length === 0) {
          throw new Error('فایلەکە بەتاڵە یان هیچ داتایەکی تێدا نەدۆزرایەوە.');
        }

        const headers = Object.keys(rawJson[0]);
        const mapping = detectColumnMapping(headers);

        const records = [];
        let index = 1;

        for (const row of rawJson) {
          const fileVal = String(row[mapping.fileNumber] || row['number file'] || row['ژمارەی فایل'] || row['File'] || '').trim();
          const accVal = String(row[mapping.accountNumber] || row['ID'] || row['ژمارەی ئەژمار'] || row['Account'] || '').trim();
          const phoneVal = String(row[mapping.phoneNumber] || row['Phone Number'] || row['ژمارەی مۆبایل'] || row['Phone'] || '').trim();
          const nameVal = String(row[mapping.citizenName] || row['Name'] || row['ناوی هاووڵاتی'] || row['ناو'] || '').trim();
          const statusRaw = String(row[mapping.status] || row['Status'] || row['دۆخ'] || '').trim();
          const dateVal = String(row[mapping.deliveredDate] || row['date'] || row['بەروار'] || '').trim();
          const recNameVal = String(row[mapping.receiverName] || row['name of recive'] || row['ناوی وەرگرەوە'] || '').trim();

          // Skip headers / months metadata
          if (!fileVal && !accVal && !phoneVal) continue;
          if (nameVal.startsWith('مانگی ') && !accVal) continue;

          let cleanPhone = phoneVal;
          if (/^7[5789]\d{8}$/.test(cleanPhone)) {
            cleanPhone = '0' + cleanPhone;
          }

          function isYellowColor(c) {
            if (!c) return false;
            const s = String(c).toUpperCase();
            return s === 'FFFF99' || s === 'FFFF66' || s === 'FFFF00' || s === 'FFFFCC';
          }

          const rawType = String(row['جۆری دۆسیە'] || row['fileType'] || row['Type'] || row['جۆر'] || '').trim().toLowerCase();
          let fileType = 'PAPER';
          if (rawType.includes('زەرد') || rawType.includes('yellow') || rawType.includes('folder') || rawType === 'فایلی زەرد') {
            fileType = 'YELLOW_FOLDER';
          } else {
            // Scan worksheet for this row's color
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:H1000');
            for (let R = range.s.r; R <= range.e.r; R++) {
              const cellE = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })]; // Col E: number file
              const cellB = worksheet[XLSX.utils.encode_cell({ r: R, c: 1 })]; // Col B: ID
              const matchFile = fileVal && cellE && String(cellE.v).trim() === fileVal;
              const matchAcc = accVal && cellB && String(cellB.v).trim() === accVal;
              if (matchFile || matchAcc) {
                const cB = worksheet[XLSX.utils.encode_cell({ r: R, c: 1 })];
                const cA = worksheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
                const cC = worksheet[XLSX.utils.encode_cell({ r: R, c: 2 })];

                const isY = (cell) => {
                  if (!cell || !cell.s || cell.s.patternType === 'none') return false;
                  const fg = cell.s.fgColor?.rgb || '';
                  const bg = cell.s.bgColor?.rgb || '';
                  return isYellowColor(fg) || isYellowColor(bg);
                };

                if (isY(cB) || isY(cA) || isY(cC)) {
                  fileType = 'YELLOW_FOLDER';
                }
                break;
              }
            }
          }

          records.push({
            id: 'imp-' + Date.now() + '-' + index,
            fileNumber: fileVal || String(index),
            accountNumber: accVal,
            citizenName: hasRealName ? nameVal : 'هاوبەشی کارەبا',
            hasRealName: hasRealName,
            phoneNumber: cleanPhone || 'نیە',
            fileType: fileType, // 'YELLOW_FOLDER' | 'PAPER'
            department: String(row['department'] || row['فەرمانگە'] || 'بەڕێوەبەرایەتی دابەشکردنی کارەبا').trim(),
            transactionType: String(row['transactionType'] || row['جۆری مامەڵە'] || 'پڕۆژەی ڕووناکی - پێوەری زیرەک').trim(),
            status: normalizeStatus(statusRaw, dateVal, recNameVal),
            archiveLocation: String(row['archiveLocation'] || row['شوێنی فایل'] || `سندوقی ${fileVal || index}`).trim(),
            submissionDate: String(row['submissionDate'] || '2024-08-01').trim(),
            completionDate: (statusRaw.toLowerCase() === 'done' || dateVal) ? (dateVal || '2024-08-20') : null,
            deliveredDate: dateVal || null,
            receiverName: recNameVal || '',
            handledBy: 'هۆبەی پەیوەندیدار',
            notes: (cleanPhone === 'نیە' ? 'تەلەفۆنی نیە' : '') + (recNameVal ? ' | وەرگیراوەتەوە: ' + recNameVal : '')
          });

          index++;
        }

        resolve({ records, headers, detectedMapping: mapping, rawCount: records.length });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(records, filename = 'co2_file_records.xlsx') {
  const exportData = records.map((r) => ({
    'Name': r.hasRealName ? r.citizenName : '',
    'ID': r.accountNumber,
    'Phone Number': r.phoneNumber,
    'Status': r.status === 'COMPLETED' ? 'Done' : (r.status === 'DELIVERED' ? 'Done' : 'Not Done'),
    'number file': r.fileNumber,
    'جۆری دۆسیە': r.fileType === 'YELLOW_FOLDER' ? 'فایلی زەرد' : 'ئەوراق',
    'date': r.deliveredDate || '',
    'name of recive': r.receiverName || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 22 }, // Name
    { wch: 18 }, // ID
    { wch: 18 }, // Phone Number
    { wch: 14 }, // Status
    { wch: 14 }, // number file
    { wch: 16 }, // date
    { wch: 25 }  // name of recive
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');
  XLSX.writeFile(workbook, filename);
}

export function downloadStarterTemplate() {
  const sampleData = [
    {
      'Name': 'ئارام علی ئەحمەد',
      'ID': '63450291130',
      'Phone Number': '07501234567',
      'Status': 'Done',
      'number file': '1',
      'date': '',
      'name of recive': ''
    },
    {
      'Name': '',
      'ID': '70000374549',
      'Phone Number': '07509876543',
      'Status': 'Not Done',
      'number file': '2',
      'date': '',
      'name of recive': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');
  XLSX.writeFile(workbook, 'co2_file_template.xlsx');
}
