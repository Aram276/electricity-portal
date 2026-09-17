import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Star,
  Search,
  CheckCircle2,
  Clock,
  PackageCheck,
  Printer,
  Edit,
  Trash2,
  FileSpreadsheet,
  Plus,
  Zap,
  Phone,
  Hash,
  User,
  Folder,
  FileText,
  AlertCircle,
  Tag,
  MessageSquare,
  Sparkles,
  Check,
  X,
  ShieldCheck,
  MoreVertical,
  ExternalLink,
  Save,
  Calendar,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { STATUS_CONFIG, getRecordKYC } from '../constants/status';
import { formatKurdistanDateTime, getKurdistanDate, getKurdistanDateTime } from '../utils/dateUtils';
import { exportToExcel } from '../utils/excelHelper';
import { generateWhatsAppUrl } from '../utils/whatsappHelper';

// Normalizers for fuzzy search
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
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .trim();
}

export const SPECIAL_CATEGORIES = {
  METER_REQUEST: {
    id: 'METER_REQUEST',
    label: '🔌 پێوەر داواکردن (داواکاری نوێ)',
    shortLabel: 'پێوەر داواکردن',
    icon: '🔌',
    badgeClass: 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-500/40'
  },
  METER_REPAIR: {
    id: 'METER_REPAIR',
    label: '🛠️ پێوەر چاککردنەوە / چاکسازی',
    shortLabel: 'پێوەر چاککردنەوە',
    icon: '🛠️',
    badgeClass: 'bg-blue-500/20 text-blue-900 dark:text-blue-300 border-blue-500/40'
  },
  INSPECTION: {
    id: 'INSPECTION',
    label: '🔍 کەشف / پشکنینی شوێن و پێوەر',
    shortLabel: 'کەشف و پشکنین',
    icon: '🔍',
    badgeClass: 'bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border-cyan-500/40'
  },
  METER_TRANSFER: {
    id: 'METER_TRANSFER',
    label: '🔄 گواستنەوەی پێوەر / جێگۆڕکێ',
    shortLabel: 'گواستنەوەی پێوەر',
    icon: '🔄',
    badgeClass: 'bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border-indigo-500/40'
  },
  NAME_CHANGE: {
    id: 'NAME_CHANGE',
    label: '📝 گۆڕینی ناوی هاوبەش',
    shortLabel: 'گۆڕینی ناو',
    icon: '📝',
    badgeClass: 'bg-purple-500/20 text-purple-900 dark:text-purple-300 border-purple-500/40'
  },
  VIP: {
    id: 'VIP',
    label: '🌟 کەسی گرنگ (VIP)',
    shortLabel: 'VIP',
    icon: '🌟',
    badgeClass: 'bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500/50'
  },
  DIRECTOR: {
    id: 'DIRECTOR',
    label: '👔 فەرمانی بەڕێوەبەر',
    shortLabel: 'بەڕێوەبەر',
    icon: '👔',
    badgeClass: 'bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-500/40'
  },
  URGENT: {
    id: 'URGENT',
    label: '⚡ بەپەلە / زۆر بەپەلە',
    shortLabel: 'زۆر بەپەلە',
    icon: '⚡',
    badgeClass: 'bg-orange-500/20 text-orange-900 dark:text-orange-300 border-orange-500/40'
  },
  COURT: {
    id: 'COURT',
    label: '⚖️ دادگا / داواکاری گشتی / یاسایی',
    shortLabel: 'دادگا و یاسایی',
    icon: '⚖️',
    badgeClass: 'bg-slate-500/20 text-slate-900 dark:text-slate-200 border-slate-500/40'
  },
  METER_ISSUE: {
    id: 'METER_ISSUE',
    label: '📟 کێشەی پێوەر و ڕووناکی',
    shortLabel: 'کێشەی پێوەر',
    icon: '📟',
    badgeClass: 'bg-yellow-500/20 text-yellow-900 dark:text-yellow-300 border-yellow-500/40'
  },
  OTHER: {
    id: 'OTHER',
    label: '📌 کار و مامەڵەی تر',
    shortLabel: 'مامەڵەی تر',
    icon: '📌',
    badgeClass: 'bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-400/40'
  }
};

export default function SpecialFilesTab({
  records = [],
  activeStaff,
  onSaveRecord,
  onOpenEditModal,
  onOpenDeliveryModal,
  onOpenPrintModal,
  onDeleteRecord,
  allowEdit = true,
  allowDeliver = true,
  allowDelete = true
}) {
  const todayStr = getKurdistanDate();
  const fileInputRef = useRef(null);
  
  // View states
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filter only Special Records
  const specialRecords = useMemo(() => {
    return (records || []).filter(r => r.isSpecial === true);
  }, [records]);

  // Next recommended special file number (e.g., SP-01, or numeric)
  const nextSpecialNumber = useMemo(() => {
    const nums = specialRecords
      .map(r => {
        const val = String(r.fileNumber || '').replace(/\D/g, '');
        return parseInt(val, 10);
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = nums.length ? Math.max(...nums) : specialRecords.length;
    return String(maxNum + 1);
  }, [specialRecords]);

  // Dedicated Intake Form State for Special Files
  const [formData, setFormData] = useState({
    fileNumber: nextSpecialNumber,
    citizenName: '',
    accountNumber: '',
    phoneNumber: '',
    specialCategory: 'METER_REQUEST', // Default to Meter Request
    fileType: 'YELLOW_FOLDER', // 'YELLOW_FOLDER' | 'PAPER'
    status: 'IN_PROGRESS', // 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED'
    specialNote: '',
    kycStatus: 'DONE_BY_US'
  });

  // Sync next number when list changes
  useEffect(() => {
    if (!formData.citizenName && !formData.phoneNumber) {
      setFormData(prev => ({ ...prev, fileNumber: nextSpecialNumber }));
    }
  }, [nextSpecialNumber]);

  // Handle Form Submission (Adding New Special File)
  const handleCreateSpecialRecord = (e) => {
    e.preventDefault();
    const cleanFileNum = (formData.fileNumber || '').trim() || nextSpecialNumber;
    const cleanName = (formData.citizenName || '').trim();
    const cleanAccount = (formData.accountNumber || '').trim();
    const cleanPhone = (formData.phoneNumber || '').trim();
    const cleanNote = (formData.specialNote || '').trim();

    if (!cleanFileNum && !cleanName && !cleanAccount && !cleanPhone) {
      alert('تکایە لانیکەم زانیاری سەرەکی (ژمارەی فایل، ناو، یان ژمارەی ئەژمار) بنووسە');
      if (fileInputRef.current) fileInputRef.current.focus();
      return;
    }

    const staffName = activeStaff?.name || activeStaff?.username || 'فەرمانبەری ژووری ١٩';
    const nowTime = getKurdistanDateTime(false);

    const newSpecial = {
      id: 'sp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      fileNumber: cleanFileNum,
      citizenName: cleanName || 'هاوبەشی تایبەت',
      hasRealName: Boolean(cleanName),
      accountNumber: cleanAccount || 'نیە',
      phoneNumber: cleanPhone || 'نیە',
      fileType: formData.fileType || 'YELLOW_FOLDER',
      status: formData.status || 'IN_PROGRESS',
      isSpecial: true,
      isExclusiveSpecial: true,
      specialCategory: formData.specialCategory || 'VIP',
      specialNote: cleanNote || 'دۆسیەی تایبەت (داخڵکردنی ڕاستەوخۆ)',
      specialDate: nowTime,
      submissionDate: todayStr,
      department: 'دابەشکردنی کارەبا - بەشی دۆسیە تایبەتەکان',
      handledBy: staffName,
      deliveredBy: formData.status === 'DELIVERED' ? staffName : null,
      deliveredDate: formData.status === 'DELIVERED' ? nowTime : null,
      kycStatus: formData.kycStatus || 'DONE_BY_US',
      isKycDone: true
    };

    if (onSaveRecord) {
      onSaveRecord(newSpecial, null);
    }

    setSuccessMsg(`دۆسیەی تایبەتی ژمارە (${cleanFileNum}) بە سەرکەوتوویی لەم بەشە تۆمار کرا! ⭐`);
    setTimeout(() => setSuccessMsg(null), 3500);

    // Reset Form
    const currentNum = parseInt(cleanFileNum.replace(/\D/g, ''), 10);
    const nextNum = !isNaN(currentNum) ? String(currentNum + 1) : nextSpecialNumber;
    setFormData({
      fileNumber: nextNum,
      citizenName: '',
      accountNumber: '',
      phoneNumber: '',
      specialCategory: formData.specialCategory || 'VIP',
      fileType: formData.fileType || 'YELLOW_FOLDER',
      status: 'IN_PROGRESS',
      specialNote: '',
      kycStatus: 'DONE_BY_US'
    });

    if (fileInputRef.current) fileInputRef.current.focus();
  };

  // Edit Special Record Handler
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRecord || !onSaveRecord) return;
    onSaveRecord({
      ...editingRecord,
      isSpecial: true
    }, editingRecord.id);
    setEditingRecord(null);
    setSuccessMsg(`دەستکاری فایلی #${editingRecord.fileNumber} پاشەکەوت کرا! ✅`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Filtered Special Records
  const filteredSpecialRecords = useMemo(() => {
    const rawSearch = searchTerm.trim();
    const latinQ = toLatinDigits(rawSearch);
    const fuzzyQ = normalizeKurdishFuzzy(rawSearch);
    const cleanDigitsQ = latinQ.replace(/[^0-9]/g, '');

    return specialRecords.filter(r => {
      // Status Filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'ALL' && r.specialCategory !== categoryFilter) {
        return false;
      }

      // Search Filter
      if (rawSearch) {
        const fuzzyName = normalizeKurdishFuzzy(r.citizenName || '');
        const fileStr = String(r.fileNumber || '').trim().toLowerCase();
        const accStr = String(r.accountNumber || '').trim();
        const phoneDigits = String(r.phoneNumber || '').replace(/[^0-9]/g, '');
        const fuzzyNote = normalizeKurdishFuzzy(r.specialNote || r.notes || '');

        const matchName = fuzzyName.includes(fuzzyQ);
        const matchFile = fileStr.includes(cleanDigitsQ) || fileStr.includes(fuzzyQ);
        const matchAcc = cleanDigitsQ && accStr.includes(cleanDigitsQ);
        const matchPhone = cleanDigitsQ && phoneDigits.includes(cleanDigitsQ);
        const matchNote = fuzzyNote.includes(fuzzyQ);

        if (!matchName && !matchFile && !matchAcc && !matchPhone && !matchNote) {
          return false;
        }
      }

      return true;
    });
  }, [specialRecords, searchTerm, statusFilter, categoryFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = specialRecords.length;
    let completed = 0;
    let inProgress = 0;
    let delivered = 0;
    let yellowFolders = 0;
    let papers = 0;

    specialRecords.forEach(r => {
      if (r.status === 'COMPLETED') completed++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'DELIVERED') delivered++;

      if (r.fileType === 'YELLOW_FOLDER') yellowFolders++;
      else papers++;
    });

    return { total, completed, inProgress, delivered, yellowFolders, papers };
  }, [specialRecords]);

  // Remove single record from special
  const handleRemoveFromSpecial = (record) => {
    if (!onSaveRecord) return;
    if (confirm(`ئایا دڵنیایت لە لابردنی فایلی #${record.fileNumber} لە لیستی دۆسیە تایبەتەکان؟`)) {
      onSaveRecord({
        ...record,
        isSpecial: false
      }, record.id);
    }
  };

  // Delete Special Record
  const handleDeleteSpecial = (record) => {
    if (confirm(`ئایا دڵنیایت لە سڕینەوەی ئەم دۆسیە تایبەتە (فایلی #${record.fileNumber})؟`)) {
      if (onDeleteRecord) {
        onDeleteRecord(record.id);
      } else if (onSaveRecord) {
        onSaveRecord({ ...record, isDeleted: true, isSpecial: false }, record.id);
      }
    }
  };

  // Quick Status Toggle
  const handleQuickStatus = (record, newStatus) => {
    if (!onSaveRecord) return;
    const nowTime = getKurdistanDateTime(false);
    const updates = {
      status: newStatus,
      deliveredDate: newStatus === 'DELIVERED' ? (record.deliveredDate || nowTime) : record.deliveredDate,
      deliveredBy: newStatus === 'DELIVERED' ? (record.deliveredBy || activeStaff?.name || 'فەرمانبەری ژووری ١٩') : record.deliveredBy
    };
    onSaveRecord({ ...record, ...updates }, record.id);
  };

  // Batch Remove from Special
  const handleBatchRemoveSpecial = () => {
    if (!selectedIds.length || !onSaveRecord) return;
    if (confirm(`ئایا دڵنیایت لە لابردنی ${selectedIds.length} فایل لە بەشی تایبەت؟`)) {
      selectedIds.forEach(id => {
        const rec = records.find(r => r.id === id);
        if (rec) {
          onSaveRecord({ ...rec, isSpecial: false }, rec.id);
        }
      });
      setSelectedIds([]);
    }
  };

  // Batch Export
  const handleExportSpecial = () => {
    const data = selectedIds.length 
      ? specialRecords.filter(r => selectedIds.includes(r.id))
      : filteredSpecialRecords;
    exportToExcel(data, `Roonaki_Special_VIP_Files_${data.length}_${getKurdistanDate()}.xlsx`);
  };

  const CATEGORY_LABELS = Object.fromEntries(
    Object.entries(SPECIAL_CATEGORIES).map(([k, v]) => [k, v.label])
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn font-kurdish text-right" dir="rtl">
      
      {/* ── HERO BANNER: SPECIAL & VIP ARCHIVES ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/25 via-amber-600/15 to-yellow-500/25 border-2 border-amber-500/50 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/30 text-amber-950 dark:text-amber-200 border border-amber-500/50 text-xs font-black shadow-sm">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>بەشی سەربەخۆی دۆسیە تایبەتەکان (Exclusive VIP Archives)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span>دۆسیە تایبەتەکان</span>
              <span className="px-3.5 py-1 rounded-2xl bg-amber-500 text-slate-950 text-base sm:text-lg font-mono font-black shadow-lg shadow-amber-500/30">
                {stats.total} دۆسیەی تایبەت
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 max-w-2xl leading-relaxed font-medium">
              ئەم بەشە بە تەواوی سەربەخۆیە بۆ تۆمارکردن و بەڕێوەبردنی ئەو فایلە تایبەتانەی کە خۆت دەتەوێت بەجیا داخیلیان بکەیت. لێرەوە بە شێوەیەکی ڕاستەوخۆ فایلی تایبەت تۆمار بکە.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFormOpen(prev => !prev)}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95 border border-amber-400/60 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isFormOpen ? 'داخستنی فۆڕمی داخڵکردن' : 'داخڵکردنی فایلی نوێ +'}</span>
              {isFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleExportSpecial}
              disabled={specialRecords.length === 0}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-amber-900 dark:text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 border border-amber-500/40 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>هەناردەی ئێکسڵ ({specialRecords.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SUCCESS BANNER ── */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center gap-3 animate-bounce shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── DEDICATED DIRECT SPECIAL INTAKE FORM (فۆڕمی داخڵکردنی فایلی تایبەت) ── */}
      {isFormOpen && (
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white dark:via-slate-900 to-amber-600/10 border-2 border-amber-500/50 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                  فۆڕمی داخڵکردنی دۆسیەی تایبەت (Direct Special Entry)
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                  تۆمارکردنی دۆسیەیەکی نوێ لەناو بەشی تایبەت بەبێ تێکەڵبوون
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
              ئەمڕۆ: {todayStr}
            </span>
          </div>

          <form onSubmit={handleCreateSpecialRecord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* File Number */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-500" />
                  <span>ژمارەی دۆسیە (File #)*:</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="text"
                  required
                  value={formData.fileNumber}
                  onChange={(e) => setFormData({ ...formData, fileNumber: e.target.value })}
                  placeholder="بۆ نموونە: 101 یان SP-1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border-2 border-amber-400/80 dark:border-amber-500/50 text-amber-700 dark:text-amber-300 font-mono font-black text-base focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Citizen Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>ناوی هاووڵاتی / خاوەن دۆسیە*:</span>
                </label>
                <input
                  type="text"
                  value={formData.citizenName}
                  onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                  placeholder="ناوی سیانی هاووڵاتی بنووسە..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>ژمارەی مۆبایل:</span>
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0750xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Account / ID Number */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-500" />
                  <span>ژمارەی ئەژمار (ID):</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="ژمارەی ئەژمار یان پێوەر..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Category / Reason */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>پۆلێن / جۆری کار و تایبەت بوون:</span>
                </label>
                <select
                  value={formData.specialCategory}
                  onChange={(e) => setFormData({ ...formData, specialCategory: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500"
                >
                  {Object.values(SPECIAL_CATEGORIES).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* File Type */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                  <span>جۆری فایل:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fileType: 'YELLOW_FOLDER' })}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.fileType === 'YELLOW_FOLDER'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>📁 زەرد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fileType: 'PAPER' })}
                    className={`py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.fileType === 'PAPER'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span>📄 ئەوراق</span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>دۆخی سەرەتایی:</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="IN_PROGRESS">🟡 لە کاردایە (پێنەدراوەتەوە)</option>
                  <option value="COMPLETED">🟢 وەرگیراوەتەوە (تەواوبوو)</option>
                  <option value="DELIVERED">🔵 تەسلیمکراوە (ڕادەستکراو)</option>
                </select>
              </div>

            </div>

            {/* Quick Category Selection Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                هەڵبژاردنی خێرای جۆری کار / پۆلێن:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(SPECIAL_CATEGORIES).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, specialCategory: cat.id })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      formData.specialCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                        : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <span>{cat.shortLabel || cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Note */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>تێبینی و هۆکاری تایبەتکردنی فایل:</span>
              </label>
              <input
                type="text"
                value={formData.specialNote}
                onChange={(e) => setFormData({ ...formData, specialNote: e.target.value })}
                placeholder="بۆ نموونە: پێوەر داواکردن، کەشفی مەیدانی، ڕاسپێردراوی بەڕێوەبەر، زۆر بەپەلە..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-300/80 dark:border-amber-500/40 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer border border-amber-400/60"
            >
              <Save className="w-5 h-5" />
              <span>تۆمارکردنی دۆسیەی تایبەت لەم بەشە (Enter) ⭐</span>
            </button>
          </form>
        </div>
      )}

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Special */}
        <div 
          onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
          className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border-2 border-amber-500/40 shadow-lg space-y-1 cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">کۆی دۆسیە تایبەتەکان</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500">فایلی جیاکراوەی VIP</div>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-md space-y-1 cursor-pointer transition-all ${
            statusFilter === 'COMPLETED' 
              ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40' 
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">تەواوبوو (وەرگیراوەتەوە)</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </div>
          <div className="text-[11px] text-slate-500">ئامادەی ڕادەستکردنەوە</div>
        </div>

        {/* In Progress */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-md space-y-1 cursor-pointer transition-all ${
            statusFilter === 'IN_PROGRESS' 
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40' 
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">لە کاردایە (پێنەدراوەتەوە)</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
            {stats.inProgress}
          </div>
          <div className="text-[11px] text-slate-500">لە قۆناغی جێبەجێکردندایە</div>
        </div>

        {/* Delivered */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'DELIVERED' ? 'ALL' : 'DELIVERED')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-md space-y-1 cursor-pointer transition-all ${
            statusFilter === 'DELIVERED' 
              ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/40' 
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-bold">تەسلیمکراوە</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
            {stats.delivered}
          </div>
          <div className="text-[11px] text-slate-500">ڕادەستی هاووڵاتی کرا</div>
        </div>

      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96 flex items-center">
          <Search className="absolute right-3.5 w-4 h-4 text-amber-500 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان بە ناو، مۆبایل، فایل، ئەژمار، یان تێبینی تایبەت..."
            className="w-full pr-10 pl-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Filter Tabs + View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">📋 هەموو کار و پۆلێنەکان</option>
            {Object.values(SPECIAL_CATEGORIES).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { id: 'ALL', label: `هەموو (${specialRecords.length})` },
              { id: 'COMPLETED', label: `تەواوبوو (${stats.completed})` },
              { id: 'IN_PROGRESS', label: `لە کاردایە (${stats.inProgress})` },
              { id: 'DELIVERED', label: `تەسلیمکراو (${stats.delivered})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="پیشاندانی بە کارت"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="پیشاندانی بە خشتە"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* ── BATCH ACTIONS BAR (WHEN ITEMS SELECTED) ── */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {selectedIds.length} دۆسیەی تایبەت دیاری کراوە
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBatchRemoveSpecial}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Star className="w-3.5 h-3.5" />
              <span>لابردن لە بەشی تایبەت</span>
            </button>

            <button
              type="button"
              onClick={handleExportSpecial}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>هەناردەی ئەمانە</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              پاشگەزبوونەوە
            </button>
          </div>
        </div>
      )}

      {/* ── SPECIAL FILES CONTENT (CARDS OR TABLE) ── */}
      {filteredSpecialRecords.length > 0 ? (
        viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredSpecialRecords.map((record, index) => {
              const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;
              const isSelected = selectedIds.includes(record.id);
              const catConfig = SPECIAL_CATEGORIES[record.specialCategory];

              return (
                <div
                  key={record.id || index}
                  className={`relative rounded-3xl bg-white dark:bg-slate-900 border-2 transition-all p-5 sm:p-6 shadow-xl space-y-4 ${
                    isSelected 
                      ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50/20' 
                      : 'border-amber-500/40 hover:border-amber-500 hover:shadow-2xl'
                  }`}
                >
                  
                  {/* Header: Star, File Number, Status Badge */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedIds(prev => 
                            prev.includes(record.id) ? prev.filter(id => id !== record.id) : [...prev, record.id]
                          );
                        }}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />

                      <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-500">
                        <Star className="w-5 h-5 fill-amber-500" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                            #{record.fileNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${catConfig?.badgeClass || 'bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500/40'}`}>
                            {catConfig?.label || CATEGORY_LABELS[record.specialCategory] || '⭐ دۆسیەی تایبەت'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          بەروار: {record.submissionDate || record.specialDate || todayStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={record.status}
                        onChange={(e) => handleQuickStatus(record, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-black border ${status.badgeClass} bg-white dark:bg-slate-900 cursor-pointer focus:outline-none`}
                      >
                        <option value="IN_PROGRESS">🟡 لە کاردایە</option>
                        <option value="COMPLETED">🟢 وەرگیراوەتەوە</option>
                        <option value="DELIVERED">🔵 تەسلیمکراوە</option>
                      </select>

                      {record.fileType === 'YELLOW_FOLDER' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                          📁 فایلی زەرد
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          📄 ئەوراق
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Citizen Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    
                    {/* Name */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-500" />
                        <span>ناوی هاووڵاتی:</span>
                      </div>
                      <div className="font-black text-slate-900 dark:text-white text-sm truncate">
                        {record.citizenName || 'هاوبەشی تایبەت'}
                      </div>
                    </div>

                    {/* Account */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-amber-500" />
                        <span>ژمارەی ئەژمار (ID):</span>
                      </div>
                      <div className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs">
                        {record.accountNumber && record.accountNumber !== 'نیە' ? record.accountNumber : 'بێ ئەژمار'}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-500" />
                        <span>ژمارەی مۆبایل:</span>
                      </div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <span>{record.phoneNumber || 'نیە'}</span>
                        {record.phoneNumber && record.phoneNumber !== 'نیە' && (
                          <a
                            href={generateWhatsAppUrl(record)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 transition-colors inline-flex items-center gap-1"
                            title="واتسئاپ"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-[10px]">نامە</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Handled By */}
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Folder className="w-3 h-3 text-amber-500" />
                        <span>تۆمارکراوە لەلایەن:</span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {record.handledBy || 'فەرمانبەری ژووری ١٩'}
                      </div>
                    </div>

                  </div>

                  {/* ── SPECIAL REASON / NOTE BOX ── */}
                  <div className="p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-500/15 border border-amber-300/80 dark:border-amber-500/40 text-xs space-y-1">
                    <div className="flex items-center justify-between text-amber-950 dark:text-amber-200 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>تێبینی و هۆکاری تایبەتکردن:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(record)}
                        className="text-[10px] text-amber-700 dark:text-amber-400 underline hover:text-amber-900 font-bold cursor-pointer"
                      >
                        دەستکاری ✏️
                      </button>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {record.specialNote || record.notes || <span className="text-slate-400 italic">هیچ تێبینییەکی تایبەت نەنووسراوە</span>}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {allowDeliver && record.status !== 'DELIVERED' && onOpenDeliveryModal && (
                        <button
                          type="button"
                          onClick={() => onOpenDeliveryModal(record)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>تەسلیمکردنەوە</span>
                        </button>
                      )}

                      {onOpenPrintModal && (
                        <button
                          type="button"
                          onClick={() => onOpenPrintModal(record)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="چاپی پسوولە"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingRecord(record)}
                        className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 transition-colors cursor-pointer"
                        title="دەستکاری فایل"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveFromSpecial(record)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                        title="لابردن لە بەشی تایبەت"
                      >
                        لابردن لە تایبەت
                      </button>

                      {allowDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSpecial(record)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 transition-colors cursor-pointer"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xl">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-amber-500/10 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-black border-b border-amber-500/30">
                <tr>
                  <th className="p-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredSpecialRecords.length && filteredSpecialRecords.length > 0}
                      onChange={(e) => {
                        if (e.checked || e.target.checked) setSelectedIds(filteredSpecialRecords.map(r => r.id));
                        else setSelectedIds([]);
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 text-center w-16">فایل #</th>
                  <th className="p-3 text-right">ناوی هاووڵاتی</th>
                  <th className="p-3 text-center w-28">ئەژمار (ID)</th>
                  <th className="p-3 text-center w-28">مۆبایل</th>
                  <th className="p-3 text-center w-36">پۆلێن / جۆری کار</th>
                  <th className="p-3 text-center w-24">جۆری فایل</th>
                  <th className="p-3 text-center w-28">دۆخ</th>
                  <th className="p-3 text-right min-w-[150px]">تێبینی تایبەت</th>
                  <th className="p-3 text-center w-28">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredSpecialRecords.map(record => {
                  const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;
                  const isSelected = selectedIds.includes(record.id);
                  const catConfig = SPECIAL_CATEGORIES[record.specialCategory];

                  return (
                    <tr key={record.id} className={`hover:bg-amber-50/40 dark:hover:bg-amber-950/20 ${isSelected ? 'bg-amber-50/80 dark:bg-amber-500/10' : ''}`}>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedIds(prev => prev.includes(record.id) ? prev.filter(id => id !== record.id) : [...prev, record.id]);
                          }}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                        #{record.fileNumber}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                        {record.citizenName || 'هاوبەشی تایبەت'}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {record.accountNumber && record.accountNumber !== 'نیە' ? record.accountNumber : '-'}
                      </td>
                      <td className="p-3 text-center font-mono">
                        <div className="flex items-center justify-center gap-1">
                          <span>{record.phoneNumber || '-'}</span>
                          {record.phoneNumber && record.phoneNumber !== 'نیە' && (
                            <a href={generateWhatsAppUrl(record)} target="_blank" rel="noreferrer" className="text-emerald-500">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catConfig?.badgeClass || 'bg-amber-500/15 text-amber-900 dark:text-amber-300'}`}>
                          {catConfig?.shortLabel || CATEGORY_LABELS[record.specialCategory] || 'تایبەت'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {record.fileType === 'YELLOW_FOLDER' ? '📁 زەرد' : '📄 ئەوراق'}
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={record.status}
                          onChange={(e) => handleQuickStatus(record, e.target.value)}
                          className={`px-2 py-1 rounded-lg text-xs font-black border ${status.badgeClass} bg-white dark:bg-slate-900 cursor-pointer`}
                        >
                          <option value="IN_PROGRESS">لە کاردایە</option>
                          <option value="COMPLETED">وەرگیراوەتەوە</option>
                          <option value="DELIVERED">تەسلیمکراوە</option>
                        </select>
                      </td>
                      <td className="p-3 text-right text-xs text-slate-600 dark:text-slate-300">
                        {record.specialNote || record.notes || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingRecord(record)}
                            className="p-1 rounded bg-amber-500/15 text-amber-600 hover:bg-amber-500/25"
                            title="دەستکاری"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromSpecial(record)}
                            className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800"
                            title="لابردن لە تایبەت"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-amber-500/40 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Star className="w-8 h-8 fill-amber-500/30" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL' 
                ? 'هیچ دۆسیەیەکی تایبەت بەم فلتەرە نەدۆزرایەوە!' 
                : 'هێشتا هیچ دۆسیەیەکی تایبەت تۆمار نەکراوە!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              دەتوانیت لە سەرەوە لە ڕێگەی «فۆڕمی داخڵکردنی دۆسیەی تایبەت» فایلی تایبەت تۆمار بکەیت، یان لە خشتەی سەرەکی ئەستێرەی ⭐ دابگریت.
            </p>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL') ? (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
            >
              پاککردنەوەی فلتەرەکان
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(true);
                if (fileInputRef.current) fileInputRef.current.focus();
              }}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              داخڵکردنی یەکەمین دۆسیەی تایبەت +
            </button>
          )}
        </div>
      )}

      {/* ── EDIT SPECIAL RECORD MODAL ── */}
      {editingRecord && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-kurdish text-right" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                  دەستکاریکردنی دۆسیەی تایبەت (#{editingRecord.fileNumber})
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ناوی هاووڵاتی:</label>
                <input
                  type="text"
                  value={editingRecord.citizenName || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, citizenName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ژمارەی مۆبایل:</label>
                  <input
                    type="text"
                    value={editingRecord.phoneNumber || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ژمارەی ئەژمار (ID):</label>
                  <input
                    type="text"
                    value={editingRecord.accountNumber || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">پۆلێنکردن / جۆری کار:</label>
                  <select
                    value={editingRecord.specialCategory || 'METER_REQUEST'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, specialCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    {Object.values(SPECIAL_CATEGORIES).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دۆخی ئێستا:</label>
                  <select
                    value={editingRecord.status || 'IN_PROGRESS'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="IN_PROGRESS">🟡 لە کاردایە</option>
                    <option value="COMPLETED">🟢 وەرگیراوەتەوە</option>
                    <option value="DELIVERED">🔵 تەسلیمکراوە</option>
                  </select>
                </div>
              </div>

              {/* Quick Category Chips for Edit Modal */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">هەڵبژاردنی خێرا:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.values(SPECIAL_CATEGORIES).map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditingRecord({ ...editingRecord, specialCategory: cat.id })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                        (editingRecord.specialCategory || 'METER_REQUEST') === cat.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {cat.shortLabel || cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تێبینی و هۆکاری تایبەتکردن:</label>
                <textarea
                  rows={3}
                  value={editingRecord.specialNote || editingRecord.notes || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, specialNote: e.target.value, notes: e.target.value })}
                  placeholder="هۆکار و تێبینی بنووسە..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  پاشەکەوتکردن
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
