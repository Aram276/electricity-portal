import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Image, 
  KeyRound, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  Download, 
  Building2, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertTriangle,
  Phone,
  Clock,
  MapPin,
  Globe,
  FileText,
  LayoutTemplate
} from 'lucide-react';
import RoonakiLogo from './RoonakiLogo';

export default function SettingsTab({ onResetData, records }) {
  // ── Password / PIN State ──
  const [currentPin, setCurrentPin]   = useState('');
  const [newPin, setNewPin]           = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pinStatus, setPinStatus]     = useState(null);

  // ── Directorate Title State ──
  const [directorateName, setDirectorateName] = useState(
    () => localStorage.getItem('electricity_directorate_title') || 'بەڕێوەبەرایەتی گشتی دابەشکردنی کارەبا'
  );
  const [dirSaved, setDirSaved] = useState(false);

  // ── Footer Texts State ──
  const [footerData, setFooterData] = useState(() => ({
    description: localStorage.getItem('footer_description') || 'پڕۆژەی نیشتمانیی ڕووناکی؛ پڕۆژەی حکومەتی هەرێمی کوردستان و وەزارەتی کارەبا بۆ دابینکردنی کارەبای ٢٤ کاتژمێری و مۆدێرنکردنی خزمەتگوزارییەکانی هاووڵاتیان.',
    hotline: localStorage.getItem('footer_hotline') || '122',
    phone: localStorage.getItem('footer_phone') || '066 123 4567',
    hours: localStorage.getItem('footer_hours') || 'یەکشەممە - پێنجشەممە (٨:٣٠ بەیانی - ٢:٠٠ پاشنیوەڕۆ)',
    location: localStorage.getItem('footer_location') || 'هەرێمی کوردستان - سەرجەم بەڕێوەبەرایەتییەکان',
    websiteName: localStorage.getItem('footer_website_name') || 'runaki.gov.krd',
    websiteUrl: localStorage.getItem('footer_website_url') || 'https://runaki.gov.krd',
    copyright: localStorage.getItem('footer_copyright') || `مافی ئەم سیستەمە پارێزراوە بۆ پڕۆژەی ڕووناکی - حکومەتی هەرێمی کوردستان © ${new Date().getFullYear()}`,
    bottomNote: localStorage.getItem('footer_bottom_note') || 'سیستەمی ئەلیکترۆنی پشکنین و بەڕێوەبردنی دۆسیەکانی هاوبەشان'
  }));
  const [footerSaved, setFooterSaved] = useState(false);

  // ── Change PIN handler ──
  const handleChangePIN = (e) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('electricity_portal_pin') || '075075';

    if (currentPin !== storedPin) {
      setPinStatus('wrong-current');
      return;
    }
    if (newPin.length < 4) {
      setPinStatus('too-short');
      return;
    }
    if (newPin !== confirmPin) {
      setPinStatus('mismatch');
      return;
    }

    localStorage.setItem('electricity_portal_pin', newPin);
    setPinStatus('success');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setPinStatus(null), 3500);
  };

  // ── Save directorate name ──
  const handleSaveDirectorate = (e) => {
    e.preventDefault();
    localStorage.setItem('electricity_directorate_title', directorateName);
    setDirSaved(true);
    setTimeout(() => setDirSaved(false), 2500);
  };

  // ── Save Footer Settings ──
  const handleSaveFooter = (e) => {
    e.preventDefault();
    localStorage.setItem('footer_description', footerData.description);
    localStorage.setItem('footer_hotline', footerData.hotline);
    localStorage.setItem('footer_phone', footerData.phone);
    localStorage.setItem('footer_hours', footerData.hours);
    localStorage.setItem('footer_location', footerData.location);
    localStorage.setItem('footer_website_name', footerData.websiteName);
    localStorage.setItem('footer_website_url', footerData.websiteUrl);
    localStorage.setItem('footer_copyright', footerData.copyright);
    localStorage.setItem('footer_bottom_note', footerData.bottomNote);

    window.dispatchEvent(new Event('footer_settings_updated'));
    setFooterSaved(true);
    setTimeout(() => setFooterSaved(false), 3000);
  };

  // ── Reset Footer to Defaults ──
  const handleResetFooter = () => {
    const defaults = {
      description: 'پڕۆژەی نیشتمانیی ڕووناکی؛ پڕۆژەی حکومەتی هەرێمی کوردستان و وەزارەتی کارەبا بۆ دابینکردنی کارەبای ٢٤ کاتژمێری و مۆدێرنکردنی خزمەتگوزارییەکانی هاووڵاتیان.',
      hotline: '122',
      phone: '066 123 4567',
      hours: 'یەکشەممە - پێنجشەممە (٨:٣٠ بەیانی - ٢:٠٠ پاشنیوەڕۆ)',
      location: 'هەرێمی کوردستان - سەرجەم بەڕێوەبەرایەتییەکان',
      websiteName: 'runaki.gov.krd',
      websiteUrl: 'https://runaki.gov.krd',
      copyright: `مافی ئەم سیستەمە پارێزراوە بۆ پڕۆژەی ڕووناکی - حکومەتی هەرێمی کوردستان © ${new Date().getFullYear()}`,
      bottomNote: 'سیستەمی ئەلیکترۆنی پشکنین و بەڕێوەبردنی دۆسیەکانی هاوبەشان'
    };

    setFooterData(defaults);
    Object.keys(defaults).forEach(key => {
      const storageKey = 'footer_' + key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      localStorage.setItem(storageKey, defaults[key]);
    });
    window.dispatchEvent(new Event('footer_settings_updated'));
    setFooterSaved(true);
    setTimeout(() => setFooterSaved(false), 3000);
  };

  const handleBackupJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `Electricity_Records_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">

      {/* Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 transition-colors shadow-sm">
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-500">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">ڕێکخستنەکانی سیستەم و فووتەر</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">گۆڕینی پاسۆرد، زانیارییەکانی خوارەوەی پەڕە (Footer)، و ناوی فەرمانگە</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Change PIN Card ─────────────────────────────── */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 transition-colors">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">گۆڕینی پاسۆردی ئادمین</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">پاسۆردی تایبەتی خۆت دابنێ</p>
            </div>
          </div>

          <form onSubmit={handleChangePIN} className="space-y-4">
            {/* Current PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>پاسۆردی ئێستا (کۆنەکە):</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPin}
                  onChange={(e) => { setCurrentPin(e.target.value); setPinStatus(null); }}
                  placeholder="••••••"
                  className={`w-full pr-4 pl-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 font-mono text-base tracking-widest focus:outline-none transition-colors ${
                    pinStatus === 'wrong-current'
                      ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-500/5'
                      : 'border-slate-300 dark:border-slate-700 focus:border-amber-500'
                  } text-slate-900 dark:text-white`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinStatus === 'wrong-current' && (
                <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> پاسۆردی ئێستا هەڵەیە
                </p>
              )}
            </div>

            {/* New PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>پاسۆردی نوێ:</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPin}
                  onChange={(e) => { setNewPin(e.target.value); setPinStatus(null); }}
                  placeholder="لانیکەم ٤ پیت"
                  className={`w-full pr-4 pl-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 font-mono text-base tracking-widest focus:outline-none transition-colors ${
                    pinStatus === 'too-short'
                      ? 'border-rose-400 dark:border-rose-500'
                      : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
                  } text-slate-900 dark:text-white`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinStatus === 'too-short' && (
                <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> پاسۆرد دەبێت لانیکەم ٤ پیت بێت
                </p>
              )}
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>دووپاتکردنەوەی پاسۆردی نوێ:</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value); setPinStatus(null); }}
                  placeholder="پاسۆردی نوێ دووپات بکەرەوە"
                  className={`w-full pr-4 pl-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 font-mono text-base tracking-widest focus:outline-none transition-colors ${
                    pinStatus === 'mismatch'
                      ? 'border-rose-400 dark:border-rose-500'
                      : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
                  } text-slate-900 dark:text-white`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPin && newPin && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${confirmPin === newPin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {confirmPin === newPin
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> پاسۆردەکان یەکسانن ✓</>
                    : <><AlertTriangle className="w-3.5 h-3.5" /> پاسۆردەکان جیاوازن</>
                  }
                </p>
              )}
              {pinStatus === 'mismatch' && !confirmPin && (
                <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> دوو پاسۆردەکە یەکسان نین
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>پاشەکەوتکردنی پاسۆردی نوێ</span>
            </button>

            {pinStatus === 'success' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ پاسۆردی نوێت بە سەرکەوتوویی پاشەکەوت کرا!</span>
              </div>
            )}
          </form>
        </div>

        {/* ── Directorate & Logo ───────────────────────────── */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-900 dark:text-white font-bold text-sm">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>ناوی بەڕێوەبەرایەتی سەرەکی</span>
            </div>
            <form onSubmit={handleSaveDirectorate} className="space-y-3">
              <input
                type="text"
                value={directorateName}
                onChange={(e) => setDirectorateName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>پاشەکەوتکردنی ناوی فەرمانگە</span>
              </button>
              {dirSaved && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ناوی فەرمانگە پاشەکەوت کرا</span>
                </div>
              )}
            </form>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
              <Image className="w-4 h-4 text-amber-500" />
              <span>لۆگۆی پڕۆژەی ڕووناکی</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-2">
              <RoonakiLogo className="h-16 w-auto" showText={false} />
              <p className="text-[11px] text-slate-400">
                لۆگۆ لە <code className="text-amber-600 dark:text-amber-400 font-mono">public/logo.png</code> دانراوە
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── NEW: Comprehensive Footer Texts Customization Card ───────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-500">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                دەستکاریکردنی تێکست و زانیارییەکانی خوارەوەی پەڕە (Footer)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                گۆڕینی ڕاستەوخۆی دەقی وەسف، تەلەفۆن، هێڵی فریاکەوتن، کاتژمێری دەوام، و ماڵپەڕ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetFooter}
            className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>گەڕاندنەوە بۆ بنەڕەت</span>
          </button>
        </div>

        <form onSubmit={handleSaveFooter} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>دەقی وەسفی پڕۆژە (Description):</span>
              </label>
              <textarea
                rows="2"
                value={footerData.description}
                onChange={(e) => setFooterData({ ...footerData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Hotline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی هێڵی تەلەفۆنی پڕۆژەی ڕووناکی:</span>
              </label>
              <input
                type="text"
                value={footerData.hotline}
                onChange={(e) => setFooterData({ ...footerData, hotline: e.target.value })}
                placeholder="122"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>ژمارەی تەلەفۆنی پەیوەندییەکان:</span>
              </label>
              <input
                type="text"
                value={footerData.phone}
                onChange={(e) => setFooterData({ ...footerData, phone: e.target.value })}
                placeholder="066 123 4567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Hours */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>کاتی دەوام و ئەرشیف:</span>
              </label>
              <input
                type="text"
                value={footerData.hours}
                onChange={(e) => setFooterData({ ...footerData, hours: e.target.value })}
                placeholder="یەکشەممە - پێنجشەممە (٨:٣٠ بەیانی - ٢:٠٠ پاشنیوەڕۆ)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>شوێن و ناونیشانی فەرمانگەکان:</span>
              </label>
              <input
                type="text"
                value={footerData.location}
                onChange={(e) => setFooterData({ ...footerData, location: e.target.value })}
                placeholder="هەرێمی کوردستان - سەرجەم بەڕێوەبەرایەتییەکان"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Website Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>ناوی ماڵپەڕ (تێکستی بەستەر):</span>
              </label>
              <input
                type="text"
                value={footerData.websiteName}
                onChange={(e) => setFooterData({ ...footerData, websiteName: e.target.value })}
                placeholder="runaki.gov.krd"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>لینکی بەستەری ماڵپەڕ (URL):</span>
              </label>
              <input
                type="text"
                value={footerData.websiteUrl}
                onChange={(e) => setFooterData({ ...footerData, websiteUrl: e.target.value })}
                placeholder="https://runaki.gov.krd"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Copyright */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>دەقی مافی پارێزراو (Copyright):</span>
              </label>
              <input
                type="text"
                value={footerData.copyright}
                onChange={(e) => setFooterData({ ...footerData, copyright: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Bottom Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>تێبینی خوارەوە:</span>
              </label>
              <input
                type="text"
                value={footerData.bottomNote}
                onChange={(e) => setFooterData({ ...footerData, bottomNote: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>پاشەکەوتکردنی زانیارییەکانی فووتەر</span>
          </button>

          {footerSaved && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center gap-2 font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ تێکستەکانی فووتەر بە سەرکەوتوویی نوێکرانەوە!</span>
            </div>
          )}
        </form>
      </div>

      {/* Backup and Maintenance */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl transition-colors">
        <div className="text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
          پاڵپشتی و پاراستنی زانیارییەکان (Backup & Reset)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleBackupJSON}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-right space-y-1 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
              <Download className="w-4 h-4" />
              <span>داگرتنی کۆپی پاڵپشتی داتاکان (JSON Backup)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              دابەزاندنی سەرجەم ({records.length}) مامەڵەکە وەک فایلی پارێزراو
            </p>
          </button>

          <button
            onClick={onResetData}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-rose-500 text-right space-y-1 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>گەڕاندنەوە بۆ دۆخی سەرەتایی بنەڕەت</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              سڕینەوەی هەموو گۆڕانکارییەکان و گەڕانەوە بۆ داتای نموونەیی
            </p>
          </button>
        </div>
      </div>

    </div>
  );
}
