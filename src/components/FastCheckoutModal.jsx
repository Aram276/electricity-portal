import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  CheckCircle2, 
  X, 
  User, 
  Folder, 
  Hash, 
  Phone, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Numerals converter
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

export default function FastCheckoutModal({ isOpen, onClose, records = [], onDeliverRecord }) {
  const [query, setQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const queryInputRef = useRef(null);
  const receiverInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedRecord(null);
      setReceiverName('');
      setReceiverPhone('');
      setSuccessMessage(null);
      setErrorMsg(null);
      setTimeout(() => queryInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Search logic for instant matching
  const handleQueryChange = (val) => {
    setQuery(val);
    setErrorMsg(null);
    const cleanQ = toLatinDigits(val).trim().toLowerCase();

    if (!cleanQ) {
      setSelectedRecord(null);
      return;
    }

    // Exact or close match by fileNumber, accountNumber, or phoneNumber
    const match = records.find(r => {
      const fNum = toLatinDigits(String(r.fileNumber || '')).trim().toLowerCase();
      const acc = toLatinDigits(String(r.accountNumber || '')).trim();
      const phone = toLatinDigits(String(r.phoneNumber || '')).replace(/[^0-9]/g, '');

      return fNum === cleanQ || acc === cleanQ || (phone && phone === cleanQ.replace(/[^0-9]/g, ''));
    });

    if (match) {
      setSelectedRecord(match);
      setReceiverName(match.citizenName !== 'هاوبەشی کارەبا' ? match.citizenName : '');
      setReceiverPhone(match.phoneNumber !== 'نیە' ? match.phoneNumber : '');
    } else {
      setSelectedRecord(null);
    }
  };

  const handleConfirmDelivery = (e) => {
    e?.preventDefault();
    if (!selectedRecord) {
      setErrorMsg('تکایە سەرەتا ژمارەی فایل یان ئەژماری هاووڵاتی بنووسە');
      return;
    }

    const finalReceiver = receiverName.trim() || selectedRecord.citizenName || 'هاوبەشی کارەبا';
    const nowTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const activeStaff = JSON.parse(localStorage.getItem('electricity_active_staff') || 'null');
    const staffName = activeStaff?.name ? `${activeStaff.name}` : 'کارمەندی ژووری ١٩';

    onDeliverRecord(selectedRecord.id, {
      status: 'DELIVERED',
      deliveredDate: nowTime,
      receiverName: finalReceiver,
      handledBy: staffName,
      deliveredBy: staffName
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    setSuccessMessage(`دۆسیەی ژمارە (${selectedRecord.fileNumber}) بە ناوی [${finalReceiver}] بە فەرمی تەسلیم کرایەوە! ✅`);
    
    // Reset for next citizen in line
    setTimeout(() => {
      setQuery('');
      setSelectedRecord(null);
      setReceiverName('');
      setReceiverPhone('');
      setSuccessMessage(null);
      queryInputRef.current?.focus();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/50 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">تەسلیمکردنەوەی خێرا (Fast Checkout)</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  ژووری ١٩
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">تەسلیمکردنەوەی دۆسیەی هاووڵاتییان بە تەنها ١ چرکە لە کاتی قەرەباڵغیدا</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Step 1: Search File / ID */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>ژمارەی فایل یان ژمارەی ئەژمار (ID) بنووسە:</span>
            <span className="text-slate-400 text-[11px]">بە نووسین دەستبەجێ دەیدۆزێتەوە</span>
          </label>
          <div className="relative">
            <input
              ref={queryInputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && selectedRecord) {
                  receiverInputRef.current?.focus();
                }
              }}
              placeholder="نموونە: 841 یان 63450291130"
              className="w-full pr-11 pl-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base font-bold focus:border-amber-500 focus:outline-none transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {errorMsg && (
            <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {errorMsg}
            </p>
          )}
        </div>

        {/* Step 2: Found Citizen Preview Card */}
        {selectedRecord ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/80 dark:bg-gradient-to-br dark:from-amber-500/10 dark:to-slate-950 border-2 border-amber-500/40 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center font-mono text-lg shadow-md">
                  {selectedRecord.fileNumber}
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white text-base">
                    {selectedRecord.citizenName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: {selectedRecord.accountNumber || 'نیە'}
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl text-xs font-black border bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/30">
                {selectedRecord.fileType === 'YELLOW_FOLDER' ? '📁 فایلی زەرد' : '📄 ئەوراق'}
              </span>
            </div>

            {/* Current Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">دۆخی ئێستا:</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                selectedRecord.status === 'DELIVERED'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                  : (selectedRecord.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300')
              }`}>
                {selectedRecord.status === 'DELIVERED' ? '📦 پێشتر تەسلیم کراوە' : (selectedRecord.status === 'COMPLETED' ? '✅ تەواوبووە (Done)' : '⏳ پێنەدراوەتەوە')}
              </span>
            </div>

            {/* Receiver Input */}
            <form onSubmit={handleConfirmDelivery} className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ناوی کەسی وەرگرەوە:
                </label>
                <input
                  ref={receiverInputRef}
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="ناوی وەرگرەوە (خۆی یان کەسی تر)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>تەسلیمی بکە (Confirm & Checkout ➔)</span>
              </button>
            </form>
          </div>
        ) : query ? (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">هیچ دۆسیەیەک نەدۆزرایەوە بە ژمارەی: "{query}"</p>
            <p className="text-[11px] text-slate-400">دڵنیابەرەوە لە دروستی ژمارەی فایل یان ژمارەی ئەژمار</p>
          </div>
        ) : null}

        {/* Bottom Quick Help */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>کلیلەکانی کیبۆرد: <strong>Enter</strong> بۆ پەسەندکردن</span>
          <span><strong>Esc</strong> بۆ داخستن</span>
        </div>

      </div>
    </div>
  );
}
