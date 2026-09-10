import React, { useState, useMemo, useDeferredValue } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Phone, 
  Clock, 
  Folder, 
  FileText, 
  Sparkles,
  Info,
  XCircle
} from 'lucide-react';
import { STATUS_CONFIG, FILE_TYPES } from '../constants/status';

// Convert numerals
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

function normalizeKurdish(str) {
  if (!str) return '';
  return toLatinDigits(str)
    .toLowerCase()
    .replace(/[ڕ]/g, 'ر')
    .replace(/[ڵ]/g, 'ل')
    .replace(/[يىئێی]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ةه]/g, 'ە')
    .replace(/[ۆو]/g, 'و')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .trim();
}

export default function TrashTab({
  trashRecords = [],
  onRestoreRecord,
  onBatchRestore,
  onPermanentDelete,
  onBatchPermanentDelete,
  onEmptyTrash
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'empty' | 'permanent' | 'batch_permanent', payload }

  // Filtered trash records
  const filteredTrash = useMemo(() => {
    if (!deferredSearch.trim()) return trashRecords;
    const query = normalizeKurdish(deferredSearch);
    return trashRecords.filter(r => {
      const fileNum = normalizeKurdish(r.fileNumber);
      const name = normalizeKurdish(r.citizenName);
      const phone = normalizeKurdish(r.phoneNumber);
      const deletedBy = normalizeKurdish(r.deletedBy);
      return fileNum.includes(query) || name.includes(query) || phone.includes(query) || deletedBy.includes(query);
    });
  }, [trashRecords, deferredSearch]);

  const allSelected = filteredTrash.length > 0 && selectedIds.length === filteredTrash.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrash.map(r => r.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    onBatchRestore(selectedIds);
    setSelectedIds([]);
  };

  const handleConfirmPermanentDelete = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'empty') {
      onEmptyTrash();
      setSelectedIds([]);
    } else if (confirmModal.type === 'permanent') {
      onPermanentDelete(confirmModal.payload);
      setSelectedIds(prev => prev.filter(id => id !== confirmModal.payload));
    } else if (confirmModal.type === 'batch_permanent') {
      onBatchPermanentDelete(selectedIds);
      setSelectedIds([]);
    }
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-kurdish">
      {/* Top Banner / Stats */}
      <div className="bg-gradient-to-r from-red-900/40 via-slate-900/80 to-amber-950/40 border border-red-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                  سەلەی خۆڵ و گەڕاندنەوە (Recycle Bin)
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-300 border border-red-500/40">
                  {trashRecords.length} فایلی سڕاوە
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                هەموو ئەو دۆسیانەی دەسڕدرێنەوە بۆ پاراستنیان لێرە هەڵدەگیرێن. دەتوانیت بە یەک کلیک بیگەڕێنیتەوە.
              </p>
            </div>
          </div>

          {trashRecords.length > 0 && (
            <button
              onClick={() => setConfirmModal({ type: 'empty' })}
              className="px-4 py-2.5 rounded-2xl bg-red-500/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/40 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              <span>بەتاڵکردنی تەواوی سەلەی خۆڵ</span>
            </button>
          )}
        </div>
      </div>

      {/* Action and Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان بەپێی ژمارەی فایل، ناو، مۆبایل، یان فەرمانبەر..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Bulk Action Buttons (Visible when items selected) */}
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 w-full md:w-auto justify-end animate-fadeIn">
              <span className="text-xs font-bold text-amber-500 dark:text-amber-400 px-3 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
                {selectedIds.length} فایل هەڵبژێردراوە
              </span>

              <button
                onClick={handleRestoreSelected}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>گەڕاندنەوەی هەڵبژێردراوەکان</span>
              </button>

              <button
                onClick={() => setConfirmModal({ type: 'batch_permanent' })}
                className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>سڕینەوەی یەکجارەکی</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 hidden md:block">
              {filteredTrash.length} فایل دۆزرایەوە
            </div>
          )}
        </div>
      </div>

      {/* Table / Content */}
      {filteredTrash.length === 0 ? (
        <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xl space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
            سەلەی خۆڵ بەتاڵە
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            هیچ فایلێکی سڕاوە لەناو سیستەمدا بوونی نییە. هەر کاتێک فایلێک بسڕیتەوە لەم بەشەدا دەمێنێتەوە بۆ ئەوەی بتوانیت بیگەڕێنیتەوە.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 select-none">
                <tr>
                  <th className="p-3 sm:p-4 w-10 text-center">
                    <button onClick={handleToggleSelectAll} className="p-1 hover:text-amber-500 transition-colors">
                      {allSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </button>
                  </th>
                  <th className="p-3 sm:p-4">ژمارەی فایل</th>
                  <th className="p-3 sm:p-4">ناوی هاووڵاتی</th>
                  <th className="p-3 sm:p-4">مۆبایل</th>
                  <th className="p-3 sm:p-4">جۆری فایل</th>
                  <th className="p-3 sm:p-4">دۆخی سەرەتایی</th>
                  <th className="p-3 sm:p-4">کاتی سڕینەوە</th>
                  <th className="p-3 sm:p-4">سڕاوەتەوە لەلایەن</th>
                  <th className="p-3 sm:p-4 text-center">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredTrash.map((rec) => {
                  const isSelected = selectedIds.includes(rec.id);
                  const statusConf = STATUS_CONFIG[rec.status] || STATUS_CONFIG.IN_PROGRESS;
                  const fileTypeConf = FILE_TYPES[rec.fileType] || FILE_TYPES.YELLOW_FOLDER;

                  return (
                    <tr 
                      key={rec.id}
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-amber-500/10 dark:bg-amber-500/15' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-3 sm:p-4 text-center">
                        <button onClick={() => handleToggleSelect(rec.id)} className="p-1 hover:text-amber-500 transition-colors">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-amber-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                      </td>

                      {/* File Number */}
                      <td className="p-3 sm:p-4 font-mono font-black text-slate-900 dark:text-amber-400">
                        #{rec.fileNumber}
                      </td>

                      {/* Citizen Name */}
                      <td className="p-3 sm:p-4 font-bold text-slate-800 dark:text-slate-100">
                        {rec.hasRealName ? rec.citizenName : <span className="text-slate-400 font-normal">هاوبەشی کارەبا</span>}
                      </td>

                      {/* Phone Number */}
                      <td className="p-3 sm:p-4 font-mono text-slate-600 dark:text-slate-300">
                        {rec.phoneNumber && rec.phoneNumber !== 'نیە' ? rec.phoneNumber : <span className="text-slate-400">نیە</span>}
                      </td>

                      {/* File Type */}
                      <td className="p-3 sm:p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${fileTypeConf.badgeClass}`}>
                          {rec.fileType === 'PAPER' ? <FileText className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                          {fileTypeConf.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3 sm:p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${statusConf.badgeClass}`}>
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Deleted At */}
                      <td className="p-3 sm:p-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {rec.deletedAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rec.deletedAt}</span>
                          </div>
                        ) : 'پێشتر'}
                      </td>

                      {/* Deleted By */}
                      <td className="p-3 sm:p-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                          <span>{rec.deletedBy || 'ئادمین'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onRestoreRecord(rec.id)}
                            title="گەڕاندنەوەی ئەم فایلە"
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>گەڕاندنەوە</span>
                          </button>

                          <button
                            onClick={() => setConfirmModal({ type: 'permanent', payload: rec.id })}
                            title="سڕینەوەی یەکجارەکی"
                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white dark:text-red-400 border border-red-500/20 text-xs transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {confirmModal.type === 'empty' 
                  ? 'ئایا دڵنیایت لە بەتاڵکردنی تەواوی سەلەی خۆڵ؟' 
                  : 'ئایا دڵنیایت لە سڕینەوەی یەکجارەکی؟'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {confirmModal.type === 'empty' 
                  ? 'هەموو فایلە سڕاوەکان بە یەکجاری لە کڵاود و کۆگای لۆکاڵ دەسڕدرێنەوە و ئیتر ناگەڕێندرێنەوە!' 
                  : 'ئەم فایلە بە تەواوی لە کڵاود و سیستەم دەسڕدرێتەوە و ناتوانیت بیگەڕێنیتەوە.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>سڕینەوەی یەکجارەکی</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
