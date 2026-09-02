import React, { useState, useEffect } from 'react';
import { Search, Lock, LogOut, Sun, Moon, Download, Smartphone, Monitor, X, Check } from 'lucide-react';
import RoonakiLogo from './RoonakiLogo';

export default function Navbar({ currentView, setCurrentView, isAdmin, onOpenAdminLogin, onAdminLogout, isDarkMode, onToggleTheme }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

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
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            
            {/* Logo & Directorate Title */}
            <div className="cursor-pointer shrink-0" onClick={() => setCurrentView('citizen')}>
              <RoonakiLogo 
                className="h-10 sm:h-12 md:h-14 w-auto" 
                textClassName="hidden sm:block" 
              />
            </div>

            {/* Mobile compact title when logo text hidden */}
            <div className="block sm:hidden text-center cursor-pointer" onClick={() => setCurrentView('citizen')}>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 block">
                پڕۆژەی ڕووناکی
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-bold">
                فرۆشیاری وزە ٢
              </span>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* Install App Button */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  title="ئینستاڵکردنی پڕۆژەی ڕووناکی لەسەر مۆبایل و کۆمپیوتەر"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 border border-amber-400/50"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">ئینستاڵی ئەپ</span>
                  <span className="xs:hidden">ئەپ</span>
                </button>
              )}

              {/* Live Cloud Status Indicator */}
              <div 
                title="پەیوەستە بە داتابەیسی گشتی گووگڵ فایەربەیس (Realtime Cloud Sync Active)"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>کڵاود چالاکە</span>
              </div>

              {/* Theme Toggle Button (Light/Dark) */}
              <button
                onClick={onToggleTheme}
                title={isDarkMode ? 'گۆڕین بۆ لایت مۆد (Light Mode)' : 'گۆڕین بۆ دارک مۆد (Dark Mode)'}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 transition-all shadow-sm active:scale-95"
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
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-black text-slate-800 dark:text-slate-200 bg-amber-500/15 hover:bg-amber-500/25 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-amber-400/50 dark:border-amber-500/30 transition-all shadow-sm active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="hidden xs:inline">چوونەژوورەوەی ئادمین</span>
                  <span className="xs:hidden">ئادمین</span>
                </button>
              ) : (
                /* When inside Admin Portal */
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <button
                    onClick={() => setCurrentView('citizen')}
                    className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
                    <span className="hidden xs:inline">پۆرتاڵی هاووڵاتی</span>
                    <span className="xs:hidden">هاووڵاتی</span>
                  </button>

                  <button
                    onClick={onAdminLogout}
                    title="دەرچوون لە ئەژمێری ئادمین"
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">دەرچوون</span>
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
