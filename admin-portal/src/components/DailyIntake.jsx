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
  X
} from 'lucide-react';
import { STATUS_CONFIG } from '../constants/status';

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
    notes: ''
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
    if (onSaveRecord) {
      onSaveRecord(editingItem, editingItem.id);
    }
    setLocalSubmitted(prev =>
      prev.map(p => p.id === editingItem.id ? { ...editingItem } : p)
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
      completionDate: formData.status === 'COMPLETED' ? todayStr : null,
      deliveredDate: formData.deliveredDate || null,
      receiverName: formData.receiverName || '',
      handledBy: 'هۆبەی پەیوەندیدار',
      notes: formData.notes || ''
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
      notes: ''
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
            <span>داخڵکردنی خێرا (بە شێوازی ئێکسڵەکەت)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            تۆمارکردنی دۆسیەی نوێ بۆ ناو لیست
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            زانیارییەکان بنووسە و دوگمەی Enter دابگرە بۆ تۆمارکردنی خێرا
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-950/80 p-3 rounded-2xl border border-amber-300 dark:border-amber-500/30">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">تۆمارکراوی ئەمڕۆ</div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{todayList.length} دۆسیە</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Fast Entry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>فۆڕمی زیادکردنی دۆسیە</span>
            </h3>
            <span className="text-xs text-slate-400">کلیلەکانی Enter / Tab بەکاربێنە</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Type Choice Toggle (Yellow Folder vs Paper) */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border-2 border-amber-500/30">
              <label className="block text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-500" />
                <span>جۆری دۆسیە (شێوازی پاراستن لە فەرمانگە):</span>
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
                  <span>فایلی زەرد (دۆسیەی زەرد)</span>
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
                  <span>ئەوراق (کاغەز/پەڕەی سپی)</span>
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

              {/* Initial Status (Not Done / Archive) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>دۆخی سەرەتایی دۆسیە:</span>
                </label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-amber-100/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>پێنەدراوەتەوە - لەلای ئێمەیە لە ئەرشیف (Not Done)</span>
                </div>
              </div>

            </div>

            {/* Note below fields */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 تێبینی: بەرواری ئەمڕۆ خۆکارانە دادەنرێت. کاتێک هاووڵاتی لە داهاتوودا سەردانی کرد، لە لیستی سەرەکی دوگمەی «تەسلیمکردن» دادەگریت.
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
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-mono font-bold">
              {todayList.length} دانە
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
            {todayList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">هیچ فایلێکی نوێت لەم دانیشتنەدا داخڵ نەکردووە</p>
              </div>
            ) : (
              todayList.map((item, idx) => (
                <div key={item.id || idx} className="space-y-0">

                  {/* Card Row */}
                  <div className={`p-3.5 rounded-2xl border transition-all text-xs flex items-start justify-between gap-3 ${
                    editingItem?.id === item.id
                      ? 'bg-amber-50 dark:bg-amber-500/8 border-amber-400 dark:border-amber-500/50 rounded-b-none'
                      : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800/80 hover:border-amber-400/40'
                  }`}>

                    {/* Info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 rounded shrink-0">
                          #{item.fileNumber}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 truncate">
                          ID: {item.accountNumber || 'نیە'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.hasRealName ? item.citizenName : <span className="text-slate-400 italic">هاوبەشی کارەبا</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        مۆبایل: {item.phoneNumber || 'نیە'}
                        {item.deliveredDate && <span className="mr-2 text-blue-600 dark:text-blue-400"> | بەروار: {item.deliveredDate}</span>}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit toggle */}
                      <button
                        onClick={() => setEditingItem(
                          editingItem?.id === item.id ? null : { ...item }
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
                        onClick={() => {
                          if (onDeleteRecord) onDeleteRecord(item.id);
                          setLocalSubmitted(prev => prev.filter(p => p.id !== item.id));
                          if (editingItem?.id === item.id) setEditingItem(null);
                        }}
                        title="سڕینەوە"
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Panel (slides in under the card) */}
                  {editingItem?.id === item.id && (
                    <div className="rounded-b-2xl border-x border-b border-amber-400 dark:border-amber-500/50 bg-white dark:bg-slate-900/95 p-4 space-y-3 shadow-xl">
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b border-amber-100 dark:border-amber-500/20 pb-2">
                        <Edit className="w-3.5 h-3.5" />
                        دەستکاریکردنی فایلی #{item.fileNumber}
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* File Number */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ژمارەی فایل:</label>
                          <input
                            type="text"
                            value={editingItem.fileNumber}
                            onChange={e => setEditingItem({ ...editingItem, fileNumber: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* ID */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ژمارەی ئەژمار (ID):</label>
                          <input
                            type="text"
                            value={editingItem.accountNumber}
                            onChange={e => setEditingItem({ ...editingItem, accountNumber: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">مۆبایل:</label>
                          <input
                            type="text"
                            value={editingItem.phoneNumber === 'نیە' ? '' : editingItem.phoneNumber}
                            onChange={e => setEditingItem({ ...editingItem, phoneNumber: e.target.value || 'نیە' })}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Name */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ناوی هاووڵاتی:</label>
                          <input
                            type="text"
                            value={editingItem.hasRealName ? editingItem.citizenName : ''}
                            onChange={e => setEditingItem({
                              ...editingItem,
                              citizenName: e.target.value || 'هاوبەشی کارەبا',
                              hasRealName: Boolean(e.target.value.trim())
                            })}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">دۆخ (Status):</label>
                          <select
                            value={editingItem.status}
                            onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500"
                          >
                            <option value="IN_PROGRESS">پێنەدراوەتەوە - لەلای ئێمەیە</option>
                            <option value="COMPLETED">وەرگیراوەتەوە (Done)</option>
                            <option value="DELIVERED">تەسلیم کرا</option>
                          </select>
                        </div>

                        {/* Delivery Date */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">بەرواری تەسلیم (date):</label>
                          <input
                            type="text"
                            value={editingItem.deliveredDate || ''}
                            onChange={e => setEditingItem({ ...editingItem, deliveredDate: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Receiver Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ناوی وەرگرەوە (name of recive):</label>
                        <input
                          type="text"
                          value={editingItem.receiverName || ''}
                          onChange={e => setEditingItem({ ...editingItem, receiverName: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Save / Cancel */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setEditingItem(null)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" /> پاشگەزبوونەوە
                        </button>
                        <button
                          onClick={handleEditSave}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> پاشەکەوتکردن
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
