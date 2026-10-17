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
  Tag,
  Printer,
  PackageCheck,
  Building2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Share2,
  CalendarCheck2,
  LogIn,
  LogOut,
  History
} from 'lucide-react';
import { STATUS_CONFIG, FILE_TYPES } from '../constants/status';
import { getKurdistanDate, getKurdistanDateTime, getKurdistanTime12, formatKurdistanDateTime } from '../utils/dateUtils';

// Helper to compute difference in calendar days
function getDaysDiff(fromDateStr, toDateStr) {
  if (!fromDateStr) return null;
  try {
    const d1 = new Date(fromDateStr.slice(0, 10));
    const d2 = toDateStr ? new Date(toDateStr.slice(0, 10)) : new Date();
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  } catch (e) {
    return null;
  }
}

export default function FileTimelineModal({ 
  isOpen, 
  onClose, 
  record, 
  onAddTimelineNote, 
  activeStaff 
}) {
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('NOTE');
  const [activeActionModal, setActiveActionModal] = useState(null); // 'CHECKOUT' | 'RETURN' | 'COMPLETE' | 'DELIVER'
  const [actionDate, setActionDate] = useState(getKurdistanDate());
  const [actionPerson, setActionPerson] = useState('');
  const [actionNote, setActionNote] = useState('');

  if (!isOpen || !record) return null;

  const staffName = activeStaff?.name || 'ئارام (ژووری ١٩)';
  const isYellow = record.fileType === 'YELLOW_FOLDER';
  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;

  // ── Key Milestone Dates ──
  const submissionDate = record.submissionDate || record.createdAt || null;
  const temporaryCheckoutDate = record.temporaryCheckoutDate || null;
  const returnDate = record.returnDate || null;
  const completionDate = record.completionDate || (record.status === 'COMPLETED' ? (record.updatedAt ? new Date(record.updatedAt).toISOString().slice(0, 10) : null) : null);
  const deliveredDate = record.deliveredDate || (record.status === 'DELIVERED' ? (record.updatedAt ? new Date(record.updatedAt).toISOString().slice(0, 10) : null) : null);

  // ── Calculate days duration ──
  const totalDays = getDaysDiff(submissionDate, deliveredDate || null);

  // ── Synthesize Chronological Events Feed ──
  const events = [];

  // 1. Initial Submission / Intake
  if (submissionDate) {
    events.push({
      id: 'evt-submission',
      timestamp: new Date(submissionDate).getTime() || 1,
      type: 'INTAKE',
      title: 'داخیلکردن و تۆمارکردنی سەرەتایی دۆسیە',
      date: submissionDate,
      time: record.createdAtTime || 'کاتی دەوام',
      staff: record.handledBy || staffName,
      badge: 'داخیلکراوە 📥',
      badgeColor: 'emerald',
      icon: PlusCircle,
      description: `دۆسیەی هاووڵاتی بە فایلی (${isYellow ? 'فایلی زەرد 📁' : 'ئەوراق 📄'}) و ژمارەی (#${record.fileNumber || 'نادیار'}) لە (${record.archiveLocation || 'ئەرشیفی ژووری ١٩'}) تۆمار کرا.`
    });
  }

  // 2. Temporary Checkout / Citizen Takes File for Procedures
  if (temporaryCheckoutDate) {
    const diff = getDaysDiff(submissionDate, temporaryCheckoutDate);
    events.push({
      id: 'evt-checkout',
      timestamp: new Date(temporaryCheckoutDate).getTime() || 2,
      type: 'CHECKOUT',
      title: 'بردنەدەرەوەی کاتیی فایل بۆ ڕاییکردنی کارەکان',
      date: temporaryCheckoutDate,
      time: 'کاتی بردنەدەرەوە',
      staff: record.checkoutStaff || staffName,
      badge: 'بردرایە دەرەوە 📤',
      badgeColor: 'amber',
      icon: LogOut,
      diffText: diff !== null ? (diff === 0 ? 'لە هەمان ڕۆژدا' : `دوای ${diff} ڕۆژ لە داخیلکردن`) : null,
      description: `هاووڵاتی یان نوێنەر (${record.checkoutReceiver || record.citizenName || 'خاوەن مامەڵە'}) دۆسیەکەی لە ژووری ١٩ وەرگرت بۆ تەواوکردنی ڕێکار و مۆرەکانی تر.`
    });
  }

  // 3. File Return to Room 19
  if (returnDate) {
    const diff = getDaysDiff(temporaryCheckoutDate || submissionDate, returnDate);
    events.push({
      id: 'evt-return',
      timestamp: new Date(returnDate).getTime() || 3,
      type: 'RETURN',
      title: 'هێنانەوەی فایل بۆ ژووری ١٩ (دوای ڕاییکردن)',
      date: returnDate,
      time: 'کاتی هێنانەوە',
      staff: record.returnStaff || staffName,
      badge: 'هێنرایەوە 🏢',
      badgeColor: 'sky',
      icon: LogIn,
      diffText: diff !== null ? `دوای ${diff} ڕۆژ لای هاووڵاتی بوو` : null,
      description: `دۆسیەکە لەلایەن هاووڵاتییەوە هێنرایەوە بۆ ژووری ١٩ تاوەکو پشکنینی کۆتایی بۆ بکرێت و بە فەرمی پەسەند بکرێت.`
    });
  }

  // 4. KYC Verification Event
  if (record.kycStatus === 'DONE_BY_US' || record.kycStatus === 'PRE_VERIFIED') {
    events.push({
      id: 'evt-kyc',
      timestamp: (record.kycVerifiedAt ? new Date(record.kycVerifiedAt).getTime() : (new Date(submissionDate || Date.now()).getTime() + 100)),
      type: 'KYC',
      title: record.kycStatus === 'DONE_BY_US' ? 'ئەنجامدانی پشکنینی ڕووناکی (KYC)' : 'پەسەندکردنی پشکنینی پێشتر (KYC)',
      date: record.kycVerifiedAt ? record.kycVerifiedAt.slice(0, 10) : (submissionDate || getKurdistanDate()),
      time: record.kycVerifiedAt ? record.kycVerifiedAt.slice(11, 16) : 'پەسەندکراو',
      staff: record.kycVerifiedBy || staffName,
      badge: record.kycStatus === 'DONE_BY_US' ? 'KYC کراوە 🪪' : 'پێشتر کراوە 🪪',
      badgeColor: record.kycStatus === 'DONE_BY_US' ? 'emerald' : 'sky',
      icon: ShieldCheck,
      description: `پشکنینی ناسنامە و داتای ئەلیکترۆنیی هاوبەش (KYC) لە سیستەم بە سەرکەوتوویی جێبەجێ کرا.`
    });
  }

  // 5. Completion Event
  if (completionDate || record.status === 'COMPLETED') {
    const diff = getDaysDiff(returnDate || submissionDate, completionDate);
    events.push({
      id: 'evt-complete',
      timestamp: new Date(completionDate || Date.now()).getTime() || 4,
      type: 'COMPLETE',
      title: 'تەواوبوونی پشکنین و سەرجەم کارەکان (Done)',
      date: completionDate || submissionDate || getKurdistanDate(),
      time: 'کاتی بڕیاردان',
      staff: record.handledBy || staffName,
      badge: 'تەواوبوو ✅',
      badgeColor: 'emerald',
      icon: CheckCircle2,
      diffText: diff !== null ? `دوای ${diff} ڕۆژ لە هێنانەوە` : null,
      description: 'سەرجەم ڕێکارە هونەری و داراییەکان لە سیستەم پەسەند کران و دۆسیەکە ئامادەیە بۆ ڕادەستکردنەوەی کۆتایی.'
    });
  }

  // 6. Final Delivery Event
  if (deliveredDate || record.status === 'DELIVERED') {
    const diff = getDaysDiff(completionDate || submissionDate, deliveredDate);
    events.push({
      id: 'evt-delivery',
      timestamp: new Date(deliveredDate || Date.now()).getTime() || 5,
      type: 'DELIVERY',
      title: 'تەسلیمکردنەوەی کۆتایی بە هاووڵاتی',
      date: deliveredDate || completionDate || getKurdistanDate(),
      time: record.deliveredTime || 'کاتی تەسلیمکردن',
      staff: record.deliveredBy || record.handledBy || staffName,
      badge: 'تەسلیمکرا 📦',
      badgeColor: 'blue',
      icon: PackageCheck,
      diffText: diff !== null ? (diff === 0 ? 'لە هەمان ڕۆژی تەواوبووندا' : `دوای ${diff} ڕۆژ لە تەواوبوون`) : null,
      description: `دۆسیە و پسوولەی فەرمی بە تەواوی تەسلیمی بەڕێز (${record.receiverName || record.citizenName || 'هاوبەش'}) کرایەوە و مامەڵەکە بە سەرکەوتوویی کۆتایی هات.`
    });
  }

  // 7. Custom Dynamic Timeline entries (from record.timeline array)
  if (Array.isArray(record.timeline)) {
    record.timeline.forEach((item, index) => {
      events.push({
        id: `evt-custom-${index}`,
        timestamp: item.timestamp || Date.now() - (1000 * 60 * (10 - index)),
        type: item.type || 'NOTE',
        title: item.title || 'تێبینی و بەدواداچوونی فەرمانبەر',
        date: item.date || getKurdistanDate(),
        time: item.time || '',
        staff: item.staff || staffName,
        badge: item.badge || 'تێبینی 📌',
        badgeColor: 'purple',
        icon: Clock,
        description: item.description || item.text || ''
      });
    });
  }

  // Sort all events chronologically (oldest first)
  const sortedEvents = events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  // ── Stage Pipeline Definitions ──
  const stages = [
    {
      id: 1,
      name: 'داخیلکردن',
      sub: 'پێشکەشکردنی داواکاری',
      date: submissionDate,
      isDone: Boolean(submissionDate),
      icon: PlusCircle,
      activeColor: 'emerald'
    },
    {
      id: 2,
      name: 'بردنەدەرەوەی کاتی',
      sub: 'ڕاییکردنی کار لە بەشەکان',
      date: temporaryCheckoutDate,
      isDone: Boolean(temporaryCheckoutDate),
      icon: LogOut,
      activeColor: 'amber'
    },
    {
      id: 3,
      name: 'هێنانەوەی فایل',
      sub: 'گەڕاندنەوە بۆ ژووری ١٩',
      date: returnDate,
      isDone: Boolean(returnDate),
      icon: LogIn,
      activeColor: 'sky'
    },
    {
      id: 4,
      name: 'تەواوبوونی کارەکان',
      sub: 'پشکنین و بڕیاری کۆتایی',
      date: completionDate,
      isDone: Boolean(completionDate || record.status === 'COMPLETED' || record.status === 'DELIVERED'),
      icon: CheckCircle2,
      activeColor: 'emerald'
    },
    {
      id: 5,
      name: 'تەسلیمکردنەوەی کۆتایی',
      sub: 'وەرگرتنەوە لەلایەن هاووڵاتی',
      date: deliveredDate,
      isDone: Boolean(deliveredDate || record.status === 'DELIVERED'),
      icon: PackageCheck,
      activeColor: 'blue'
    }
  ];

  // Handler for adding custom note
  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    if (onAddTimelineNote) {
      onAddTimelineNote(record.id, {
        title: noteCategory === 'CALL' ? '📞 پەیوەندی تەلەفۆنی بە هاووڵاتی' :
               noteCategory === 'WARNING' ? '⚠️ مۆر یان بەڵگەنامەی کەمە' :
               noteCategory === 'DEPT' ? '🏛️ سەردانی لیژنە یان فەرمانگەی تر' :
               '📌 تێبینی و تۆماری کارمەند',
        type: noteCategory,
        description: newNote.trim(),
        staff: staffName,
        date: getKurdistanDate(),
        time: getKurdistanTime12(false),
        timestamp: Date.now()
      });
    }
    setNewNote('');
  };

  // Handler for Quick Milestone Action Buttons
  const handleExecuteMilestoneAction = (e) => {
    e.preventDefault();
    if (!onAddTimelineNote) return;

    if (activeActionModal === 'CHECKOUT') {
      const person = actionPerson.trim() || record.citizenName || 'خاوەن مامەڵە';
      const updates = {
        temporaryCheckoutDate: actionDate,
        checkoutReceiver: person,
        checkoutStaff: staffName
      };
      const noteObj = {
        title: 'بردنەدەرەوەی کاتیی فایل لەلایەن هاووڵاتی',
        type: 'CHECKOUT',
        description: `فایلەکە بە شێوەی کاتی تەسلیمی (${person}) کرا بۆ ڕاییکردنی مامەڵە لە فەرمانگە و لیژنە پەیوەندیدارەکان.${actionNote ? ' | تێبینی: ' + actionNote : ''}`,
        staff: staffName,
        date: actionDate,
        time: getKurdistanTime12(false),
        timestamp: Date.now()
      };
      onAddTimelineNote(record.id, noteObj, updates);
    } else if (activeActionModal === 'RETURN') {
      const updates = {
        returnDate: actionDate,
        returnStaff: staffName
      };
      const noteObj = {
        title: 'هێنانەوەی فایل بۆ ژووری ١٩ (دوای ڕاییکردن)',
        type: 'RETURN',
        description: `هاووڵاتی فایلەکەی هێنایەوە بۆ ژووری ١٩ دوای جێبەجێکردنی ڕێکارەکان بۆ تەواوکردنی کۆتایی.${actionNote ? ' | تێبینی: ' + actionNote : ''}`,
        staff: staffName,
        date: actionDate,
        time: getKurdistanTime12(false),
        timestamp: Date.now()
      };
      onAddTimelineNote(record.id, noteObj, updates);
    } else if (activeActionModal === 'COMPLETE') {
      const updates = {
        completionDate: actionDate,
        status: 'COMPLETED'
      };
      const noteObj = {
        title: 'تەواوبوونی سەرجەم کار و پشکنینەکان (Done)',
        type: 'COMPLETE',
        description: `سەرجەم پشکنین و بڕیارەکان تەواوبوون و فایلەکە ئامادەی تەسلیمکردنەوەیە.${actionNote ? ' | تێبینی: ' + actionNote : ''}`,
        staff: staffName,
        date: actionDate,
        time: getKurdistanTime12(false),
        timestamp: Date.now()
      };
      onAddTimelineNote(record.id, noteObj, updates);
    } else if (activeActionModal === 'DELIVER') {
      const person = actionPerson.trim() || record.citizenName || 'خاوەن مامەڵە';
      const updates = {
        deliveredDate: actionDate,
        receiverName: person,
        deliveredBy: staffName,
        status: 'DELIVERED'
      };
      const noteObj = {
        title: 'تەسلیمکردنەوەی کۆتایی بە هاووڵاتی',
        type: 'DELIVERY',
        description: `فایل و پسوولەی فەرمی بە تەواوی ڕادەستی (${person}) کرایەوە.${actionNote ? ' | تێبینی: ' + actionNote : ''}`,
        staff: staffName,
        date: actionDate,
        time: getKurdistanTime12(false),
        timestamp: Date.now()
      };
      onAddTimelineNote(record.id, noteObj, updates);
    }

    setActiveActionModal(null);
    setActionNote('');
    setActionPerson('');
  };

  const openMilestoneModal = (type) => {
    setActiveActionModal(type);
    setActionDate(getKurdistanDate());
    setActionPerson(record.citizenName && record.citizenName !== 'هاوبەشی کارەبا' ? record.citizenName : '');
    setActionNote('');
  };

  // Print Timeline Slip
  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="timeline-modal-printable"
        className="relative w-full max-w-3xl rounded-[28px] bg-white dark:bg-slate-900 border-2 border-amber-500/50 shadow-2xl p-5 sm:p-7 space-y-5 max-h-[94vh] overflow-y-auto transition-colors text-right select-text"
        dir="rtl"
      >
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                  مێژوو و جووڵەی دۆسیە (Lifecycle Journey)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400">
                  فایلی #{record.fileNumber || 'نادیار'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isYellow 
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-400/40' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}>
                  {isYellow ? '📁 فایلی زەرد' : '📄 ئەوراق'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تۆماری تەواوی بەروارەکان: لە داخیلکردن، بردنەدەرەوە، هێنانەوە تا تەواوبوون و تەسلیمکردنەوەی کۆتایی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="چاپکردنی مێژووی جووڵەی فایل"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="داخستن (Esc)"
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* File Quick Identity Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-100/60 to-slate-50 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-950 border border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shadow-inner">
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">ناوی خاوەن مامەڵە:</span>
            <span className="font-black text-slate-900 dark:text-white truncate block text-sm">
              {record.citizenName || 'هاوبەشی کارەبا'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">ژمارەی ئەژمار (ID):</span>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
              {record.accountNumber || 'نیە'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">مۆبایل:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {record.phoneNumber || 'نیە'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold">ماوەی مامەڵە:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black font-mono">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{totalDays !== null ? `${totalDays} ڕۆژ` : 'لە دەوامدایە'}</span>
            </span>
          </div>
        </div>

        {/* ── 5-STAGE VISUAL LIFECYCLE PIPELINE ── */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/70 border-2 border-slate-200/90 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>شریتی قۆناغە سەرەکییەکانی دۆسیە (Lifecycle Pipeline):</span>
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Stepper Dots & Line */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 pt-2 text-center select-none">
            {stages.map((stg, i) => {
              const Icon = stg.icon;
              return (
                <div key={stg.id} className="relative flex flex-col items-center">
                  {/* Connecting Line */}
                  {i < stages.length - 1 && (
                    <div className={`absolute top-4 right-[50%] left-[-50%] h-1 z-0 transition-colors ${
                      stages[i + 1].isDone 
                        ? 'bg-gradient-to-l from-emerald-500 to-amber-500' 
                        : stg.isDone 
                          ? 'bg-amber-500/40 dark:bg-slate-700' 
                          : 'bg-slate-200 dark:bg-slate-800'
                    }`} />
                  )}

                  {/* Circle Icon Badge */}
                  <div className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black transition-all shadow-md ${
                    stg.isDone 
                      ? 'bg-emerald-500 text-slate-950 border-2 border-emerald-400 ring-2 ring-emerald-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}>
                    {stg.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>

                  {/* Stage Name */}
                  <span className={`text-[11px] sm:text-xs font-black mt-2 leading-tight block ${
                    stg.isDone ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {stg.name}
                  </span>

                  {/* Stage Date or Status */}
                  <span className={`text-[10px] font-mono mt-0.5 px-1 rounded block ${
                    stg.date 
                      ? 'text-amber-600 dark:text-amber-400 font-bold' 
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {stg.date || 'نەکراوە'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── QUICK ACTION MILESTONE BUTTONS ── */}
        <div className="space-y-2">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
            ⚡ کردارە خێراکانی قۆناغی دۆسیە (تۆمارکردنی بەروار و جووڵە):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* 1. Temporary Checkout */}
            <button
              type="button"
              onClick={() => openMilestoneModal('CHECKOUT')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                temporaryCheckoutDate 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-amber-500" />
              <span>{temporaryCheckoutDate ? 'دەستکاری بردنەدەرەوە' : 'بردنەدەرەوەی کاتی 📤'}</span>
            </button>

            {/* 2. File Return */}
            <button
              type="button"
              onClick={() => openMilestoneModal('RETURN')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                returnDate 
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-sky-500" />
              <span>{returnDate ? 'دەستکاری هێنانەوە' : 'هێنانەوەی فایل 🏢'}</span>
            </button>

            {/* 3. Mark Completed */}
            <button
              type="button"
              onClick={() => openMilestoneModal('COMPLETE')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                completionDate || record.status === 'COMPLETED'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{completionDate ? 'کارەکان تەواوبوون ✅' : 'تەواوبوونی کارەکان ⚡'}</span>
            </button>

            {/* 4. Final Delivery */}
            <button
              type="button"
              onClick={() => openMilestoneModal('DELIVER')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                deliveredDate || record.status === 'DELIVERED'
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>{deliveredDate ? 'تەسلیمکراوەتەوە 📦' : 'تەسلیمکردنەوەی کۆتایی'}</span>
            </button>
          </div>
        </div>

        {/* Modal Popover for Milestone Action */}
        {activeActionModal && (
          <form onSubmit={handleExecuteMilestoneAction} className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>
                  {activeActionModal === 'CHECKOUT' && 'تۆمارکردنی بردنەدەرەوەی کاتی بۆ هاووڵاتی'}
                  {activeActionModal === 'RETURN' && 'تۆمارکردنی هێنانەوەی فایل بۆ ژووری ١٩'}
                  {activeActionModal === 'COMPLETE' && 'تۆمارکردنی تەواوبوونی پشکنین و سەرجەم کارەکان'}
                  {activeActionModal === 'DELIVER' && 'تۆمارکردنی تەسلیمکردنەوەی کۆتایی بە هاووڵاتی'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">بەرواری ڕووداو:</label>
                <input
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              {(activeActionModal === 'CHECKOUT' || activeActionModal === 'DELIVER') && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">وەرگیرا لەلایەن (ناوی کەسەکە):</label>
                  <input
                    type="text"
                    value={actionPerson}
                    onChange={(e) => setActionPerson(e.target.value)}
                    placeholder="ناوی کەسەکە بنووسە..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">تێبینی یان هۆکار (ئارەزوومەندانە):</label>
              <input
                type="text"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="تێبینی بنووسە ئەگەر پێویستە..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
              >
                پاشەکەوتکردنی قۆناغ
              </button>
            </div>
          </form>
        )}

        {/* ── DETAILED CHRONOLOGICAL JOURNEY (CARDS) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>تۆماری تەواوی جووڵە و ڕووداوەکان ({sortedEvents.length} ڕووداو):</span>
            <span className="text-[11px] font-mono">بەپێی زنجیرەی کاتی (کۆن بۆ نوێ)</span>
          </div>

          <div className="relative border-r-2 border-amber-500/40 mr-4 sm:mr-5 pr-4 sm:pr-6 space-y-4 my-2">
            {sortedEvents.map((evt, idx) => {
              const IconComponent = evt.icon;
              return (
                <div key={evt.id || idx} className="relative group animate-fadeIn">
                  {/* Stepper Dot */}
                  <div className="absolute -right-[27px] sm:-right-[35px] top-1 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md group-hover:scale-110 transition-transform">
                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  {/* Event Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          {evt.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                          {evt.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span>{evt.date}</span>
                        </span>
                        {evt.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>{evt.time}</span>
                          </span>
                        )}
                        {evt.diffText && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                            {evt.diffText}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {evt.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>لەلایەن:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{evt.staff}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ADD CUSTOM AUDIT NOTE FORM ── */}
        <form onSubmit={handleAddNoteSubmit} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              زیادکردنی تێبینی یان بەدواداچوونی دەستی بۆ ئەم فایلە:
            </label>
            
            {/* Category presets */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setNoteCategory('NOTE')}
                className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${noteCategory === 'NOTE' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}
              >
                تێبینی گشتی
              </button>
              <button
                type="button"
                onClick={() => setNoteCategory('CALL')}
                className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${noteCategory === 'CALL' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}
              >
                📞 پەیوەندی
              </button>
              <button
                type="button"
                onClick={() => setNoteCategory('DEPT')}
                className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${noteCategory === 'DEPT' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}
              >
                🏛️ لیژنە/شارەوانی
              </button>
              <button
                type="button"
                onClick={() => setNoteCategory('WARNING')}
                className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${noteCategory === 'WARNING' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}
              >
                ⚠️ کەموکوڕی
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="تێبینییەکە بنووسە (بۆ نموونە: هاووڵاتی سەردانی کرد، پسوولەی پارەدانی هێنا، پەیوەندی پێوە کرا...)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>تۆمارکردن</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px]">
            لەلایەن سیستەمی ئەلیکترۆنی پڕۆژەی ڕووناکی (فرۆشیاری وزە ٢)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
}
