import React from 'react';
import { Search, Lock, LogOut, Sun, Moon } from 'lucide-react';
import RoonakiLogo from './RoonakiLogo';

export default function Navbar({ currentView, setCurrentView, isAdmin, onOpenAdminLogin, onAdminLogout, isDarkMode, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-white/95 dark:bg-[#070b16]/95 backdrop-blur-xl transition-colors duration-300 shadow-sm">
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
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
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
  );
}
