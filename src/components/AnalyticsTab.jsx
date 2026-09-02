import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Folder, 
  FileText, 
  Users, 
  PhoneCall, 
  ShieldCheck, 
  Calendar,
  AlertTriangle,
  Download,
  Printer
} from 'lucide-react';
import { exportToExcel } from '../utils/excelHelper';

export default function AnalyticsTab({ records = [] }) {
  const total = records.length;
  const completed = records.filter(r => r.status === 'COMPLETED').length;
  const inProgress = records.filter(r => r.status === 'IN_PROGRESS').length;
  const delivered = records.filter(r => r.status === 'DELIVERED').length;

  const yellowFolders = records.filter(r => r.fileType === 'YELLOW_FOLDER').length;
  const papers = records.filter(r => r.fileType === 'PAPER' || !r.fileType).length;

  const withPhone = records.filter(r => r.phoneNumber && r.phoneNumber !== 'نیە' && r.phoneNumber.trim() !== '').length;
  const missingPhone = total - withPhone;

  const withRealName = records.filter(r => r.citizenName && r.citizenName !== 'هاوبەشی کارەبا' && r.citizenName.trim() !== '').length;
  const genericName = total - withRealName;

  const todayStr = new Date().toISOString().slice(0, 10);
  const intakeToday = records.filter(r => r.submissionDate === todayStr).length;
  const deliveredToday = records.filter(r => r.deliveredDate && r.deliveredDate.startsWith(todayStr)).length;

  const completedPercent = total > 0 ? Math.round(((completed + delivered) / total) * 100) : 0;
  const yellowPercent = total > 0 ? Math.round((yellowFolders / total) * 100) : 0;
  const paperPercent = total > 0 ? (100 - yellowPercent) : 0;
  const phonePercent = total > 0 ? Math.round((withPhone / total) * 100) : 0;

  const handleExportReport = () => {
    exportToExcel(records, `Raporti_Roonaki_${todayStr}.xlsx`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
            <BarChart3 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>ناوەندی ئامار و شیکاری پڕۆژەی ڕووناکی</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ڕاپۆرتی گشتی کار و دۆسیەکانی کارەبا
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            شیکاری وردی کۆی مامەڵەکان، ڕێژەی تەواوبوون، و دابەشبوونی فایلی زەرد بەرامبەر ئەوراق
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto no-print">
          <button
            onClick={handleExportReport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>داگرتنی ئێکسڵ</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>پرێنت (Print)</span>
          </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Records */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">کۆی گشتی دۆسیەکان</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            {total}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">+{intakeToday}</span> تۆمارکراوی ئەمڕۆ
          </div>
        </div>

        {/* Completed & Delivered */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold">تەواوبوو / تەسلیمکراو</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {completed + delivered}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${completedPercent}%` }}></div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
            <span>ڕێژەی ئەنجامدان:</span>
            <strong className="text-emerald-600 font-mono">{completedPercent}%</strong>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-amber-500/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold">لە جێبەجێکردندایە</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
            {inProgress}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            لە ئەرشیف دەمێنێتەوە تا هاووڵاتی دێت
          </div>
        </div>

        {/* Delivered Count */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-blue-500/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold">تەسلیمی هاووڵاتی کرا</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
            {delivered}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            بە بەڵگەنامەی فەرمی دراوەتەوە
          </div>
        </div>

      </div>

      {/* Visual Distributions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Yellow Folders vs Papers Breakdown Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-amber-500" />
              <span>دابەشبوونی جۆری دۆسیەکان (فایلی زەرد بەرامبەر ئەوراق)</span>
            </h3>
          </div>

          <div className="space-y-4">
            {/* Combined Bar */}
            <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${yellowPercent}%` }} 
                className="bg-amber-400 dark:bg-amber-500 h-full transition-all duration-500"
                title={`فایلی زەرد: ${yellowFolders} (${yellowPercent}%)`}
              />
              <div 
                style={{ width: `${paperPercent}%` }} 
                className="bg-slate-700 dark:bg-slate-600 h-full transition-all duration-500"
                title={`ئەوراق: ${papers} (${paperPercent}%)`}
              />
            </div>

            {/* Legend Items */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">📁 فایلی زەرد (دۆسیەی ئەسڵی)</span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-950 dark:text-amber-200">{yellowFolders}</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400">{yellowPercent}% لە کۆی گشتی</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-slate-600 dark:bg-slate-400"></span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">📄 ئەوراق (کاغەزی سپی)</span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{papers}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">{paperPercent}% لە کۆی گشتی</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality & Hygiene Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>تەندروستی و تەواوکاری داتاکان (Data Quality)</span>
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Phone ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                  <span>دۆسیەکانی خاوەن ژمارەی مۆبایل:</span>
                </span>
                <span className="font-mono text-emerald-600">{withPhone} لە {total} ({phonePercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${phonePercent}%` }}></div>
              </div>
            </div>

            {/* Name ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>دۆسیەکانی خاوەن ناوی هاووڵاتی:</span>
                </span>
                <span className="font-mono text-blue-600">{withRealName} لە {total}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${total > 0 ? (withRealName / total) * 100 : 0}%` }}></div>
              </div>
            </div>

            {/* Quick action advice */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{missingPhone} دۆسیە ژمارەی مۆبایلیان نییە؛ دەتوانیت لە خشتەی سەرەکی بە فلتەری خێرا بێ مۆبایلەکان دەستکاری بکەیت.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
