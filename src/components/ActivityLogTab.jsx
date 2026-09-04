import React, { useState, useEffect } from 'react';
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
  RefreshCw
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

  useEffect(() => {
    const unsub = subscribeToActivityLogs((cloudLogs) => {
      setLogs(cloudLogs || []);
    });
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (typeFilter !== 'ALL' && log.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const titleMatch = String(log.title || '').toLowerCase().includes(q);
      const userMatch = String(log.user || '').toLowerCase().includes(q);
      const detailsMatch = JSON.stringify(log.details || '').toLowerCase().includes(q);
      return titleMatch || userMatch || detailsMatch;
    }
    return true;
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'DELIVERY':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'STATUS_CHANGE':
        return <Zap className="w-4 h-4 text-emerald-500" />;
      case 'CREATE':
        return <PlusCircle className="w-4 h-4 text-amber-500" />;
      case 'EXCEL_IMPORT':
        return <UploadCloud className="w-4 h-4 text-purple-500" />;
      case 'WHATSAPP_BROADCAST':
        return <Send className="w-4 h-4 text-emerald-500" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLogBadge = (type) => {
    switch (type) {
      case 'DELIVERY':
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300';
      case 'STATUS_CHANGE':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300';
      case 'CREATE':
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300';
      case 'EXCEL_IMPORT':
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300';
      case 'WHATSAPP_BROADCAST':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300';
      case 'DELETE':
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300';
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
            چاودێریکردنی مێژووی دەستکاری دۆسیەکان، تەسلیمکردنەوەکان، ناردنی نامە، و هاوردەی ئێکسڵ بە کات و خولەک
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
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
            placeholder="گەڕان لە لۆگەکان (ناو، فایل، کردار)..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter by Type */}
        <div className="w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">گشت جۆرەکانی چالاکی ({logs.length})</option>
            <option value="DELIVERY">تەسلیمکردنەوەکان (Delivered)</option>
            <option value="STATUS_CHANGE">گۆڕینی دۆخ (Status Changes)</option>
            <option value="CREATE">تۆمارکردنی فایل (Intake)</option>
            <option value="WHATSAPP_BROADCAST">ناردنی واتسئاپ (WhatsApp)</option>
            <option value="EXCEL_IMPORT">ئەپڵۆدی ئێکسڵ (Excel Import)</option>
            <option value="DELETE">سڕینەوەکان (Deletions)</option>
          </select>
        </div>

      </div>

      {/* Logs Timeline List */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-blue-400 dark:hover:border-blue-500/40"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${getLogBadge(log.type)}`}>
                      {log.type}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {log.title}
                    </h4>
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                      {log.details.fileNumber && <span>فایلی: <strong>{log.details.fileNumber}</strong></span>}
                      {log.details.citizenName && <span>هاووڵاتی: <strong>{log.details.citizenName}</strong></span>}
                      {log.details.count && <span>ژمارە: <strong>{log.details.count}</strong></span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatLogTimestamp(log.timestamp)}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans font-bold">
                  {log.user || 'کارمەند'}
                </span>
              </div>
            </div>
          ))}
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
