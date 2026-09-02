import React from 'react';
import { X, Printer, Zap, CheckCircle2, Building2, User, Hash, Phone, Calendar, Archive } from 'lucide-react';
import { STATUS_CONFIG } from '../constants/status';
import RoonakiLogo from './RoonakiLogo';
import runakiLogo from '../assets/runaki-logo.png';

export default function PrintReceiptModal({ record, isOpen, onClose }) {
  if (!isOpen || !record) return null;

  const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto">
        
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 no-print">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Printer className="w-5 h-5 text-amber-400" />
            <span>پێشبینینی کارتی سەردان بۆ پرێنت</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>پرێنت بکە (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div id="printable-receipt" className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-dashed border-slate-300 space-y-6 font-kurdish">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="flex justify-center mb-1">
              <img src={runakiLogo} alt="ڕووناکی" className="h-14 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div className="text-xs font-bold text-slate-600">حکومەتی هەرێمی کوردستان - وەزارەتی کارەبا | پڕۆژەی ڕووناکی</div>
            <div className="text-lg font-black text-slate-900">{record.department || 'بەڕێوەبەرایەتی دابەشکردنی کارەبا'}</div>
            <div className="text-xs font-bold text-amber-800 bg-amber-100 inline-block px-3 py-0.5 rounded-full border border-amber-300 mt-1">
              کارتی سەردانی هاووڵاتی بۆ وەرگرتنەوەی دۆسیە
            </div>
          </div>

          {/* Core Highlight: File Number */}
          <div className="bg-slate-50 border-2 border-slate-800 rounded-xl p-4 text-center space-y-2">
            <div className="text-xs font-bold text-slate-600">ژمارەی تایبەتی فایل لە ئەرشیف (ئەم ژمارەیە بدە بە فەرمانبەر):</div>
            <div className="text-3xl font-black font-mono text-slate-950 tracking-wider">
              {record.fileNumber}
            </div>
            <div className="text-xs font-semibold text-slate-700">
              شوێنی فایل: {record.archiveLocation || 'ئەرشیفی سەرەکی'}
            </div>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-3 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div>
              <span className="text-slate-500 block">ناوی هاووڵاتی:</span>
              <span className="font-bold text-slate-900 text-sm">{record.citizenName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ژمارەی ئەژمار (Account):</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{record.accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ژمارەی مۆبایل:</span>
              <span className="font-mono text-slate-800">{record.phoneNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">جۆری مامەڵە:</span>
              <span className="font-semibold text-slate-800">{record.transactionType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">بەرواری پێشکەشکردن:</span>
              <span className="font-mono text-slate-800">{record.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">جۆری دۆسیە (شێوازی پاراستن):</span>
              <span className="font-bold text-amber-900">
                {record.fileType === 'YELLOW_FOLDER' ? '📁 فایلی زەرد' : '📄 ئەوراق'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">دۆخی تەواوبوون:</span>
              <span className="font-bold text-emerald-700">{status.shortLabel}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-[11px] text-slate-600 space-y-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="font-bold text-amber-900">تێبینییە گرنگەکان بۆ سەردانیکردن:</div>
            <div>• لە کاتی سەردانیکردنی بەڕێوەبەرایەتی کارەبا، تکایە ئەم کارتە یاخود ژمارەی فایلەکەت بە فەرمانبەری ئەرشیف بدە.</div>
            <div>• کارتی نیشتمانی یان پێناسی باری شارستانی هاووڵاتی پێویستە بۆ وەرگرتنەوەی دۆسیەی ئەسڵی.</div>
          </div>

          {/* Stamp and Date Footer */}
          <div className="flex justify-between items-end pt-2 text-[11px] text-slate-500 border-t border-slate-200">
            <div>
              بەرواری دەرچوونی کارت: {new Date().toLocaleDateString('en-CA')}
            </div>
            <div className="text-center">
              <div className="w-24 h-12 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                مۆری بەڕێوەبەرایەتی
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
