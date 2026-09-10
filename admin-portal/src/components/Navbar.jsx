import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Sun, Moon, Download, Smartphone, Monitor, X, Check, Menu, FileText, Cloud } from 'lucide-react';
import RoonakiLogo from './RoonakiLogo';

export default function Navbar({ currentView, setCurrentView, isAdmin, isAdminPath, activeStaff, onOpenAdminLogin, onAdminLogout, isDarkMode, onToggleTheme, onToggleSidebar, isSidebarOpen }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 3) {
        if (!isAdmin) {
          onOpenAdminLogin();
        }
        return 0;
      }
      return next;
    });
    setTimeout(() => setLogoClicks(0), 1500);
  };

  useEffect(() => {
    // Check if already in standalone/PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <>
      <header className="relative z-40 w-full border-b border-amber-500/20 bg-white/95 dark:bg-[#070b16]/95 backdrop-blur-xl transition-colors duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Right Side (دەستەڕاست): Menu Hamburger Toggle Button + Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Slide-over Sidebar Drawer Button on the Right */}
              {currentView === 'admin' && onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  title="مێنیوی بەڕێوەبردن (سڵایدباڕ) ☰"
                  className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 active:scale-90 transition-all border border-amber-400/60 shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Logo & Directorate Title */}
              <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={handleLogoClick} title="پڕۆژەی ڕووناکی">
                <RoonakiLogo 
                  className="h-8 sm:h-10 md:h-11 w-auto" 
                  showText={false}
                />
                <div className="flex flex-col text-right">
                  <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 leading-tight">
                    پڕۆژەی ڕووناکی
                  </span>
                  <span className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                    فرۆشیاری وزە ٢
                  </span>
                </div>
              </div>
            </div>

            {/* Left Side (دەستەچەپ): Essential Controls Only */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* Theme Toggle Button (Light/Dark) */}
              <button
                onClick={onToggleTheme}
                title={isDarkMode ? 'گۆڕین بۆ لایت مۆد' : 'گۆڕین بۆ دارک مۆد'}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 transition-all shadow-sm shrink-0"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* When on Citizen View */}
              {currentView === 'citizen' ? (
                <button
                  onClick={isAdmin ? () => setCurrentView('admin') : onOpenAdminLogin}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 bg-amber-500/15 hover:bg-amber-500/25 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-amber-400/50 dark:border-amber-500/30 transition-all shadow-sm shrink-0 cursor-pointer"
                  title={isAdmin ? "چوونە پەنێڵی ئادمین" : "چوونەژوورەوەی ستاف و بەڕێوەبەر"}
                >
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{isAdmin ? 'پەنێڵی ئادمین' : 'چوونەژوورەوە'}</span>
                </button>
              ) : (
                /* When inside Admin Portal */
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  {/* Active Staff Badge with Role */}
                  {activeStaff && (
                    <div 
                      title={`${activeStaff.name} (${activeStaff.title || 'ژووری ١٩'})`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-sm shrink-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                      <span className="hidden md:inline font-black max-w-[120px] truncate">{activeStaff.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${
                        activeStaff.role === 'ADMIN' 
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' 
                          : activeStaff.role === 'VIEWER'
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      }`}>
                        {activeStaff.role === 'ADMIN' ? 'ئادمین' : activeStaff.role === 'VIEWER' ? 'بینەر' : 'ستاف'}
                      </span>
                    </div>
                  )}

                  {/* Logout Button (Icon) */}
                  <button
                    onClick={onAdminLogout}
                    title="دەرچوون لە ئەژمێر"
                    className="p-2 sm:p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 transition-all shrink-0 flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      </header>

      {/* PWA Install Instructions Modal (When Automatic Prompt Not Fired) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 shadow-2xl p-6 sm:p-7 space-y-5 text-right transition-colors">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-black text-base sm:text-lg">
                <Download className="w-5 h-5" />
                <span>ئینستاڵکردنی ئەپڵیکەیشن (PWA)</span>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              دەتوانیت پڕۆژەی ڕووناکی وەک ئەپڵیکەیشنێکی سەربەخۆ داببەزێنیت بۆ سەر شاشەی سەرەکیی (Home Screen) مۆبایلەکەت یاخود کۆمپیوتەرەکەت:
            </p>

            <div className="space-y-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              
              {/* Android & PC */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 space-y-1">
                <div className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>لە ئەندرۆید (Android) و کۆمپیوتەر (Chrome/Edge):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  لە سەرەوە یان دەستەڕاستی بەستەری براوزەر، کلیک لەسەر ئایکۆنی <strong>«ئینستاڵ (Install App)»</strong> یان ٣ خاڵەکە ➔ <strong>«Add to Home Screen»</strong> بکە.
                </p>
              </div>

              {/* iPhone / iOS */}
              <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>لە ئایفۆن (iPhone / Safari):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  لە خوارەوەی براوزەری Safari کلیک لەسەر دوگمەی <strong>Share (ناردن) ⎋</strong> بکە، پاشان بڕۆ خوارەوە و کلیک لەسەر <strong>«Add to Home Screen ⊞»</strong> بکە.
                </p>
              </div>

            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all active:scale-98 shadow-md shadow-amber-500/20"
            >
              تێگەیشتم
            </button>

          </div>
        </div>
      )}
    </>
  );
}
