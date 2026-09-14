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
  PhoneOff,
  X
} from 'lucide-react';
import { formatKurdistanDateTime } from '../utils/dateUtils';
import { getTranslation } from '../utils/translations';
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

export default function CitizenSearch({ records, onOpenPrintModal, language = 'ku' }) {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('ALL'); // 'ALL' | 'NAME' | 'FILE' | 'PHONE' | 'ID' | 'MISSING_PHONE' | 'MISSING_ID' | 'MISSING_ANY'
  const [searchResults, setSearchResults] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(25);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const t = getTranslation(language);
  const isAr = language === 'ar';

  // Helper functions to identify missing records
  const isPhoneMissing = (r) => !r.phoneNumber || r.phoneNumber === 'نیە' || r.phoneNumber.trim() === '';
  const isIdMissing = (r) => !r.accountNumber || r.accountNumber === 'نیە' || r.accountNumber.trim() === '' || r.accountNumber === '-';

  const missingPhoneCount = useMemo(() => (records || []).filter(isPhoneMissing).length, [records]);
  const missingIdCount = useMemo(() => (records || []).filter(isIdMissing).length, [records]);
  const missingAnyCount = useMemo(() => (records || []).filter(r => isPhoneMissing(r) || isIdMissing(r)).length, [records]);

  // Perform Exact & Substring search (strictly matching Admin search)
  const executeSearch = (searchQuery, currentMode) => {
    const rawQuery = searchQuery.trim();
    
    // If no text query: in missing modes, display all records in that category
    if (!rawQuery) {
      if (currentMode === 'MISSING_PHONE') {
        setSearchResults((records || []).filter(isPhoneMissing));
        setHasSearched(true);
        return;
      }
      if (currentMode === 'MISSING_ID') {
        setSearchResults((records || []).filter(isIdMissing));
        setHasSearched(true);
        return;
      }
      if (currentMode === 'MISSING_ANY') {
        setSearchResults((records || []).filter(r => isPhoneMissing(r) || isIdMissing(r)));
        setHasSearched(true);
        return;
      }
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    const latinQuery = toLatinDigits(rawQuery);
    const fuzzyQ = normalizeKurdishFuzzy(rawQuery);
    const compactFuzzyQ = fuzzyQ.replace(/\s+/g, '');
    const cleanDigitsQ = latinQuery.replace(/[^0-9]/g, '');
    const cleanPhoneNoZeroQ = cleanDigitsQ.replace(/^0+/, '');

    const directMatches = (records || []).filter(r => {
      // Check missing constraints if mode is missing
      if (currentMode === 'MISSING_PHONE' && !isPhoneMissing(r)) return false;
      if (currentMode === 'MISSING_ID' && !isIdMissing(r)) return false;
      if (currentMode === 'MISSING_ANY' && (!isPhoneMissing(r) && !isIdMissing(r))) return false;

      const hasValidName = Boolean(r.citizenName && r.citizenName !== 'هاوبەشی کارەبا' && r.citizenName.trim() !== '');
      const fuzzyName = normalizeKurdishFuzzy(r.citizenName || '');
      const compactFuzzyName = fuzzyName.replace(/\s+/g, '');
      const fileStr = String(r.fileNumber || '').trim().toLowerCase();
      const accStr = String(r.accountNumber || '').trim().toLowerCase();
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

      // ── GENERAL OR MISSING MODES: search by name, file, phone, id ──
      if (hasValidName && (fuzzyName.includes(fuzzyQ) || compactFuzzyName.includes(compactFuzzyQ))) {
        return true;
      }
      if (cleanDigitsQ && (fileStr === cleanDigitsQ || fileStr.includes(cleanDigitsQ))) {
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

    setSearchResults(directMatches);
  };

  // Run instant search whenever query or searchMode changes
  useEffect(() => {
    executeSearch(query, searchMode);
  }, [query, searchMode, records]);

  const handleCopyFileNumber = (recordId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(recordId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusDetails = (statusKey) => {
    if (isAr) {
      if (statusKey === 'COMPLETED') {
        return {
          label: 'مكتملة وجاهزة للاستلام',
          shortLabel: 'مكتملة',
          citizenStatusTitle: 'معاملتك منجزة بنجاح وجاهزة للاستلام',
          citizenStatusDesc: 'يمكنك مراجعة شعبة المشتركين لاستلام إضبارتك مع جلب المستمسكات الثبوتية',
          citizenAction: 'يرجى مراجعة الدائرة مع جلب الهوية الأصلية للاستلام',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
          bgLight: 'bg-emerald-50/50 dark:bg-emerald-950/20',
          borderClass: 'border-emerald-200 dark:border-emerald-800'
        };
      }
      if (statusKey === 'DELIVERED') {
        return {
          label: 'تم التسليم للمشترك',
          shortLabel: 'تم التسليم',
          citizenStatusTitle: 'تم تسليم الإضبارة رسمياً لصاحبها',
          citizenStatusDesc: 'هذه المعاملة تم تسليمها وتوثيقها في النظام الإلكتروني',
          citizenAction: 'تم التسليم رسمياً - لا حاجة للمراجعة',
          badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
          bgLight: 'bg-blue-50/50 dark:bg-blue-950/20',
          borderClass: 'border-blue-200 dark:border-blue-800'
        };
      }
      return {
        label: 'قيد الإنجاز والمتابعة الفنية',
        shortLabel: 'قيد الإنجاز',
        citizenStatusTitle: 'معاملتك قيد التدقيق والمتابعة الفنية بالدائرة',
        citizenStatusDesc: 'يرجى الانتظار لحين اكتمال المعاملة وسنقوم بالاتصال بك أو تحديث الحالة هنا',
        citizenAction: 'المعاملة قيد المتابعة والتدقيق الفني في الدائرة',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
        bgLight: 'bg-amber-50/50 dark:bg-amber-950/20',
        borderClass: 'border-amber-200 dark:border-amber-800'
      };
    }

    // Kurdish
    if (statusKey === 'COMPLETED') {
      return {
        label: 'وەرگیراوەتەوە (Done)',
        shortLabel: 'وەرگیراوەتەوە',
        citizenStatusTitle: 'دۆسیەکەت تەواوبووە و ئامادەی وەرگرتنەوەیە',
        citizenStatusDesc: 'دەتوانیت سەردانی بەڕێوەبەرایەتی بکەیت بۆ وەرگرتنەوەی دۆسیەکەت',
        citizenAction: 'سەردانی بەشی هاوبەشان بکە لەگەڵ ناسنامەی فەرمی بۆ وەرگرتنەوە',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
        bgLight: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        borderClass: 'border-emerald-200 dark:border-emerald-800'
      };
    }
    if (statusKey === 'DELIVERED') {
      return {
        label: 'تەسلیم کرا (Delivered)',
        shortLabel: 'تەسلیم کرا',
        citizenStatusTitle: 'دۆسیەکەت بە فەرمی تەسلیم کراوەتەوە',
        citizenStatusDesc: 'دۆسیەکە وەرگیراوەتەوە و لە سیستەم بە تەسلیمکراو تۆمار کراوە',
        citizenAction: 'ڕادەستکراوەتەوە - پێویست بە سەردانیکردن ناکات',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
        bgLight: 'bg-blue-50/50 dark:bg-blue-950/20',
        borderClass: 'border-blue-200 dark:border-blue-800'
      };
    }
    return {
      label: 'پێنەدراوەتەوە - لەلای ئێمەیە (Not Done)',
      shortLabel: 'پێنەدراوەتەوە',
      citizenStatusTitle: 'دۆسیەکەت لە قۆناغی کارکردندایە و لەلای ئێمەیە',
      citizenStatusDesc: 'تکایە چاوەڕوان بە تاوەکو پەیوەندیت پێوە دەکرێت',
      citizenAction: 'دۆسیەکەت لە قۆناغی پشکنین و کارکردندایە',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
      bgLight: 'bg-amber-50/50 dark:bg-amber-950/20',
      borderClass: 'border-amber-200 dark:border-amber-800'
    };
  };

  // Summary counts for multiple results
  const completedCount = searchResults.filter(r => r.status === 'COMPLETED' || r.status === 'DELIVERED').length;
  const inProgressCount = searchResults.filter(r => r.status === 'IN_PROGRESS' || r.status === 'NOT_CONTACTED').length;

  const getPlaceholder = () => {
    if (isAr) {
      switch (searchMode) {
        case 'NAME':
          return 'اكتب الاسم الأول أو الثلاثي (مثال: محمد، علي، كارزان)...';
        case 'FILE':
          return 'اكتب رقم الإضبارة / الفايل (مثال: 197 أو 246)...';
        case 'PHONE':
          return 'اكتب جزءاً من رقم الهاتف (مثال: 0750494 أو ٠٧٥٠٤٩٤)...';
        case 'ID':
          return 'اكتب رقم الحساب / القائمة (ID)...';
        case 'MISSING_PHONE':
          return 'ابحث باسمك في المعاملات غير المزودة برقم هاتف...';
        case 'MISSING_ID':
          return 'ابحث باسمك في المعاملات غير المزودة برقم حساب (ID)...';
        case 'MISSING_ANY':
          return 'ابحث بالاسم أو رقم الفايل في المعاملات ذات البيانات غير المكتملة...';
        default:
          return 'الاسم (مثل محمد)، رقم الهاتف (مثل 0750494)، رقم الحساب أو الفايل...';
      }
    }

    switch (searchMode) {
      case 'NAME':
        return 'تەنها ناو یان ناوی یەکەم بنووسە (بۆ نموونە: ڕێبین، محمد، کارزان)...';
      case 'FILE':
        return 'ژمارەی فایلی فەرمانگە بنووسە (بۆ نموونە: 197 یان 246)...';
      case 'PHONE':
        return 'کەمێک لە ژمارەی مۆبایل بنووسە (بۆ نموونە: 0750494 یان ٠٧٥٠٤٩٤)...';
      case 'ID':
        return 'ژمارەی ئەژماری کارەبا بنووسە (ID)...';
      case 'MISSING_PHONE':
        return 'گەڕان بە ناوی خۆت لەناو دۆسیە بێ مۆبایلەکاندا...';
      case 'MISSING_ID':
        return 'گەڕان بە ناوی خۆت لەناو دۆسیە بێ ئەژمارەکاندا (ID)...';
      case 'MISSING_ANY':
        return 'گەڕان بە ناو یان ژمارەی فایل لەناو دۆسیە ناتەواوەکاندا...';
      default:
        return 'ناو (وەک ڕێبین)، بەشێک لە مۆبایل (وەک ٠٧٥٠٤٩٤)، فایل، یان ID...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 py-4 sm:py-8 px-2 sm:px-0" dir="rtl">
      
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
            <span className="truncate">
              {isAr ? 'مشروع روناهي الوطني لتوفير الكهرباء على مدار 24 ساعة' : 'پڕۆژەی نیشتمانیی ڕووناکی بۆ کارەبای ٢٤ کاتژمێری'}
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
              {isAr ? (
                <>البوابة الإلكترونية لمتابعة <span className="text-amber-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500">معاملات المشتركين</span></>
              ) : (
                <>پۆرتاڵی زیرەکی بەدواداچوونی <span className="text-amber-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500">مامەڵەکانی کارەبا</span></>
              )}
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-medium">
              {isAr ? (
                <>نظام البحث الذكي: اكتب <strong className="text-amber-700 dark:text-amber-300 font-bold">اسمك</strong> أو <strong className="text-amber-700 dark:text-amber-300 font-bold">جزءاً من رقم هاتفك أو رقم الحساب</strong> للاستعلام الفوري عن معاملتك.</>
              ) : (
                <>سیستەمی گەڕانی زیرەک: تەنها <strong className="text-amber-700 dark:text-amber-300 font-bold">ناوی یەکەم</strong> یان <strong className="text-amber-700 dark:text-amber-300 font-bold">بەشێک لە ژمارەی مۆبایلەکەت</strong> بنووسە، ڕاستەوخۆ دۆسیەکەت دەدۆزێتەوە.</>
              )}
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
              {isAr ? '🔍 كافة الحالات (عام)' : '🔍 گشت شێوازەکان (گشتی)'}
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
              <span>{isAr ? 'اسم المواطن' : 'ناوی هاووڵاتی'}</span>
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
              <span>{isAr ? 'رقم الهاتف' : 'مۆبایل'}</span>
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
              <span>{isAr ? 'رقم الفايل' : 'ژمارەی فایل'}</span>
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
              <span>{isAr ? 'رقم الحساب (ID)' : 'ژمارەی ئەژمار (ID)'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setSearchMode('MISSING_PHONE'); setDisplayLimit(25); }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'MISSING_PHONE'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-black ring-2 ring-rose-500/50'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900/50 hover:border-rose-400'
              }`}
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>📵 {isAr ? 'بدون هاتف' : 'بێ مۆبایل'} ({missingPhoneCount})</span>
            </button>

            <button
              type="button"
              onClick={() => { setSearchMode('MISSING_ID'); setDisplayLimit(25); }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                searchMode === 'MISSING_ID'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black ring-2 ring-purple-500/50'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-900/50 hover:border-purple-400'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>🆔 {isAr ? 'بدون حساب' : 'بێ ئەژمار'} ({missingIdCount})</span>
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
                <span>{t.searchBtn}</span>
              </button>
            </div>
          </form>

          {/* Quick Examples & Guidance */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100/90 dark:bg-[#0c1322] border border-slate-200 dark:border-amber-500/30 max-w-2xl mx-auto text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-3 text-right shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="leading-relaxed flex-1">
              <span className="font-black text-amber-700 dark:text-amber-400">
                {isAr ? '💡 ميزة البحث السريع: ' : '💡 شێوازی گەڕانی زیرەک: '}
              </span>
              {isAr ? (
                <>إذا كتبت جزءاً من الاسم مثل <span className="font-bold text-slate-950 dark:text-white bg-amber-500/20 dark:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/30">محمد</span> أو جزءاً من الهاتف مثل <span className="font-bold font-mono text-slate-950 dark:text-white bg-amber-500/20 dark:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/30">0750494</span> فسيتم العثور على معاملتك مباشرة.</>
              ) : (
                <>ئەگەر تەنها بەشێکی ناو وەک <span className="font-bold text-slate-950 dark:text-white bg-amber-500/20 dark:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/30">ڕێبین</span> یان بەشێکی مۆبایل وەک <span className="font-bold font-mono text-slate-950 dark:text-white bg-amber-500/20 dark:bg-amber-500/30 px-1.5 py-0.5 rounded border border-amber-500/30">0750494</span> بنووسیت، ڕاستەوخۆ دەیدۆزێتەوە.</>
              )}
            </p>
          </div>

          {/* Missing Phone & Missing ID Special Quick Action Box */}
          <div className="max-w-2xl mx-auto rounded-2xl bg-amber-500/10 dark:bg-[#080d1a]/95 border-2 border-amber-500/40 p-3.5 sm:p-4 text-right space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'قسم المعاملات غير المزودة برقم هاتف أو حساب (ID):' : 'بەشی دۆسیە بێ ژمارە مۆبایل و بێ ئەژمارەکان (ID):'}
                </span>
              </div>
              {(searchMode === 'MISSING_PHONE' || searchMode === 'MISSING_ID' || searchMode === 'MISSING_ANY') && (
                <button
                  type="button"
                  onClick={() => { setSearchMode('ALL'); setQuery(''); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>{isAr ? 'إلغاء الفلتر' : 'لابردنی فلتەر'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSearchMode('MISSING_PHONE'); setDisplayLimit(25); }}
                className={`p-2.5 rounded-xl border transition-all text-right flex items-center justify-between gap-2 cursor-pointer ${
                  searchMode === 'MISSING_PHONE'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                  <PhoneOff className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span className="truncate">{isAr ? 'معاملات بدون هاتف' : 'دۆسیە بێ مۆبایلەکان'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                  searchMode === 'MISSING_PHONE' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}>
                  {missingPhoneCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setSearchMode('MISSING_ID'); setDisplayLimit(25); }}
                className={`p-2.5 rounded-xl border transition-all text-right flex items-center justify-between gap-2 cursor-pointer ${
                  searchMode === 'MISSING_ID'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-purple-300 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                  <Hash className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                  <span className="truncate">{isAr ? 'بدون رقم حساب (ID)' : 'دۆسیە بێ ئەژمارەکان (ID)'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                  searchMode === 'MISSING_ID' ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                }`}>
                  {missingIdCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setSearchMode('MISSING_ANY'); setDisplayLimit(25); }}
                className={`p-2.5 rounded-xl border transition-all text-right flex items-center justify-between gap-2 cursor-pointer ${
                  searchMode === 'MISSING_ANY'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-amber-300 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{isAr ? 'بيانات غير مكتملة' : 'هەردووکیان / هەریەکێکیان'}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                  searchMode === 'MISSING_ANY' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                }`}>
                  {missingAnyCount}
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Results Header Banner (when 1 or more files are found) */}
      {hasSearched && searchResults.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn bg-white dark:bg-slate-900 border-amber-500/40 text-slate-900 dark:text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>{isAr ? 'نتائج الاستعلام:' : 'ئەنجامی گەڕان:'}</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
                  {searchResults.length} {isAr ? 'معاملة مطابقة' : 'فایل دۆزرایەوە'}
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isAr ? `نتائج البحث عن (${query})` : `لەسەر گەڕان بە دوای (${query}) ئەم دۆسیانە دۆزرانەوە`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {completedCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{completedCount} {isAr ? 'منجزة (Done)' : 'وەرگیراوەتەوە (Done)'}</span>
              </span>
            )}
            {inProgressCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{inProgressCount} {isAr ? 'قيد الإنجاز (Not Done)' : 'پێنەدراوەتەوە (Not Done)'}</span>
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
                            {isAr ? `الحالة: ${status.shortLabel}` : `دۆخی ئێستا: ${status.shortLabel}`}
                          </span>
                          
                          {/* File Type Badge (Yellow Folder vs Papers) */}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
                            result.fileType === 'YELLOW_FOLDER'
                              ? 'bg-amber-200/80 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-400 dark:border-amber-500/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}>
                            <span>{result.fileType === 'YELLOW_FOLDER' ? (isAr ? '📁 فايل أصفر' : '📁 فایلی زەرد') : (isAr ? '📄 أوراق ومستندات' : '📄 ئەوراق')}</span>
                          </span>

                          {/* KYC Badge in Citizen Search */}
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
                            (result.isKycDone || result.kycStatus === 'DONE' || result.status === 'COMPLETED' || result.status === 'DELIVERED')
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {isAr ? (
                                (result.isKycDone || result.kycStatus === 'DONE' || result.status === 'COMPLETED' || result.status === 'DELIVERED')
                                  ? 'الهوية مؤكدة رسمياً (KYC ✅)'
                                  : 'مطلوب إبراز الهوية عند الاستلام (KYC ℹ️)'
                              ) : (
                                (result.isKycDone || result.kycStatus === 'DONE' || result.status === 'COMPLETED' || result.status === 'DELIVERED')
                                  ? 'ناسنامە پشتڕاستکراوەتەوە (KYC ✅)'
                                  : 'پێویست بە KYC لە کاتی وەرگرتنەوە ℹ️'
                              )}
                            </span>
                          </span>

                          {searchResults.length > 1 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {isAr ? `معاملة #${index + 1}` : `فایلی #${index + 1}`}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                          {status.label}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-2 leading-relaxed max-w-2xl font-medium">
                          {status.citizenStatusDesc}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenPrintModal(result)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm border border-amber-400 dark:border-amber-500/40 transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>{isAr ? 'طباعة بطاقة المراجعة' : 'پرێنتکردنی کارتی سەردان'}</span>
                    </button>
                  </div>
                </div>

                {/* KEY HIGHLIGHT BOX: THE FILE NUMBER TO SHOW TO THE EMPLOYEE */}
                <div className="p-4 sm:p-8 bg-amber-50/70 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-yellow-500/5 dark:to-amber-500/15 border-b border-amber-300/40 dark:border-amber-500/20">
                  <div className="rounded-2xl roonaki-glow-box p-4 sm:p-6 shadow-inner flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
                    <div className="space-y-2 text-center md:text-right w-full md:w-auto">
                      <div className="flex items-center justify-center md:justify-start gap-2 text-amber-800 dark:text-amber-400 font-black text-xs sm:text-sm">
                        <Archive className="w-4 h-4" />
                        <span>{isAr ? 'رقم الإضبارة في الدائرة (أعطِ هذا الرقم للموظف):' : 'ژمارەی فایلی تۆ لە دائیرەی کارەبا (ئەم ژمارەیە بە فەرمانبەری بڵێ):'}</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-3xl sm:text-5xl font-black font-mono text-amber-700 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-amber-300 dark:to-yellow-400 tracking-wider">
                          {result.fileNumber}
                        </span>
                        <button
                          onClick={() => handleCopyFileNumber(result.id, result.fileNumber)}
                          className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-400 dark:border-amber-500/30 transition-colors shadow-sm"
                          title={isAr ? 'نسخ رقم الإضبارة' : 'کۆپیکردنی ژمارەی فایل'}
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center md:justify-start gap-1.5 pt-1">
                        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          {isAr ? 'موقع الحفظ في الأرشيف: ' : 'شوێنی پاراستن لە ئەرشیف: '}
                          <strong className="text-amber-800 dark:text-amber-300 font-bold">{result.archiveLocation || (isAr ? `صندوق ${result.fileNumber}` : `سندوقی ${result.fileNumber}`)}</strong>
                        </span>
                      </p>
                    </div>

                    <div className="w-full md:w-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-950/90 border border-amber-300 dark:border-amber-500/30 text-center space-y-1.5 shadow-md">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'إرشادات الاستلام:' : 'ڕێنمایی وەرگرتنەوە:'}</div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">{status.citizenAction}</div>
                      {result.deliveredDate && (
                        <div className="text-xs text-blue-700 dark:text-cyan-300 pt-1 font-mono font-bold">
                          {isAr ? 'تاريخ التسليم: ' : 'بەرواری تەسلیم: '}
                          {formatKurdistanDateTime(result.deliveredDate)}
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
                      <span>{t.citizenName}</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {(result.citizenName && result.citizenName !== 'هاوبەشی کارەبا' && result.citizenName.trim() !== '') ? result.citizenName : (isAr ? 'مشترك كهرباء' : 'هاوبەشی کارەبا')}
                    </div>
                  </div>

                  {/* ID / Account */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{t.accountNumber} (ID)</span>
                    </div>
                    <div className="text-sm sm:text-base font-mono font-bold text-amber-700 dark:text-amber-300">
                      {isIdMissing(result) ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 font-bold inline-block">
                          🆔 {isAr ? 'بدون رقم حساب (ID)' : 'ئەژمار (ID) نیە'}
                        </span>
                      ) : (
                        result.accountNumber
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{t.phoneNumber}</span>
                    </div>
                    <div className="text-sm sm:text-base font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {isPhoneMissing(result) ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold inline-block">
                          📵 {isAr ? 'بدون رقم هاتف' : 'ژمارەی مۆبایل نیە'}
                        </span>
                      ) : (
                        result.phoneNumber
                      )}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{isAr ? 'المديرية / الشعبة' : 'بەڕێوەبەرایەتی / فەرمانگە'}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{result.department || (isAr ? 'مبيعات الطاقة ٢' : 'فرۆشیاری وزە ٢')}</div>
                  </div>

                  {/* File Type (Yellow Folder vs Papers) */}
                  <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{isAr ? 'نوع الإضبارة والأرشيف' : 'جۆری دۆسیە (شێوازی پاراستن)'}</span>
                    </div>
                    <div>
                      {result.fileType === 'YELLOW_FOLDER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-black">
                          📁 {isAr ? 'فايل أصفر رسمي' : 'فایلی زەرد (دۆسیەی زەرد)'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold">
                          📄 {isAr ? 'أوراق ومستندات' : 'ئەوراق (کاغەز/پەڕەی سپی)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Receiver Name if delivered */}
                  {result.receiverName && (
                    <div className="space-y-1 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent dark:bg-transparent">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{isAr ? 'اسم المستلم' : 'ناوی وەرگرەوە'}</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400">{result.receiverName}</div>
                    </div>
                  )}

                  {result.notes && (
                    <div className="sm:col-span-2 lg:col-span-3 p-3.5 sm:p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 font-medium">
                      <span className="font-bold text-amber-700 dark:text-amber-400 ml-1">{isAr ? 'ملاحظات الدائرة:' : 'تێبینی فەرمانگە:'}</span>
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
                {isAr ? `عرض (${searchResults.length - displayLimit}) معاملة إضافية...` : `پیشاندانی (${searchResults.length - displayLimit}) فایلی تری دۆزراوە...`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Not Found State */}
      {hasSearched && searchResults.length === 0 && (
        <div className="rounded-2xl sm:rounded-[32px] roonaki-card border-amber-400 dark:border-amber-500/40 p-6 sm:p-10 text-center space-y-4 shadow-xl animate-fadeIn">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isAr ? 'لم يتم العثور على أي معاملة!' : 'هیچ دۆسیەیەک نەدۆزرایەوە!'}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {isAr ? (
              <>لا توجد إضبارة بهذه البيانات (<strong className="text-amber-600 dark:text-amber-400 font-mono">{query}</strong>) مسجلة في النظام حالياً.</>
            ) : (
              <>هیچ فایلێک بەم زانیارییە (<strong className="text-amber-600 dark:text-amber-400 font-mono">{query}</strong>) لە سیستەمدا تۆمار نەکراوە.</>
            )}
          </p>

          {/* Official Citizen Reassurance Notice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-950 dark:text-amber-200 text-xs sm:text-sm max-w-lg mx-auto text-right space-y-1.5 shadow-sm">
            <div className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isAr ? 'تنبيه وإرشاد للمواطن الكريم:' : 'تێبینی گرنگ بۆ هاووڵاتیی بەڕێز:'}</span>
            </div>
            <p className="leading-relaxed">
              {isAr ? (
                <>إذا لم يظهر اسمك أو رقمك في النظام، فهذا يعني أن معاملتك لا تزال <strong>قيد المتابعة والإجراءات الفنية بالدائرة</strong>، يرجى الانتظار لحين اكتمالها والاتصال بك أو مراجعة شعبة المشتركين.</>
              ) : (
                <>ئەگەر ناوت یان ژمارەکەت لە سیستەمەکەدا نەبوو، مانای ئەوەیە هێشتا مامەڵەکەت لە قۆناغی کارپێکردندایە و <strong>تەلەفۆنت بۆ نەکراوە، با چاوەڕێ بکات</strong> تا لەلایەن بەڕێوەبەرایەتی کارەباوە پەیوەندیت پێوە دەکرێت.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Roonaki Project Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 pt-2">
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl roonaki-card space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5 fill-amber-500" />
          </div>
          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
            {isAr ? 'كهرباء ٢٤ ساعة مستمرة' : 'کارەبای ٢٤ کاتژمێری'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr ? 'مشروع روناهي الوطني يهدف لتوفير كهرباء مستمرة وموثوقة لكافة المشتركين والمواطنين.' : 'پڕۆژەی ڕووناکی دابینکردنی کارەبای بەردەوام و بێ پچڕانە بۆ سەرجەم هاوبەشانی هەرێمی کوردستان.'}
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl roonaki-card space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
            {isAr ? 'أرشيف إلكتروني متطور' : 'ئەرشیفی ئەلیکترۆنی'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr ? 'حفظ وأرشفة وتوثيق معاملات المشتركين بدقة وأمان ضمن أحدث الأنظمة السحابية.' : 'بەدواداچوونی دۆسیە و پاراستنی زانیاری بەشداربووان لە سیستەمی ئەلیکترۆنی پێشکەوتوودا.'}
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl roonaki-card space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
            {isAr ? 'استلام سريع وسهل' : 'وەرگرتنەوەی خێرا'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr ? 'عند اكتمال الإضبارة، أعطِ رقم الفايل للموظف المختص لاستلام معاملتك بكل سهولة.' : 'لە کاتی تەواوبووندا، ژمارەی فایلەکەت پیشانی فەرمانبەری ئەرشیف بدە و دۆسیەکەت وەربگرەوە.'}
          </p>
        </div>
      </div>

    </div>
  );
}
