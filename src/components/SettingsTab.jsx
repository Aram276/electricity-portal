import React, { useState, useEffect } from 'react';
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
  LayoutTemplate,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  X,
  ShieldCheck,
  User,
  MessageSquare
} from 'lucide-react';
import RoonakiLogo from './RoonakiLogo';
import { 
  saveFooterSettingsToCloud, 
  subscribeToFooterSettings, 
  subscribeToStaffAccounts, 
  saveStaffAccountsToCloud, 
  DEFAULT_STAFF, 
  logActivity 
} from '../utils/cloudSync';
import {
  getCustomWhatsAppTemplate,
  saveCustomWhatsAppTemplate,
  DEFAULT_WHATSAPP_TEMPLATE
} from '../utils/whatsappHelper';

export default function SettingsTab({ onResetData, records = [], activeStaff = null }) {
  // ── Password / PIN State ──
  const [currentPin, setCurrentPin]   = useState('');
  const [newPin, setNewPin]           = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pinStatus, setPinStatus]     = useState(null);

  // ── Staff Accounts State ──
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTitle, setNewStaffTitle] = useState('فەرمانبەری ژووری ١٩');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('STAFF');
  const [staffMsg, setStaffMsg] = useState('');

  // ── Directorate Title State ──
  const [directorateName, setDirectorateName] = useState(
    () => localStorage.getItem('electricity_directorate_title') || 'بەڕێوەبەرایەتی گشتی دابەشکردنی کارەبا'
  );
  const [dirSaved, setDirSaved] = useState(false);

  // ── Footer Texts State ──
  const [footerData, setFooterData] = useState(() => ({
    description: localStorage.getItem('footer_description') || 'پڕۆژەی نیشتمانیی ڕووناکی؛ پڕۆژەی حکومەتی هەرێمی کوردستان و وەزارەتی کارەبا بۆ دابینکردنی کارەبای ٢٤ کاتژمێری و مۆدێرنکردنی خزمەتگوزارییەکانی هاووڵاتیان.',
    hotline: localStorage.getItem('footer_hotline') || '1992',
    phone: localStorage.getItem('footer_phone') || 'نیە',
    hours: localStorage.getItem('footer_hours') || 'یەکشەممە - پێنجشەممە (٨:٣٠ بەیانی - ١:٣٠ پاشنیوەڕۆ)',
    location: localStorage.getItem('footer_location') || 'هەرێمی کوردستان - هەولێر - فرۆشیاری وزە ٢',
    websiteName: localStorage.getItem('footer_website_name') || 'runaki.gov.krd',
    websiteUrl: localStorage.getItem('footer_website_url') || 'https://runaki.gov.krd',
    copyright: localStorage.getItem('footer_copyright') || `مافی ئەم سیستەمە پارێزراوە بۆ پڕۆژەی ڕووناکی - حکومەتی هەرێمی کوردستان © ${new Date().getFullYear()}`,
    bottomNote: localStorage.getItem('footer_bottom_note') || 'سیستەمی ئەلیکترۆنی پشکنین و بەڕێوەبردنی دۆسیەکانی هاوبەشان'
  }));
  const [footerSaved, setFooterSaved] = useState(false);

  // ── WhatsApp Template State ──
  const [waTemplate, setWaTemplate] = useState(() => getCustomWhatsAppTemplate());
  const [waSaved, setWaSaved] = useState(false);

  useEffect(() => {
    const unsubFooter = subscribeToFooterSettings((cloudSettings) => {
      if (cloudSettings) {
        setFooterData(cloudSettings);
      }
    });

    const unsubStaff = subscribeToStaffAccounts((cloudStaff) => {
      if (cloudStaff && Array.isArray(cloudStaff) && cloudStaff.length > 0) {
        setStaffList(cloudStaff);
      }
    });

    return () => {
      if (typeof unsubFooter === 'function') unsubFooter();
      if (typeof unsubStaff === 'function') unsubStaff();
    };
  }, []);

  // ── Start Editing a Staff User ──
  const handleStartEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setNewStaffUsername(staff.username || staff.name || '');
    setNewStaffName(staff.name || '');
    setNewStaffTitle(staff.title || 'فەرمانبەری ژووری ١٩');
    setNewStaffPin(staff.pin || '');
    setNewStaffRole(staff.role || 'STAFF');
  };

  // ── Cancel Editing ──
  const handleCancelEditStaff = () => {
    setEditingStaffId(null);
    setNewStaffUsername('');
    setNewStaffName('');
    setNewStaffTitle('فەرمانبەری ژووری ١٩');
    setNewStaffPin('');
    setNewStaffRole('STAFF');
  };

  // ── Staff Add or Update Handler ──
  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPin.trim()) return;

    const currentList = Array.isArray(staffList) ? staffList : DEFAULT_STAFF;

    if (editingStaffId) {
      // Update existing staff
      const updated = currentList.map(s => {
        if (s.id === editingStaffId) {
          return {
            ...s,
            username: (newStaffUsername.trim() || newStaffName.trim()).toLowerCase(),
            name: newStaffName.trim(),
            title: newStaffTitle.trim() || 'فەرمانبەری ژووری ١٩',
            pin: newStaffPin.trim(),
            role: newStaffRole
          };
        }
        return s;
      });

      setStaffList(updated);
      saveStaffAccountsToCloud(updated);
      logActivity('STATUS_CHANGE', `دەستکاریکردنی زانیارییەکانی یوزەر: [${newStaffName.trim()}] (@${newStaffUsername.trim().toLowerCase()})`);

      setEditingStaffId(null);
      setNewStaffUsername('');
      setNewStaffName('');
      setNewStaffPin('');
      setStaffMsg('گۆڕانکارییەکانی یوزەر بە سەرکەوتوویی لە کڵاود پاشەکەوت کران ✓');
      setTimeout(() => setStaffMsg(''), 3000);
    } else {
      // Add new staff
      const newStaff = {
        id: 'staff-' + Date.now(),
        username: (newStaffUsername.trim() || newStaffName.trim()).toLowerCase(),
        name: newStaffName.trim(),
        title: newStaffTitle.trim() || 'فەرمانبەری ژووری ١٩',
        pin: newStaffPin.trim(),
        role: newStaffRole
      };

      const updated = [...currentList, newStaff];
      setStaffList(updated);
      saveStaffAccountsToCloud(updated);
      logActivity('STATUS_CHANGE', `زیادکردنی یوزەری نوێ: [${newStaff.name}] (@${newStaff.username})`);

      setNewStaffUsername('');
      setNewStaffName('');
      setNewStaffPin('');
      setStaffMsg('یوزەری نوێ بە سەرکەوتوویی لە کڵاود تۆمار کرا ✓');
      setTimeout(() => setStaffMsg(''), 3000);
    }
  };

  // ── Staff Delete Handler ──
  const handleDeleteStaff = (staffId, staffName) => {
    const currentList = Array.isArray(staffList) ? staffList : DEFAULT_STAFF;
    if (currentList.length <= 1) {
      alert('ناتوانیت هەموو فەرمانبەرەکان بسڕیتەوە! لانیکەم دەبێت یەک ئەکاونت بمێنێتەوە.');
      return;
    }
    const updated = currentList.filter(s => s.id !== staffId);
    setStaffList(updated);
    saveStaffAccountsToCloud(updated);
    logActivity('STATUS_CHANGE', `سڕینەوەی ئەکاونتی فەرمانبەر: [${staffName}]`);
  };

  // ── Change PIN / Password handler (Full Cloud & Local Sync) ──
  const handleChangePIN = (e) => {
    e.preventDefault();
    
    // Determine active staff user
    let currentStaff = activeStaff;
    if (!currentStaff) {
      try {
        currentStaff = JSON.parse(localStorage.getItem('electricity_active_staff') || 'null');
      } catch (err) {}
    }

    const currentList = Array.isArray(staffList) ? staffList : DEFAULT_STAFF;
    
    // Find target staff in list
    const matchedIndex = currentList.findIndex(s => 
      (currentStaff?.id && s.id === currentStaff.id) ||
      (currentStaff?.username && s.username === currentStaff.username) ||
      (currentStaff?.name && s.name === currentStaff.name)
    );

    const targetStaff = matchedIndex !== -1 ? currentList[matchedIndex] : currentList[0];
    const expectedPin = String(targetStaff?.pin || currentStaff?.pin || localStorage.getItem('electricity_portal_pin') || '075075').trim();
    const cleanCurrent = String(currentPin || '').trim();
    const cleanNew = String(newPin || '').trim();
    const cleanConfirm = String(confirmPin || '').trim();

    // Verify current PIN (supports active staff pin, legacy pin, or master pin)
    if (cleanCurrent !== expectedPin && cleanCurrent !== '075075' && cleanCurrent !== localStorage.getItem('electricity_portal_pin')) {
      setPinStatus('wrong-current');
      return;
    }
    if (cleanNew.length < 3) {
      setPinStatus('too-short');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setPinStatus('mismatch');
      return;
    }

    // Update staff in list and cloud
    let updatedStaffList;
    if (matchedIndex !== -1) {
      updatedStaffList = currentList.map((s, idx) => idx === matchedIndex ? { ...s, pin: cleanNew } : s);
    } else {
      updatedStaffList = currentList.map((s, idx) => idx === 0 ? { ...s, pin: cleanNew } : s);
    }

    setStaffList(updatedStaffList);
    saveStaffAccountsToCloud(updatedStaffList);

    // Update local storage
    localStorage.setItem('electricity_portal_pin', cleanNew);
    if (targetStaff) {
      const updatedStaff = { ...targetStaff, pin: cleanNew };
      localStorage.setItem('electricity_active_staff', JSON.stringify(updatedStaff));
    }

    logActivity('STATUS_CHANGE', `گۆڕینی پاسۆردی هەژمار بۆ: [${targetStaff?.name || 'بەڕێوەبەر'}]`);

    setPinStatus('success');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setPinStatus(null), 4000);
  };

  // ── Save directorate name ──
  const handleSaveDirectorate = (e) => {
    e.preventDefault();
    localStorage.setItem('electricity_directorate_title', directorateName);
    setDirSaved(true);
    setTimeout(() => setDirSaved(false), 2500);
  };

  // ── Save Footer Settings to Cloud ──
  const handleSaveFooter = (e) => {
    e.preventDefault();
    saveFooterSettingsToCloud(footerData);
    setFooterSaved(true);
    setTimeout(() => setFooterSaved(false), 3000);
  };

  // ── Reset Footer to Defaults ──
  const handleResetFooter = () => {
    const defaults = {
      description: 'پڕۆژەی نیشتمانیی ڕووناکی؛ پڕۆژەی حکومەتی هەرێمی کوردستان و وەزارەتی کارەبا بۆ دابینکردنی کارەبای ٢٤ کاتژمێری و مۆدێرنکردنی خزمەتگوزارییەکانی هاووڵاتیان.',
      hotline: '1992',
      phone: 'نیە',
      hours: 'یەکشەممە - پێنجشەممە (٨:٣٠ بەیانی - ١:٣٠ پاشنیوەڕۆ)',
      location: 'هەرێمی کوردستان - هەولێر - فرۆشیاری وزە ٢',
      websiteName: 'runaki.gov.krd',
      websiteUrl: 'https://runaki.gov.krd',
      copyright: `مافی ئەم سیستەمە پارێزراوە بۆ پڕۆژەی ڕووناکی - حکومەتی هەرێمی کوردستان © ${new Date().getFullYear()}`,
      bottomNote: 'سیستەمی ئەلیکترۆنی پشکنین و بەڕێوەبردنی دۆسیەکانی هاوبەشان'
    };

    setFooterData(defaults);
    saveFooterSettingsToCloud(defaults);
    setFooterSaved(true);
    setTimeout(() => setFooterSaved(false), 3000);
  };

  // ── WhatsApp Template Handlers ──
  const handleSaveWaTemplate = (e) => {
    e.preventDefault();
    saveCustomWhatsAppTemplate(waTemplate);
    setWaSaved(true);
    setTimeout(() => setWaSaved(false), 3000);
  };

  const handleResetWaTemplate = () => {
    if (window.confirm('ئایا دڵنیایت لە گەڕاندنەوەی دەقی نامەی واتسئاپ بۆ دەقی بنەڕەت؟')) {
      setWaTemplate(DEFAULT_WHATSAPP_TEMPLATE);
      saveCustomWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
      setWaSaved(true);
      setTimeout(() => setWaSaved(false), 3000);
    }
  };

  const handleInsertWaTag = (tag) => {
    setWaTemplate(prev => (prev || '') + tag);
  };

  const handleBackupJSON = () => {
    const dataList = Array.isArray(records) ? records : [];
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataList, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `Electricity_Records_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const currentStaffArray = Array.isArray(staffList) ? staffList : DEFAULT_STAFF;
  const recordsCount = Array.isArray(records) ? records.length : 0;

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
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                گۆڕینی پاسۆردی هەژمار {activeStaff?.name ? `(${activeStaff.name})` : ''}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                پاسۆردی نوێ بۆ هەژمارەکەت دابنێ و لە کڵاود پاشەکەوت دەبێت
              </p>
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

      {/* ── NEW: Staff Accounts Management Card ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  بەڕێوەبردنی ئەکاونتی فەرمانبەران (Staff Accounts)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {currentStaffArray.length} فەرمانبەر
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                زیادکردنی کارمەندان (وەک ڕەعد، ئارام، ...) تا لە کاتی تەسلیمکردنەوە یان دەستکاری دۆسیە، ناوی هەر فەرمانبەرێک بە جیا دیاری بکرێت
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentStaffArray.map((staff) => (
            <div 
              key={staff.id || staff.username || Math.random()} 
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3.5 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{staff.name}</span>
                      <span className="font-mono text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                        @{staff.username || staff.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {staff.title || 'ژووری ١٩'}
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border shrink-0 ${
                  staff.role === 'ADMIN' 
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40' 
                    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-500/40'
                }`}>
                  {staff.role === 'ADMIN' ? '👑 بەڕێوەبەر' : '👤 فەرمانبەر'}
                </span>
              </div>

              {/* Card Bottom: Password + Action Buttons */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">پاسۆرد:</span>
                  <span className="font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-400/40">
                    {staff.pin}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEditStaff(staff)}
                    title={`دەستکاریکردنی زانیارییەکانی ${staff.name}`}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-bold shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>دەستکاری</span>
                  </button>

                  {currentStaffArray.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      title={`سڕینەوەی ئەکاونتی ${staff.name}`}
                      className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors border border-rose-200 dark:border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Staff Form */}
        <form onSubmit={handleSaveStaff} className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all space-y-4 ${
          editingStaffId 
            ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500 shadow-lg' 
            : 'bg-slate-50 dark:bg-slate-900/60 border-dashed border-amber-500/40'
        }`}>
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
              {editingStaffId ? <Edit3 className="w-4 h-4 text-amber-500" /> : <UserPlus className="w-4 h-4 text-amber-500" />}
              <span>{editingStaffId ? `دەستکاریکردنی یوزەری (${newStaffName || 'فەرمانبەر'}):` : 'فۆرمی زیادکردنی فەرمانبەری نوێ:'}</span>
            </div>

            {editingStaffId && (
              <button
                type="button"
                onClick={handleCancelEditStaff}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-bold"
              >
                <X className="w-3.5 h-3.5" />
                <span>پاشگەزبوونەوە</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ناوی بەکارهێنەر (Username):</label>
              <input
                type="text"
                required
                placeholder="ناوی یوزەر (بۆ نموونە: raad)"
                value={newStaffUsername}
                onChange={(e) => setNewStaffUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ناوی فەرمانبەر (کوردی):</label>
              <input
                type="text"
                required
                placeholder="ناوی فەرمانبەر (بۆ نموونە: ڕەعد)"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ناونیشانی کار (بەش/ژوور):</label>
              <input
                type="text"
                required
                placeholder="وەک: فەرمانبەری ژووری ١٩"
                value={newStaffTitle}
                onChange={(e) => setNewStaffTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">پاسۆرد (Password):</label>
              <input
                type="text"
                required
                placeholder="پاسۆرد بۆ چوونەژوورەوە"
                value={newStaffPin}
                onChange={(e) => setNewStaffPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">دەسەڵاتی سیستەم:</label>
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="STAFF">👤 فەرمانبەر (Staff)</option>
                <option value="ADMIN">👑 بەڕێوەبەر (Admin)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {editingStaffId ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{editingStaffId ? 'پاشەکەوتکردنی گۆڕانکارییەکان' : 'تۆمارکردنی فەرمانبەری نوێ'}</span>
              </button>

              {editingStaffId && (
                <button
                  type="button"
                  onClick={handleCancelEditStaff}
                  className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  پاشگەزبوونەوە
                </button>
              )}
            </div>

            {staffMsg && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/30">
                {staffMsg}
              </span>
            )}
          </div>
        </form>
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
                value={footerData?.description || ''}
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
                value={footerData?.hotline || ''}
                onChange={(e) => setFooterData({ ...footerData, hotline: e.target.value })}
                placeholder="1992"
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
                value={footerData?.phone || ''}
                onChange={(e) => setFooterData({ ...footerData, phone: e.target.value })}
                placeholder="نیە"
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
                value={footerData?.hours || ''}
                onChange={(e) => setFooterData({ ...footerData, hours: e.target.value })}
                placeholder="یەکشەممە - پێنجشەممە (٨:٣٠ بەیانی - ١:٣٠ پاشنیوەڕۆ)"
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
                value={footerData?.location || ''}
                onChange={(e) => setFooterData({ ...footerData, location: e.target.value })}
                placeholder="هەرێمی کوردستان - هەولێر - فرۆشیاری وزە ٢"
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
                value={footerData?.websiteName || ''}
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
                value={footerData?.websiteUrl || ''}
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
                value={footerData?.copyright || ''}
                onChange={(e) => setFooterData({ ...footerData, copyright: e.target.value })}
                placeholder="مافی ئەم سیستەمە پارێزراوە..."
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
                value={footerData?.bottomNote || ''}
                onChange={(e) => setFooterData({ ...footerData, bottomNote: e.target.value })}
                placeholder="سیستەمی ئەلیکترۆنی پشکنین..."
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

      {/* ── NEW: WhatsApp Message Template Customization Card ───────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  دەستکاریکردنی دەقی فەرمیی نامەی واتسئاپ (WhatsApp Template)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Custom Template
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                دانانی ئەو دەقەی بە خۆکاری دەنێردرێت بۆ هاووڵاتییان لە کاتی ئاگادارکردنەوە لە ڕێگەی واتسئاپ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetWaTemplate}
            className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>گەڕاندنەوە بۆ بنەڕەت</span>
          </button>
        </div>

        <form onSubmit={handleSaveWaTemplate} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            دەتوانیت هەر زانیاری و تێکستێک دەتەوێت زیادی بکەیت. تاگە تایبەتەکان کلیک بکە بۆ زیادکردنی شوێنی خۆکار:
          </p>

          {/* Variable tags shortcuts */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تاگی ئۆتۆماتیکی:</span>
            {[
              { label: 'ناوی هاووڵاتی', tag: ' {ناو} ' },
              { label: 'ژمارەی فایل', tag: ' {ژمارەی_فایل} ' },
              { label: 'ژمارەی ئەژمار (ID)', tag: ' {ژمارەی_ئەژمار} ' },
              { label: 'دۆخی مامەڵە', tag: ' {دۆخ} ' },
              { label: 'ژووری ١٩', tag: ' {ژوور} ' },
              { label: 'ناوی فەرمانگە', tag: ' {فەرمانگە} ' },
            ].map(v => (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleInsertWaTag(v.tag)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white font-mono text-xs font-bold transition-all shadow-sm"
              >
                + {v.label}
              </button>
            ))}
          </div>

          <textarea
            rows="8"
            value={waTemplate}
            onChange={(e) => setWaTemplate(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/40 text-slate-900 dark:text-white text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-emerald-500 font-sans shadow-inner"
            placeholder="دەقی نامەی فەرمیی واتسئاپ لێرە دابنێ..."
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>پاشەکەوتکردنی دەقی نوێی واتسئاپ</span>
            </button>

            {waSaved && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center gap-2 font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ دەقی نامەی واتسئاپ بە سەرکەوتوویی پاشەکەوت کرا!</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Backup, Restore and Maintenance */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Download className="w-4 h-4 text-emerald-500" />
            <span>پاڵپشتی و پاراستنی زانیارییەکان (Cloud Backup & Restore)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            کۆی فایلەکان: {recordsCount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Download JSON Backup */}
          <button
            type="button"
            onClick={handleBackupJSON}
            className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-500/30 hover:border-emerald-500 text-right space-y-1 transition-all shadow-sm active:scale-95 group"
          >
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm">
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <span>داگرتنی کۆپی یەدەگ (JSON)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              دابەزاندنی تەواوی داتابەیس بۆ سەر کۆمپیوتەر
            </p>
          </button>

          {/* Restore JSON Backup */}
          <label className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border-2 border-blue-500/30 hover:border-blue-500 text-right space-y-1 transition-all shadow-sm active:scale-95 cursor-pointer group block">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const parsed = JSON.parse(event.target.result);
                    const backupList = Array.isArray(parsed) ? parsed : (parsed.records || []);
                    if (!backupList.length) {
                      alert('فایلی هەڵبژێردراو هیچ داتایەکی دروستی تێدا نەبوو.');
                      return;
                    }
                    if (window.confirm(`ئایا دڵنیایت لە گەڕاندنەوەی (${backupList.length}) دۆسیە لە کۆپی یەدەگ بۆ ناو کڵاود؟`)) {
                      if (onResetData) onResetData(backupList);
                    }
                  } catch (err) {
                    alert('هەڵە لە خوێندنەوەی فایلی کۆپی یەدەگ: ' + err.message);
                  }
                };
                reader.readAsText(f);
                e.target.value = '';
              }}
            />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs sm:text-sm">
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>گەڕاندنەوەی کۆپی یەدەگ</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ئەپڵۆدکردنی فایلی JSON بۆ گەڕاندنەوە
            </p>
          </label>

          {/* Reset to Factory Defaults */}
          <button
            type="button"
            onClick={onResetData}
            className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border-2 border-rose-500/30 hover:border-rose-500 text-right space-y-1 transition-all shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>گەڕاندنەوە بۆ سەرەتا</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              سڕینەوەی هەموو داتاکان بە دۆخی پاک
            </p>
          </button>

        </div>
      </div>

    </div>
  );
}
