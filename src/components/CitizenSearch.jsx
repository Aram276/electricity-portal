import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Zap, 
  CheckCircle2, 
  Clock, 
  PhoneMissed, 
  PackageCheck, 
  AlertCircle, 
  Printer, 
  Copy, 
  Check, 
  Building2, 
  User, 
  Phone, 
  Hash, 
  Calendar, 
  FileText, 
  Archive, 
  Sparkles, 
  Info,
  ShieldCheck,
  Layers,
  CheckCheck,
  HelpCircle,
  Folder,
  X
} from 'lucide-react';
import { STATUS_CONFIG } from '../constants/status';
import RoonakiLogo from './RoonakiLogo';

// Convert Arabic & Persian / Kurdish numerals (٠-٩, ۰-۹) to standard Latin digits (0-9)
function toLatinDigits(str) {
  if (!str) return '';
  const eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(eastern[i], String(i)).replaceAll(persian[i], String(i));
  }
  return res;
}

// Ultra-Smart Kurdish fuzzy text normalizer
function normalizeKurdishFuzzy(str) {
  if (!str) return '';
  return toLatinDigits(str)
    .toLowerCase()
    .replace(/[ڕ]/g, 'ر')
    .replace(/[ڵ]/g, 'ل')
    .replace(/[يىئێی]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ةه]/g, 'ە')
    .replace(/[ۆو]/g, 'و')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel & tatweel
    .trim();
}

// Levenshtein distance for fuzzy tolerance
function levenshtein(a, b) {
  if (!a || !b) return (a || b || '').length;
  const la = a.length, lb = b.length;
  const d = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[la][lb];
}

// Subsequence check (tolerant of missing or extra digits)
function isSubsequence(sub, str) {
  if (!sub || !str) return false;
  let i = 0, j = 0;
  while (i < sub.length && j < str.length) {
    if (sub[i] === str[j]) i++;
    j++;
  }
  return i === sub.length;
}

export default function CitizenSearch({ records, onOpenPrintModal }) {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('ALL'); // 'ALL' | 'NAME' | 'FILE' | 'PHONE' | 'ID'
  const [searchResults, setSearchResults] = useState([]);
  const [isFuzzyMatch, setIsFuzzyMatch] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(25);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Perform the search (Direct Exact + Smart Fuzzy Closest Tolerance Engine)
  const executeSearch = (searchQuery, currentMode) => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      setSearchResults([]);
      setIsFuzzyMatch(false);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    const latinQuery = toLatinDigits(rawQuery);
    const fuzzyQ = normalizeKurdishFuzzy(rawQuery);
    const compactFuzzyQ = fuzzyQ.replace(/\s+/g, '');
    const cleanDigitsQ = latinQuery.replace(/[^0-9]/g, '');
    const cleanPhoneNoZeroQ = cleanDigitsQ.replace(/^0+/, '');

    // ── STAGE 1: Exact & Substring Matches ──
    const directMatches = records.filter(r => {
      const hasValidName = Boolean(r.citizenName && r.citizenName !== 'هاوبەشی کارەبا' && r.citizenName.trim() !== '');
      const fuzzyName = normalizeKurdishFuzzy(r.citizenName || '');
      const compactFuzzyName = fuzzyName.replace(/\s+/g, '');
      const fileStr = String(r.fileNumber || '').trim().toLowerCase();
      const accStr = String(r.accountNumber || '').trim();
      const phoneDigits = String(r.phoneNumber || '').replace(/[^0-9]/g, '');
      const phoneNoZero = phoneDigits.replace(/^0+/, '');

      // ── MODE: NAME ──
      if (currentMode === 'NAME') {
        if (!hasValidName) return false;
        return fuzzyName.includes(fuzzyQ) || compactFuzzyName.includes(compactFuzzyQ);
      }

      // ── MODE: FILE NUMBER ──
      if (currentMode === 'FILE') {
        return fileStr === cleanDigitsQ || fileStr === compactFuzzyQ || fileStr.includes(cleanDigitsQ);
      }

      // ── MODE: PHONE NUMBER ──
      if (currentMode === 'PHONE') {
        if (!cleanDigitsQ || r.phoneNumber === 'نیە') return false;
        return phoneDigits.includes(cleanDigitsQ) || phoneNoZero.includes(cleanPhoneNoZeroQ);
      }

      // ── MODE: ID / ACCOUNT NUMBER ──
      if (currentMode === 'ID') {
        if (!cleanDigitsQ) return false;
        return accStr.includes(cleanDigitsQ);
      }

      // ── GENERAL MODE: ALL ──
      if (hasValidName && (fuzzyName.includes(fuzzyQ) || compactFuzzyName.includes(compactFuzzyQ))) {
        return true;
      }
      if (cleanDigitsQ && (fileStr === cleanDigitsQ || fileStr === compactFuzzyQ || fileStr.includes(cleanDigitsQ))) {
        return true;
      }
      if (cleanDigitsQ && (phoneDigits.includes(cleanDigitsQ) || phoneNoZero.includes(cleanPhoneNoZeroQ))) {
        return true;
      }
      if (cleanDigitsQ && accStr.includes(cleanDigitsQ)) {
        return true;
      }

      return false;
    });

    // If direct matches found, return them
    if (directMatches.length > 0) {
      setSearchResults(directMatches);
      setIsFuzzyMatch(false);
      return;
    }

    // ── STAGE 2: Closest Fuzzy Match (In case employee or citizen mistyped a digit) ──
    const fuzzyCandidates = [];

    for (const r of records) {
      const fileStr = String(r.fileNumber || '').trim();
      const accStr = String(r.accountNumber || '').trim();
      const phoneDigits = String(r.phoneNumber || '').replace(/[^0-9]/g, '');
      const phoneNoZero = phoneDigits.replace(/^0+/, '');
      const fuzzyName = normalizeKurdishFuzzy(r.citizenName || '');
      const compactFuzzyName = fuzzyName.replace(/\s+/g, '');

      let minDistance = 999;
      let matchReason = '';

      // Check Account ID fuzzy distance
      if (cleanDigitsQ.length >= 4 && accStr && accStr !== 'نیە') {
        const dAcc = levenshtein(cleanDigitsQ, accStr);
        if (dAcc <= 2) {
          minDistance = Math.min(minDistance, dAcc);
          matchReason = `ژمارەی ئەژماری نزیک: ${accStr}`;
        } else if (isSubsequence(cleanDigitsQ, accStr) || isSubsequence(accStr, cleanDigitsQ)) {
          minDistance = Math.min(minDistance, Math.abs(cleanDigitsQ.length - accStr.length));
          matchReason = `ئەژماری هاوشێوە: ${accStr}`;
        }
      }

      // Check Phone Number fuzzy distance
      if (cleanPhoneNoZeroQ.length >= 6 && phoneNoZero && r.phoneNumber !== 'نیە') {
        const dPhone = levenshtein(cleanPhoneNoZeroQ, phoneNoZero);
        if (dPhone <= 2) {
          minDistance = Math.min(minDistance, dPhone);
          matchReason = `مۆبایلی نزیک: ${r.phoneNumber}`;
        }
      }

      // Check File Number fuzzy distance
      if (cleanDigitsQ.length >= 2 && fileStr) {
        const dFile = levenshtein(cleanDigitsQ, fileStr);
        if (dFile <= 1 && Math.abs(cleanDigitsQ.length - fileStr.length) <= 1) {
          minDistance = Math.min(minDistance, dFile);
          matchReason = `ژمارەی فایلی نزیک: ${fileStr}`;
        }
      }

      // Check Name fuzzy distance
      if (compactFuzzyQ.length >= 3 && compactFuzzyName && r.citizenName !== 'هاوبەشی کارەبا') {
        const dName = levenshtein(compactFuzzyQ, compactFuzzyName);
        if (dName <= 2) {
          minDistance = Math.min(minDistance, dName);
          matchReason = `ناوی نزیک: ${r.citizenName}`;
        }
      }

      if (minDistance <= 2) {
        fuzzyCandidates.push({
          record: r,
          distance: minDistance,
          matchReason
        });
      }
    }

    if (fuzzyCandidates.length > 0) {
      fuzzyCandidates.sort((a, b) => a.distance - b.distance);
      const topFuzzy = fuzzyCandidates.slice(0, 15).map(c => ({
        ...c.record,
        _fuzzyReason: c.matchReason
      }));
      setSearchResults(topFuzzy);
      setIsFuzzyMatch(true);
    } else {
      setSearchResults([]);
      setIsFuzzyMatch(false);
    }
  };

  // Run instant search whenever query or searchMode changes
  useEffect(() => {
    if (query.trim().length >= 1) {
      executeSearch(query, searchMode);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [query, searchMode, records]);

  const handleCopyFileNumber = (recordId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(recordId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusDetails = (statusKey) => {
    return STATUS_CONFIG[statusKey] || STATUS_CONFIG.IN_PROGRESS;
  };

  // Summary counts for multiple results
  const completedCount = searchResults.filter(r => r.status === 'COMPLETED' || r.status === 'DELIVERED').length;
  const inProgressCount = searchResults.filter(r => r.status === 'IN_PROGRESS' || r.status === 'NOT_CONTACTED').length;

  const getPlaceholder = () => {
    switch (searchMode) {
      case 'NAME':
        return 'تەنها ناو یان ناوی یەکەم بنووسە (بۆ نموونە: ڕێبین، محمد، کارزان)...';
      case 'FILE':
        return 'ژمارەی فایلی فەرمانگە بنووسە (بۆ نموونە: 197 یان 246)...';
      case 'PHONE':
        return 'کەمێک لە ژمارەی مۆبایل بنووسە (بۆ نموونە: 0750494 یان ٠٧٥٠٤٩٤)...';
      case 'ID':
        return 'ژمارەی ئەژماری کارەبا بنووسە (ID)...';
      default:
        return 'ناو (وەک ڕێبین)، بەشێک لە مۆبایل (وەک ٠٧٥٠٤٩٤)، فایل، یان ID...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 py-4 sm:py-8 px-2 sm:px-0">
      
      {/* Official Roonaki Hero Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px] roonaki-card p-5 sm:p-10 md:p-12 text-center transition-all">
        
        {/* Ambient Light Aura */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 sm:space-y-6">
          
          {/* Logo Showcase */}
          <div className="flex justify-center">
            <RoonakiLogo className="h-16 sm:h-24 w-auto" showText={false} />
          </div>

          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full roonaki-badge-gold text-[11px] sm:text-sm font-bold shadow-sm max-w-full truncate">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">پڕۆژەی نیشتمانیی ڕووناکی بۆ کارەبای ٢٤ کاتژمێری</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              پۆرتاڵی زیرەکی بەدواداچوونی <span className="text-amber-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500">مامەڵەکانی کارەبا</span>
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
              سیستەمی گەڕانی زیرەک: تەنها <strong className="text-amber-700 dark:text-amber-300 font-bold">ناوی یەکەم</strong> یان <strong className="text-amber-700 dark:text-amber-300 font-bold">بەشێک لە ژمارەی مۆبایلەکەت</strong> بنووسە، ڕاستەوخۆ دۆسیەکەت دەدۆزێتەوە.
            </p>
          </div>

          {/* Search Criteria Mode Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSearchMode('ALL')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                searchMode === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              🔍 گشت شێوازەکان (گشتی)
            </button>

            <button
              type="button"
              onClick={() => setSearchMode('NAME')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'NAME'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>ناوی هاووڵاتی (وەک ڕێبین)</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchMode('PHONE')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'PHONE'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>مۆبایل (وەک ٠٧٥٠٤٩٤)</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchMode('FILE')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'FILE'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>ژمارەی فایل</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchMode('ID')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'ID'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>ژمارەی ئەژمار (ID)</span>
            </button>
          </div>

          {/* Search Form with Instant Clear & Search */}
          <form onSubmit={(e) => { e.preventDefault(); executeSearch(query, searchMode); }} className="max-w-2xl mx-auto pt-1 sm:pt-2">
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-[#090e1a]/95 p-2 rounded-2xl border-2 border-amber-500/40 focus-within:border-amber-500 transition-all shadow-lg">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute right-3.5 sm:right-4 w-5 h-5 text-amber-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full pr-11 sm:pr-12 pl-10 sm:pl-10 py-3 sm:py-3.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-base font-semibold focus:outline-none"
                  dir="rtl"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl roonaki-btn-primary text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 active:scale-98 shrink-0"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
                <span>گەڕان</span>
              </button>
            </div>
          </form>

          {/* Quick Examples */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/90 dark:bg-[#0c1322] border border-slate-200 dark:border-amber-500/30 max-w-2xl mx-auto text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-3 text-right shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="leading-relaxed flex-1">
              <span className="font-black text-amber-700 dark:text-amber-400">💡 شێوازی گەڕانی زیرەک: </span>
              ئەگەر تەنها بەشێکی ناو وەک <span className="font-bold text-slate-950 dark:text-white bg-amber-500/20 dark:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/30">ڕێبین</span> یان بەشێکی مۆبایل وەک <span className="font-bold font-mono text-slate-950 dark:text-white bg-amber-500/20 dark:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/30">0750494</span> بنووسیت، ڕاستەوخۆ دەیدۆزێتەوە.
            </p>
          </div>

        </div>
      </div>

      {/* Multiple Results Header Banner (when 1 or more files are found) */}
      {hasSearched && searchResults.length > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn ${
          isFuzzyMatch 
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100'
            : 'bg-white dark:bg-slate-900 border-amber-500/40 text-slate-900 dark:text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isFuzzyMatch 
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}>
              {isFuzzyMatch ? <Sparkles className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>{isFuzzyMatch ? 'پێشنیاری نزیکترین ئەنجامەکان:' : 'ئەنجامی گەڕان:'}</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
                  {searchResults.length} فایل دۆزرایەوە
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isFuzzyMatch 
                  ? `دۆسیەی تەواو ڕاستەوخۆ نەدۆزرایەوە، بەڵام ئەم دۆسیانە نزیکترینن لە (${query}) لەوانەیە بەهۆی ژمارەیەکی هەڵەوە بێت`
                  : `لەسەر گەڕان بە دوای (${query}) ئەم دۆسیانە دۆزرانەوە`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {completedCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{completedCount} وەرگیراوەتەوە (Done)</span>
              </span>
            )}
            {inProgressCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{inProgressCount} پێنەدراوەتەوە (Not Done)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Render Each Matching File Result */}
      {hasSearched && searchResults.length > 0 && (
        <div className="space-y-8 animate-fadeIn">
          {searchResults.slice(0, displayLimit).map((result, index) => {
            const status = getStatusDetails(result.status);
            const isCopied = copiedId === result.id;

            return (
              <div key={result.id || index} className="rounded-2xl sm:rounded-[32px] roonaki-card overflow-hidden shadow-2xl transition-all border border-slate-200 dark:border-slate-800">
                
                {/* Status Header Banner */}
                <div className={`p-5 sm:p-8 border-b ${status.bgLight} ${status.borderClass}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`p-3 rounded-2xl ${status.badgeClass} border shadow-md shrink-0`}>
                        {result.status === 'COMPLETED' && <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-600 dark:text-emerald-400" />}
                        {result.status === 'IN_PROGRESS' && <Clock className="w-7 h-7 sm:w-9 sm:h-9 text-amber-600 dark:text-amber-400" />}
                        {result.status === 'NOT_CONTACTED' && <PhoneMissed className="w-7 h-7 sm:w-9 sm:h-9 text-orange-600 dark:text-orange-400" />}
                        {result.status === 'DELIVERED' && <PackageCheck className="w-7 h-7 sm:w-9 sm:h-9 text-blue-600 dark:text-blue-400" />}
                        {result.status === 'NEEDS_DOCS' && <AlertCircle className="w-7 h-7 sm:w-9 sm:h-9 text-rose-600 dark:text-rose-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${status.badgeClass} border shadow-sm`}>
                            دۆخی ئێستا: {status.shortLabel}
                          </span>
                          
                          {/* File Type Badge (Yellow Folder vs Papers) */}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
                            result.fileType === 'YELLOW_FOLDER'
                              ? 'bg-amber-200/80 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-400 dark:border-amber-500/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}>
                            <span>{result.fileType === 'YELLOW_FOLDER' ? '📁 فایلی زەرد' : '📄 ئەوراق'}</span>
                          </span>

                          {result._fuzzyReason && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>{result._fuzzyReason}</span>
                            </span>
                          )}

                          {searchResults.length > 1 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              فایلی #{index + 1}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                          {status.label}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-2 leading-relaxed max-w-2xl font-medium">
                          {status.citizenMessage}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenPrintModal(result)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm border border-amber-400 dark:border-amber-500/40 transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>پرێنتکردنی کارتی سەردان</span>
                    </button>
                  </div>
                </div>

                {/* KEY HIGHLIGHT BOX: THE FILE NUMBER TO SHOW TO THE EMPLOYEE */}
                <div className="p-4 sm:p-8 bg-amber-50/70 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-yellow-500/5 dark:to-amber-500/15 border-b border-amber-300/40 dark:border-amber-500/20">
                  <div className="rounded-2xl roonaki-glow-box p-4 sm:p-6 shadow-inner flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
                    <div className="space-y-2 text-center md:text-right w-full md:w-auto">
                      <div className="flex items-center justify-center md:justify-start gap-2 text-amber-800 dark:text-amber-400 font-black text-xs sm:text-sm">
                        <Archive className="w-4 h-4" />
                        <span>ژمارەی فایلی تۆ لە دائیرەی کارەبا (ئەم ژمارەیە بە فەرمانبەری بڵێ):</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-3xl sm:text-5xl font-black font-mono text-amber-700 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-amber-300 dark:to-yellow-400 tracking-wider">
                          {result.fileNumber}
                        </span>
                        <button
                          onClick={() => handleCopyFileNumber(result.id, result.fileNumber)}
                          className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-400 dark:border-amber-500/30 transition-colors shadow-sm"
                          title="کۆپیکردنی ژمارەی فایل"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center md:justify-start gap-1.5 pt-1">
                        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>شوێنی پاراستن لە ئەرشیف: <strong className="text-amber-800 dark:text-amber-300 font-bold">{result.archiveLocation || `سندوقی ${result.fileNumber}`}</strong></span>
                      </p>
                    </div>

                    <div className="w-full md:w-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950/90 border border-amber-300 dark:border-amber-500/30 text-center space-y-1.5 shadow-md">
                      <div className="text-xs text-slate-500 dark:text-slate-400">ڕێنمایی وەرگرتنەوە:</div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">{status.citizenAction}</div>
                      {result.deliveredDate && (
                        <div className="text-xs text-blue-700 dark:text-cyan-300 pt-1 font-mono font-bold">
                          بەرواری تەسلیم: {result.deliveredDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Information Grid */}
                <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-xs sm:text-sm">
                  
                  {/* Citizen Name */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>ناوی بەشداربوو / هاووڵاتی</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {(result.citizenName && result.citizenName !== 'هاوبەشی کارەبا' && result.citizenName.trim() !== '') ? result.citizenName : 'هاوبەشی کارەبا'}
                    </div>
                  </div>

                  {/* ID / Account */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>ژمارەی ئەژمار (ID)</span>
                    </div>
                    <div className="text-sm sm:text-base font-mono font-bold text-amber-700 dark:text-amber-300">
                      {result.accountNumber || 'تۆمار نەکراوە'}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>ژمارەی مۆبایل</span>
                    </div>
                    <div className="text-sm sm:text-base font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {result.phoneNumber}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>بەڕێوەبەرایەتی / فەرمانگە</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{result.department}</div>
                  </div>

                  {/* File Type (Yellow Folder vs Papers) */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>جۆری دۆسیە (شێوازی پاراستن)</span>
                    </div>
                    <div>
                      {result.fileType === 'YELLOW_FOLDER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-black">
                          📁 فایلی زەرد (دۆسیەی زەرد)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold">
                          📄 ئەوراق (کاغەز/پەڕەی سپی)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Receiver Name if delivered */}
                  {result.receiverName && (
                    <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>ناوی وەرگرەوە</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400">{result.receiverName}</div>
                    </div>
                  )}

                  {result.notes && (
                    <div className="sm:col-span-2 lg:col-span-3 p-3.5 sm:p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 font-medium">
                      <span className="font-bold text-amber-700 dark:text-amber-400 ml-1">تێبینی فەرمانگە:</span>
                      {result.notes}
                    </div>
                  )}
                </div>

              </div>
            );
          })}

          {searchResults.length > displayLimit && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setDisplayLimit(prev => prev + 50)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-95"
              >
                پیشاندانی ({searchResults.length - displayLimit}) فایلی تری دۆزراوە...
              </button>
            </div>
          )}
        </div>
      )}

      {/* Not Found State */}
      {hasSearched && searchResults.length === 0 && (
        <div className="rounded-2xl sm:rounded-[32px] roonaki-card border-rose-400 dark:border-rose-500/30 p-6 sm:p-10 text-center space-y-4 shadow-xl animate-fadeIn">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">هیچ دۆسیەیەک نەدۆزرایەوە!</h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            هیچ فایلێک بەم زانیارییە ({query}) لە سیستەمدا نەدۆزرایەوە. تکایە دڵنیابە لە دروستی نووسینی ناوەکەت یان کەمێکی تر لە ژمارەی مۆبایلەکەت بنووسە.
          </p>
        </div>
      )}

      {/* Roonaki Project Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 pt-2">
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl roonaki-card space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5 fill-amber-500" />
          </div>
          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">کارەبای ٢٤ کاتژمێری</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            پڕۆژەی ڕووناکی دابینکردنی کارەبای بەردەوام و بێ پچڕانە بۆ سەرجەم هاوبەشانی هەرێمی کوردستان.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl roonaki-card space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">ئەرشیفی ئەلیکترۆنی</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            بەدواداچوونی دۆسیە و پاراستنی زانیاری بەشداربووان لە سیستەمی ئەلیکترۆنی پێشکەوتوودا.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl roonaki-card space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">وەرگرتنەوەی خێرا</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            لە کاتی تەواوبووندا، ژمارەی فایلەکەت پیشانی فەرمانبەری ئەرشیف بدە و دۆسیەکەت وەربگرەوە.
          </p>
        </div>
      </div>

    </div>
  );
}
