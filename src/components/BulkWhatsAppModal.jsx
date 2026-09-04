import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  X, 
  User, 
  Folder, 
  Hash, 
  Phone, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Users, 
  CheckCheck, 
  Sparkles, 
  AlertTriangle, 
  Play, 
  Edit3, 
  RefreshCw, 
  Eye, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { 
  generateWhatsAppUrl, 
  cleanIraqiPhone, 
  getCustomWhatsAppTemplate, 
  saveCustomWhatsAppTemplate, 
  buildWhatsAppMessage, 
  DEFAULT_WHATSAPP_TEMPLATE 
} from '../utils/whatsappHelper';

export default function BulkWhatsAppModal({ 
  isOpen, 
  onClose, 
  records = [], 
  selectedIds = [], 
  onMarkNotified 
}) {
  const [targetGroup, setTargetGroup] = useState('COMPLETED_UNNOTIFIED'); 
  // 'COMPLETED_UNNOTIFIED' | 'ALL_COMPLETED' | 'SELECTED' | 'ALL_WITH_PHONE'

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  
  // Custom WhatsApp template state
  const [customTemplate, setCustomTemplate] = useState(() => getCustomWhatsAppTemplate());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);

  // Compute eligible target queue
  useEffect(() => {
    if (!isOpen) return;

    let eligible = [];
    if (targetGroup === 'SELECTED' && selectedIds.length > 0) {
      const selectedSet = new Set(selectedIds);
      eligible = records.filter(r => selectedSet.has(r.id) && cleanIraqiPhone(r.phoneNumber));
    } else if (targetGroup === 'COMPLETED_UNNOTIFIED') {
      eligible = records.filter(r => r.status === 'COMPLETED' && cleanIraqiPhone(r.phoneNumber) && !r.notifiedAt);
    } else if (targetGroup === 'ALL_COMPLETED') {
      eligible = records.filter(r => r.status === 'COMPLETED' && cleanIraqiPhone(r.phoneNumber));
    } else if (targetGroup === 'ALL_WITH_PHONE') {
      eligible = records.filter(r => cleanIraqiPhone(r.phoneNumber));
    }

    setQueue(eligible);
    setCurrentIndex(0);
    setSentCount(0);
    setSkippedCount(0);
  }, [isOpen, targetGroup, selectedIds, records]);

  if (!isOpen) return null;

  const currentRecord = queue[currentIndex];
  const totalInQueue = queue.length;
  const progressPercent = totalInQueue > 0 ? Math.round((currentIndex / totalInQueue) * 100) : 0;
  const isFinished = currentIndex >= totalInQueue && totalInQueue > 0;

  const handleTemplateChange = (val) => {
    setCustomTemplate(val);
    saveCustomWhatsAppTemplate(val);
    setTemplateSavedMsg(true);
    setTimeout(() => setTemplateSavedMsg(false), 2000);
  };

  const handleInsertTag = (tag) => {
    const updated = (customTemplate || '') + tag;
    setCustomTemplate(updated);
    saveCustomWhatsAppTemplate(updated);
  };

  const handleResetTemplate = () => {
    if (window.confirm('ئایا دڵنیایت لە گەڕاندنەوەی دەقی نامەی واتسئاپ بۆ دەقی بنەڕەت؟')) {
      setCustomTemplate(DEFAULT_WHATSAPP_TEMPLATE);
      saveCustomWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
      setTemplateSavedMsg(true);
      setTimeout(() => setTemplateSavedMsg(false), 2000);
    }
  };

  const handleSendCurrent = () => {
    if (!currentRecord) return;

    const url = generateWhatsAppUrl(currentRecord, customTemplate);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // Mark as notified in database
      if (onMarkNotified) {
        onMarkNotified(currentRecord.id);
      }

      setSentCount(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setSkippedCount(prev => prev + 1);
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/50 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">ناردنی بەکۆمەڵی نامەی واتسئاپ</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  Bulk WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">ئاگادارکردنەوەی ژیرانەی هاووڵاتییان بۆ سەردانی ژووری ١٩</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Custom Message Template Editor (Accordion) ── */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-500" />
              <span>دەستکاریکردن و دانانی دەقی دڵی خۆت بۆ نامەی واتسئاپ (Template)</span>
              {templateSavedMsg && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] animate-pulse">
                  ✓ پاشەکەوت کرا
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
              <span>{isEditorOpen ? 'داخستن' : 'ئیدیتکردن'}</span>
              {isEditorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isEditorOpen && (
            <div className="p-4 pt-0 space-y-3 border-t border-emerald-500/20 animate-fadeIn">
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                دەتوانیت هەر تێکستێک دەتەوێت لێرە بنووسیت. وشە نیشانکراوەکانی وەک <strong>{'{ناو}'}</strong> و <strong>{'{ژمارەی_فایل}'}</strong> بە خۆکاری بۆ هەر هاووڵاتییەک دەگۆڕدرێن:
              </p>

              {/* Variable shortcut buttons */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="font-bold text-slate-600 dark:text-slate-400">زیادکردن:</span>
                {[
                  { label: 'ناوی هاووڵاتی', tag: ' {ناو} ' },
                  { label: 'ژمارەی فایل', tag: ' {ژمارەی_فایل} ' },
                  { label: 'ژمارەی ئەژمار (ID)', tag: ' {ژمارەی_ئەژمار} ' },
                  { label: 'دۆخی مامەڵە', tag: ' {دۆخ} ' },
                  { label: 'ژووری ١٩', tag: ' {ژوور} ' },
                ].map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertTag(v.tag)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white font-mono text-[11px] transition-colors"
                  >
                    + {v.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                rows="6"
                value={customTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-emerald-500/40 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500 font-sans shadow-inner"
                placeholder="دەقی نامەی واتسئاپ لێرە بنووسە..."
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>گەڕاندنەوە بۆ دەقی بنەڕەت</span>
                </button>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ بەردەوام دەمێنێتەوە بۆ هەموو نامەکان
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Target Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            کۆمەڵەی ئامانج بۆ ناردنی نامە:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            <button
              type="button"
              onClick={() => setTargetGroup('COMPLETED_UNNOTIFIED')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                targetGroup === 'COMPLETED_UNNOTIFIED'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              تەواوبوو (بێ نامە)
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setTargetGroup('SELECTED')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  targetGroup === 'SELECTED'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                دەستنیشانکراو ({selectedIds.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setTargetGroup('ALL_COMPLETED')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                targetGroup === 'ALL_COMPLETED'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              هەموو تەواوبووەکان
            </button>

            <button
              type="button"
              onClick={() => setTargetGroup('ALL_WITH_PHONE')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                targetGroup === 'ALL_WITH_PHONE'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              سەرجەم بە مۆبایلەکان
            </button>

          </div>
        </div>

        {/* Progress Overview Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>پێشکەوتنی ناردن:</span>
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              {currentIndex} لە {totalInQueue} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span className="text-emerald-600 font-bold">✓ نێردراو: {sentCount}</span>
            <span className="text-amber-600 font-bold">تێپەڕێنراو: {skippedCount}</span>
            <span>ماوە: {Math.max(0, totalInQueue - currentIndex)}</span>
          </div>
        </div>

        {/* Active Item Card */}
        {currentRecord && !isFinished ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/70 dark:bg-gradient-to-br dark:from-emerald-950/30 dark:to-slate-950 border-2 border-emerald-500/40 space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white font-black flex items-center justify-center font-mono text-xl shadow-md">
                  {currentRecord.fileNumber}
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white text-base">
                    {currentRecord.citizenName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                    <span>مۆبایل: {currentRecord.phoneNumber}</span>
                    <span>•</span>
                    <span>ID: {currentRecord.accountNumber || 'نیە'}</span>
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl text-xs font-black border bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40">
                {currentRecord.fileType === 'YELLOW_FOLDER' ? '📁 فایلی زەرد' : '📄 ئەوراق'}
              </span>
            </div>

            {/* Live Message Preview Box */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 space-y-1.5 shadow-sm text-right">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>پێشبینینی دەقی نامە بۆ ئەم هاووڵاتییە (Preview):</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {buildWhatsAppMessage(currentRecord, customTemplate)}
              </p>
            </div>

            {/* Notification History if already notified */}
            {currentRecord.notifiedAt && (
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5 font-bold">
                <CheckCheck className="w-4 h-4 text-blue-500" />
                <span>پێشتر لە بەرواری ({currentRecord.notifiedAt}) نامەی بۆ نێردراوە.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendCurrent}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>ناردنی واتسئاپ و کەسی دواتر ➔</span>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                تێپەڕاندن (Skip)
              </button>
            </div>

          </div>
        ) : isFinished ? (
          <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">پرۆسەی ناردن بە سەرکەوتوویی تەواو بوو! 🎉</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              کۆی گشتی ({sentCount}) نامەی فەرمی بۆ هاووڵاتییان نێردرا. داتاکانیان لە کڵاود وەک ئاگادارکراو تۆمار کران.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              داخستنی پەنجەرە
            </button>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">هیچ هاووڵاتییەک لەم گروپەدا نەدۆزرایەوە</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">تکایە فلتەرەکەی سەرەوە بگۆڕە یان دڵنیابە لە هەبوونی ژمارەی مۆبایل.</p>
          </div>
        )}

      </div>
    </div>
  );
}
