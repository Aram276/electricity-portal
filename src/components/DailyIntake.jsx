import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Plus, 
  Save, 
  Clock, 
  Hash, 
  User, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  Trash2,
  Calendar,
  UserCheck,
  Edit,
  Folder,
  FileText,
  ShieldCheck,
  Shield,
  ShieldAlert,
  AlertTriangle,
  X
} from 'lucide-react';
import { STATUS_CONFIG, KYC_CONFIG, getRecordKYC } from '../constants/status';

export default function DailyIntake({ records = [], onSaveRecord, onDeleteRecord }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const accountInputRef = useRef(null);
  const [editingItem, setEditingItem] = useState(null); // { id, fields... }

  // Auto-calculate the next file number starting from 933 onwards (934, 935...)
  const nextFileNumber = useMemo(() => {
    const nums = (records || []).map(r => parseInt(r.fileNumber, 10)).filter(n => !isNaN(n) && n > 0);
    const maxNum = nums.length ? Math.max(933, ...nums) : 933;
    return String(maxNum + 1);
  }, [records]);

  const [formData, setFormData] = useState({
    fileNumber: nextFileNumber,
    fileType: 'YELLOW_FOLDER', // 'YELLOW_FOLDER' | 'PAPER'
    accountNumber: '',
    citizenName: '',
    phoneNumber: '',
    status: 'IN_PROGRESS', // 'Not Done'
    deliveredDate: '',
    receiverName: '',
    notes: '',
    kycStatus: 'PENDING', // 'DONE_BY_US' | 'PRE_VERIFIED' | 'PENDING'
    isKycDone: false
  });

  const [localSubmitted, setLocalSubmitted] = useState([]);

  // Sync initial fileNumber when records first load
  useEffect(() => {
    setFormData(prev => {
      if (!prev.fileNumber || prev.fileNumber === '934') {
        return { ...prev, fileNumber: nextFileNumber };
      }
      return prev;
    });
  }, [nextFileNumber]);

  // Intelligent Duplicate Detection & Previous File Lookup (Realtime)
  const duplicates = useMemo(() => {
    if (!records || !records.length) return [];
    const cleanAccount = (formData.accountNumber || '').trim();
    const cleanName = (formData.citizenName || '').trim().toLowerCase();
    const cleanPhone = (formData.phoneNumber || '').replace(/\D/g, '');

    if (!cleanAccount && !cleanName && !cleanPhone) return [];

    return records.filter(r => {
      const rAccount = (r.accountNumber || '').trim();
      const rName = (r.citizenName || '').trim().toLowerCase();
      const rPhone = (r.phoneNumber || '').replace(/\D/g, '');

      const isSameAccount = cleanAccount && cleanAccount.length >= 4 && cleanAccount === rAccount;
      const isSamePhone = cleanPhone && cleanPhone.length >= 8 && cleanPhone === rPhone;
      const isSameName = cleanName && cleanName !== 'هاوبەشی کارەبا' && cleanName.length >= 4 && (cleanName === rName || rName.includes(cleanName) || cleanName.includes(rName));

      return isSameAccount || isSamePhone || isSameName;
    }).slice(0, 2);
  }, [formData.accountNumber, formData.citizenName, formData.phoneNumber, records]);

  // Autofill form from previous matched file
  const handleAutofillFromDuplicate = (dup) => {
    const prevKyc = getRecordKYC(dup);
    setFormData(prev => ({
      ...prev,
      citizenName: (dup.citizenName && dup.citizenName !== 'هاوبەشی کارەبا') ? dup.citizenName : prev.citizenName,
      phoneNumber: (dup.phoneNumber && dup.phoneNumber !== 'نیە') ? dup.phoneNumber : prev.phoneNumber,
      accountNumber: (dup.accountNumber && dup.accountNumber !== 'نیە') ? dup.accountNumber : prev.accountNumber,
      kycStatus: prevKyc,
      isKycDone: prevKyc === 'DONE_BY_US' || prevKyc === 'PRE_VERIFIED'
    }));
  };

  // Combined list of records entered today
  const todayList = useMemo(() => {
    const fromRecords = (records || []).filter(r => r.submissionDate === todayStr);
    const map = new Map();
    // Add local ones first
    localSubmitted.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    // Add records from prop
    fromRecords.forEach(item => {
      if (item && item.id && !map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [records, localSubmitted, todayStr]);

  const handleEditSave = () => {
    if (!editingItem) return;
    const isDone = editingItem.kycStatus === 'DONE_BY_US' || editingItem.kycStatus === 'PRE_VERIFIED';
    const updated = {
      ...editingItem,
      isKycDone: isDone,
      kycType: editingItem.kycStatus
    };
    if (onSaveRecord) {
      onSaveRecord(updated, updated.id);
    }
    setLocalSubmitted(prev =>
      prev.map(p => p.id === updated.id ? { ...updated } : p)
    );
    setEditingItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanAccount = (formData.accountNumber || '').trim();
    const cleanPhone = (formData.phoneNumber || '').trim();
    const cleanName = (formData.citizenName || '').trim();
    const cleanFileNum = (formData.fileNumber || '').trim() || nextFileNumber;

    if (!cleanAccount && !cleanPhone && !cleanName) {
      alert('تکایە لانیکەم یەکێک لەمانە بنووسە: ژمارەی ئەژمار (ID)، ژمارەی مۆبایل، یان ناوی هاووڵاتی');
      if (accountInputRef.current) accountInputRef.current.focus();
      return;
    }

    const hasRealName = Boolean(cleanName && cleanName !== 'هاوبەشی کارەبا');
    const isDone = formData.status === 'COMPLETED';
    const isKyc = formData.kycStatus === 'DONE_BY_US' || formData.kycStatus === 'PRE_VERIFIED' || isDone;

    const newRecord = {
      id: 'rec-' + Date.now(),
      fileNumber: cleanFileNum,
      fileType: formData.fileType || 'YELLOW_FOLDER',
      accountNumber: cleanAccount,
      citizenName: hasRealName ? cleanName : 'هاوبەشی کارەبا',
      hasRealName: hasRealName,
      phoneNumber: cleanPhone || 'نیە',
      department: 'بەڕێوەبەرایەتی دابەشکردنی کارەبا',
      transactionType: 'پڕۆژەی ڕووناکی - پێوەری زیرەک',
      status: formData.status || 'IN_PROGRESS',
      archiveLocation: `سندوقی ${cleanFileNum}`,
      submissionDate: todayStr,
      completionDate: isDone ? todayStr : null,
      deliveredDate: formData.deliveredDate || null,
      receiverName: formData.receiverName || '',
      handledBy: 'هۆبەی پەیوەندیدار',
      notes: formData.notes || '',
      kycStatus: formData.kycStatus || 'PENDING',
      kycType: formData.kycStatus || 'PENDING',
      isKycDone: isKyc
    };

    if (onSaveRecord) {
      onSaveRecord(newRecord, null);
    }
    setLocalSubmitted(prev => [newRecord, ...prev]);

    // Calculate next file number for next entry
    const currentNumInt = parseInt(cleanFileNum, 10);
    const nextNum = !isNaN(currentNumInt) ? String(currentNumInt + 1) : nextFileNumber;

    setFormData({
      fileNumber: nextNum,
      fileType: formData.fileType || 'YELLOW_FOLDER',
      accountNumber: '',
      citizenName: '',
      phoneNumber: '',
      status: 'IN_PROGRESS',
      deliveredDate: '',
      receiverName: '',
      notes: '',
      kycStatus: 'PENDING',
      isKycDone: false
    });

    if (accountInputRef.current) {
      accountInputRef.current.focus();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>داخڵکردنی خێرا و ئۆتۆماتیکی دۆسیەکان</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            داخڵکردنی بەردەوامی دۆسیەکانی ئەمڕۆ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            تەنها ژمارەی ئەژمار یان ناوی هاووڵاتی بنووسە و ئینتەر (Enter) دابگرە، ژمارەی فایل و دۆخ و بەروار خۆکارانە دادەنرێن.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-amber-200 dark:border-amber-500/20 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">کۆی تۆمارکراوی ئەمڕۆ</div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {todayList.length} <span className="text-xs font-normal text-slate-500">دۆسیە</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Intake Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Rapid Entry Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>فۆرمی خێرای تۆمارکردنی دۆسیە</span>
            </h3>
            <span className="text-xs font-mono text-amber-800 dark:text-amber-300 font-black bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 rounded-full">
              فایلی داهاتوو: #{formData.fileNumber}
            </span>
          </div>

          {/* Realtime Duplicate Notice & Previous KYC Awareness */}
          {duplicates.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 space-y-2.5 animate-fadeIn shadow-md">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 text-xs font-black">
                  <AlertTriangle className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
                  <span>ئاگاداری: ئەم هاووڵاتییە پێشتر تۆمارکراوە!</span>
                </div>
              </div>

              <div className="space-y-2">
                {duplicates.map(dup => {
                  const dupKyc = getRecordKYC(dup);
                  return (
                    <div key={dup.id} className="p-2.5 rounded-xl bg-white/95 dark:bg-slate-950/90 border border-amber-300 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">{dup.citizenName}</span>
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold">
                            فایلی #{dup.fileNumber}
                          </span>
                          {dup.accountNumber && <span className="font-mono text-slate-500">ID: {dup.accountNumber}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <span>دۆخی KYC لە فایلی پێشوو:</span>
                          {dupKyc === 'DONE_BY_US' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">🟢 ئێمە کردمان</span>
                          ) : dupKyc === 'PRE_VERIFIED' ? (
                            <span className="text-sky-600 dark:text-sky-400 font-black">🔵 پێشتر کراوە (دەرەکی)</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-black">🟡 نەکراوە (پێنەدراوەتەوە)</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAutofillFromDuplicate(dup)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-95 flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>پڕکردنەوە 📥</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Folder Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                <span>شێوازی پاراستن / جۆری دۆسیە:</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, fileType: 'YELLOW_FOLDER' }))}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all flex items-center justify-center gap-2 cursor-pointer select-none active:scale-98 ${
                    formData.fileType === 'YELLOW_FOLDER'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/30 ring-2 ring-amber-500/50'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
                  }`}
                >
                  <Folder className={`w-4 h-4 ${formData.fileType === 'YELLOW_FOLDER' ? 'text-slate-950' : 'text-amber-500'}`} />
                  <span>فایلی زەرد (دۆسیەی زەرد) 📁</span>
                  {formData.fileType === 'YELLOW_FOLDER' && <CheckCircle2 className="w-4 h-4 text-slate-950 ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, fileType: 'PAPER' }))}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all flex items-center justify-center gap-2 cursor-pointer select-none active:scale-98 ${
                    formData.fileType === 'PAPER'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 ring-2 ring-blue-500/50'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                  }`}
                >
                  <FileText className={`w-4 h-4 ${formData.fileType === 'PAPER' ? 'text-white' : 'text-blue-500'}`} />
                  <span>ئەوراق (کاغەز/پەڕەی سپی) 📄</span>
                  {formData.fileType === 'PAPER' && <CheckCircle2 className="w-4 h-4 text-white ml-1" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* number file */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>ژمارەی فایل (number file)*:</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fileNumber}
                  onChange={(e) => setFormData({ ...formData, fileNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 font-mono font-bold text-base focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* ID / Account Number (Auto-focused) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>ژمارەی ئەژمار (Account / ID):</span>
                </label>
                <input
                  ref={accountInputRef}
                  type="text"
                  autoFocus
                  placeholder="بۆ نموونە: 63450291130"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 text-slate-900 dark:text-white font-mono text-sm focus:outline-none"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>ژمارەی مۆبایل (Phone Number):</span>
                </label>
                <input
                  type="text"
                  placeholder="0750xxxxxxx"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>ناوی هاووڵاتی (Name - گەر هەیە):</span>
                </label>
                <input
                  type="text"
                  placeholder="ناوی هاووڵاتی (ئارەزوومەندانە)..."
                  value={formData.citizenName}
                  onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submission Date (Auto-filled for Today) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>بەرواری تۆمارکردن (ئەمڕۆ - ئۆتۆماتیکی):</span>
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/70 dark:bg-slate-950 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 font-mono font-bold text-sm flex items-center justify-between">
                  <span>{todayStr}</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200">ئۆتۆماتیک</span>
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>دۆخی سەرەتایی دۆسیە:</span>
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-amber-100/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>پێنەدراوەتەوە - لەلای ئێمەیە لە ئەرشیف</span>
                </div>
              </div>

            </div>

            {/* KYC Selector (3 Options) */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>دۆخی ناسینەوەی هاوبەش (KYC Status):</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kycStatus: 'DONE_BY_US', isKycDone: true })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    formData.kycStatus === 'DONE_BY_US'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md font-black ring-2 ring-emerald-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  🟢 ئێمە کردمان
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kycStatus: 'PRE_VERIFIED', isKycDone: true })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    formData.kycStatus === 'PRE_VERIFIED'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md font-black ring-2 ring-sky-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  🔵 پێشتر کراوە
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kycStatus: 'PENDING', isKycDone: false })}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    formData.kycStatus === 'PENDING'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black ring-2 ring-amber-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  🟡 نەکراوە
                </button>
              </div>
            </div>

            {/* Note below fields */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 تێبینی: بەرواری ئەمڕۆ خۆکارانە دادەنرێت. کاتێک هاووڵاتی لە داهاتوودا سەردانی کرد، لە لیستی سەرەکی دەتوانیت دۆخی بگۆڕیت و وەک تەواوکراو تەسلیمی بکەیت.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Save className="w-5 h-5" />
              <span>تۆمارکردنی دۆسیەی ئەمڕۆ (Enter)</span>
            </button>
          </form>
        </div>

        {/* Live List of Today's Inputs */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>فایلە تۆمارکراوەکانی ئەمڕۆ</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
              {todayList.length} تۆمار
            </span>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto max-h-[580px] space-y-3 pr-1">
            {todayList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
                <p className="text-xs">هیچ دۆسیەیەک بۆ ئەمڕۆ تۆمار نەکراوە</p>
                <p className="text-[11px] text-slate-500">بە داخڵکردنی هەر دۆسیەیەک لێرە دەستبەجێ لیستەکە نوێ دەبێتەوە</p>
              </div>
            ) : (
              todayList.map((item) => {
                const isYellow = item.fileType === 'YELLOW_FOLDER';
                const itemKyc = getRecordKYC(item);

                return (
                  <div key={item.id} className="space-y-1">
                    <div className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      editingItem?.id === item.id 
                        ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/30' 
                        : isYellow
                        ? 'bg-amber-50/40 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80 hover:border-amber-400/40'
                    }`}>

                      {/* Info */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 rounded shrink-0">
                            #{item.fileNumber}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 truncate text-xs">
                            ID: {item.accountNumber || 'نیە'}
                          </span>
                          
                          {/* KYC Badge */}
                          {itemKyc === 'DONE_BY_US' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                              🟢 ئێمە کردمان
                            </span>
                          ) : itemKyc === 'PRE_VERIFIED' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-300">
                              🔵 پێشتر کراوە
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300">
                              🟡 نەکراوە
                            </span>
                          )}
                        </div>

                        <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {item.hasRealName ? item.citizenName : <span className="text-slate-400 italic">هاوبەشی کارەبا</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          مۆبایل: {item.phoneNumber || 'نیە'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit toggle */}
                        <button
                          type="button"
                          onClick={() => setEditingItem(
                            editingItem?.id === item.id ? null : { ...item, kycStatus: itemKyc }
                          )}
                          title="دەستکاریکردن"
                          className={`p-2 rounded-xl border transition-all ${
                            editingItem?.id === item.id
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                              : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-400'
                          }`}
                        >
                          {editingItem?.id === item.id
                            ? <X className="w-4 h-4" />
                            : <Edit className="w-4 h-4" />}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`ئایا دڵنیایت لە سڕینەوەی فایلی #${item.fileNumber}؟`)) {
                              if (onDeleteRecord) onDeleteRecord(item.id);
                              setLocalSubmitted(prev => prev.filter(p => p.id !== item.id));
                              if (editingItem?.id === item.id) setEditingItem(null);
                            }
                          }}
                          title="سڕینەوە"
                          className="p-2 rounded-xl bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Edit Panel */}
                    {editingItem?.id === item.id && (
                      <div className="rounded-b-2xl border-x border-b border-amber-400 dark:border-amber-500/50 bg-white dark:bg-slate-900/95 p-4 space-y-3 shadow-xl">
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-amber-100 dark:border-amber-500/20 pb-2">
                          <Edit className="w-3.5 h-3.5" />
                          دەستکاریکردنی فایلی #{item.fileNumber}
                        </p>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ناوی هاووڵاتی:</label>
                            <input
                              type="text"
                              value={editingItem.citizenName || ''}
                              onChange={e => setEditingItem({ ...editingItem, citizenName: e.target.value, hasRealName: Boolean(e.target.value.trim()) })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ژمارەی ئەژمار (ID):</label>
                            <input
                              type="text"
                              value={editingItem.accountNumber || ''}
                              onChange={e => setEditingItem({ ...editingItem, accountNumber: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* KYC Choice in Inline Edit */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">دۆخی KYC:</label>
                          <select
                            value={editingItem.kycStatus || 'PENDING'}
                            onChange={e => setEditingItem({ ...editingItem, kycStatus: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                          >
                            <option value="DONE_BY_US">🟢 ئێمە کردمان</option>
                            <option value="PRE_VERIFIED">🔵 پێشتر کراوە (دەرەکی)</option>
                            <option value="PENDING">🟡 نەکراوە (پێنەدراوەتەوە)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleEditSave}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>پاشەکەوتکردن</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                          >
                            داخستن
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
