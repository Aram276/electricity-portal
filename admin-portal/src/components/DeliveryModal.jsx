import React, { useState, useEffect } from 'react';
import { PackageCheck, X, Calendar, User, FileText, CheckCircle2, ShieldCheck, Shield, ShieldAlert, CreditCard } from 'lucide-react';
import { KYC_CONFIG, getRecordKYC } from '../constants/status';

export default function DeliveryModal({ record, isOpen, onClose, onConfirm }) {
  const [receiverName, setReceiverName] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [note, setNote] = useState('');
  const [kycStatus, setKycStatus] = useState('DONE_BY_US');
  const [nationalId, setNationalId] = useState('');

  const prevKyc = record ? getRecordKYC(record) : 'PENDING';

  useEffect(() => {
    if (record) {
      setReceiverName(record.citizenName && record.citizenName !== 'هاوبەشی کارەبا' ? record.citizenName : '');
      const now = new Date();
      const formatted = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
      setDeliveryDateTime(formatted);
      setNote('');
      // If was already pre-verified keep it, otherwise default to DONE_BY_US since we are delivering it now
      setKycStatus(prevKyc === 'PRE_VERIFIED' ? 'PRE_VERIFIED' : 'DONE_BY_US');
      setNationalId(record.nationalId || '');
    }
  }, [record, prevKyc]);

  // Handle ESC key to exit modal smoothly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const isDone = kycStatus === 'DONE_BY_US' || kycStatus === 'PRE_VERIFIED';
    onConfirm(
      record.id, 
      receiverName, 
      deliveryDateTime, 
      note,
      isDone,
      nationalId.trim()
    );
  };

  const isYellowFolder = record.fileType === 'YELLOW_FOLDER';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[94vh] overflow-y-auto transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                تەسلیمکردنەوەی {isYellowFolder ? 'فایلی زەرد' : 'ئەوراق'} بە هاوبەش
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">تۆمارکردنی بەروار و کاتی دەرچوونی فایل و پشکنینی KYC</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="داخستن (Esc)"
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Overview Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>ژمارەی فایل:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-base">#{record.fileNumber}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                {isYellowFolder ? '📁 فایلی زەرد' : '📄 ئەوراق'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>ناوی خاوەن مامەڵە:</span>
            <span className="font-bold text-slate-900 dark:text-white">{record.citizenName}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>ژمارەی ئەژمار (ID):</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">{record.accountNumber || 'نیە'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>شوێنی سندوق لە ئەرشیف:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{record.archiveLocation || 'ئەرشیفی سەرەکی'}</span>
          </div>
        </div>

        {/* ── KYC SELECTION BOX (3 CHOICES) ── */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  دۆخی ناسینەوەی هاوبەش (KYC Status)
                </h4>
                {prevKyc === 'DONE_BY_US' ? (
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🟢 پێشتر کرا
                  </span>
                ) : prevKyc === 'PRE_VERIFIED' ? (
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    🔵 پێشتر کراوە (دەرەکی)
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    🟡 پێشتر نەکراوە
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                لە کاتی دانەوە، تکایە دۆخی KYC دیاری بکە:
              </p>
            </div>
          </div>

          {/* 3 Selectable Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setKycStatus('DONE_BY_US')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                kycStatus === 'DONE_BY_US'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md font-black ring-2 ring-emerald-500/40'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              🟢 ئێمە کردمان
            </button>

            <button
              type="button"
              onClick={() => setKycStatus('PRE_VERIFIED')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                kycStatus === 'PRE_VERIFIED'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md font-black ring-2 ring-sky-500/40'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              🔵 پێشتر کراوە
            </button>

            <button
              type="button"
              onClick={() => setKycStatus('PENDING')}
              className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                kycStatus === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black ring-2 ring-amber-500/40'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              🟡 نەکراوە
            </button>
          </div>

          {/* Optional National ID field */}
          <div className="pt-2 border-t border-emerald-500/20">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ژمارەی کارتی نیشتمانی / ناسنامەی هاوبەش:</span>
            </label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="ژمارەی کارتی نیشتمانی (ئارەزوومەندانە)..."
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>ناوی کەسی وەرگرەوە:</span>
            </label>
            <input
              type="text"
              required
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="ناوی تەواوی ئەو کەسەی فایلەکەی وەرگرتەوە..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>بەروار و کاتی تەسلیمکردن:</span>
            </label>
            <input
              type="text"
              required
              value={deliveryDateTime}
              onChange={(e) => setDeliveryDateTime(e.target.value)}
              placeholder="YYYY-MM-DD HH:MM"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>تێبینی کاتی تەسلیمکردن (ئارەزوومەندانە):</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="وەسڵ درا، مۆر کرا، یاخود بریکارنامە هێنرا..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
            >
              پاشگەزبوونەوە (Esc)
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تەواو - تەسلیم کرا</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
