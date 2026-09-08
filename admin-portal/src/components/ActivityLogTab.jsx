import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle2, 
  Trash2, 
  Send, 
  UploadCloud, 
  PlusCircle, 
  Zap, 
  Calendar,
  Download,
  AlertTriangle,
  User,
  RefreshCw,
  Edit3,
  Layers,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react';
import { subscribeToActivityLogs } from '../utils/cloudSync';
import { exportToExcel } from '../utils/excelHelper';

function formatLogTimestamp(ts) {
  if (!ts) return '';
  try {
    if (typeof ts === 'string' && (ts.endsWith('Z') || ts.includes('T'))) {
      const d = new Date(ts);
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Baghdad',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(d).replace(',', '');
    }
    return String(ts);
  } catch (e) {
    return String(ts);
  }
}

export default function ActivityLogTab() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  useEffect(() => {
    const unsub = subscribeToActivityLogs((cloudLogs) => {
      setLogs(cloudLogs || []);
    });
    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'INTAKE' && log.type !== 'CREATE' && log.type !== 'ADD_RECORD') return false;
        else if (typeFilter === 'EDIT' && log.type !== 'EDIT_RECORD') return false;
        else if (typeFilter === 'DELETE' && log.type !== 'DELETE' && log.type !== 'DELETE_RECORD' && log.type !== 'BATCH_DELETE') return false;
        else if (typeFilter === 'BATCH' && log.type !== 'BATCH_STATUS' && log.type !== 'BATCH_DELETE') return false;
        else if (typeFilter !== 'INTAKE' && typeFilter !== 'EDIT' && typeFilter !== 'DELETE' && typeFilter !== 'BATCH' && log.type !== typeFilter) return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const titleMatch = String(log.title || '').toLowerCase().includes(q);
        const userMatch = String(log.user || '').toLowerCase().includes(q);
        const detailsMatch = JSON.stringify(log.details || '').toLowerCase().includes(q);
        return titleMatch || userMatch || detailsMatch;
      }
      return true;
    });
  }, [logs, typeFilter, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, pageSize]);

  const handleExportLogs = () => {
    if (!filteredLogs.length) return;
    const exportData = filteredLogs.map((l, index) => ({
      'ڕیزبەندی': index + 1,
      'جۆری کردار': l.type,
      'ناونیشانی کردار': l.title,
      'ئەنجامدەر': l.user || 'نەزانراو',
      'کات و بەروار': formatLogTimestamp(l.timestamp),
      'وردەکاری': JSON.stringify(l.details || {})
    }));
    exportToExcel(exportData, `Audit_Logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'DELIVERY':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'STATUS_CHANGE':
        return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'CREATE':
      case 'ADD_RECORD':
        return <PlusCircle className="w-4 h-4 text-amber-500" />;
      case 'EDIT_RECORD':
        return <Edit3 className="w-4 h-4 text-cyan-500" />;
      case 'EXCEL_IMPORT':
        return <UploadCloud className="w-4 h-4 text-purple-500" />;
      case 'WHATSAPP_BROADCAST':
        return <Send className="w-4 h-4 text-emerald-500" />;
      case 'DELETE':
      case 'DELETE_RECORD':
      case 'BATCH_DELETE':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'BATCH_STATUS':
        return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'SYSTEM_RESTORE':
        return <RefreshCw className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLogBadge = (type) => {
    switch (type) {
      case 'DELIVERY':
        return { label: 'تەسلیمکردنەوە', style: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300' };
      case 'STATUS_CHANGE':
        return { label: 'گۆڕینی دۆخ', style: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300' };
      case 'CREATE':
      case 'ADD_RECORD':
        return { label: 'فایلی نوێ', style: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300' };
      case 'EDIT_RECORD':
        return { label: 'دەستکاری', style: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300' };
      case 'EXCEL_IMPORT':
        return { label: 'هاوردەی ئێکسڵ', style: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300' };
      case 'WHATSAPP_BROADCAST':
        return { label: 'واتسئاپ', style: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300' };
      case 'DELETE':
      case 'DELETE_RECORD':
      case 'BATCH_DELETE':
        return { label: 'سڕینەوە', style: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300' };
      case 'BATCH_STATUS':
        return { label: 'گۆڕینی بەکۆمەڵ', style: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300' };
      case 'SYSTEM_RESTORE':
        return { label: 'گەڕاندنەوەی کلاود', style: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300' };
      default:
        return { label: type || 'چالاکی', style: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300' };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-blue-50 dark:bg-gradient-to-r dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 border border-blue-200 dark:border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-300 text-xs font-bold border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>سیستەمی چاودێری و لۆگی چالاکییەکان</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            تۆماری تەواوی کرداری کارمەندان (Audit Logs)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            چاودێریکردنی وردی هەموو دەستکارییەک، تۆمارکردنی فایل، تەسلیمکردنەوەکان، ناردنی نامە، و هاوردەی ئێکسڵ بە کات و چرکە
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>هەناردەی ئێکسڵ ({filteredLogs.length})</span>
          </button>
          <span className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
            کۆی تۆمارەکان: {logs.length}
          </span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان لە لۆگەکان (ناو، ژمارەی فایل، کارمەند)..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter by Type & Per Page */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">گشت جۆرەکانی چالاکی ({logs.length})</option>
            <option value="DELIVERY">تەسلیمکردنەوەکان (Delivered)</option>
            <option value="STATUS_CHANGE">گۆڕینی دۆخ (Status Changes)</option>
            <option value="INTAKE">تۆمارکردنی فایلی نوێ (Add Records)</option>
            <option value="EDIT">دەستکاریکردنی فایل (Edits)</option>
            <option value="WHATSAPP_BROADCAST">ناردنی واتسئاپ (WhatsApp)</option>
            <option value="EXCEL_IMPORT">ئەپڵۆدی ئێکسڵ (Excel Import)</option>
            <option value="BATCH">کرداری بەکۆمەڵ (Batch Actions)</option>
            <option value="DELETE">سڕینەوەکان (Deletions)</option>
            <option value="SYSTEM_RESTORE">گەڕاندنەوەی سیستم (System Restore)</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value={20}>20 دێڕ</option>
            <option value={30}>30 دێڕ</option>
            <option value={50}>50 دێڕ</option>
            <option value={100}>100 دێڕ</option>
          </select>
        </div>

      </div>

      {/* Logs Timeline List */}
      {paginatedLogs.length > 0 ? (
        <div className="space-y-3">
          {paginatedLogs.map((log) => {
            const badge = getLogBadge(log.type);
            return (
              <div 
                key={log.id} 
                className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-blue-400 dark:hover:border-blue-500/40"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${badge.style}`}>
                        {badge.label}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {log.title}
                      </h4>
                    </div>
                    {log.details && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2.5 flex-wrap pt-0.5">
                        {log.details.fileNumber && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                            #{log.details.fileNumber}
                          </span>
                        )}
                        {log.details.citizenName && (
                          <span>هاووڵاتی: <strong className="text-slate-800 dark:text-slate-200">{log.details.citizenName}</strong></span>
                        )}
                        {log.details.receiverName && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            وەرگر: <strong>{log.details.receiverName}</strong>
                          </span>
                        )}
                        {log.details.accountNumber && (
                          <span>ئەژمار: <strong>{log.details.accountNumber}</strong></span>
                        )}
                        {log.details.phoneNumber && log.details.phoneNumber !== 'نیە' && (
                          <span>مۆبایل: <strong>{log.details.phoneNumber}</strong></span>
                        )}
                        {log.details.count && (
                          <span>ژمارەی فایل: <strong>{log.details.count}</strong></span>
                        )}
                        {log.details.date && (
                          <span>بەروار: <strong>{log.details.date}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatLogTimestamp(log.timestamp)}</span>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-sans font-bold">
                    {log.user || 'کارمەند'}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                پیشاندانی <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> تا <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, filteredLogs.length)}</span> لە کۆی <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span> چالاکی
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300 font-mono">
                  پەڕەی {currentPage} لە {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">هیچ لۆگێک نەدۆزرایەوە</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">چالاکییەکان لەگەڵ ئەنجامدانی کردارەکان بە خۆکاری لێرە تۆمار دەبن.</p>
        </div>
      )}

    </div>
  );
}
