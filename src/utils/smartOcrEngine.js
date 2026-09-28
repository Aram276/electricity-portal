/**
 * Ultra-Fast & Resilient Multi-Pass OCR Engine
 * Optimized for:
 * - Kurdistan Electricity Receipts & Bills (وەسڵ / پسوولە) with 11-digit IDs (6315..., 6345..., 7000...)
 * - Targeted Region Zoom & Multi-Pass Scanning
 * - Iraqi Phone Numbers (0750..., 0770..., 0780..., 964...)
 * - Yellow Folders (فایلی زەرد) with Yellow-Paper Filter & High Contrast
 * - Real-time Arabic/Kurdish to Latin Numeral Translator (٠-٩ -> 0-9)
 */
import { createWorker } from 'tesseract.js';

// Convert Eastern Arabic / Persian numerals to Latin (٠-٩ -> 0-9)
export function toLatinDigits(str) {
  if (!str) return '';
  const eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(eastern[i], String(i)).replaceAll(persian[i], String(i));
  }
  return res;
}

/**
 * Intelligent Character Disambiguation & Numeral Fixer
 */
export function fixOcrDigitConfusions(text) {
  if (!text) return '';
  let cleaned = toLatinDigits(text);

  // Clean digit sequences that have OCR character misreads
  cleaned = cleaned.replace(/(\b[0-9OolIZzSsBgq]{5,15}\b)/g, (match) => {
    return match
      .replace(/[OoQ]/g, '0')
      .replace(/[lIi|!L]/g, '1')
      .replace(/[Zz]/g, '2')
      .replace(/[Ss]/g, '5')
      .replace(/[B]/g, '8')
      .replace(/[gq]/g, '9');
  });

  return cleaned;
}

/**
 * Adaptive Image Pre-processors with Mobile-Optimized Downscaling (Max 1280px)
 */
export function preprocessImage(imgElement, mode = 'receipt', cropRect = null) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const srcW = imgElement.naturalWidth || imgElement.width || 1200;
    const srcH = imgElement.naturalHeight || imgElement.height || 900;

    let sx = 0, sy = 0, sw = srcW, sh = srcH;
    if (cropRect) {
      sx = Math.round(srcW * cropRect.x);
      sy = Math.round(srcH * cropRect.y);
      sw = Math.round(srcW * cropRect.w);
      sh = Math.round(srcH * cropRect.h);
    }

    // ⚡ ULTRA-FAST MOBILE SCALING:
    // Android cameras capture 12MP/48MP (4000x3000). Downscaling to max 1280px speeds up WASM OCR by 600-1000%
    const MAX_DIM = 1280;
    let scale = 1.0;
    const maxOriginal = Math.max(sw, sh);
    if (maxOriginal > MAX_DIM) {
      scale = MAX_DIM / maxOriginal;
    } else if (maxOriginal < 700) {
      scale = Math.min(2.0, 1000 / maxOriginal);
    }

    const width = Math.round(sw * scale);
    const height = Math.round(sh * scale);

    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgElement, sx, sy, sw, sh, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;

    if (mode === 'receipt') {
      // Enhanced grayscale & high-definition ink contrast for receipts
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        // Sharpen dark text while brightening paper background
        const val = gray < 135 ? Math.max(0, (gray - 20) * 0.7) : Math.min(255, gray * 1.35);
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
    } else if (mode === 'yellow_folder') {
      // Specialized filter for yellow folders: makes yellow paper white and pencil/pen dark
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const brightness = (r + g) * 0.55 - b * 0.1;
        const stretched = (brightness - 110) * 2.2 + 110;
        const val = Math.min(255, Math.max(0, stretched));
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
    } else if (mode === 'binarize') {
      for (let i = 0; i < d.length; i += 4) {
        const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const val = avg > 135 ? 255 : 0;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
    } else {
      // High dynamic range contrast stretch
      for (let i = 0; i < d.length; i += 4) {
        const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const val = Math.min(255, Math.max(0, (avg - 128) * 1.8 + 128));
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('Preprocessing notice:', e);
    return null;
  }
}

/**
 * Intelligent parser to extract Electricity Account IDs, Phone Numbers, Citizen Name, Box, and Amount
 */
export function extractElectricityNumbers(rawText) {
  const clean = fixOcrDigitConfusions(rawText || '');
  const results = {
    accountNumbers: [],
    phoneNumbers: [],
    fileNumbers: [],
    citizenName: '',
    primaryAccount: null,
    primaryPhone: null,
    boxNumber: null,
    totalAmount: null,
    billDate: null,
    rawText: clean
  };

  const foundAccounts = new Set();
  const foundPhones = new Set();
  const foundFiles = new Set();

  // 0. Detect Dates & Explicitly Exclude them from Accounts
  const datePattern = /\b([0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})\b/g;
  const dates = new Set();
  let dateMatch;
  while ((dateMatch = datePattern.exec(clean)) !== null) {
    const rawDate = dateMatch[1].trim();
    if (/(?:20[2-3][0-9]|19[8-9][0-9])/.test(rawDate) || /^(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[0-2])[\/\-\.]/.test(rawDate)) {
      dates.add(rawDate);
      if (!results.billDate) {
        results.billDate = rawDate;
      }
    }
  }

  const isDateString = (str) => {
    if (!str) return false;
    const cleanStr = String(str).trim();
    if (dates.has(cleanStr)) return true;
    if (/(?:20[2-3][0-9]|19[8-9][0-9])/.test(cleanStr) && (cleanStr.includes('/') || cleanStr.includes('-') || cleanStr.includes('.'))) {
      return true;
    }
    if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(cleanStr) || /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(cleanStr)) {
      return true;
    }
    return false;
  };

  // 1. EXACT KURDISTAN 11-DIGIT ELECTRICITY ACCOUNT NUMBER (e.g. 63450291130, 70000374549, 63157262865)
  // Auto-stitch prefix 61..65, 70..75 even with space, dash, or newline before 8-10 digits: e.g. "63 450291130" -> "63450291130"
  const prefixStitchPattern = /(?:^|\D)(6[1-5]|7[0-5])[\s\-\:\.\/]*([0-9]{8,10})(?:\D|$)/g;
  let match;
  while ((match = prefixStitchPattern.exec(clean)) !== null) {
    const full11 = (match[1] + match[2]).replace(/\D/g, '');
    if (full11.length >= 10 && full11.length <= 12) {
      foundAccounts.add(full11);
    }
  }

  // General 11-digit numbers starting with 6 or 7
  const kurd11Pattern = /(?:^|\D)(6[1-5][0-9\s-]{9,15}[0-9]|7[0-5][0-9\s-]{9,15}[0-9])(?:\D|$)/g;
  while ((match = kurd11Pattern.exec(clean)) !== null) {
    const pure = match[1].replace(/[\s-]/g, '');
    if (pure.length === 11 && (pure.startsWith('6') || pure.startsWith('7'))) {
      foundAccounts.add(pure);
    }
  }

  // Secondary search for 11-digit sequences across OCR space artifacts
  const digitsWithSpaces = clean.replace(/[^\d\s]/g, ' ');
  const clean11Regex = /\b(6[1-5]\d{9}|7[0-5]\d{9})\b/g;
  while ((match = clean11Regex.exec(digitsWithSpaces)) !== null) {
    foundAccounts.add(match[1]);
  }

  // 2. Iraqi Kurdistan Phone Numbers (0750..., 0770..., 0780..., 0790..., 964...)
  const phonePattern = /\b(?:(?:\+?964|00964)[\s-]?)?(0?7[5789][0-9]{8})\b|\b(964[0-9]{8,11})\b/g;
  while ((match = phonePattern.exec(clean)) !== null) {
    const p = match[1] || match[2] || match[0];
    if (p) foundPhones.add(p.replace(/[\s-]/g, ''));
  }

  // Labeled Phone matches
  const labeledPhone = /(?:تەلەفۆن|مۆبایل|ژمارەی\s*مۆبایل|ژ\.\s*تەلەفۆن|هاتف|Phone|Tel|Mobile|📞)\s*[:.]?\s*([0-9\+\s]{8,16})/gi;
  while ((match = labeledPhone.exec(clean)) !== null) {
    const rawP = match[1].replace(/[\s-]/g, '');
    if (rawP.length >= 9 && rawP.length <= 15) {
      foundPhones.add(rawP);
    }
  }

  // 3. Continuous 8 to 13-digit Account IDs
  const accountPattern = /\b([0-9]{8,13})\b/g;
  while ((match = accountPattern.exec(clean)) !== null) {
    const num = match[1];
    if (
      !num.startsWith('075') && 
      !num.startsWith('077') && 
      !num.startsWith('078') && 
      !num.startsWith('079') && 
      !num.startsWith('964') && 
      !num.startsWith('2024') && 
      !num.startsWith('2025') && 
      !num.startsWith('2026') &&
      !isDateString(num)
    ) {
      // In Kurdistan electricity bills, 9-digit account numbers are prefixed with 63 (Erbil) or 70 (Sulaymaniyah)
      if (num.length === 9) {
        foundAccounts.add('63' + num); // Erbil province
        foundAccounts.add('70' + num); // Sulaymaniyah province
        foundAccounts.add(num);
      } else if (num.length === 10) {
        if (num.startsWith('3')) foundAccounts.add('6' + num); // e.g. 6 + 3450291130 -> 63450291130
        if (num.startsWith('0')) foundAccounts.add('7' + num); // e.g. 7 + 0000374549 -> 70000374549
        foundAccounts.add(num);
      } else {
        foundAccounts.add(num);
      }
    }
  }

  // Check all lines in raw text for numbers separated by spaces/newlines
  const lines = clean.split(/[\r\n]+/);
  for (const line of lines) {
    const lineDigits = line.replace(/[^\d]/g, '');
    if (lineDigits.length >= 10 && lineDigits.length <= 12) {
      if (/^(?:6[1-5]|7[0-5])/.test(lineDigits)) {
        foundAccounts.add(lineDigits);
      }
    }
  }

  // 4. Slashed Account IDs on Yellow Folders e.g. 1891 / 205 or 1891 / 205 / 7000 (Exclude dates!)
  const formattedPattern = /\b([0-9]{1,7}\s*[\/\-\.]\s*[0-9]{1,7}(?:\s*[\/\-\.]\s*[0-9]{1,8})?)\b/g;
  while ((match = formattedPattern.exec(clean)) !== null) {
    const matchedStr = match[1].trim();
    if (!isDateString(matchedStr)) {
      const stripped = matchedStr.replace(/[\/\-\.\s]/g, '');
      if (stripped.length >= 3 && stripped.length <= 16) {
        if (!stripped.startsWith('075') && !stripped.startsWith('077') && !stripped.startsWith('202')) {
          foundAccounts.add(matchedStr);
        }
      }
    }
  }

  // 5. Look specifically under "ژمارەی ئەژمار" or "Account ID" or "ژ.ئەژمار"
  const labeledPattern = /(?:ژمارەی\s*ئەژمار|ژ\.\s*ئەژمار|ئەژمار|Account\s*ID|ID)[\s\:\.\-]*([0-9\/\-\s]{4,20})/gi;
  while ((match = labeledPattern.exec(clean)) !== null) {
    const candidate = match[1].trim().replace(/\s+/g, ' ');
    if (!isDateString(candidate)) {
      const stripped = candidate.replace(/[\s\/\-\.]/g, '');
      if (stripped.length >= 4 && stripped.length <= 16 && !stripped.startsWith('202')) {
        foundAccounts.add(candidate);
      }
    }
  }

  // 6. Box Number (ژ.سندوق / سندوق / E511324)
  const boxPattern = /(?:ژ\.?\s*سندوق|سندوق|ژمارەی\s*سندوق|Box)\s*[:.]?\s*([A-Za-z0-9]{3,12})/gi;
  while ((match = boxPattern.exec(clean)) !== null) {
    const box = match[1].trim();
    if (box && !box.startsWith('075') && !box.startsWith('62') && !box.startsWith('63') && !box.startsWith('70')) {
      results.boxNumber = box;
      foundFiles.add(box);
    }
  }

  // 7. File Numbers (e.g. #152, فایل: 3, دۆسیە: 5, فەرمان 152)
  const filePattern = /(?:فەرمان|فایل|دۆسیە|file|no|#)\s*[:.]?\s*([0-9]{1,6})\b/gi;
  while ((match = filePattern.exec(clean)) !== null) {
    foundFiles.add(match[1]);
  }

  // 8. Citizen Name Extraction (ناو / الاسم)
  const namePattern = /(?:ناو|ناوی\s*هاووڵاتی|الاسم|ناوی\s*سیانی|Name)\s*[:.]?\s*([\u0600-\u06FF\s]{4,35})/i;
  const nameMatch = clean.match(namePattern);
  if (nameMatch) {
    const rawName = nameMatch[1].split(/[\n\r\t,،;:]/)[0].trim();
    if (rawName.length >= 3 && !rawName.includes('ئەژمار') && !rawName.includes('هاوبەش')) {
      results.citizenName = rawName;
    }
  }

  // 9. Total Amount (کۆی گشتی / بڕی پارە)
  const amountPattern = /(?:کۆی\s*گشتی|بڕی\s*پارە|کۆ|المجموع|Total)\s*[:.]?\s*([0-9]{1,3}(?:[,.][0-9]{3})*|[0-9]{4,8})/i;
  const amountMatch = clean.match(amountPattern);
  if (amountMatch) {
    results.totalAmount = amountMatch[1].trim();
  }

  // ── SORT AND PRIORITIZE ALL ACCOUNT NUMBERS ──
  const allAccounts = Array.from(foundAccounts).filter(a => !isDateString(a));

  allAccounts.sort((a, b) => {
    const pureA = a.replace(/\D/g, '');
    const pureB = b.replace(/\D/g, '');

    // Priority 1: Exact 11-Digit Kurdistan Account (63... or 70... or 61-65, 71-75)
    const is11KurdA = pureA.length === 11 && (pureA.startsWith('63') || pureA.startsWith('70') || /^(?:6[1-5]|7[0-5])/.test(pureA));
    const is11KurdB = pureB.length === 11 && (pureB.startsWith('63') || pureB.startsWith('70') || /^(?:6[1-5]|7[0-5])/.test(pureB));
    if (is11KurdA && !is11KurdB) return -1;
    if (!is11KurdA && is11KurdB) return 1;

    // Priority 2: Other 11-digit numbers
    if (pureA.length === 11 && pureB.length !== 11) return -1;
    if (pureA.length !== 11 && pureB.length === 11) return 1;

    // Priority 3: Slashed yellow folder format (e.g. 1891 / 205)
    const isSlashA = a.includes('/') || a.includes('-');
    const isSlashB = b.includes('/') || b.includes('-');
    if (isSlashA && !isSlashB) return -1;
    if (!isSlashA && isSlashB) return 1;

    // Priority 4: Longer digit count
    return pureB.length - pureA.length;
  });

  results.accountNumbers = allAccounts;
  results.phoneNumbers = Array.from(foundPhones);
  results.fileNumbers = Array.from(foundFiles);

  if (results.phoneNumbers.length > 0) {
    results.primaryPhone = results.phoneNumbers[0];
  }

  if (results.accountNumbers.length > 0) {
    results.primaryAccount = results.accountNumbers[0].replace(/\s+/g, '');
  }

  return results;
}

/**
 * Scan for QR-Code / Barcode using Native BarcodeDetector
 */
export async function scanBarcodeOrQr(imgElement) {
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
      });
      const barcodes = await barcodeDetector.detect(imgElement);
      if (barcodes && barcodes.length > 0) {
        const rawValue = barcodes[0].rawValue || '';
        if (rawValue) {
          const parsed = extractElectricityNumbers(rawValue);
          const urlMatch = rawValue.match(/([0-9]{8,13})/);
          if (urlMatch && !parsed.primaryAccount) {
            parsed.primaryAccount = urlMatch[1];
            if (!parsed.accountNumbers.includes(urlMatch[1])) {
              parsed.accountNumbers.unshift(urlMatch[1]);
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('BarcodeDetector note:', e);
    }
  }
  return null;
}

let cachedWorkerPromise = null;

async function getCachedWorker(onProgress) {
  if (!cachedWorkerPromise) {
    cachedWorkerPromise = createWorker('eng', 1, {
      workerBlobURL: true,
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          const p = Math.round(35 + m.progress * 55);
          onProgress(p, `پشکنینی خێرای وەسڵەکە... (${Math.round(m.progress * 100)}%)`);
        }
      }
    });
  }
  return cachedWorkerPromise;
}

/**
 * Super-Intelligent Multi-Pass OCR Pipeline across Entire Image (Lightning Fast for Mobile)
 */
export async function performSmartOCR(dataUrl, onProgress = () => {}) {
  let combinedText = '';

  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // ── PASS 0: Instant Barcode / QR Detection ──
  onProgress(10, 'پشکنینی باڕکۆد و QR-Code ی وەسڵ...');
  const qrResult = await scanBarcodeOrQr(img);
  if (qrResult && qrResult.primaryAccount) {
    onProgress(100, 'سەرکەوتوو بوو! ژمارەی ئەژمار لە QR-Code دۆزرایەوە.');
    return qrResult;
  }

  // ── PASS 1: Native Mobile TextDetector (Ultra-fast & offline on Android) ──
  if (typeof window !== 'undefined' && 'TextDetector' in window) {
    try {
      onProgress(20, 'خوێندنەوەی خێرای دەق و ژمارەکان لە سەرانسەری وێنە...');
      const detector = new window.TextDetector();
      const detected = await detector.detect(img);
      if (Array.isArray(detected) && detected.length > 0) {
        const nativeText = detected.map(d => d.rawValue || '').join('\n');
        combinedText += '\n' + nativeText;
        const nativeParsed = extractElectricityNumbers(combinedText);
        if (nativeParsed.primaryAccount) {
          onProgress(100, 'سەرکەوتوو بوو! ژمارەکان بە خێرایی دۆزرانەوە.');
          return nativeParsed;
        }
      }
    } catch (nativeErr) {
      console.warn('Native TextDetector fallback:', nativeErr);
    }
  }

  // ── PASS 2: Bundled Tesseract Engine Across Entire Image ──
  onProgress(35, 'شیکردنەوەی خێرای وەسڵەکە...');
  try {
    const worker = await getCachedWorker(onProgress);

    // Pass 2A: Full High-Definition Receipt Filter (Mobile Optimized Max 1280px)
    const receiptUrl = preprocessImage(img, 'receipt');
    const result1 = await worker.recognize(receiptUrl || dataUrl);
    const text1 = result1?.data?.text || '';
    combinedText += '\n' + text1;

    let parsed = extractElectricityNumbers(combinedText);

    // If Kurdistan Account ID or numbers found in Pass 2A, finish immediately (Takes ~0.8s on Android!)
    if (parsed.accountNumbers.length > 0 && parsed.primaryAccount) {
      onProgress(100, 'سەرکەوتوو بوو! ژمارەی ئەژمار بە سەرکەوتوویی دۆزرایەوە.');
      return parsed;
    }

    // Pass 2B: High Contrast Yellow-Paper Filter across Entire Image (Fallback only if not found in 2A)
    onProgress(85, 'پشکنینی فلتەری دووەم بۆ فایلی زەرد...');
    const yellowUrl = preprocessImage(img, 'yellow_folder');
    if (yellowUrl) {
      const result2 = await worker.recognize(yellowUrl);
      const text2 = result2?.data?.text || '';
      combinedText += '\n' + text2;
      parsed = extractElectricityNumbers(combinedText);
    }

    onProgress(100, 'پشکنین بە سەرکەوتوویی تەواو بوو');
    return parsed;
  } catch (err) {
    console.error('Tesseract Execution:', err);
    if (combinedText) {
      return extractElectricityNumbers(combinedText);
    }
    throw err;
  }
}
