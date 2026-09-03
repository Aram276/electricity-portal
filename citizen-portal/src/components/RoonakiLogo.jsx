import React, { useState, useEffect } from 'react';
import logoImg from '../assets/runaki-logo.png';

export default function RoonakiLogo({ className = "h-14 w-auto", showText = true, textClassName = "" }) {
  const [directorateTitle, setDirectorateTitle] = useState(() => {
    return localStorage.getItem('electricity_directorate_title') || 'بەڕێوەبەرایەتی گشتی دابەشکردنی کارەبا';
  });

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('electricity_directorate_title');
      if (stored) setDirectorateTitle(stored);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative group flex items-center justify-center">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
        <img 
          src={logoImg} 
          alt="پڕۆژەی ڕووناکی" 
          className={`relative object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105 ${className}`}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className={`flex flex-col text-right ${textClassName}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              پڕۆژەی ڕووناکی
            </span>
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-extrabold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              فرۆشیاری وزە ٢
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold">
            {directorateTitle}
          </span>
        </div>
      )}
    </div>
  );
}
