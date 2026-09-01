import React, { useState, useEffect } from 'react';
import { X, Save, User, Hash, Phone, Building2, FileText, Archive, Calendar, CheckCircle2, Folder } from 'lucide-react';
import { STATUS_CONFIG, DEPARTMENTS, TRANSACTION_TYPES } from '../constants/status';

export default function RecordModal({ isOpen, onClose, onSave, editingRecord, records = [] }) {
  const [formData, setFormData] = useState({
    fileNumber: '838',
    fileType: 'YELLOW_FOLDER',
    accountNumber: '',
    citizenName: '',
    phoneNumber: '',
    department: DEPARTMENTS[0],
    transactionType: TRANSACTION_TYPES[0],
    status: 'IN_PROGRESS',
    archiveLocation: 'سندوقی 838',
    submissionDate: new Date().toISOString().slice(0, 10),
    completionDate: '',
    deliveredDate: '',
    receiverName: '',
    handledBy: '',
    notes: ''
  });

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        fileNumber: editingRecord.fileNumber || '',
        fileType: editingRecord.fileType || 'YELLOW_FOLDER',
        accountNumber: editingRecord.accountNumber || '',
        citizenName: editingRecord.citizenName || '',
        phoneNumber: editingRecord.phoneNumber || '',
        department: editingRecord.department || DEPARTMENTS[0],
        transactionType: editingRecord.transactionType || TRANSACTION_TYPES[0],
        status: editingRecord.status || 'IN_PROGRESS',
        archiveLocation: editingRecord.archiveLocation || '',
        submissionDate: editingRecord.submissionDate || new Date().toISOString().slice(0, 10),
        completionDate: editingRecord.completionDate || '',
        deliveredDate: editingRecord.deliveredDate || '',
        receiverName: editingRecord.receiverName || '',
        handledBy: editingRecord.handledBy || '',
        notes: editingRecord.notes || ''
      });
    } else {
      const nums = (records || []).map(r => parseInt(r.fileNumber, 10)).filter(n => !isNaN(n));
      const maxNum = nums.length ? Math.max(...nums) : 837;
      const nextNum = maxNum >= 838 ? maxNum + 1 : 838;

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
        notes: ''
      });
    }
  }, [editingRecord, isOpen, records]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, editingRecord ? editingRecord.id : null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingRecord ? 'دەستکاریکردنی زانیاری مامەڵە' : 'زیادکردنی مامەڵەی نوێ بۆ سیستم'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">تۆمارکردنی دۆسیە لە ئەرشیف و داتابەیسی کارەبا</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* File Type Choice Toggle */}
            <div className="sm:col-span-2 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>جۆری دۆسیە (شێوازی پاراستن):</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, fileType: 'YELLOW_FOLDER' })}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
                    formData.fileType === 'YELLOW_FOLDER'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span>📁 فایلی زەرد (دۆسیەی زەرد)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, fileType: 'PAPER' })}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-1.5 ${
                    formData.fileType === 'PAPER'
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-950 border-slate-800 shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span>📄 ئەوراق (کاغەز/پەڕەی سپی)</span>
                </button>
              </div>
            </div>

            {/* File Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی فایل / مامەڵە:</span>
              </label>
              <input
                type="text"
                required
                value={formData.fileNumber}
                onChange={(e) => setFormData({ ...formData, fileNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی ئەژمار (Account No):</span>
              </label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="بۆ نموونە: 10458293"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Citizen Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>ناوی تەواوی هاووڵاتی:</span>
              </label>
              <input
                type="text"
                required
                value={formData.citizenName}
                onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                placeholder="ناوی سیانی بنووسە..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی مۆبایل:</span>
              </label>
              <input
                type="text"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0770xxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                <span>بەڕێوەبەرایەتی / فەرمانگە:</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Transaction Type */}
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

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>دۆخی ئێستای مامەڵە:</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 font-semibold"
              >
                {Object.values(STATUS_CONFIG).map((st) => (
                  <option key={st.id} value={st.id}>{st.label}</option>
                ))}
              </select>
            </div>

            {/* Archive Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-amber-500" />
                <span>شوێنی فایل لە ئەرشیف / سندوق:</span>
              </label>
              <input
                type="text"
                value={formData.archiveLocation}
                onChange={(e) => setFormData({ ...formData, archiveLocation: e.target.value })}
                placeholder="ڕەفەی ٤ - سندوقی ١٢"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Submission Date */}
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

            {/* Completion Date */}
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

            {/* Delivered Date */}
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

            {/* Handled By */}
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
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>پاشەکەوتکردنی زانیاری</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
