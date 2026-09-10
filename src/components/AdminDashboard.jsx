import React, { useState, useMemo, useDeferredValue, useEffect, useRef } from 'react';
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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  MoreVertical
} from 'lucide-react';
import { STATUS_CONFIG, FILE_TYPES, KYC_CONFIG, getRecordKYC } from '../constants/status';
import { exportToExcel } from '../utils/excelHelper';
import RoonakiLogo from './RoonakiLogo';
import DailyIntake from './DailyIntake';
import SettingsTab from './SettingsTab';
import AnalyticsTab from './AnalyticsTab';
import ActivityLogTab from './ActivityLogTab';
import FastCheckoutModal from './FastCheckoutModal';
import BulkWhatsAppModal from './BulkWhatsAppModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import FileTimelineModal from './FileTimelineModal';
import ArchiveBoxesModal from './ArchiveBoxesModal';
import TrashTab from './TrashTab';
import { generateWhatsAppUrl } from '../utils/whatsappHelper';
import { logActivity } from '../utils/cloudSync';
import { MessageSquare, BarChart3, ExternalLink, Send, History } from 'lucide-react';
import { 
  getStaffRole, 
  canCreate, 
  canEdit, 
  canDeliver, 
  canDelete, 
  canImportExcel, 
  canManageSettings, 
  canSendBroadcast, 
  isViewer,
  ROLE_CONFIG 
} from '../utils/permissions';

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

// 3-Dots Interactive Actions Popover Menu Component (کردارەکان ⁝)
function RowActionsDropdown({
  record,
  isOpen,
  onToggle,
  allowDeliver = true,
  allowEdit = true,
  allowDelete = true,
  onOpenDeliveryModal,
  onOpenEditModal,
  onOpenPrintModal,
  onSetTimelineRecord,
  onSetDeleteTarget
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isOpen) onToggle(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="relative inline-block text-right" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(isOpen ? null : record.id);
        }}
        title="کردارەکانی دۆسیە ⁝"
        className={`p-2 rounded-xl border transition-all active:scale-90 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/50'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 shadow-xs'
        }`}
      >
        <MoreVertical className="w-4 h-4 pointer-events-none" />
      </button>

      {isOpen && (
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-500/50 shadow-2xl z-[9999] py-1.5 text-xs font-bold divide-y divide-slate-100 dark:divide-slate-800/80 animate-fadeIn text-right"
        >
          
          <div className="py-1">
            {allowDeliver && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(null);
                  if (onOpenDeliveryModal) onOpenDeliveryModal(record);
                }}
                className="w-full px-3 py-2 text-right text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <PackageCheck className="w-4 h-4 shrink-0 text-blue-500 pointer-events-none" />
                <span>تەسلیمکردنەوە (وەرگیراوەتەوە) ⚡</span>
              </button>
            )}

            {allowEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(null);
                  if (onOpenEditModal) onOpenEditModal(record);
                }}
                className="w-full px-3 py-2 text-right text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4 shrink-0 text-emerald-500 pointer-events-none" />
                <span>دەستکاریکردنی فایل</span>
              </button>
            )}
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle(null);
                if (onSetTimelineRecord) onSetTimelineRecord(record);
              }}
              className="w-full px-3 py-2 text-right text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 shrink-0 text-purple-500 pointer-events-none" />
              <span>مێژوو و هێڵی کاتیی فایل</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle(null);
                if (onOpenPrintModal) onOpenPrintModal(record);
              }}
              className="w-full px-3 py-2 text-right text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0 text-amber-500 pointer-events-none" />
              <span>پرێنتکردنی پسوولەی فەرمی</span>
            </button>
          </div>

          {allowDelete && (
            <div className="py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(null);
                  if (onSetDeleteTarget) onSetDeleteTarget({ id: record.id, fileNumber: record.fileNumber, citizenName: record.citizenName });
                }}
                className="w-full px-3 py-2 text-right text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 shrink-0 text-rose-500 pointer-events-none" />
                <span>سڕینەوە بۆ سەلەی خۆڵ</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({
  records = [],
  trashRecords = [],
  activeStaff,
  onOpenExcelImport,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeliveryModal,
  onOpenPrintModal,
  onDeleteRecord,
  onBatchDelete,
  onRestoreRecord,
  onBatchRestore,
  onPermanentDelete,
  onBatchPermanentDelete,
  onEmptyTrash,
  onBatchUpdateStatus,
  onBatchUpdateFileType,
  onToggleFileType,
  onToggleKYC,
  onUpdateKYC,
  onBatchUpdateKYC,
  onBatchEditRecords,
  onUpdateStatus,
  onSaveRecord,
  onResetData,
  isSidebarOpen: externalIsSidebarOpen,
  setIsSidebarOpen: externalSetIsSidebarOpen
}) {
  const [activeTab, setActiveTab] = useState('records');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm); // Prevents UI typing lag

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dataFilter, setDataFilter] = useState('ALL'); // 'ALL' | 'YELLOW_FOLDER' | 'PAPER' | 'KYC_DONE' | 'KYC_PENDING' | ...
  const [sortField, setSortField] = useState('fileNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination State for Instant 60 FPS Performance
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected IDs for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, fileNumber, citizenName, isBulk, count, ids }
  const [timelineRecord, setTimelineRecord] = useState(null); // File life history modal
  const [isFastCheckoutOpen, setIsFastCheckoutOpen] = useState(false);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState(false);
  const [isArchiveBoxesOpen, setIsArchiveBoxesOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    status: '',
    fileType: '',
    kycStatus: '',
    handledBy: '',
    archiveLocation: '',
    notes: ''
  });
  // Sidebar Drawer state & Row Actions dropdown state
  const [internalIsSidebarOpen, setInternalIsSidebarOpen] = useState(false);
  const isSidebarOpen = externalIsSidebarOpen !== undefined ? externalIsSidebarOpen : internalIsSidebarOpen;
  const setIsSidebarOpen = externalSetIsSidebarOpen || setInternalIsSidebarOpen;
  const [openRowMenuId, setOpenRowMenuId] = useState(null);

  const handleStatusChangeWithStaff = (recordId, newStatus) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    const staffName = activeStaff?.name ? `${activeStaff.name}` : (activeStaff?.username || 'فەرمانبەری ژووری ١٩');
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updates = { status: newStatus };
    if (newStatus === 'DELIVERED' || newStatus === 'COMPLETED') {
      updates.deliveredDate = target.deliveredDate || nowTime;
      updates.deliveredBy = target.deliveredBy || staffName;
      updates.handledBy = target.handledBy || staffName;
      updates.isKycDone = true;
      updates.kycStatus = 'DONE';
    }

    if (onSaveRecord) {
      onSaveRecord({ ...target, ...updates }, recordId);
    } else if (onUpdateStatus) {
      onUpdateStatus(recordId, newStatus);
    }
  };

  // Add audit note to file timeline
  const handleTimelineNote = (recordId, noteObj) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;
    const existingTimeline = Array.isArray(target.timeline) ? target.timeline : [];
    const updatedRecord = {
      ...target,
      timeline: [...existingTimeline, noteObj]
    };
    if (onSaveRecord) {
      onSaveRecord(updatedRecord, recordId);
    }
    setTimelineRecord(updatedRecord);
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, statusFilter, dataFilter, pageSize]);

  // Compute Metrics & Data Quality Stats (Memoized)
  const stats = useMemo(() => {
    const safeRecords = Array.isArray(records) ? records : [];
    const total = safeRecords.length;
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
    let kycDoneByUs = 0;
    let kycPreVerified = 0;
    let kycPending = 0;

    for (let i = 0; i < total; i++) {
      const r = safeRecords[i];
      if (!r) continue;
      if (r.status === 'COMPLETED') completed++;
      else if (r.status === 'IN_PROGRESS') inProgress++;
      else if (r.status === 'DELIVERED') delivered++;

      const hasReal = Boolean(
        r.hasRealName === true || 
        (r.citizenName && r.citizenName !== 'هاوبەشی کارەبا' && r.citizenName.trim() !== '' && !r.citizenName.startsWith('مانگی '))
      );

      if (hasReal) withNames++;

      if (r.fileType === 'YELLOW_FOLDER') {
        yellowFolders++;
      } else {
        papers++;
      }

      // 3-state KYC calculation
      const kycState = getRecordKYC(r);
      if (kycState === 'DONE_BY_US') kycDoneByUs++;
      else if (kycState === 'PRE_VERIFIED') kycPreVerified++;
      else kycPending++;

      const isPNull = !r.phoneNumber || r.phoneNumber === 'نیە' || r.phoneNumber.trim() === '';
      if (isPNull) noPhone++;

      const isINull = !r.accountNumber || r.accountNumber === 'نیە' || r.accountNumber.trim() === '' || r.accountNumber === '-';
      if (isINull) noId++;

      if (r.receiverName && r.receiverName.trim() !== '') withReceiver++;

      if (isPNull || isINull || !hasReal) incomplete++;
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
      papers,
      kycDoneByUs,
      kycPreVerified,
      kycPending,
      kycDone: kycDoneByUs + kycPreVerified
    };
  }, [records]);

  // Filtered & Sorted Records (Fast & Memoized)
  const filteredRecords = useMemo(() => {
    const rawSearch = deferredSearchTerm.trim();
    const latinQ = toLatinDigits(rawSearch);
    const fuzzyQ = normalizeKurdishFuzzy(rawSearch);
    const compactFuzzyQ = fuzzyQ.replace(/\s+/g, '');
    const cleanDigitsQ = latinQ.replace(/[^0-9]/g, '');

    const safeRecords = Array.isArray(records) ? records : [];
    const filtered = safeRecords.filter(record => {
      if (!record) return false;
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
        const hasReceiver = Boolean(record.receiverName && record.receiverName.trim() !== '');
        const hasRealName = Boolean(
          record.hasRealName === true || 
          (record.citizenName && record.citizenName !== 'هاوبەشی کارەبا' && record.citizenName.trim() !== '' && !record.citizenName.startsWith('مانگی '))
        );
        const kycVal = getRecordKYC(record);

        if (dataFilter === 'YELLOW_FOLDER' && record.fileType !== 'YELLOW_FOLDER') return false;
        if (dataFilter === 'PAPER' && record.fileType === 'YELLOW_FOLDER') return false;

        if (dataFilter === 'KYC_DONE_BY_US' && kycVal !== 'DONE_BY_US') return false;
        if (dataFilter === 'KYC_PRE_VERIFIED' && kycVal !== 'PRE_VERIFIED') return false;
        if (dataFilter === 'KYC_PENDING' && kycVal !== 'PENDING') return false;
        if (dataFilter === 'KYC_DONE' && kycVal === 'PENDING') return false;

        if (dataFilter === 'NO_PHONE' && !isPhoneMissing) return false;
        if (dataFilter === 'HAS_PHONE' && isPhoneMissing) return false;
        if (dataFilter === 'NO_ID' && !isIdMissing) return false;
        if (dataFilter === 'HAS_ID' && isIdMissing) return false;
        if (dataFilter === 'WITH_NAME' && !hasRealName) return false;
        if (dataFilter === 'NO_NAME' && hasRealName) return false;
        if (dataFilter === 'HAS_RECEIVER' && !hasReceiver) return false;
        if (dataFilter === 'NO_RECEIVER' && hasReceiver) return false;
        if (dataFilter === 'INCOMPLETE' && (!isPhoneMissing && !isIdMissing && hasRealName)) return false;
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

  const handleExport = (exportOnlyFiltered = false) => {
    let dataToExport = records;
    if (selectedIds.length > 0) {
      dataToExport = records.filter(r => selectedIds.includes(r.id));
    } else if (exportOnlyFiltered && filteredRecords.length > 0) {
      dataToExport = filteredRecords;
    }
    const count = dataToExport.length;
    exportToExcel(dataToExport, `Roonaki_Electricity_Records_${count}_files_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

  // Role-Based Access Control (RBAC) Permissions
  const allowCreate = canCreate(activeStaff);
  const allowEdit = canEdit(activeStaff);
  const allowDeliver = canDeliver(activeStaff);
  const allowDelete = canDelete(activeStaff);
  const allowImport = canImportExcel(activeStaff);
  const allowSettings = canManageSettings(activeStaff);
  const allowBroadcast = canSendBroadcast(activeStaff);
  const viewerMode = isViewer(activeStaff);

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-1 sm:px-0">
      
      {/* Viewer Mode Alert Banner */}
      {viewerMode && (
        <div className="p-4 rounded-2xl sm:rounded-3xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-500/40 text-blue-900 dark:text-blue-200 text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-blue-500/5 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 text-lg sm:text-xl">
              👁️
            </div>
            <div>
              <span className="font-black text-blue-950 dark:text-blue-100 text-sm">هەژماری تەنها بینەر (Viewer Mode):</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                تۆ مۆڵەتی بینینی داتاکان، گەڕان، چاپی پسوولە و هەناردەی ئێکسڵت هەیە. دەسەڵاتی دەستکاری، زیادکردن، تەسلیمکردنەوە یان سڕینەوە ناچالاکە.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-black border border-blue-500/30 shrink-0">
            تەنها خوێندنەوە (Read-Only)
          </span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-amber-500/30 p-4 sm:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-xl shadow-lg transition-colors">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
            <Zap className="w-4 h-4 fill-amber-500 shrink-0" />
            <span>پەنێڵی بەڕێوەبردن | فرۆشیاری وزە ٢ - ژووری ١٩</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            بەڕێوەبردنی فایلەکانی دائیرەی کارەبا ({records.length} دۆسیە)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            جیاکردنەوەی فایلی زەرد 📁 و ئەوراق 📄، پەڕەبەندی خێرا، و بەڕێوەبردنی گشتی
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active View Indicator Badge */}
          <div className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {activeTab === 'records' && 'گشت فایلەکان (خشتە)'}
              {activeTab === 'daily' && 'داخڵکردنی خێرا (ڕۆژانە)'}
              {activeTab === 'analytics' && 'ئامار و شیکاری'}
              {activeTab === 'activity' && 'تۆماری چالاکی'}
              {activeTab === 'trash' && 'سەلەی خۆڵ'}
              {activeTab === 'settings' && 'ڕێکخستن'}
            </span>
          </div>
        </div>
      </div>

      {/* ── ULTRA-MODERN SLIDE-OVER SIDEBAR DRAWER (سڵایدباڕی مۆدێرن) ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[999] h-screen w-screen overflow-hidden animate-fadeIn font-kurdish">
          {/* Glassmorphic Dark Backdrop */}
          <div 
            className="fixed inset-0 z-[1000] bg-slate-950/75 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer Panel (Zero gap, flush against top, bottom and right edge) */}
          <div className="fixed top-0 right-0 bottom-0 z-[1001] h-screen w-full max-w-md bg-white dark:bg-[#090e1c] border-l border-slate-200/80 dark:border-amber-500/20 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight text-right">
              
              {/* Drawer Header (Fixed) */}
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-l from-amber-500/10 via-transparent to-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-md shadow-amber-500/15 shrink-0">
                    <RoonakiLogo className="h-9 w-auto" showText={false} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                      مێنیوی سەرەکی پۆرتاڵ
                    </h3>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                      پڕۆژەی ڕووناکی • فرۆشیاری وزە ٢
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                  title="داخستن (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-6 custom-scrollbar">
                
                {/* Section 1: Main Tabs */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider flex items-center justify-between">
                    <span>بەشە سەرەکییەکان</span>
                    <span className="text-[10px] text-amber-500 font-normal">Navigation</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('records'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                      activeTab === 'records'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${activeTab === 'records' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div>گشت فایلەکان (خشتە)</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'records' ? 'text-slate-900' : 'text-slate-400'}`}>
                          گەڕان و بەڕێوەبردنی تەواوی دۆسیەکان
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      activeTab === 'records' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                    }`}>
                      {records.length}
                    </span>
                  </button>

                  {allowCreate && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('daily'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                        activeTab === 'daily'
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${activeTab === 'daily' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>
                          <PlusCircle className="w-4 h-4" />
                        </div>
                        <div className="text-right">
                          <div>داخڵکردنی خێرا (ڕۆژانە)</div>
                          <div className={`text-[10px] font-normal ${activeTab === 'daily' ? 'text-slate-900' : 'text-slate-400'}`}>
                            تۆمارکردنی یەک لەدوای یەکی کارمەندان
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">نوێ</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                      activeTab === 'analytics'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${activeTab === 'analytics' ? 'bg-slate-950 text-sky-400' : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'}`}>
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div>ئامار و شیکاری گشتی</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'analytics' ? 'text-slate-900' : 'text-slate-400'}`}>
                          ڕێژەی ئەنجامدان، فایلی زەرد و ئەوراق
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('activity'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                      activeTab === 'activity'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${activeTab === 'activity' ? 'bg-slate-950 text-indigo-400' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'}`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div>تۆماری چالاکیی کارمەندان</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'activity' ? 'text-slate-900' : 'text-slate-400'}`}>
                          چاودێری و لۆگی تەواوی کردارەکان
                        </div>
                      </div>
                    </div>
                  </button>

                  {allowDelete && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('trash'); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                        activeTab === 'trash'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-500/40'
                          : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${activeTab === 'trash' ? 'bg-slate-950 text-rose-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'}`}>
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="text-right">
                          <div>سەلەی خۆڵ (فایلە سڕاوەکان)</div>
                          <div className={`text-[10px] font-normal ${activeTab === 'trash' ? 'text-rose-200' : 'text-slate-400'}`}>
                            گەڕاندنەوە یان سڕینەوەی یەکجاری
                          </div>
                        </div>
                      </div>
                      {trashRecords && trashRecords.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white font-mono">
                          {trashRecords.length}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                      activeTab === 'settings'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${activeTab === 'settings' ? 'bg-slate-950 text-amber-400' : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'}`}>
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div>ڕێکخستنی سیستەم و ڕۆڵەکان</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'settings' ? 'text-slate-900' : 'text-slate-400'}`}>
                          کارمەندان، مۆڵەتەکان، و زانیاری فەرمانگە
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Section 2: Quick Tools */}
                <div className="space-y-2 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
                  <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider flex items-center justify-between">
                    <span>ئامراز و خێراکارییەکان</span>
                    <span className="text-[10px] text-emerald-500 font-normal">Quick Actions</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {allowDeliver && (
                      <button
                        type="button"
                        onClick={() => { setIsSidebarOpen(false); setIsFastCheckoutOpen(true); }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/15 active:scale-98 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Zap className="w-4 h-4 fill-current shrink-0" />
                          <span>تەسلیمکردنی خێرا (Fast Checkout)</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/20">ژووری ١٩</span>
                      </button>
                    )}

                    {allowBroadcast && (
                      <button
                        type="button"
                        onClick={() => { setIsSidebarOpen(false); setIsBulkWhatsAppOpen(true); }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/15 active:scale-98 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Send className="w-4 h-4 shrink-0" />
                          <span>نامەی بەکۆمەڵ (واتسئاپ بۆ تەواوبووەکان)</span>
                        </div>
                        <span className="text-xs">📢</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => { setIsSidebarOpen(false); setIsArchiveBoxesOpen(true); }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/15 active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder className="w-4 h-4 shrink-0" />
                        <span>بۆکسەکانی ئەرشیف (١٥٠ دۆسیە بۆ چاپکردن)</span>
                      </div>
                      <span className="text-xs">📦</span>
                    </button>

                    {allowImport && (
                      <button
                        type="button"
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('records'); onOpenExcelImport(); }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-white shadow-md active:scale-98 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <UploadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>هاوردەکردنی فایلی ئێکسڵ (Excel)</span>
                        </div>
                        <span className="text-xs text-emerald-400 font-bold">Upload</span>
                      </button>
                    )}

                    <a
                      href="/poster.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsSidebarOpen(false)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/15 active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>پۆستەری ڕێنمایی A4 (بۆ چاپکردن)</span>
                      </div>
                      <span className="text-xs">📄</span>
                    </a>
                  </div>
                </div>

              </div>

              {/* Drawer Footer: Active Staff Card */}
              <div className="p-4 sm:p-5 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#070b16]/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    {activeStaff?.name ? activeStaff.name.charAt(0) : '👤'}
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      {activeStaff?.name || 'فەرمانبەری ژووری ١٩'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <span>{activeStaff?.title || 'بەشی ئەرشیف'}</span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {activeStaff?.role === 'ADMIN' ? 'ئادمین' : activeStaff?.role === 'VIEWER' ? 'بینەر' : 'ستاف'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Developers & System Ownership Card */}
                <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 space-y-1.5 text-right">
                  <div className="flex items-center justify-between text-[11px] font-black text-amber-900 dark:text-amber-200">
                    <span>💻 بیرۆکە و گەشەپێدانی سیستم:</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">Room 19</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                    <span>ئارام عەباس (Aram Abbas)</span>
                    <span className="text-amber-500 font-black">&</span>
                    <span>ڕەعد ئیبراهیم (Raad Ebrahim)</span>
                  </div>
                </div>
              </div>

            </div>
        </div>
      )}

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
              {allowImport && (
                <button
                  onClick={onOpenExcelImport}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span>ئەپڵۆدی ئێکسڵ</span>
                </button>
              )}

              {/* Export All or Filtered Excel Button */}
              {selectedIds.length > 0 ? (
                <button
                  onClick={() => handleExport(false)}
                  title="هەناردەکردنی تەنها ئەو فایلانەی هەڵتبژاردوون"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>هەناردەی هەڵبژێردراو ({selectedIds.length})</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                  <button
                    onClick={() => handleExport(false)}
                    title="هەناردەکردنی سەرجەم دۆسیەکانی داتابەیس بۆ ناو فایلی ئێکسڵ"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>داگرتنی ئێکسڵ ({records.length})</span>
                  </button>

                  {filteredRecords.length < records.length && (
                    <button
                      onClick={() => handleExport(true)}
                      title="هەناردەکردنی تەنها ئەو فایلانەی فلتەرکراون لە خشتەکەدا"
                      className="px-2.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-xs font-bold transition-all"
                    >
                      فلتەرکراو ({filteredRecords.length})
                    </button>
                  )}
                </div>
              )}

              {allowCreate && (
                <button
                  onClick={onOpenAddModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>فایلی نوێ</span>
                </button>
              )}
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
              onClick={() => setStatusFilter(prev => prev === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/30' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1.5">
                <span className="text-[11px] sm:text-xs font-bold">وەرگیراوەتەوە</span>
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">{stats.completed}</div>
            </div>

            <div 
              onClick={() => setStatusFilter(prev => prev === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                statusFilter === 'IN_PROGRESS' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/30' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-500'
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
                  <option value="KYC_DONE_BY_US">🟢 تەنها ئەوانەی ئێمە کردمان ({stats.kycDoneByUs})</option>
                  <option value="KYC_PRE_VERIFIED">🔵 تەنها ئەوانەی پێشتر کراون - دەرەکی ({stats.kycPreVerified})</option>
                  <option value="KYC_PENDING">🟡 تەنها ئەوانەی نەکراون - پێنەدراوەتەوە ({stats.kycPending})</option>
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
                    <span>فلتەر: {
                      dataFilter === 'KYC_DONE_BY_US' ? '🟢 ئێمە کردمان' :
                      dataFilter === 'KYC_PRE_VERIFIED' ? '🔵 پێشتر کراوە (دەرەکی)' :
                      dataFilter === 'KYC_PENDING' ? '🟡 نەکراوە (پێنەدراوەتەوە)' :
                      dataFilter === 'KYC_DONE' ? '🟢 هەموو KYC کراوەکان' :
                      dataFilter === 'YELLOW_FOLDER' ? '📁 فایلی زەرد' :
                      dataFilter === 'PAPER' ? '📄 ئەوراق' :
                      dataFilter === 'NO_PHONE' ? 'بێ مۆبایل' :
                      dataFilter === 'HAS_PHONE' ? 'بە مۆبایل' :
                      dataFilter === 'NO_ID' ? 'بێ ئەژمار' :
                      dataFilter === 'HAS_ID' ? 'بە ئەژمار' :
                      dataFilter === 'WITH_NAME' ? 'بە ناو' :
                      dataFilter === 'NO_NAME' ? 'بێ ناو' : 'کەموکوڕی'
                    }</span>
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
                {allowEdit && (
                  <button
                    onClick={() => onBatchUpdateFileType && onBatchUpdateFileType(selectedIds, 'YELLOW_FOLDER')}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>فایلی زەرد 📁</span>
                  </button>
                )}

                {/* Bulk Set to Paper */}
                {allowEdit && (
                  <button
                    onClick={() => onBatchUpdateFileType && onBatchUpdateFileType(selectedIds, 'PAPER')}
                    className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>ئەوراق 📄</span>
                  </button>
                )}

                {/* Bulk Send WhatsApp */}
                {allowBroadcast && (
                  <button
                    onClick={() => setIsBulkWhatsAppOpen(true)}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ناردنی واتسئاپ ({selectedIds.length}) 📢</span>
                  </button>
                )}

                {/* Bulk KYC 3-choice group */}
                {allowEdit && (
                  <div className="flex items-center gap-1 bg-slate-900/60 dark:bg-slate-950/80 p-1.5 rounded-xl border-2 border-amber-500/60 shadow-md">
                    <span className="text-[11px] font-black text-amber-300 px-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>بەتنی KYC ({selectedIds.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onBatchUpdateKYC && onBatchUpdateKYC(selectedIds, 'DONE_BY_US')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all active:scale-95 shadow-sm"
                      title="دیاریکردن وەک ئێمە کردمان بۆ هەڵبژێردراوەکان"
                    >
                      🟢 ئێمە کردمان
                    </button>
                    <button
                      type="button"
                      onClick={() => onBatchUpdateKYC && onBatchUpdateKYC(selectedIds, 'PRE_VERIFIED')}
                      className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition-all active:scale-95 shadow-sm"
                      title="دیاریکردن وەک پێشتر کراوە (دەرەکی)"
                    >
                      🔵 پێشتر کراوە
                    </button>
                    <button
                      type="button"
                      onClick={() => onBatchUpdateKYC && onBatchUpdateKYC(selectedIds, 'PENDING')}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-all active:scale-95 shadow-sm"
                      title="دیاریکردن وەک نەکراوە (پێنەدراوەتەوە)"
                    >
                      🟡 نەکراوە
                    </button>
                  </div>
                )}

                {/* Change Status Buttons */}
                {allowEdit && (
                  <>
                    <button
                      onClick={() => handleBulkStatusChange('COMPLETED')}
                      className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>وەرگیراوەتەوە (Done)</span>
                    </button>

                    <button
                      onClick={() => handleBulkStatusChange('IN_PROGRESS')}
                      className="px-3 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>پێنەدراوەتەوە (Not Done)</span>
                    </button>

                    <button
                      onClick={() => handleBulkStatusChange('DELIVERED')}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>تەسلیم کرا (Delivered) 🔵</span>
                    </button>

                    {/* Bulk Custom Edit Button */}
                    <button
                      onClick={() => {
                        setBulkEditForm({
                          status: '',
                          fileType: '',
                          kycStatus: '',
                          handledBy: '',
                          archiveLocation: '',
                          notes: ''
                        });
                        setIsBulkEditOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      <span>دەستکاریکردنی بەکۆمەڵ ✏️</span>
                    </button>
                  </>
                )}

                {/* BULK DELETE BUTTON */}
                {allowDelete && (
                  <button
                    onClick={handleTriggerBulkDelete}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>سڕینەوەی ({selectedIds.length}) فایل</span>
                  </button>
                )}

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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-950/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs">
                  <tr>
                    {/* Select All Checkbox Header */}
                    <th className="p-2 text-center w-8">
                      <button
                        type="button"
                        onClick={handleToggleSelectAllPage}
                        title={isAllPageSelected ? "هەڵوەشاندنەوەی پەڕە" : "هەڵبژاردنی هەموو ئەم پەڕەیە"}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                      >
                        {isAllPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>

                    <th className="p-2 cursor-pointer text-center w-16" onClick={() => { setSortField('fileNumber'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      فایل {sortField === 'fileNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-2 text-center w-24">جۆری دۆسیە</th>
                    <th className="p-2 cursor-pointer text-center w-24" onClick={() => { setSortField('accountNumber'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      ئەژمار (ID) {sortField === 'accountNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-2 text-center w-28">مۆبایل</th>
                    <th className="p-2 cursor-pointer text-right min-w-[110px]" onClick={() => { setSortField('citizenName'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                      ناوی هاووڵاتی {sortField === 'citizenName' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-2 bg-amber-500/15 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 border-x border-amber-300 dark:border-amber-500/40 text-center font-black w-32">
                      <div className="flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>بەتنی KYC 🪪</span>
                      </div>
                    </th>
                    <th className="p-2 text-center w-32">دۆخی ئێستا</th>
                    <th className="p-2 text-center w-20">بەروار</th>
                    <th className="p-2 text-center w-24">وەرگرەوە</th>
                    <th className="p-2 text-center w-36">کردارەکان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="p-12 text-center text-slate-400">
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
                      const allowDeliver = true;
                      const allowEdit = activeStaff?.permissions?.canEdit !== false;
                      const allowDelete = activeStaff?.permissions?.canDelete !== false;

                      return (
                        <tr 
                          key={record.id} 
                          className={`transition-colors ${openRowMenuId === record.id ? 'relative z-30' : ''} ${
                            isSelected 
                              ? 'bg-amber-50/80 dark:bg-amber-500/10' 
                              : (isYellowFolder ? 'bg-amber-50/30 dark:bg-amber-500/5 hover:bg-amber-50/60' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40')
                          }`}
                        >
                          
                          {/* Row Checkbox */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOne(record.id)}
                              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* number file */}
                          <td className="p-2 text-center">
                            <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-xs px-1.5 py-0.5 bg-amber-100/70 dark:bg-amber-500/10 rounded border border-amber-300 dark:border-amber-500/30">
                              {record.fileNumber}
                            </span>
                          </td>

                          {/* File Type Button Toggle (Yellow Folder vs Paper) */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              disabled={!allowEdit}
                              onClick={() => onToggleFileType && onToggleFileType(record.id)}
                              title={allowEdit ? "کلیک بکە بۆ گۆڕینی جۆری فایل (فایلی زەرد / ئەوراق)" : "تەنها خوێندنەوە"}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-black border transition-all active:scale-95 shadow-xs inline-flex items-center gap-1 ${
                                !allowEdit ? 'opacity-85 cursor-default' : 'cursor-pointer'
                              } ${
                                isYellowFolder
                                  ? 'bg-amber-200/80 dark:bg-amber-500/25 text-amber-950 dark:text-amber-300 border-amber-400 dark:border-amber-500/50'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <span>{isYellowFolder ? '📁 فایلی زەرد' : '📄 ئەوراق'}</span>
                            </button>
                          </td>

                          {/* ID */}
                          <td className="p-2 text-center font-mono text-xs">
                            {isIdMissing ? (
                              <span className="text-rose-600 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 font-bold">
                                نیە
                              </span>
                            ) : (
                              <span className="text-slate-900 dark:text-white font-mono font-semibold">{record.accountNumber}</span>
                            )}
                          </td>

                          {/* Phone & WhatsApp */}
                          <td className="p-2 text-center font-mono text-xs">
                            {isPhoneMissing ? (
                              <span className="text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[10px] font-bold">
                                نیە
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <span className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{record.phoneNumber}</span>
                                {generateWhatsAppUrl(record) && (
                                  <a
                                    href={generateWhatsAppUrl(record)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="ناردنی نامەی فەرمی بە واتسئاپ بۆ هاووڵاتی"
                                    className="p-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center transition-all active:scale-95"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Name */}
                          <td className="p-2 text-right">
                            {(record.citizenName && record.citizenName !== 'هاوبەشی کارەبا' && record.citizenName.trim() !== '') ? (
                              <span className="font-bold text-slate-900 dark:text-white text-xs block truncate max-w-[130px]" title={record.citizenName}>
                                {record.citizenName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">هاوبەشی کارەبا</span>
                            )}
                          </td>

                          {/* KYC Status Dropdown */}
                          <td className="p-2 bg-amber-500/5 dark:bg-amber-500/5 border-x border-amber-200/60 dark:border-amber-500/20 text-center">
                            {(() => {
                              const kycState = getRecordKYC(record);
                              return (
                                <select
                                  value={kycState}
                                  disabled={!allowEdit}
                                  onChange={(e) => {
                                    if (onUpdateKYC) {
                                      onUpdateKYC(record.id, e.target.value);
                                    } else if (onToggleKYC) {
                                      onToggleKYC(record.id);
                                    }
                                  }}
                                  title={allowEdit ? "بەتنی دیاریکردنی دۆخی کەیوایسی (KYC)" : "تەنها خوێندنەوە"}
                                  className={`w-full px-1.5 py-1 rounded-lg text-xs font-black border-2 transition-all focus:outline-none shadow-xs text-center ${
                                    !allowEdit ? 'cursor-default opacity-85' : 'cursor-pointer'
                                  } ${
                                    kycState === 'DONE_BY_US'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border-emerald-500'
                                      : kycState === 'PRE_VERIFIED'
                                      ? 'bg-sky-100 dark:bg-sky-500/25 text-sky-950 dark:text-sky-200 border-sky-500'
                                      : 'bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500'
                                  }`}
                                >
                                  <option value="DONE_BY_US" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold">
                                    🟢 ئێمە کردمان
                                  </option>
                                  <option value="PRE_VERIFIED" className="bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-bold">
                                    🔵 پێشتر کراوە
                                  </option>
                                  <option value="PENDING" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold">
                                    🟡 نەکراوە
                                  </option>
                                </select>
                              );
                            })()}
                          </td>

                          {/* Status selector */}
                          <td className="p-2 text-center">
                            <select
                              value={record.status}
                              disabled={!allowEdit}
                              onChange={(e) => onUpdateStatus(record.id, e.target.value)}
                              className={`w-full px-1.5 py-1 rounded-lg text-xs font-bold border ${status.badgeClass} bg-white dark:bg-slate-900 focus:outline-none shadow-xs text-center ${
                                !allowEdit ? 'cursor-default opacity-85' : 'cursor-pointer'
                              }`}
                            >
                              <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold">
                                🟢 وەرگیراوەتەوە
                              </option>
                              <option value="IN_PROGRESS" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold">
                                🟡 پێنەدراوەتەوە
                              </option>
                              <option value="DELIVERED" className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold">
                                🔵 تەسلیم کرا
                              </option>
                            </select>
                          </td>

                          {/* date */}
                          <td className="p-2 text-center text-xs">
                            {record.deliveredDate ? (
                              <span className="text-blue-700 dark:text-blue-400 font-bold font-mono text-[11px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-500/30">
                                {record.deliveredDate}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* name of recive & staff handler */}
                          <td className="p-2 text-center text-xs">
                            {record.receiverName ? (
                              <span className="font-bold text-slate-900 dark:text-white text-xs truncate block max-w-[95px] mx-auto" title={record.receiverName}>
                                {record.receiverName}
                              </span>
                            ) : (record.deliveredBy || record.handledBy) ? (
                              <span className="text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 truncate block max-w-[95px] mx-auto" title={record.deliveredBy || record.handledBy}>
                                👤 {record.deliveredBy || record.handledBy}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Actions Column (3-Dots Popover Menu ⁝) */}
                          <td className={`p-2 text-center relative ${openRowMenuId === record.id ? 'z-50' : ''}`}>
                            <RowActionsDropdown
                              record={record}
                              isOpen={openRowMenuId === record.id}
                              onToggle={(id) => setOpenRowMenuId(id)}
                              allowDeliver={allowDeliver}
                              allowEdit={allowEdit}
                              allowDelete={allowDelete}
                              onOpenDeliveryModal={onOpenDeliveryModal}
                              onOpenEditModal={onOpenEditModal}
                              onOpenPrintModal={onOpenPrintModal}
                              onSetTimelineRecord={(rec) => setTimelineRecord(rec)}
                              onSetDeleteTarget={(target) => setDeleteTarget(target)}
                            />
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
                  const allowDeliver = true;
                  const allowEdit = activeStaff?.permissions?.canEdit !== false;
                  const allowDelete = activeStaff?.permissions?.canDelete !== false;
                  const isKyc = Boolean(
                    record.isKycDone || 
                    record.kycStatus === 'DONE' || 
                    record.status === 'COMPLETED' || 
                    record.status === 'DELIVERED'
                  );

                  return (
                    <div 
                      key={record.id} 
                      className={`p-3.5 sm:p-4 space-y-3 transition-colors ${openRowMenuId === record.id ? 'relative z-30' : ''} ${
                        isSelected 
                          ? 'bg-amber-50/90 dark:bg-amber-500/15' 
                          : (isYellowFolder ? 'bg-amber-50/30 dark:bg-amber-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40')
                      }`}
                    >
                      {/* Mobile Top Row: Checkbox + File # + File Type Toggle + KYC Toggle + Status Dropdown */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
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
                            disabled={!allowEdit}
                            onClick={() => onToggleFileType && onToggleFileType(record.id)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-black border transition-all active:scale-95 flex items-center gap-1 ${
                              !allowEdit ? 'opacity-85 cursor-default' : 'cursor-pointer'
                            } ${
                              isYellowFolder
                                ? 'bg-amber-200/80 dark:bg-amber-500/25 text-amber-950 dark:text-amber-300 border-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <span>{isYellowFolder ? '📁 فایلی زەرد' : '📄 ئەوراق'}</span>
                          </button>

                          {/* KYC Dropdown on Mobile */}
                          <div className="flex items-center gap-1.5 bg-amber-500/15 dark:bg-amber-500/20 px-2.5 py-1 rounded-xl border-2 border-amber-400 dark:border-amber-500/40 shadow-xs">
                            <span className="text-[11px] font-black text-amber-950 dark:text-amber-200 shrink-0">
                              بەتنی KYC 🪪:
                            </span>
                            {(() => {
                              const kycState = getRecordKYC(record);
                              return (
                                <select
                                  value={kycState}
                                  disabled={!allowEdit}
                                  onChange={(e) => {
                                    if (onUpdateKYC) {
                                      onUpdateKYC(record.id, e.target.value);
                                    } else if (onToggleKYC) {
                                      onToggleKYC(record.id);
                                    }
                                  }}
                                  title={allowEdit ? "بەتنی گۆڕینی دۆخی KYC" : "تەنها خوێندنەوە"}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-black border-2 transition-all focus:outline-none ${
                                    !allowEdit ? 'opacity-85 cursor-default' : 'cursor-pointer'
                                  } ${
                                    kycState === 'DONE_BY_US'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border-emerald-500'
                                      : kycState === 'PRE_VERIFIED'
                                      ? 'bg-sky-100 dark:bg-sky-500/25 text-sky-950 dark:text-sky-200 border-sky-500'
                                      : 'bg-amber-100 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border-amber-500'
                                  }`}
                                >
                                  <option value="DONE_BY_US" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold">
                                    🟢 ئێمە کردمان
                                  </option>
                                  <option value="PRE_VERIFIED" className="bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-bold">
                                    🔵 پێشتر کراوە
                                  </option>
                                  <option value="PENDING" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold">
                                    🟡 نەکراوە
                                  </option>
                                </select>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Inline Status Dropdown */}
                        <select
                          value={record.status}
                          disabled={!allowEdit}
                          onChange={(e) => onUpdateStatus(record.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black border ${status.badgeClass} bg-white dark:bg-slate-900 focus:outline-none shadow-sm ${
                            !allowEdit ? 'opacity-85 cursor-default' : 'cursor-pointer'
                          }`}
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

                        {/* Delivered Info / Staff if available */}
                        {(record.deliveredDate || record.receiverName || record.deliveredBy || record.handledBy) && (
                          <div className="col-span-2 flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] flex-wrap gap-1">
                            {record.deliveredDate && (
                              <span className="text-blue-700 dark:text-blue-400 font-mono">بەروار: {record.deliveredDate}</span>
                            )}
                            {record.receiverName && (
                              <span className="font-bold text-slate-800 dark:text-slate-200">وەرگرەوە: {record.receiverName}</span>
                            )}
                            {(record.deliveredBy || record.handledBy) && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                                👤 {record.deliveredBy || record.handledBy}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Dropdown on Mobile */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400">کردارەکانی دۆسیە:</span>
                        <RowActionsDropdown
                          record={record}
                          isOpen={openRowMenuId === record.id}
                          onToggle={(id) => setOpenRowMenuId(id)}
                          allowDeliver={allowDeliver}
                          allowEdit={allowEdit}
                          allowDelete={allowDelete}
                          onOpenDeliveryModal={onOpenDeliveryModal}
                          onOpenEditModal={onOpenEditModal}
                          onOpenPrintModal={onOpenPrintModal}
                          onSetTimelineRecord={(rec) => setTimelineRecord(rec)}
                          onSetDeleteTarget={(target) => setDeleteTarget(target)}
                        />
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

      {/* View 4: Audit Activity Logs */}
      {activeTab === 'activity' && (
        <ActivityLogTab />
      )}

      {/* View 5: Settings & Logo */}
      {activeTab === 'settings' && (
        <SettingsTab
          records={records}
          activeStaff={activeStaff}
          onResetData={onResetData}
        />
      )}

      {/* View 6: Recycle Bin / Trash */}
      {activeTab === 'trash' && (
        <TrashTab
          trashRecords={trashRecords}
          onRestoreRecord={onRestoreRecord}
          onBatchRestore={onBatchRestore}
          onPermanentDelete={onPermanentDelete}
          onBatchPermanentDelete={onBatchPermanentDelete}
          onEmptyTrash={onEmptyTrash}
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

      {/* Fast Delivery Checkout Modal for Room 19 */}
      <FastCheckoutModal
        isOpen={isFastCheckoutOpen}
        onClose={() => setIsFastCheckoutOpen(false)}
        records={records}
        onDeliverRecord={(recordId, deliveryData) => {
          const target = records.find(r => r.id === recordId);
          if (target && onSaveRecord) {
            onSaveRecord({ ...target, ...deliveryData }, recordId);
          }
        }}
      />

      {/* Bulk WhatsApp Broadcast Queue Modal */}
      <BulkWhatsAppModal
        isOpen={isBulkWhatsAppOpen}
        onClose={() => setIsBulkWhatsAppOpen(false)}
        records={records}
        selectedIds={selectedIds}
        onMarkNotified={(recordId) => {
          const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
          const target = records.find(r => r.id === recordId);
          if (target && onSaveRecord) {
            onSaveRecord({ ...target, notifiedAt: nowStr }, recordId);
          }
          logActivity('WHATSAPP_BROADCAST', `نامەی واتسئاپ نێردرا بۆ فایلی (${target?.fileNumber}) بە ناوی [${target?.citizenName}]`, {
            fileNumber: target?.fileNumber,
            citizenName: target?.citizenName
          });
        }}
      />

      {/* File Life History & Audit Timeline Modal */}
      {timelineRecord && (
        <FileTimelineModal
          isOpen={Boolean(timelineRecord)}
          record={timelineRecord}
          onClose={() => setTimelineRecord(null)}
          onAddTimelineNote={handleTimelineNote}
          activeStaff={activeStaff}
        />
      )}

      {/* Bulk Edit Modal for Selected Records */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/50 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">دەستکاریکردنی بەکۆمەڵ (Bulk Edit)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    گۆڕینی هاوبەشی زانیاری بۆ <strong className="text-amber-500 font-mono">({selectedIds.length})</strong> فایلی هەڵبژێردراو
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkEditOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Status */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دۆخی مامەڵە (Status):</label>
                <select
                  value={bulkEditForm.status}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:border-amber-500"
                >
                  <option value="">-- دەستکاری نەکرێت (وەک خۆی بمێنێتەوە) --</option>
                  <option value="COMPLETED">🟢 وەرگیراوەتەوە (Done)</option>
                  <option value="IN_PROGRESS">🟡 پێنەدراوەتەوە (In Progress)</option>
                  <option value="DELIVERED">🔵 تەسلیم کراوە (Delivered)</option>
                </select>
              </div>

              {/* Folder Type */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">جۆری دۆسیە (Folder Type):</label>
                <select
                  value={bulkEditForm.fileType}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, fileType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:border-amber-500"
                >
                  <option value="">-- دەستکاری نەکرێت --</option>
                  <option value="YELLOW_FOLDER">📁 فایلی زەرد (دۆسیەی زەرد)</option>
                  <option value="PAPER">📄 ئەوراق (کاغەز/پەڕەی سپی)</option>
                </select>
              </div>

              {/* KYC Status */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دۆخی KYC (ناسینەوەی هاوبەش):</label>
                <select
                  value={bulkEditForm.kycStatus}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, kycStatus: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:border-amber-500"
                >
                  <option value="">-- دەستکاری نەکرێت --</option>
                  <option value="DONE_BY_US">🟢 ئێمە کردمان (Done by us)</option>
                  <option value="PRE_VERIFIED">🔵 پێشتر کراوە (دەرەکی)</option>
                  <option value="PENDING">🟡 نەکراوە (پێنەدراوەتەوە)</option>
                </select>
              </div>

              {/* Handled By */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">فەرمانبەری ئەنجامدەر (Handled By):</label>
                <input
                  type="text"
                  placeholder="بۆ نموونە: ئارام، یاخود بە بەتاڵی جێی بهێڵە"
                  value={bulkEditForm.handledBy}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, handledBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:border-amber-500"
                />
              </div>

              {/* Archive Location */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شوێنی ئەرشیف (Archive Box / Location):</label>
                <input
                  type="text"
                  placeholder="بۆ نموونە: سندوقی ژووری ١٩"
                  value={bulkEditForm.archiveLocation}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, archiveLocation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:border-amber-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تێبینی هاوبەش (Notes):</label>
                <textarea
                  rows="2"
                  placeholder="تێبینی بۆ سەرجەم ئەم دۆسیانە زیاد دەبێت..."
                  value={bulkEditForm.notes}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500 resize-none"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkEditOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                onClick={() => {
                  const updates = {};
                  if (bulkEditForm.status) {
                    updates.status = bulkEditForm.status;
                    if (bulkEditForm.status === 'COMPLETED' || bulkEditForm.status === 'DELIVERED') {
                      updates.isKycDone = true;
                      updates.kycStatus = 'DONE';
                    }
                    if (bulkEditForm.status === 'COMPLETED') {
                      updates.completionDate = new Date().toISOString().slice(0, 10);
                    }
                    if (bulkEditForm.status === 'DELIVERED') {
                      updates.deliveredDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
                    }
                  }
                  if (bulkEditForm.fileType) updates.fileType = bulkEditForm.fileType;
                  if (bulkEditForm.kycStatus) {
                    updates.kycStatus = bulkEditForm.kycStatus;
                    updates.kycType = bulkEditForm.kycStatus;
                    updates.isKycDone = bulkEditForm.kycStatus === 'DONE_BY_US' || bulkEditForm.kycStatus === 'PRE_VERIFIED';
                  }
                  if (bulkEditForm.handledBy) updates.handledBy = bulkEditForm.handledBy;
                  if (bulkEditForm.archiveLocation) updates.archiveLocation = bulkEditForm.archiveLocation;
                  if (bulkEditForm.notes) updates.notes = bulkEditForm.notes;

                  if (Object.keys(updates).length === 0) {
                    alert('تکایە لانیکەم یەک خانە دیاریبکە بۆ نوێکردنەوە');
                    return;
                  }

                  if (onBatchEditRecords) {
                    onBatchEditRecords(selectedIds, updates);
                  }
                  setIsBulkEditOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25 active:scale-95"
              >
                جێبەجێکردنی گۆڕانکارییەکان ({selectedIds.length})
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Archive Box Manifest & Sticker Printing Modal (150 per box) */}
      <ArchiveBoxesModal
        isOpen={isArchiveBoxesOpen}
        onClose={() => setIsArchiveBoxesOpen(false)}
        records={records}
      />

    </div>
  );
}

