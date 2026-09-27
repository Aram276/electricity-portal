import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Package, 
  FileSpreadsheet, 
  Search, 
  Layers, 
  Folder, 
  FileText, 
  CheckCircle2, 
  Check,
  Clock, 
  PackageCheck, 
  ShieldCheck, 
  Calendar,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Tag,
  Download,
  Edit3,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { STATUS_CONFIG, getRecordKYC } from '../constants/status';
import { exportToExcel } from '../utils/excelHelper';
import runakiLogo from '../assets/runaki-logo.png';

export default function ArchiveBoxesModal({ isOpen, onClose, records = [] }) {
  // Mode: 'AUTO' (لە ناو داتابەیس) | 'MANUAL' (دەستی - خۆم بینووسم)
  const [sourceMode, setSourceMode] = useState('AUTO');

  // Manual / Custom Print Fields
  const [customBoxNumber, setCustomBoxNumber] = useState('1');
  const [customStartFile, setCustomStartFile] = useState('1');
  const [customEndFile, setCustomEndFile] = useState('150');
  const [customTotalCount, setCustomTotalCount] = useState('150');
  const [customRoomNote, setCustomRoomNote] = useState('ژووری ١٩ (بەشی ئەرشیف و وەرگرتنەوەی دۆسیەی هاوبەشان)');
  const [customLocationNote, setCustomLocationNote] = useState('سندوق و کارتۆنی ژمارە 1 لە ئەرشیفی ژووری ١٩');

  // Batching & Configuration (Auto Mode)
  const [batchSize, setBatchSize] = useState(150);
  const [startFileNumber, setStartFileNumber] = useState(2);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState('ALL'); // 'ALL' or box index number
  const [viewMode, setViewMode] = useState('STICKER'); // 'STICKER' | 'COMPACT_2' | 'LIST'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFileType, setFilterFileType] = useState('ALL');

  // Directorate title
  const directorateTitle = localStorage.getItem('electricity_directorate_title') || 'بەڕێوەبەرایەتی گشتی دابەشکردنی کارەبا';

  // Handle start/end change in manual mode to auto-calculate count if desirable
  const handleManualStartChange = (val) => {
    setCustomStartFile(val);
    const start = parseInt(val, 10);
    const end = parseInt(customEndFile, 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      setCustomTotalCount(String(end - start + 1));
    }
  };

  const handleManualEndChange = (val) => {
    setCustomEndFile(val);
    const start = parseInt(customStartFile, 10);
    const end = parseInt(val, 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      setCustomTotalCount(String(end - start + 1));
    }
  };

  // 1. Process and Chunk all records into Boxes (Auto Mode)
  const boxes = useMemo(() => {
    if (!records || records.length === 0) return [];

    const validRecords = records.filter(r => {
      const num = parseInt(String(r.fileNumber || '0').replace(/\D/g, ''), 10);
      return !isNaN(num) && num >= (parseInt(startFileNumber, 10) || 1);
    });

    const sorted = [...validRecords].sort((a, b) => {
      const numA = parseInt(String(a.fileNumber || '0').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.fileNumber || '0').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    const size = Math.max(1, parseInt(batchSize, 10) || 150);
    const boxList = [];

    for (let i = 0; i < sorted.length; i += size) {
      const chunk = sorted.slice(i, i + size);
      const boxNum = Math.floor(i / size) + 1;
      const firstRec = chunk[0];
      const lastRec = chunk[chunk.length - 1];

      const yellowCount = chunk.filter(r => r.fileType === 'YELLOW_FOLDER').length;
      const paperCount = chunk.filter(r => r.fileType !== 'YELLOW_FOLDER').length;
      const completedCount = chunk.filter(r => r.status === 'COMPLETED').length;
      const deliveredCount = chunk.filter(r => r.status === 'DELIVERED').length;
      const inProgressCount = chunk.filter(r => r.status === 'IN_PROGRESS').length;
      const kycDoneCount = chunk.filter(r => {
        const kyc = getRecordKYC(r);
        return kyc === 'DONE_BY_US' || kyc === 'PRE_VERIFIED' || r.status === 'COMPLETED' || r.status === 'DELIVERED';
      }).length;

      boxList.push({
        boxNumber: boxNum,
        boxTitle: `بۆکسی ژمارە (${boxNum})`,
        fileRange: `دۆسیەی (#${firstRec.fileNumber}) تا (#${lastRec.fileNumber})`,
        firstFile: firstRec.fileNumber,
        lastFile: lastRec.fileNumber,
        count: chunk.length,
        yellowCount,
        paperCount,
        completedCount,
        deliveredCount,
        inProgressCount,
        kycDoneCount,
        records: chunk
      });
    }

    return boxList;
  }, [records, batchSize, startFileNumber]);

  // Active Boxes to display / print in AUTO mode
  const displayedBoxes = useMemo(() => {
    let list = boxes;
    if (selectedBoxIndex !== 'ALL') {
      const idx = parseInt(selectedBoxIndex, 10);
      list = boxes.filter((_, i) => i === idx);
    }

    if (searchTerm.trim() || filterFileType !== 'ALL') {
      const q = searchTerm.trim().toLowerCase();
      list = list.map(b => ({
        ...b,
        records: b.records.filter(r => {
          const matchQ = !q || 
            String(r.fileNumber).includes(q) || 
            String(r.citizenName || '').toLowerCase().includes(q) || 
            String(r.accountNumber || '').includes(q) || 
            String(r.phoneNumber || '').includes(q);
          const matchType = filterFileType === 'ALL' || 
            (filterFileType === 'YELLOW_FOLDER' && r.fileType === 'YELLOW_FOLDER') ||
            (filterFileType === 'PAPER' && r.fileType !== 'YELLOW_FOLDER');
          return matchQ && matchType;
        })
      })).filter(b => b.records.length > 0);
    }

    return list;
  }, [boxes, selectedBoxIndex, searchTerm, filterFileType]);

  if (!isOpen) return null;

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Export Box Data to Excel
  const handleExportExcel = () => {
    const exportData = [];
    displayedBoxes.forEach(b => {
      b.records.forEach((r, idx) => {
        exportData.push({
          'ژمارەی بۆکس (Box)': b.boxNumber,
          'ناوی بۆکس': b.boxTitle,
          'ڕیزبەندی لە بۆکس': idx + 1,
          'ژمارەی دۆسیە': r.fileNumber,
          'ناوی هاووڵاتی': r.citizenName || 'هاوبەشی کارەبا',
          'ژمارەی ئەژمار (ID)': r.accountNumber || 'نیە',
          'ژمارەی مۆبایل': r.phoneNumber || 'نیە',
          'جۆری دۆسیە': r.fileType === 'YELLOW_FOLDER' ? 'فایلی زەرد' : 'ئەوراق',
          'دۆخی دۆسیە': r.status === 'COMPLETED' ? 'وەرگیراوەتەوە' : (r.status === 'DELIVERED' ? 'تەسلیم کرا' : 'پێنەدراوەتەوە'),
          'دۆخی KYC': getRecordKYC(r) === 'DONE_BY_US' ? 'ئێمە کردمان' : (getRecordKYC(r) === 'PRE_VERIFIED' ? 'پێشتر کراوە' : 'نەکراوە'),
          'وەرگرەوە': r.receiverName || '-',
          'بەرواری تەسلیمکردن': r.deliveredDate || '-'
        });
      });
    });

    const fileName = selectedBoxIndex !== 'ALL' 
      ? `Box_${parseInt(selectedBoxIndex, 10) + 1}_Files_${exportData.length}.xlsx`
      : `All_Archive_Boxes_${boxes.length}_Boxes_${exportData.length}_Files.xlsx`;

    exportToExcel(exportData, fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto font-kurdish text-right" dir="rtl">
      <div className="relative w-full max-w-6xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* ── Top Modal Navigation & Config Bar (Hidden on Print) ── */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 space-y-4 no-print shrink-0">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>پرێنتکردنی ستیکەر و لیستی بۆکسەکانی ئەرشیف</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  دەتوانیت خۆکار لە داتابەیس یان بە دەستی ژمارەی بۆکس و مەودای فایلەکان بنووسیت و پرێنتی بکەیت
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              {sourceMode === 'AUTO' && (
                <button
                  type="button"
                  onClick={handleExportExcel}
                  title="داگرتنی داتای بۆکسەکان بە ئێکسڵ"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>ئێکسڵ (Excel)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                title="پرێنتکردنی لیست بە شێوەی A4"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer border border-amber-400"
              >
                <Printer className="w-4 h-4" />
                <span>پرێنت بکە (Print) 🖨️</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs: AUTO vs MANUAL */}
          <div className="flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setSourceMode('MANUAL')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sourceMode === 'MANUAL'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>✍️ خۆم بینووسم (دەستی - Custom Box)</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('AUTO')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sourceMode === 'AUTO'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ خۆکار لە داتابەیس ({boxes.length} بۆکس)</span>
            </button>
          </div>

          {/* ── CONTROLS FOR MANUAL (خۆم بینووسم) MODE ── */}
          {sourceMode === 'MANUAL' ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn text-xs">
              <div>
                <label className="block text-[11px] font-black text-amber-900 dark:text-amber-300 mb-1">
                  📦 ژمارەی بۆکس:
                </label>
                <input
                  type="text"
                  value={customBoxNumber}
                  onChange={(e) => setCustomBoxNumber(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-400 font-mono font-black text-slate-900 dark:text-amber-300 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-amber-900 dark:text-amber-300 mb-1">
                  🔢 لە فایلی ژمارە:
                </label>
                <input
                  type="number"
                  value={customStartFile}
                  onChange={(e) => handleManualStartChange(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-amber-900 dark:text-amber-300 mb-1">
                  🔢 تا فایلی ژمارە:
                </label>
                <input
                  type="number"
                  value={customEndFile}
                  onChange={(e) => handleManualEndChange(e.target.value)}
                  placeholder="150"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-amber-900 dark:text-amber-300 mb-1">
                  📊 کۆی گشتی دۆسیەکان:
                </label>
                <input
                  type="text"
                  value={customTotalCount}
                  onChange={(e) => setCustomTotalCount(e.target.value)}
                  placeholder="150 دۆسیە"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-black text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          ) : (
            /* ── CONTROLS FOR AUTO MODE ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ژمارەی دۆسیە لە بۆکسێک:</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value={150}>١٥٠ دۆسیە (ستاندارد)</option>
                  <option value={100}>١٠٠ دۆسیە</option>
                  <option value={50}>٥٠ دۆسیە</option>
                  <option value={200}>٢٠٠ دۆسیە</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">دەستپێکردن لە فایلی #:</label>
                <input
                  type="number"
                  min="1"
                  value={startFileNumber}
                  onChange={(e) => setStartFileNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">دیاریکردنی بۆکس:</label>
                <select
                  value={selectedBoxIndex}
                  onChange={(e) => setSelectedBoxIndex(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">📦 سەرجەم بۆکسەکان ({boxes.length})</option>
                  {boxes.map((b, idx) => (
                    <option key={idx} value={idx}>
                      بۆکسی {b.boxNumber} ({b.firstFile} - {b.lastFile})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">شێوازی چاپکردن:</label>
                <div className="flex items-center rounded-xl bg-slate-200 dark:bg-slate-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('STICKER')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      viewMode === 'STICKER' 
                        ? 'bg-amber-500 text-slate-950 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🏷️ ستیکەری سەر بۆکس
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('COMPACT_2')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      viewMode === 'COMPACT_2' 
                        ? 'bg-amber-500 text-slate-950 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🗂️ دوو ستیکەر (٢ لە ١)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('LIST')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      viewMode === 'LIST' 
                        ? 'bg-amber-500 text-slate-950 shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    📋 خشتەی ناوی دۆسیەکان
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">گەڕانی خێرا:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ژمارە یان ناو..."
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Main Printable Content Container ── */}
        <div id="printable-box-area" className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-100/50 dark:bg-slate-900/50">
          
          {/* ══════════════════════════════════════════════════════════════
              MANUAL CUSTOM PRINT VIEW (خۆم بینووسم)
              ══════════════════════════════════════════════════════════════ */}
          {sourceMode === 'MANUAL' ? (
            <div className="page-break-box bg-white text-slate-900 p-8 sm:p-12 rounded-3xl border-4 border-slate-900 shadow-2xl space-y-8 max-w-4xl mx-auto font-kurdish text-center animate-fadeIn print:border-4 print:shadow-none print:m-0">
              
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={runakiLogo} 
                    alt="ڕووناکی" 
                    className="h-14 sm:h-16 w-auto object-contain shrink-0" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-700">حکومەتی هەرێمی کوردستان - وەزارەتی کارەبا | پڕۆژەی ڕووناکی</div>
                    <div className="text-base sm:text-lg font-black text-slate-950">{directorateTitle} - فرۆشیاری وزە ٢</div>
                    <div className="text-xs font-bold text-amber-800 bg-amber-100 inline-block px-2.5 py-0.5 rounded-md border border-amber-300 mt-1">
                      {customRoomNote}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-sm rounded-xl border border-amber-600 shrink-0">
                  ئەرشیفی فەرمی دۆسیەکان
                </div>
              </div>

              {/* Giant Box Number */}
              <div className="space-y-2 py-4">
                <div className="text-sm font-black text-amber-900 tracking-wider">سندوقی ئەرشیفی سەرەکی دۆسیەکانی هاوبەشان (ژووری ١٩)</div>
                <div className="text-6xl sm:text-8xl font-black font-mono text-slate-950 leading-tight">
                  بۆکسی ژمارە {customBoxNumber || '1'}
                </div>
              </div>

              {/* Big File Range Hero Box */}
              <div className="p-8 sm:p-12 rounded-3xl bg-amber-50/80 border-4 border-slate-900 max-w-2xl mx-auto space-y-3">
                <div className="text-sm sm:text-base font-bold text-slate-700">مەودای ژمارەی فایلەکانی ناو ئەم بۆکسە:</div>
                
                <div className="text-4xl sm:text-6xl font-black font-mono text-slate-950 tracking-wider py-1">
                  دۆسیەی (#{customStartFile || '1'}) تا (#{customEndFile || '150'})
                </div>

                <div className="text-base sm:text-lg font-black text-amber-900 pt-2 border-t border-amber-200">
                  کۆی گشتی: <span className="font-mono text-2xl">{customTotalCount || '150'}</span> دۆسیە
                </div>
              </div>

              {/* Location Note */}
              <div className="border-2 border-dashed border-slate-400 rounded-2xl p-5 max-w-xl mx-auto text-xs text-slate-700 space-y-1 bg-slate-50">
                <div>شوێنی هەڵگرتن: <strong>{customLocationNote}</strong></div>
                <div>تکایە ئەم ستیکەرە لەسەر ڕووی سەرەوە یان پێشەوەی کارتۆنەکە بلکێندرێت.</div>
              </div>

              {/* Footer Stamp / Date */}
              <div className="pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <div>
                  بەرواری چاپکردن: <span className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString('en-CA')}</span>
                </div>
                <div className="text-center font-bold text-slate-800">
                  پڕۆژەی نیشتمانیی ڕووناکی | فرۆشیاری وزە ٢
                </div>
                <div className="flex items-center gap-2">
                  <span>مۆر و واژۆی فەرمانبەری ئەرشیف:</span>
                  <div className="w-28 h-10 border border-slate-400 rounded-lg bg-slate-50"></div>
                </div>
              </div>

            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════
                AUTO MODE (خۆکار لە داتابەیس)
                ══════════════════════════════════════════════════════════════ */
            displayedBoxes.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <div className="text-base font-bold">هیچ دۆسیەیەک نەدۆزرایەوە بەپێی ئەم فلتەرە!</div>
                <p className="text-xs">تکایە ژمارەی دەستپێکردن یان فلتەرەکان ڕێکبخەوە.</p>
              </div>
            ) : viewMode === 'COMPACT_2' ? (
              <div className="space-y-8">
                {Array.from({ length: Math.ceil(displayedBoxes.length / 2) }).map((_, pageIdx) => {
                  const pair = displayedBoxes.slice(pageIdx * 2, pageIdx * 2 + 2);
                  return (
                    <div key={pageIdx} className="page-break-box space-y-6 bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-xl max-w-5xl mx-auto">
                      {pair.map((box) => (
                        <div key={box.boxNumber} className="border-4 border-slate-900 rounded-2xl p-5 bg-white text-slate-900 space-y-4">
                          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                            <div className="flex items-center gap-3">
                              <img src={runakiLogo} alt="ڕووناکی" className="h-10 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                              <div>
                                <div className="text-[10px] font-black text-slate-700">وەزارەتی کارەبا | پڕۆژەی ڕووناکی - فرۆشیاری وزە ٢</div>
                                <div className="text-xs font-black text-slate-950">ئەرشیفی دۆسیەی هاوبەشان (ژووری ١٩)</div>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-sm rounded-xl border border-amber-600">
                              بۆکسی #{box.boxNumber}
                            </div>
                          </div>

                          <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-3 text-center">
                            <div className="text-xs font-bold text-slate-600">مەودای ژمارەی دۆسیەکانی ناو ئەم کارتۆنە:</div>
                            <div className="text-2xl font-black font-mono text-slate-950 my-0.5">
                              {box.fileRange}
                            </div>
                            <div className="text-xs font-bold text-amber-900">
                              کۆی گشتی: <span className="font-mono font-black">{box.count}</span> دۆسیە
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                            <span>شوێن: سندوق و بۆکسی ژمارە {box.boxNumber} (ژووری ١٩)</span>
                            <span>بەروار: {new Date().toLocaleDateString('en-CA')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              displayedBoxes.map((box, bIndex) => (
                <div 
                  key={box.boxNumber} 
                  className={`page-break-box bg-white text-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-slate-300 shadow-xl space-y-6 max-w-5xl mx-auto font-kurdish transition-all print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-4 ${
                    bIndex < displayedBoxes.length - 1 ? 'mb-8' : ''
                  }`}
                >
                  
                  {/* Header */}
                  <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
                    <div className="flex items-center gap-3">
                      <img 
                        src={runakiLogo} 
                        alt="ڕووناکی" 
                        className="h-14 sm:h-16 w-auto object-contain shrink-0" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <div className="text-xs font-black text-slate-700">حکومەتی هەرێمی کوردستان - وەزارەتی کارەبا | پڕۆژەی ڕووناکی</div>
                        <div className="text-base sm:text-lg font-black text-slate-950">{directorateTitle} - فرۆشیاری وزە ٢</div>
                        <div className="text-xs font-bold text-amber-800 bg-amber-100 inline-block px-2.5 py-0.5 rounded-md border border-amber-300 mt-1">
                          ژووری ١٩ (بەشی ئەرشیف و وەرگرتنەوەی دۆسیەی هاوبەشان)
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-600 text-center shrink-0 min-w-[170px]">
                      <div className="text-xs font-black text-amber-950">ئەرشیفی فەرمی دۆسیەکان</div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-slate-950 leading-tight">
                        بۆکسی #{box.boxNumber}
                      </div>
                      <div className="text-[11px] font-bold text-amber-900 mt-0.5">
                        {box.count} دۆسیە
                      </div>
                    </div>
                  </div>

                  {/* Mode 1: LIST Table */}
                  {viewMode === 'LIST' ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-4 text-center sm:text-right print:border-slate-800">
                        <div className="text-xs font-bold text-slate-600">مەودای ژمارەی دۆسیەکانی ناو ئەم بۆکسە:</div>
                        <div className="text-2xl font-black font-mono text-slate-950 tracking-wider my-1">
                          {box.fileRange}
                        </div>
                        <div className="text-xs text-slate-600">
                          شوێنی هەڵگرتن: <span className="font-bold text-slate-900">سندوق و بۆکسی ژمارە {box.boxNumber} (ژووری ١٩)</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto border-2 border-slate-900 rounded-xl print:border-none print:rounded-none">
                        <table className="w-full text-right text-xs border-collapse print:border print:border-slate-400">
                          <thead>
                            <tr className="bg-slate-900 text-white font-black text-[11px] divide-x divide-slate-700 print:divide-slate-700">
                              <th className="p-2 text-center w-10">#</th>
                              <th className="p-2 text-center w-24">ژمارەی فایل</th>
                              <th className="p-2 text-right">ناوی هاووڵاتی</th>
                              <th className="p-2 text-center w-28">ژمارەی ئەژمار (ID)</th>
                              <th className="p-2 text-center w-24">جۆری دۆسیە</th>
                              <th className="p-2 text-center w-24">دۆخی فایل (چێک ✓)</th>
                              <th className="p-2 text-center w-32">مۆبایل / وەرگر</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {box.records.map((r, rIdx) => {
                              const isYellow = r.fileType === 'YELLOW_FOLDER';
                              const isDone = r.status === 'COMPLETED' || r.status === 'DELIVERED';
                              return (
                                <tr 
                                  key={r.id || rIdx} 
                                  className={`text-slate-900 ${
                                    rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                  } hover:bg-amber-50/50`}
                                >
                                  <td className="p-1.5 text-center font-mono text-[10px] text-slate-400 font-bold">
                                    {rIdx + 1}
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <span className="font-mono font-black text-xs px-1.5 py-0.5 bg-amber-100 rounded border border-amber-300 text-slate-950">
                                      {r.fileNumber}
                                    </span>
                                  </td>
                                  <td className="p-1.5 text-right font-bold text-xs truncate max-w-[170px]">
                                    {r.citizenName && r.citizenName !== 'هاوبەشی کارەبا' ? r.citizenName : <span className="text-slate-400 italic font-normal">هاوبەشی کارەبا</span>}
                                  </td>
                                  <td className="p-1.5 text-center font-mono text-xs font-semibold">
                                    {r.accountNumber && r.accountNumber !== 'نیە' ? r.accountNumber : '-'}
                                  </td>
                                  <td className="p-1.5 text-center text-[11px] font-bold">
                                    {isYellow ? (
                                      <span className="text-amber-900">📁 فایلی زەرد</span>
                                    ) : (
                                      <span className="text-slate-700">📄 ئەوراق</span>
                                    )}
                                  </td>
                                  <td className="p-1.5 text-center">
                                    <div className="flex items-center justify-center">
                                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shadow-xs transition-colors ${
                                        isDone
                                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 print:border-slate-950 print:text-slate-950'
                                          : 'border-slate-400 bg-white text-transparent'
                                      }`}>
                                        {isDone && (
                                          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-1.5 text-center font-mono text-[11px] text-slate-700 truncate max-w-[130px]">
                                    {r.receiverName || r.phoneNumber || '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: Giant Box Cover Sticker Label */
                    <div className="border-4 border-slate-900 rounded-3xl p-8 sm:p-12 bg-white space-y-8 text-center">
                      <div className="space-y-2">
                        <div className="text-sm font-black text-amber-900 tracking-wider">سندوقی ئەرشیفی سەرەکی دۆسیەکانی هاوبەشان (ژووری ١٩)</div>
                        <div className="text-5xl sm:text-7xl font-black font-mono text-slate-950 leading-tight">
                          بۆکسی ژمارە {box.boxNumber}
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 border-4 border-slate-900 max-w-2xl mx-auto space-y-2">
                        <div className="text-sm font-bold text-slate-700">مەودای ژمارەی فایلەکانی ناو ئەم بۆکسە:</div>
                        <div className="text-3xl sm:text-5xl font-black font-mono text-slate-950 tracking-wider">
                          {box.fileRange}
                        </div>
                        <div className="text-sm font-black text-amber-900 pt-1">
                          کۆی گشتی: <span className="font-mono text-lg">{box.count}</span> دۆسیە
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 max-w-xl mx-auto text-xs text-slate-600 space-y-1">
                        <div>شوێنی هەڵگرتن: <strong>سندوق و کارتۆنی ژمارە {box.boxNumber}</strong> لە ئەرشیفی ژووری ١٩</div>
                        <div>تکایە ئەم ستیکەرە لەسەر ڕووی سەرەوە یان پێشەوەی کارتۆنەکە بلکێندرێت.</div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                    <div>
                      بەرواری ئامادەکردن: <span className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString('en-CA')}</span>
                    </div>
                    <div className="text-center font-bold text-slate-800">
                      بەڕێوەبەرایەتی گشتی دابەشکردنی کارەبا | ژووری ١٩
                    </div>
                    <div className="flex items-center gap-2">
                      <span>مۆر و واژۆی فەرمانبەری ئەرشیف:</span>
                      <div className="w-24 h-10 border border-slate-300 rounded-lg bg-slate-50"></div>
                    </div>
                  </div>

                </div>
              ))
            )
          )}

        </div>

      </div>
    </div>
  );
}
