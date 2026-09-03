import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  Folder, 
  FileText, 
  Send, 
  PlusCircle, 
  ShieldCheck, 
  AlertCircle,
  Hash,
  Phone,
  Tag
} from 'lucide-react';
import { STATUS_CONFIG, FILE_TYPES } from '../constants/status';

export default function FileTimelineModal({ isOpen, onClose, record, onAddTimelineNote, activeStaff }) {
  const [newNote, setNewNote] = useState('');

  if (!isOpen || !record) return null;

  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;
  const isYellow = record.fileType === 'YELLOW_FOLDER';

  // Build the complete synthesized timeline events if timeline array is missing/incomplete
  const timelineEvents = [];

  // 1. Initial Creation / Submission
  timelineEvents.push({
    id: 'creation',
    title: 'تۆمارکردنی سەرەتایی دۆسیە',
    type: 'CREATED',
    icon: PlusCircle,
    color: 'emerald',
    date: record.submissionDate || 'نادیار',
    time: record.createdAtTime || 'کاتژمێری فەرمی',
    staff: record.handledBy || (activeStaff?.name) || 'فەرمانبەری ژووری ١٩',
    description: `دۆسیەی هاووڵاتی بە فایلی (${isYellow ? 'زەرد 📁' : 'ئەوراق 📄'}) و ژمارەی (${record.fileNumber || 'نادیار'}) تۆمار کرا لە (${record.archiveLocation || 'ئەرشیف'}).`
  });

  // 2. File Type / Classification Event
  if (record.fileType) {
    timelineEvents.push({
      id: 'file-type',
      title: isYellow ? 'پۆلێنکردن بە فایلی زەرد 📁' : 'پۆلێنکردن بە ئەوراق (کاغەز) 📄',
      type: 'TYPE',
      icon: isYellow ? Folder : FileText,
      color: isYellow ? 'amber' : 'sky',
      date: record.submissionDate || 'نادیار',
      time: 'کاتی پۆلێنکردن',
      staff: record.handledBy || 'ئەرشیف',
      description: isYellow 
        ? 'دۆسیەکە وەک فایلی زەردی پەسەندکراو وەرگیراوە و لە سندوقی ئەرشیف پارێزراوە.'
        : 'مامەڵەکە بە شێوازی ئەوراق (کاغەز) تۆمار کراوە بۆ پڕۆسەی ئیداری.'
    });
  }

  // 3. Completion / Processing Status Event
  if (record.status === 'COMPLETED' || record.completionDate) {
    timelineEvents.push({
      id: 'status-completed',
      title: 'تەواوبوونی پشکنین و دۆسیە (Done)',
      type: 'STATUS',
      icon: CheckCircle2,
      color: 'emerald',
      date: record.completionDate || record.submissionDate,
      time: 'کاتی بڕیاردان',
      staff: record.handledBy || 'تیمی پشکنین و بەستنی پێوەر',
      description: 'سەرجەم ڕێکارە هونەری و داراییەکانی مامەڵەکە تەواو بوون و ئامادەکرا بۆ ڕادەستکردنەوە.'
    });
  }

  // 4. Official Delivery Event
  if (record.deliveredDate || record.receiverName) {
    timelineEvents.push({
      id: 'delivery',
      title: 'تەسلیمکردنەوەی فەرمی بە هاووڵاتی',
      type: 'DELIVERED',
      icon: ShieldCheck,
      color: 'blue',
      date: record.deliveredDate || record.completionDate || 'نادیار',
      time: record.deliveredTime || 'کاتی ڕادەستکردن',
      staff: record.handledBy || 'ژووری ١٩ (تەسلیمکردن)',
      description: `دۆسیە و پسوڵە بە فەرمی ڕادەستی (${record.receiverName || record.citizenName || 'خاوەن مامەڵە'}) کرایەوە.`
    });
  }

  // 5. Custom Dynamic Timeline entries (if stored in record.timeline array)
  if (Array.isArray(record.timeline)) {
    record.timeline.forEach((item, index) => {
      timelineEvents.push({
        id: `custom-${index}`,
        title: item.title || 'تێبینی و چالاکیی نوێ',
        type: item.type || 'NOTE',
        icon: Clock,
        color: 'purple',
        date: item.date || new Date().toISOString().slice(0, 10),
        time: item.time || '',
        staff: item.staff || 'فەرمانبەر',
        description: item.description || item.text || ''
      });
    });
  }

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    if (onAddTimelineNote) {
      onAddTimelineNote(record.id, {
        title: 'تێبینی فەرمی لەلایەن فەرمانبەر',
        description: newNote.trim(),
        staff: activeStaff?.name || 'فەرمانبەری ژووری ١٩',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
    }
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto transition-colors text-right">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  مێژووی ژیانی فایل (Full Timeline Audit)
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  isYellow 
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-400/40' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}>
                  {isYellow ? '📁 فایلی زەرد' : '📄 ئەوراق'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تۆماری تەواوی ڕێکارەکان، کاتژمێرەکان و ناوی فەرمانبەرانی بەشدار لەم دۆسیەیەدا
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Quick Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">ژمارەی فایل:</span>
            <span className="font-black font-mono text-amber-600 dark:text-amber-400 text-sm">#{record.fileNumber || 'نادیار'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">ناوی هاووڵاتی:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{record.citizenName || 'هاوبەشی کارەبا'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">ژمارەی ئەژمار (ID):</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{record.accountNumber || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">دۆخی ئێستا:</span>
            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Vertical Stepper Timeline */}
        <div className="relative border-r-2 border-amber-500/30 mr-4 sm:mr-6 pr-4 sm:pr-6 space-y-6 my-4">
          {timelineEvents.map((evt, idx) => {
            const IconComponent = evt.icon;
            return (
              <div key={evt.id || idx} className="relative group animate-fadeIn">
                {/* Stepper Dot / Icon */}
                <div className="absolute -right-[30px] sm:-right-[38px] top-0 w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md">
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Event Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      {evt.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span>{evt.date}</span>
                      </span>
                      {evt.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{evt.time}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {evt.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>لەلایەن:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{evt.staff}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Quick Audit Note Form */}
        <form onSubmit={handleAddNoteSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            زیادکردنی تێبینی یان تۆماری فەرمی بۆ مێژووی ئەم فایلە:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="تێبینییەکە بنووسە (بۆ نموونە: هاووڵاتی پەیوەندی کرد، سەردانی لیژنە کرا...)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>تۆمارکردن</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
}
