import React, { useState, useEffect } from 'react';
import { Sun, Moon, Download, Smartphone, Monitor, X, Clock, Languages, Globe } from 'lucide-react';
import RoonakiLogo from './RoonakiLogo';
import { getKurdistanTime12, getKurdistanDate } from '../utils/dateUtils';
import { getTranslation } from '../utils/translations';

export default function Navbar({ isDarkMode, onToggleTheme, language = 'ku', onLanguageChange }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const t = getTranslation(language);

  // Live Kurdistan Time
  const [liveTime, setLiveTime] = useState(() => getKurdistanTime12(true));
  const [liveDate, setLiveDate] = useState(() => getKurdistanDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getKurdistanTime12(true));
      setLiveDate(getKurdistanDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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

  const toggleLanguage = () => {
    const nextLang = language === 'ku' ? 'ar' : 'ku';
    if (onLanguageChange) {
      onLanguageChange(nextLang);
    }
  };

  return (
    <>
      <header className="relative z-40 w-full border-b border-amber-500/20 bg-white/95 dark:bg-[#070b16]/95 backdrop-blur-xl transition-colors duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            
            {/* Logo & Directorate Title */}
            <div className="cursor-pointer shrink-0">
              <RoonakiLogo 
                className="h-10 sm:h-12 md:h-14 w-auto" 
                textClassName="hidden sm:block" 
              />
            </div>

            {/* Mobile compact title */}
            <div className="block sm:hidden text-center">
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 block">
                {t.projectTitle}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-1 font-bold">
                {t.subTitle}
              </span>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Language Switcher Button */}
              <button
                onClick={toggleLanguage}
                title={language === 'ku' ? 'گۆڕین بۆ زمانی عەرەبی (التبديل إلى العربية)' : 'التبديل إلى الكوردية (گۆڕین بۆ زمانی کوردی)'}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-black transition-all shadow-xs active:scale-95 select-none"
              >
                <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                <span>{language === 'ku' ? '🇮🇶 العربية' : '☀️ کوردی'}</span>
              </button>

              {/* Live Kurdistan Digital Clock & Date */}
              <div 
                title={t.officialTime}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-slate-900/90 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold shadow-xs select-none"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                <span className="font-black text-slate-900 dark:text-amber-200 text-xs">{liveTime}</span>
                <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">{liveDate}</span>
              </div>

              {/* Install App Button */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  title={t.pwaTitle}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 border border-amber-400/50"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xs:inline">{t.installApp}</span>
                </button>
              )}

              {/* Live Cloud Status */}
              <div 
                title="Firebase Firestore Live Active"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t.systemActive}</span>
              </div>

              {/* Theme Toggle Button (Light/Dark) */}
              <button
                onClick={onToggleTheme}
                title={isDarkMode ? t.lightMode : t.darkMode}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 transition-all shadow-sm active:scale-95"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* PWA Install Instructions Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 shadow-2xl p-6 sm:p-7 space-y-5 text-right transition-colors" dir="rtl">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-black text-base sm:text-lg">
                <Download className="w-5 h-5" />
                <span>{t.pwaTitle}</span>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.pwaDesc}
            </p>

            <div className="space-y-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 space-y-1">
                <div className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>{t.pwaPc}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  {t.pwaPcDesc}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-1">
                <div className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>{t.pwaIos}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  {t.pwaIosDesc}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
            >
              {t.understood}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
