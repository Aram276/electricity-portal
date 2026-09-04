import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  User, 
  Hash, 
  Phone, 
  Building2, 
  FileText, 
  Archive, 
  Calendar, 
  CheckCircle2, 
  Folder, 
  AlertTriangle, 
  ShieldCheck, 
  Shield, 
  ShieldAlert, 
  CreditCard,
  Sparkles
} from 'lucide-react';
import { STATUS_CONFIG, DEPARTMENTS, TRANSACTION_TYPES, KYC_CONFIG, getRecordKYC } from '../constants/status';

export default function RecordModal({ isOpen, onClose, onSave, editingRecord, initialData, records = [] }) {
  const currentRecord = editingRecord || initialData;
  
  const [formData, setFormData] = useState({
    fileNumber: '',
    fileType: 'YELLOW_FOLDER',
    accountNumber: '',
    citizenName: '',
    phoneNumber: '',
    department: DEPARTMENTS[0],
    transactionType: TRANSACTION_TYPES[0],
    status: 'IN_PROGRESS',
    archiveLocation: '',
    submissionDate: new Date().toISOString().slice(0, 10),
    completionDate: '',
    deliveredDate: '',
    receiverName: '',
    handledBy: '',
    notes: '',
    kycStatus: 'PENDING', // 'DONE_BY_US' | 'PRE_VERIFIED' | 'PENDING'
    isKycDone: false,
    nationalId: ''
  });

  // Intelligent Duplicate Detection & Previous File Lookup (Realtime)
  const duplicates = useMemo(() => {
    if (!records || !records.length) return [];
    const currentId = currentRecord?.id;
    const cleanFileNum = (formData.fileNumber || '').trim();
    const cleanAccount = (formData.accountNumber || '').trim();
    const cleanName = (formData.citizenName || '').trim().toLowerCase();
    const cleanPhone = (formData.phoneNumber || '').replace(/\D/g, '');

    if (!cleanFileNum && !cleanAccount && !cleanName && !cleanPhone) return [];

    return records.filter(r => {
      if (r.id === currentId) return false;
      const rFileNum = (r.fileNumber || '').trim();
      const rAccount = (r.accountNumber || '').trim();
      const rName = (r.citizenName || '').trim().toLowerCase();
      const rPhone = (r.phoneNumber || '').replace(/\D/g, '');

      const isSameFileNum = cleanFileNum && cleanFileNum === rFileNum;
      const isSameAccount = cleanAccount && cleanAccount.length >= 4 && cleanAccount === rAccount;
      const isSamePhone = cleanPhone && cleanPhone.length >= 8 && cleanPhone === rPhone;
      const isSameName = cleanName && cleanName !== 'هاوبەشی کارەبا' && cleanName.length >= 4 && (cleanName === rName || rName.includes(cleanName) || cleanName.includes(rName));

      return isSameFileNum || isSameAccount || isSamePhone || isSameName;
    }).slice(0, 3);
  }, [formData.fileNumber, formData.accountNumber, formData.citizenName, formData.phoneNumber, records, currentRecord]);

  // Autofill form from previous matched file
  const handleAutofillFromDuplicate = (dup) => {
    const prevKyc = getRecordKYC(dup);
    setFormData(prev => ({
      ...prev,
      citizenName: (dup.citizenName && dup.citizenName !== 'هاوبەشی کارەبا') ? dup.citizenName : prev.citizenName,
      phoneNumber: (dup.phoneNumber && dup.phoneNumber !== 'نیە') ? dup.phoneNumber : prev.phoneNumber,
      accountNumber: (dup.accountNumber && dup.accountNumber !== 'نیە') ? dup.accountNumber : prev.accountNumber,
      nationalId: dup.nationalId || prev.nationalId,
      kycStatus: prevKyc,
      isKycDone: prevKyc === 'DONE_BY_US' || prevKyc === 'PRE_VERIFIED'
    }));
  };

  useEffect(() => {
    if (!isOpen) return;

    if (currentRecord) {
      const kycVal = getRecordKYC(currentRecord);
      const isKyc = kycVal === 'DONE_BY_US' || kycVal === 'PRE_VERIFIED';

      setFormData({
        fileNumber: currentRecord.fileNumber || '',
        fileType: currentRecord.fileType || 'YELLOW_FOLDER',
        accountNumber: currentRecord.accountNumber || '',
        citizenName: currentRecord.citizenName || '',
        phoneNumber: currentRecord.phoneNumber || '',
        department: currentRecord.department || DEPARTMENTS[0],
        transactionType: currentRecord.transactionType || TRANSACTION_TYPES[0],
        status: currentRecord.status || 'IN_PROGRESS',
        archiveLocation: currentRecord.archiveLocation || '',
        submissionDate: currentRecord.submissionDate || new Date().toISOString().slice(0, 10),
        completionDate: currentRecord.completionDate || '',
        deliveredDate: currentRecord.deliveredDate || '',
        receiverName: currentRecord.receiverName || '',
        handledBy: currentRecord.handledBy || '',
        notes: currentRecord.notes || '',
        kycStatus: kycVal,
        isKycDone: isKyc,
        nationalId: currentRecord.nationalId || ''
      });
    } else {
      const nums = (records || []).map(r => parseInt(r.fileNumber, 10)).filter(n => !isNaN(n) && n > 0);
      const maxNum = nums.length ? Math.max(933, ...nums) : 933;
      const nextNum = maxNum + 1;

      setFormData({
        fileNumber: String(nextNum),
        fileType: 'YELLOW_FOLDER',
        accountNumber: '',
        citizenName: '',
        phoneNumber: '',
        department: DEPARTMENTS[0],
        transactionType: TRANSACTION_TYPES[0],
        status: 'IN_PROGRESS',
        archiveLocation: `سندوقی ${nextNum}`,
        submissionDate: new Date().toISOString().slice(0, 10),
        completionDate: '',
        deliveredDate: '',
        receiverName: '',
        handledBy: 'هۆبەی پەیوەندیدار',
        notes: '',
        kycStatus: 'PENDING',
        isKycDone: false,
        nationalId: ''
      });
    }
  }, [currentRecord, isOpen]);

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

  if (!isOpen) return null;

  const handleStatusChange = (newStatus) => {
    const isDone = newStatus === 'COMPLETED' || newStatus === 'DELIVERED';
    setFormData(prev => ({
      ...prev,
      status: newStatus,
      kycStatus: isDone && prev.kycStatus === 'PENDING' ? 'DONE_BY_US' : prev.kycStatus,
      isKycDone: isDone ? true : prev.isKycDone
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawName = (formData.citizenName || '').trim();
    const hasRealName = Boolean(rawName && rawName !== 'هاوبەشی کارەبا' && !rawName.startsWith('مانگی '));
    const isDone = formData.kycStatus === 'DONE_BY_US' || formData.kycStatus === 'PRE_VERIFIED';

    onSave({
      ...formData,
      citizenName: hasRealName ? rawName : 'هاوبەشی کارەبا',
      hasRealName: hasRealName,
      kycStatus: formData.kycStatus,
      kycType: formData.kycStatus,
      isKycDone: isDone
    }, currentRecord ? currentRecord.id : null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {currentRecord ? 'دەستکاریکردنی زانیاری مامەڵە' : 'تۆمارکردنی مامەڵەی نوێ'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">زانیارییەکان لە داتابەیسی ناوەندی پاشەکەوت دەبن</p>
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

        {/* Duplicate Realtime Warning Banner & Previous KYC Indicator */}
        {duplicates.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 space-y-3 animate-fadeIn shadow-lg">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-black">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce shrink-0" />
                <span>ئاگاداری: ئەم هاووڵاتییە/فایلە پێشتر تۆمارکراوە! (زانیاری پێشوو دۆزرایەوە)</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/70 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-400">
                {duplicates.length} فایلی پێشوو
              </span>
            </div>

            <div className="space-y-2">
              {duplicates.map(dup => {
                const dupKyc = getRecordKYC(dup);
                return (
                  <div key={dup.id} className="p-3 rounded-xl bg-white/95 dark:bg-slate-950/90 border border-amber-300 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{dup.citizenName}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold">
                          فایلی #{dup.fileNumber}
                        </span>
                        {dup.accountNumber && dup.accountNumber !== 'نیە' && (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            ID: {dup.accountNumber}
                          </span>
                        )}
                        {dup.phoneNumber && dup.phoneNumber !== 'نیە' && (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            📞 {dup.phoneNumber}
                          </span>
                        )}
                      </div>

                      {/* Previous KYC Status Notice */}
                      <div className="flex items-center gap-1.5 text-xs font-bold pt-0.5 flex-wrap">
                        <span className="text-slate-600 dark:text-slate-400">دۆخی KYC لە فایلی پێشوو:</span>
                        {dupKyc === 'DONE_BY_US' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>🟢 ئێمە کردمان (ئەنجامدراوە)</span>
                          </span>
                        ) : dupKyc === 'PRE_VERIFIED' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 inline-flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>🔵 پێشتر کراوە (دەرەکی)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 inline-flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>🟡 نەکراوە (پێنەدراوەتەوە)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAutofillFromDuplicate(dup)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-md shrink-0 w-full sm:w-auto justify-center"
                      title="پڕکردنەوەی زانیارییەکانی ئەم فۆرمە لەسەر بنەمای ئەم فایلەی پێشوو"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>پڕکردنەوە لە فایلی پێشوو 📥</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* File Type Selection (Yellow Folder vs Paper) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>شێوازی پاراستن / جۆری دۆسیە:</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, fileType: 'YELLOW_FOLDER' })}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 font-black text-xs sm:text-sm transition-all ${
                  formData.fileType === 'YELLOW_FOLDER'
                    ? 'bg-amber-100 dark:bg-amber-500/25 border-amber-500 text-amber-950 dark:text-amber-300 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Folder className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>فایلی زەرد (دۆسیەی گەورە) 📁</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, fileType: 'PAPER' })}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 font-black text-xs sm:text-sm transition-all ${
                  formData.fileType === 'PAPER'
                    ? 'bg-slate-200 dark:bg-slate-800 border-slate-500 text-slate-950 dark:text-white shadow-md ring-2 ring-slate-400/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>ئەوراق (کاغەزی تەنیا) 📄</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. File Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی فایل (کۆدی دۆسیە):</span>
              </label>
              <input
                type="text"
                required
                value={formData.fileNumber}
                onChange={(e) => setFormData({ ...formData, fileNumber: e.target.value })}
                placeholder="نموونە: 124"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            {/* 2. Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی ئەژمار (ID):</span>
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="نموونە: 63450291130 (گەر نیە بە بەتاڵی جێبهێڵە)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            {/* 3. Citizen Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>ناوی خاوەن مامەڵە / بەشداربوو:</span>
              </label>
              <input
                type="text"
                value={formData.citizenName}
                onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                placeholder="ناوی سیانی... (گەر نەزانراوە بە بەتاڵی جێبهێڵە)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 4. Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی مۆبایل:</span>
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0750xxxxxxx (گەر نیە بە بەتاڵی جێبهێڵە)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 5. Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>فەرمانگە / بەڕێوەبەرایەتی:</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {DEPARTMENTS.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            {/* 6. Transaction Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>جۆری مامەڵە:</span>
              </label>
              <select
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* 7. Archive Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-amber-500" />
                <span>شوێنی سندوق لە ئەرشیف:</span>
              </label>
              <input
                type="text"
                value={formData.archiveLocation}
                onChange={(e) => setFormData({ ...formData, archiveLocation: e.target.value })}
                placeholder="ڕەفەی ٤ - سندوقی ١٢"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 8. Handled By */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>فەرمانبەری بەرپرس:</span>
              </label>
              <input
                type="text"
                value={formData.handledBy}
                onChange={(e) => setFormData({ ...formData, handledBy: e.target.value })}
                placeholder="ناوی فەرمانبەر..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 9. Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>دۆخی ئێستای مامەڵە:</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 font-semibold"
              >
                {Object.values(STATUS_CONFIG).map((st) => (
                  <option key={st.id} value={st.id}>{st.label}</option>
                ))}
              </select>
            </div>

            {/* 10. Submission Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>بەرواری پێشکەشکردن:</span>
              </label>
              <input
                type="date"
                value={formData.submissionDate}
                onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 11. Completion Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>بەرواری تەواوبوون (گەر تەواوبووە):</span>
              </label>
              <input
                type="date"
                value={formData.completionDate || ''}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 12. Delivered Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>بەرواری تەسلیمکردن (گەر وەرگیراوە):</span>
              </label>
              <input
                type="text"
                value={formData.deliveredDate || ''}
                onChange={(e) => setFormData({ ...formData, deliveredDate: e.target.value })}
                placeholder="YYYY-MM-DD HH:MM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          {/* ── KYC VERIFICATION SECTION (3 CHOICES) ── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-50 dark:via-slate-950 to-emerald-500/10 border-2 border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    دۆخی ناسینەوەی هاوبەش (KYC Status)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تکایە دۆخی ئەنجامدانی پرۆسەی KYC بۆ ئەم هاووڵاتییە دیاری بکە:
                  </p>
                </div>
              </div>
            </div>

            {/* 3-State KYC Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Done by us */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, kycStatus: 'DONE_BY_US', isKycDone: true })}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1.5 ${
                  formData.kycStatus === 'DONE_BY_US'
                    ? 'bg-emerald-100 dark:bg-emerald-500/25 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">🟢 ئێمە کردمان</span>
                  {formData.kycStatus === 'DONE_BY_US' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  لەم شوێنە ئەنجامدراوە و مامەڵەکە تەواو بووە
                </p>
              </button>

              {/* 2. Pre-verified / External */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, kycStatus: 'PRE_VERIFIED', isKycDone: true })}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1.5 ${
                  formData.kycStatus === 'PRE_VERIFIED'
                    ? 'bg-sky-100 dark:bg-sky-500/25 border-sky-500 text-sky-950 dark:text-sky-200 shadow-md ring-2 ring-sky-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs sm:text-sm text-sky-700 dark:text-sky-400">🔵 پێشتر کراوە (دەرەکی)</span>
                  {formData.kycStatus === 'PRE_VERIFIED' && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  پێشتر لە دەرەوە یان کەسێکی تر کردویەتی
                </p>
              </button>

              {/* 3. Pending / Not Done */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, kycStatus: 'PENDING', isKycDone: false })}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1.5 ${
                  formData.kycStatus === 'PENDING'
                    ? 'bg-amber-100 dark:bg-amber-500/25 border-amber-500 text-amber-950 dark:text-amber-200 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs sm:text-sm text-amber-800 dark:text-amber-400">🟡 نەکراوە (پێنەدراوەتەوە)</span>
                  {formData.kycStatus === 'PENDING' && <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  هێشتا پرۆسەی KYC ئەنجام نەدراوە
                </p>
              </button>
            </div>

            {/* National ID Field */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>ژمارەی کارتی نیشتمانی / ناسنامە:</span>
              </label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="ژمارەی کارتی نیشتمانی (ئارەزوومەندانە)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>تێبینییەکان:</span>
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="وردەکاری زیاتر، مەرجەکان یان هۆکاری چاوەڕوانی بنووسە..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
            ></textarea>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>پاشەکەوتکردنی زانیاری</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
            >
              پاشگەزبوونەوە (Esc)
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
