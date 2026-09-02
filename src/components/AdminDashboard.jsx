import React, { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Zap, 
  Printer,
  Users,
  Layers,
  Settings,
  PlusCircle,
  UploadCloud,
  UserCheck,
  CheckSquare,
  Square,
  X,
  Filter,
  Phone,
  Hash,
  UserX,
  AlertTriangle,
  Folder,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { STATUS_CONFIG, FILE_TYPES } from '../constants/status';
import { exportToExcel } from '../utils/excelHelper';
import DailyIntake from './DailyIntake';
import SettingsTab from './SettingsTab';
import AnalyticsTab from './AnalyticsTab';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { generateWhatsAppUrl } from '../utils/whatsappHelper';
import { MessageSquare, BarChart3, ExternalLink } from 'lucide-react';

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
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .trim();
}

export default function AdminDashboard({
  records,
  onOpenExcelImport,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeliveryModal,
  onOpenPrintModal,
  onDeleteRecord,
  onBatchDelete,
  onBatchUpdateStatus,
  onBatchUpdateFileType,
  onToggleFileType,
  onUpdateStatus,
  onSaveRecord,
  onResetData
}) {
  const [activeTab, setActiveTab] = useState('records');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm); // Prevents UI typing lag

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dataFilter, setDataFilter] = useState('ALL'); // 'ALL' | 'YELLOW_FOLDER' | 'PAPER' | 'NO_PHONE' | 'HAS_PHONE' | 'NO_ID' | 'HAS_ID' | 'WITH_NAME' | 'NO_NAME' | 'HAS_RECEIVER' | 'NO_RECEIVER' | 'INCOMPLETE'
  const [sortField, setSortField] = useState('fileNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination State for Instant 60 FPS Performance
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected IDs for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, fileNumber, citizenName, isBulk, count, ids }

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, statusFilter, dataFilter, pageSize]);

  // Compute Metrics & Data Quality Stats (Memoized)
  const stats = useMemo(() => {
    const total = records.length;
    let completed = 0;
    let inProgress = 0;
    let delivered = 0;
    let withNames = 0;
    let noPhone = 0;
    let noId = 0;
    let withReceiver = 0;
    let incomplete = 0;
    let yellowFolders = 0;
    let papers = 0;

    for (let i = 0; i < total; i++) {
      const r = records[i];
      if (r.status === 'COMPLETED') completed++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'DELIVERED') delivered++;

      if (r.hasRealName) withNames++;

      if (r.fileType === 'YELLOW_FOLDER') {
        yellowFolders++;
      } else {
        papers++;
      }

      const isPNull = !r.phoneNumber || r.phoneNumber === 'نیە' || r.phoneNumber.trim() === '';
      if (isPNull) noPhone++;

      const isINull = !r.accountNumber || r.accountNumber === 'نیە' || r.accountNumber.trim() === '' || r.accountNumber === '-';
      if (isINull) noId++;

      if (r.receiverName && r.receiverName.trim() !== '') withReceiver++;

      if (isPNull || isINull || !r.hasRealName) incomplete++;
    }

    return { 
      total, 
      completed, 
      inProgress, 
      delivered, 
      withNames, 
      withoutNames: total - withNames,
      noPhone,
      hasPhone: total - noPhone,
      noId,
      hasId: total - noId,
      withReceiver,
      withoutReceiver: total - withReceiver,
      incomplete,
      yellowFolders,
      papers
    };
  }, [records]);

  // Filtered & Sorted Records (Fast & Memoized)
  const filteredRecords = useMemo(() => {
    const rawSearch = deferredSearchTerm.trim();
    const latinQ = toLatinDigits(rawSearch);
    const fuzzyQ = normalizeKurdishFuzzy(rawSearch);
    const compactFuzzyQ = fuzzyQ.replace(/\s+/g, '');
    const cleanDigitsQ = latinQ.replace(/[^0-9]/g, '');

    const filtered = records.filter(record => {
      // Search matching
      if (rawSearch) {
        const fuzzyName = normalizeKurdishFuzzy(record.citizenName || '');
        const compactName = fuzzyName.replace(/\s+/g, '');
        const fileStr = String(record.fileNumber || '').trim().toLowerCase();
        const accStr = String(record.accountNumber || '').trim();
        const phoneDigits = String(record.phoneNumber || '').replace(/[^0-9]/g, '');
        const fuzzyReceiver = normalizeKurdishFuzzy(record.receiverName || '');

        const matchName = fuzzyName.includes(fuzzyQ) || compactName.includes(compactFuzzyQ);
        const matchFile = fileStr === cleanDigitsQ || fileStr === compactFuzzyQ || (cleanDigitsQ.length >= 1 && fileStr.includes(cleanDigitsQ));
        const matchAcc = cleanDigitsQ && accStr.includes(cleanDigitsQ);
        const matchPhone = cleanDigitsQ && phoneDigits.includes(cleanDigitsQ);
        const matchReceiver = fuzzyReceiver.includes(fuzzyQ);

        if (!matchName && !matchFile && !matchAcc && !matchPhone && !matchReceiver) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'ALL' && record.status !== statusFilter) {
        return false;
      }
      
      // Data Completeness & File Type Filter
      if (dataFilter !== 'ALL') {
        const isPhoneMissing = !record.phoneNumber || record.phoneNumber === 'نیە' || record.phoneNumber.trim() === '';
        const isIdMissing = !record.accountNumber || record.accountNumber === 'نیە' || record.accountNumber.trim() === '' || record.accountNumber === '-';
        const hasRealName = Boolean(record.hasRealName);
        const hasReceiver = Boolean(record.receiverName && record.receiverName.trim() !== '');

        if (dataFilter === 'YELLOW_FOLDER' && record.fileType !== 'YELLOW_FOLDER') return false;
        if (dataFilter === 'PAPER' && record.fileType === 'YELLOW_FOLDER') return false;

        if (dataFilter === 'NO_PHONE' && !isPhoneMissing) return false;
        if (dataFilter === 'HAS_PHONE' && isPhoneMissing) return false;
        if (dataFilter === 'NO_ID' && !isIdMissing) return false;
        if (dataFilter === 'HAS_ID' && isIdMissing) return false;
        if (dataFilter === 'WITH_NAME' && !hasRealName) return false;
        if (dataFilter === 'NO_NAME' && hasRealName) return false;
        if (dataFilter === 'HAS_RECEIVER' && !hasReceiver) return false;
        if (dataFilter === 'NO_RECEIVER' && hasReceiver) return false;
        if (dataFilter === 'INCOMPLETE' && !isPhoneMissing && !isIdMissing && hasRealName) return false;
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      const numA = parseInt(valA, 10);
      const numB = parseInt(valB, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (sortOrder === 'asc') {
        return String(valA).localeCompare(String(valB));
      }
      return String(valB).localeCompare(String(valA));
    });
  }, [records, deferredSearchTerm, statusFilter, dataFilter, sortField, sortOrder]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRecords.length);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, startIndex, endIndex]);

  // ── Multi-select handlers ─────────────────────────────
  const isAllPageSelected = paginatedRecords.length > 0 && paginatedRecords.every(r => selectedIds.includes(r.id));

  const handleToggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIdSet = new Set(paginatedRecords.map(r => r.id));
      setSelectedIds(prev => prev.filter(id => !pageIdSet.has(id)));
    } else {
      const currentSelected = new Set(selectedIds);
      paginatedRecords.forEach(r => currentSelected.add(r.id));
      setSelectedIds(Array.from(currentSelected));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filteredRecords.map(r => r.id));
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleTriggerBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({
      isBulk: true,
      count: selectedIds.length,
      ids: selectedIds
    });
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedIds.length === 0) return;
    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(selectedIds, newStatus);
    }
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0 
      ? records.filter(r => selectedIds.includes(r.id))
      : filteredRecords;
    exportToExcel(dataToExport, `co2_file_records_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Generate page number list for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, validCurrentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-1 sm:px-0">
      
      {/* Top Admin Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-amber-500/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-lg transition-colors">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
            <Zap className="w-4 h-4 fill-amber-500 dark:fill-amber-400 shrink-0" />
            <span>پەنێڵی بەڕێوەبردن | فرۆشیاری وزە ٢</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
            بەڕێوەبردنی فایلەکانی دائیرەی کارەبا ({records.length} دۆسیە)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            جیاکردنەوەی فایلی زەرد 📁 و ئەوراق 📄، پەڕەبەندی خێرا، و سڕینەوەی بەکۆمەڵ
          </p>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-[#060a14] p-1.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
              activeTab === 'records'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>گشت فایلەکان ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>داخڵکردنی خێرا</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ئامار و شیکاری</span>
          </button>

          <button
            onClick={() => { setActiveTab('records'); onOpenExcelImport(); }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 whitespace-nowrap transition-all active:scale-95"
          >
            <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ئەپڵۆدی ئێکسڵ</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ڕێکخستن</span>
          </button>
        </div>
      </div>

      {/* View 1: Daily Quick Intake */}
      {activeTab === 'daily' && (
        <DailyIntake
          records={records}
          onSaveRecord={onSaveRecord}
          onDeleteRecord={onDeleteRecord}
        />
      )}

      {/* View 2: All Records Table & Excel Management */}
      {activeTab === 'records' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Action Bar */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-50/80 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-300 dark:border-emerald-500/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-colors">
            
            <div className="space-y-1 text-center md:text-right">
              <div className="text-emerald-800 dark:text-emerald-400 font-black text-xs sm:text-sm flex items-center justify-center md:justify-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>هاوردە و هەناردەی فایلی ئێکسڵ (Excel)</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                فایلی ئێکسڵ لێرەوە ئەپڵۆد بکە (ڕەنگی زەرد بە شێوەی فایلی زەرد دەناسرێتەوە)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-3">
              <button
                onClick={onOpenExcelImport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <span>ئەپڵۆدی ئێکسڵ</span>
              </button>

              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {selectedIds.length > 0 ? `هەناردەی (${selectedIds.length}) فایل` : 'هەناردەکردن'}
                </span>
              </button>

              <button
                onClick={onOpenAddModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>فایلی نوێ</span>
              </button>
            </div>

          </div>

          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
            <div 
              onClick={() => { setStatusFilter('ALL'); setDataFilter('ALL'); }}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'ALL' && dataFilter === 'ALL' ? 'bg-amber-50 dark:bg-slate-800/90 border-amber-500 shadow-md' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold">کۆی گشتی</span>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</div>
            </div>

            <div 
              onClick={() => setDataFilter(prev => prev === 'YELLOW_FOLDER' ? 'ALL' : 'YELLOW_FOLDER')}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                dataFilter === 'YELLOW_FOLDER' ? 'bg-amber-100/80 dark:bg-amber-950/60 border-amber-500 shadow-md ring-2 ring-amber-500/30' : 'bg-white dark:bg-slate-900/60 border-amber-200 dark:border-amber-500/20 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold">فایلی زەرد 📁</span>
                <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300 font-mono">{stats.yellowFolders}</div>
            </div>

            <div 
              onClick={() => setDataFilter(prev => prev === 'PAPER' ? 'ALL' : 'PAPER')}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                dataFilter === 'PAPER' ? 'bg-slate-200 dark:bg-slate-800 border-slate-500 shadow-md ring-2 ring-slate-400/30' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold">ئەوراق (کاغەز) 📄</span>
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.papers}</div>
            </div>

            <div 
              onClick={() => setStatusFilter('COMPLETED')}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold">وەرگیراوەتەوە</span>
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">{stats.completed}</div>
            </div>

            <div 
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                statusFilter === 'IN_PROGRESS' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-500'
              }`}
            >
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold">پێنەدراوەتەوە</span>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300 font-mono">{stats.inProgress}</div>
            </div>
          </div>

          {/* ── ADVANCED FILTER AND SEARCH BAR ── */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="گەڕانی زیرەک: ناو (وەک ڕێبین)، ژمارەی فایل، مۆبایل، ئەژمار (ID)، یان وەرگرەوە..."
                  className="w-full pr-10 pl-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="w-full lg:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full lg:w-auto px-3 py-2.5 sm:py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">📋 هەموو دۆخەکان ({records.length})</option>
                  <option value="COMPLETED">🟢 وەرگیراوەتەوە - Done ({stats.completed})</option>
                  <option value="IN_PROGRESS">🟡 پێنەدراوەتەوە - Not Done ({stats.inProgress})</option>
                  <option value="DELIVERED">🔵 تەسلیم کراوە ({stats.delivered})</option>
                </select>
              </div>

              {/* Advanced Data / Missing Fields & File Type Filter Dropdown */}
              <div className="w-full lg:w-auto">
                <select
                  value={dataFilter}
                  onChange={(e) => setDataFilter(e.target.value)}
                  className={`w-full lg:w-auto px-3 py-2.5 sm:py-3 rounded-xl border font-bold text-xs sm:text-sm focus:outline-none transition-colors ${
                    dataFilter !== 'ALL'
                      ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500'
                  }`}
                >
                  <option value="ALL">🔍 فلتەری زانیارییەکان (گشت داتاکان)</option>
                  <option value="YELLOW_FOLDER">📁 تەنها فایلی زەرد ({stats.yellowFolders})</option>
                  <option value="PAPER">📄 تەنها ئەوراق / کاغەز ({stats.papers})</option>
                  <option value="NO_PHONE">⚠️ ئەوانەی مۆبایلیان نیە / نیەیە ({stats.noPhone})</option>
                  <option value="HAS_PHONE">📱 ئەوانەی مۆبایلیان هەیە ({stats.hasPhone})</option>
                  <option value="NO_ID">⚠️ ئەوانەی ژمارەی ئەژماریان (ID) نیە ({stats.noId})</option>
                  <option value="HAS_ID">🔢 ئەوانەی ژمارەی ئەژماریان هەیە ({stats.hasId})</option>
                  <option value="WITH_NAME">👤 ئەوانەی ناوی هاووڵاتییان هەیە ({stats.withNames})</option>
                  <option value="NO_NAME">👥 ئەوانەی ناویان نیە / هاوبەشی کارەبا ({stats.withoutNames})</option>
                  <option value="HAS_RECEIVER">✍️ ئەوانەی ناوی وەرگرەوەیان هەیە ({stats.withReceiver})</option>
                  <option value="NO_RECEIVER">❓ ئەوانەی ناوی وەرگرەوەیان نیە ({stats.withoutReceiver})</option>
                  <option value="INCOMPLETE">🚨 سەرجەم فایلە کەموکوڕییەکان ({stats.incomplete})</option>
                </select>
              </div>

            </div>

            {/* Active Filters Badges Indicator */}
            {(statusFilter !== 'ALL' || dataFilter !== 'ALL' || searchTerm) && (
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> فلتەرە چالاکەکان:
                </span>
                
                {statusFilter !== 'ALL' && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-bold flex items-center gap-1">
                    <span>دۆخ: {statusFilter === 'COMPLETED' ? 'وەرگیراوەتەوە' : (statusFilter === 'IN_PROGRESS' ? 'پێنەدراوەتەوە' : 'تەسلیم کراوە')}</span>
                    <button onClick={() => setStatusFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {dataFilter !== 'ALL' && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-bold flex items-center gap-1">
                    <span>فلتەر: {dataFilter === 'YELLOW_FOLDER' ? '📁 فایلی زەرد' : (dataFilter === 'PAPER' ? '📄 ئەوراق' : (dataFilter === 'NO_PHONE' ? 'بێ مۆبایل' : (dataFilter === 'HAS_PHONE' ? 'بە مۆبایل' : (dataFilter === 'NO_ID' ? 'بێ ئەژمار' : (dataFilter === 'HAS_ID' ? 'بە ئەژمار' : (dataFilter === 'WITH_NAME' ? 'بە ناو' : (dataFilter === 'NO_NAME' ? 'بێ ناو' : 'کەموکوڕی')))))))}</span>
                    <button onClick={() => setDataFilter('ALL')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                  </span>
                )}

                {searchTerm && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 font-bold flex items-center gap-1">
                    <span>گەڕان: "{searchTerm}"</span>
                    <button onClick={() => setSearchTerm('')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => { setStatusFilter('ALL'); setDataFilter('ALL'); setSearchTerm(''); }}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-bold mr-auto"
                >
                  پاککردنەوەی هەموو فلتەرەکان
                </button>
              </div>
            )}
          </div>

          {/* ── STICKY / FLOATING BULK ACTIONS BAR (When Items are Selected) ── */}
          {selectedIds.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border-2 border-amber-500/80 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono text-sm shadow-md">
                  {selectedIds.length}
                </div>
                <div>
                  <span className="font-black text-sm text-white">فایلی هەڵبژێردراو</span>
                  <span className="text-xs text-slate-400 block -mt-0.5">کرداری بەکۆمەڵ ئەنجام بدە لەسەر ئەم فایلانە</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Select all filtered button */}
                {selectedIds.length < filteredRecords.length && (
                  <button
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition-all active:scale-95"
                  >
                    هەڵبژاردنی سەرجەم ({filteredRecords.length}) فایلەکان
                  </button>
                )}

                {/* Bulk Set to Yellow Folder */}
                <button
                  onClick={() => onBatchUpdateFileType && onBatchUpdateFileType(selectedIds, 'YELLOW_FOLDER')}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>فایلی زەرد 📁</span>
                </button>

                {/* Bulk Set to Paper */}
                <button
                  onClick={() => onBatchUpdateFileType && onBatchUpdateFileType(selectedIds, 'PAPER')}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>ئەوراق 📄</span>
                </button>

                {/* Change Status to Done */}
                <button
                  onClick={() => handleBulkStatusChange('COMPLETED')}
                  className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>وەرگیراوەتەوە (Done)</span>
                </button>

                {/* Change Status to Not Done */}
                <button
                  onClick={() => handleBulkStatusChange('IN_PROGRESS')}
                  className="px-3 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>پێنەدراوەتەوە (Not Done)</span>
                </button>

                {/* BULK DELETE BUTTON */}
                <button
                  onClick={handleTriggerBulkDelete}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>سڕینەوەی ({selectedIds.length}) فایل</span>
                </button>

                {/* Deselect */}
                <button
                  onClick={handleClearSelection}
                  title="هەڵوەشاندنەوەی هەڵبژاردن"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Records Table formatted like co2 file */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl backdrop-blur-xl transition-colors">
            {/* ── DESKTOP & TABLET VIEW: Wide Data Table (hidden on mobile) ── */}
            <div className="hidden md:block overflow-x-auto scrollbar-thin">
              <table className="w-full text-right text-xs sm:text-sm min-w-[850px]">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs">
                  <tr>
                    {/* Select All Checkbox Header */}
                    <th className="p-3 pr-4 text-center w-12">
                      <button
                        type="button"
                        onClick={handleToggleSelectAllPage}
                        title={isAllPageSelected ? "هەڵوەشاندنەوەی پەڕە" : "هەڵبژاردنی هەموو ئەم پەڕەیە"}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                      >
                        {isAllPageSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </th>

                    <th className="p-3 cursor-pointer" onClick={() => { setSortField('fileNumber'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      ژمارەی فایل {sortField === 'fileNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-3">جۆری دۆسیە (شێواز)</th>
                    <th className="p-3 cursor-pointer" onClick={() => { setSortField('accountNumber'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      ژمارەی ئەژمار (ID) {sortField === 'accountNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-3">ژمارەی مۆبایل</th>
                    <th className="p-3 cursor-pointer" onClick={() => { setSortField('citizenName'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      ناوی هاووڵاتی {sortField === 'citizenName' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-3">دۆخی ئێستا (Status)</th>
                    <th className="p-3">بەرواری تەسلیم</th>
                    <th className="p-3">ناوی وەرگرەوە</th>
                    <th className="p-3 text-center pl-4 sm:pl-6">کردارەکان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <span>هیچ تۆمارێک بەم فلتەرانە نەدۆزرایەوە</span>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((record) => {
                      const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;
                      const isSelected = selectedIds.includes(record.id);
                      const isPhoneMissing = !record.phoneNumber || record.phoneNumber === 'نیە' || record.phoneNumber.trim() === '';
                      const isIdMissing = !record.accountNumber || record.accountNumber === 'نیە' || record.accountNumber.trim() === '' || record.accountNumber === '-';
                      const isYellowFolder = record.fileType === 'YELLOW_FOLDER';

                      return (
                        <tr 
                          key={record.id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-amber-50/80 dark:bg-amber-500/10' 
                              : (isYellowFolder ? 'bg-amber-50/30 dark:bg-amber-500/5 hover:bg-amber-50/60' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40')
                          }`}
                        >
                          
                          {/* Row Checkbox */}
                          <td className="p-3 pr-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOne(record.id)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-amber-500" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* number file */}
                          <td className="p-3">
                            <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-base px-2 py-0.5 bg-amber-100/70 dark:bg-amber-500/10 rounded-lg border border-amber-300 dark:border-amber-500/30">
                              {record.fileNumber}
                            </span>
                          </td>

                          {/* File Type Button Toggle (Yellow Folder vs Paper) */}
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => onToggleFileType && onToggleFileType(record.id)}
                              title="کلیک بکە بۆ گۆڕینی جۆری فایل (فایلی زەرد / ئەوراق)"
                              className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all active:scale-95 shadow-sm inline-flex items-center gap-1.5 ${
                                isYellowFolder
                                  ? 'bg-amber-200/80 dark:bg-amber-500/25 text-amber-950 dark:text-amber-300 border-amber-400 dark:border-amber-500/50 hover:bg-amber-300/80'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <span>{isYellowFolder ? '📁 فایلی زەرد' : '📄 ئەوراق'}</span>
                            </button>
                          </td>

                          {/* ID */}
                          <td className="p-3 font-mono font-bold">
                            {isIdMissing ? (
                              <span className="text-rose-600 dark:text-rose-400 text-xs px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 font-bold">
                                نیە
                              </span>
                            ) : (
                              <span className="text-slate-900 dark:text-white font-mono">{record.accountNumber}</span>
                            )}
                          </td>

                          {/* Phone & WhatsApp */}
                          <td className="p-3 font-mono text-xs">
                            {isPhoneMissing ? (
                              <span className="text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 font-bold">
                                نیە
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-700 dark:text-slate-300 font-semibold">{record.phoneNumber}</span>
                                {generateWhatsAppUrl(record) && (
                                  <a
                                    href={generateWhatsAppUrl(record)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="ناردنی نامەی فەرمی بە واتسئاپ بۆ هاووڵاتی"
                                    className="p-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold hidden xl:inline">واتسئاپ</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Name */}
                          <td className="p-3">
                            {(record.citizenName && record.citizenName !== 'هاوبەشی کارەبا' && record.citizenName.trim() !== '') ? (
                              <span className="font-bold text-slate-900 dark:text-white">{record.citizenName}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">هاوبەشی کارەبا</span>
                            )}
                          </td>

                          {/* Status selector */}
                          <td className="p-3">
                            <select
                              value={record.status}
                              onChange={(e) => onUpdateStatus(record.id, e.target.value)}
                              className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold border ${status.badgeClass} bg-white dark:bg-slate-900 cursor-pointer focus:outline-none`}
                            >
                              <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal">
                                وەرگیراوەتەوە (Done)
                              </option>
                              <option value="IN_PROGRESS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal">
                                پێنەدراوەتەوە - لەلای ئێمەیە (Not Done)
                              </option>
                              <option value="DELIVERED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal">
                                تەسلیم کرا (Delivered)
                              </option>
                            </select>
                          </td>

                          {/* date */}
                          <td className="p-3 text-xs">
                            {record.deliveredDate ? (
                              <span className="text-blue-700 dark:text-blue-400 font-bold font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-500/30">
                                {record.deliveredDate}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* name of recive */}
                          <td className="p-3 text-xs">
                            {record.receiverName ? (
                              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                <span>{record.receiverName}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-2 pl-3 sm:pl-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Deliver Button */}
                              {record.status !== 'DELIVERED' ? (
                                <button
                                  onClick={() => onOpenDeliveryModal(record)}
                                  title="تەسلیمکردنەوە بە هاووڵاتی"
                                  className="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-[11px] font-black shadow-md shadow-blue-500/30 transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-blue-500/40"
                                >
                                  <PackageCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                  <span>تەسلیم</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-bold border border-blue-200 dark:border-blue-500/30">
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>تەسلیم کرا</span>
                                </span>
                              )}

                              {/* Print Button */}
                              <button
                                onClick={() => onOpenPrintModal(record)}
                                title="پرێنتکردنی کارتی هاووڵاتی"
                                className="group p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 hover:border-amber-400 dark:hover:border-amber-400/50 transition-all duration-200 active:scale-95 shadow-sm"
                              >
                                <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => onOpenEditModal(record)}
                                title="دەستکاریکردن"
                                className="group p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-400/50 transition-all duration-200 active:scale-95 shadow-sm"
                              >
                                <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setDeleteTarget({ id: record.id, fileNumber: record.fileNumber, citizenName: record.citizenName })}
                                title="سڕینەوەی دۆسیە"
                                className="group p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:border-rose-400 dark:hover:border-rose-400/50 transition-all duration-200 active:scale-95 shadow-sm"
                              >
                                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE VIEW: Touch-Friendly Interactive Cards (visible on mobile only) ── */}
            <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <span>هیچ تۆمارێک نەدۆزرایەوە</span>
                </div>
              ) : (
                paginatedRecords.map((record) => {
                  const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;
                  const isSelected = selectedIds.includes(record.id);
                  const isPhoneMissing = !record.phoneNumber || record.phoneNumber === 'نیە' || record.phoneNumber.trim() === '';
                  const isIdMissing = !record.accountNumber || record.accountNumber === 'نیە' || record.accountNumber.trim() === '' || record.accountNumber === '-';
                  const isYellowFolder = record.fileType === 'YELLOW_FOLDER';

                  return (
                    <div 
                      key={record.id} 
                      className={`p-3.5 sm:p-4 space-y-3 transition-colors ${
                        isSelected 
                          ? 'bg-amber-50/90 dark:bg-amber-500/15' 
                          : (isYellowFolder ? 'bg-amber-50/30 dark:bg-amber-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40')
                      }`}
                    >
                      {/* Mobile Top Row: Checkbox + File # + File Type Toggle + Status Dropdown */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectOne(record.id)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-amber-500" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">فایل:</span>
                            <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-base px-2.5 py-0.5 bg-amber-100/80 dark:bg-amber-500/15 rounded-xl border border-amber-300 dark:border-amber-500/30 shadow-sm">
                              {record.fileNumber}
                            </span>
                          </div>

                          {/* File Type Button on Mobile */}
                          <button
                            type="button"
                            onClick={() => onToggleFileType && onToggleFileType(record.id)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-black border transition-all active:scale-95 flex items-center gap-1 ${
                              isYellowFolder
                                ? 'bg-amber-200/80 dark:bg-amber-500/25 text-amber-950 dark:text-amber-300 border-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <span>{isYellowFolder ? '📁 فایلی زەرد' : '📄 ئەوراق'}</span>
                          </button>
                        </div>

                        {/* Inline Status Dropdown */}
                        <select
                          value={record.status}
                          onChange={(e) => onUpdateStatus(record.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black border ${status.badgeClass} bg-white dark:bg-slate-900 cursor-pointer focus:outline-none shadow-sm`}
                        >
                          <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal">
                            وەرگیراوەتەوە (Done)
                          </option>
                          <option value="IN_PROGRESS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal">
                            پێنەدراوەتەوە (Not Done)
                          </option>
                          <option value="DELIVERED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-normal">
                            تەسلیم کرا (Delivered)
                          </option>
                        </select>
                      </div>

                      {/* Details Box on Mobile */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
                        
                        {/* Citizen Name */}
                        <div className="col-span-2 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5">
                          <span className="text-slate-500 dark:text-slate-400">ناوی هاووڵاتی:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {(record.citizenName && record.citizenName !== 'هاوبەشی کارەبا' && record.citizenName.trim() !== '') ? record.citizenName : <span className="text-slate-400 italic">هاوبەشی کارەبا</span>}
                          </span>
                        </div>

                        {/* Account ID */}
                        <div className="flex flex-col">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">ژمارەی ئەژمار (ID):</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                            {isIdMissing ? <span className="text-rose-500 font-bold">نیە</span> : record.accountNumber}
                          </span>
                        </div>

                        {/* Phone & WhatsApp */}
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">مۆبایل:</span>
                            {generateWhatsAppUrl(record) && (
                              <a
                                href={generateWhatsAppUrl(record)}
                                target="_blank"
                                rel="noreferrer"
                                title="ناردنی نامەی واتسئاپ"
                                className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>واتسئاپ</span>
                              </a>
                            )}
                          </div>
                          <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                            {isPhoneMissing ? <span className="text-rose-500 font-bold">نیە</span> : record.phoneNumber}
                          </span>
                        </div>

                        {/* Delivered Info if available */}
                        {record.deliveredDate && (
                          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-blue-700 dark:text-blue-400 text-[11px]">
                            <span>بەرواری تەسلیم: {record.deliveredDate}</span>
                            {record.receiverName && <span>وەرگرەوە: {record.receiverName}</span>}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons Row on Mobile (Big, Touch-Friendly) */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {/* Deliver Button */}
                        {record.status !== 'DELIVERED' ? (
                          <button
                            onClick={() => onOpenDeliveryModal(record)}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>تەسلیم</span>
                          </button>
                        ) : (
                          <div className="flex-1 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/30 flex items-center justify-center gap-1">
                            <PackageCheck className="w-4 h-4" />
                            <span>تەسلیم کرا</span>
                          </div>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => onOpenEditModal(record)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-xs font-black shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-4 h-4" />
                          <span>دەستکاری</span>
                        </button>

                        {/* Print Button */}
                        <button
                          onClick={() => onOpenPrintModal(record)}
                          title="پرێنتکردنی کارتی هاووڵاتی"
                          className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 active:scale-95"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTarget({ id: record.id, fileNumber: record.fileNumber, citizenName: record.citizenName })}
                          title="سڕینەوەی دۆسیە"
                          className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── MODERN PAGINATION & FOOTER CONTROLS ── */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
              
              {/* Info & Page Size */}
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  پیشاندانی <span className="font-black text-slate-900 dark:text-white font-mono">{filteredRecords.length > 0 ? startIndex + 1 : 0}</span> تا <span className="font-black text-slate-900 dark:text-white font-mono">{endIndex}</span> لە کۆی <span className="font-black text-amber-600 dark:text-amber-400 font-mono">{filteredRecords.length}</span> فایل
                </div>

                <div className="flex items-center gap-1.5 border-r border-slate-300 dark:border-slate-700 pr-3 mr-1">
                  <span>ژمارەی دێڕ:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={1000}>هەمووی</option>
                  </select>
                </div>
              </div>

              {/* Page Navigation Buttons */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={validCurrentPage === 1}
                    title="پەڕەی یەکەم"
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={validCurrentPage === 1}
                    title="پەڕەی پێشوو"
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[34px] h-[34px] rounded-xl font-mono font-bold text-xs transition-all ${
                        pageNum === validCurrentPage
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={validCurrentPage === totalPages}
                    title="پەڕەی دواتر"
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={validCurrentPage === totalPages}
                    title="پەڕەی کۆتایی"
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* View 3: Analytics & Reports */}
      {activeTab === 'analytics' && (
        <AnalyticsTab
          records={records}
        />
      )}

      {/* View 4: Settings & Logo */}
      {activeTab === 'settings' && (
        <SettingsTab
          records={records}
          onResetData={onResetData}
        />
      )}

      {/* Custom In-App Delete Confirmation Modal (Supports Single & Bulk Delete) */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.isBulk && deleteTarget.ids) {
            if (onBatchDelete) onBatchDelete(deleteTarget.ids);
            setSelectedIds([]);
          } else if (deleteTarget.id) {
            onDeleteRecord(deleteTarget.id);
            setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
          }
          setDeleteTarget(null);
        }}
        count={deleteTarget?.count || 1}
        fileNumber={deleteTarget?.fileNumber}
        citizenName={deleteTarget?.citizenName}
      />

    </div>
  );
}
