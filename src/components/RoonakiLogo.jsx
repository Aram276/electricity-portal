import React, { useState } from 'react';
import runakiLogo from '../assets/runaki-logo.png';
import { Zap } from 'lucide-react';

export default function RoonakiLogo({ className = 'h-14 w-auto', showText = true, textClassName = '' }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-center gap-3.5 select-none">
      <div className="relative flex items-center justify-center">
        {!imgError ? (
          <img
            src={runakiLogo}
            alt="پڕۆژەی نیشتمانیی ڕووناکی"
            className={`${className} object-contain filter drop-shadow-[0_0_16px_rgba(245,158,11,0.45)] transition-transform hover:scale-105 duration-200`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 shadow-xl shadow-amber-500/30 ring-2 ring-amber-400/40">
            <Zap className="w-7 h-7 text-slate-950 fill-slate-950" />
          </div>
        )}
      </div>

      {showText && (
        <div className={textClassName}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              حکومەتی هەرێمی کوردستان
            </span>
            <span className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-bold">فرۆشیاری وزە ٢</span>
          </div>
          <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 dark:from-amber-300 dark:via-yellow-400 dark:to-amber-500">
              پڕۆژەی ڕووناکی
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 hidden md:inline-block">
              کارەبای ٢٤ کاتژمێری
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
