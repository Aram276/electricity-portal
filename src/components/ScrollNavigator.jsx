import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function ScrollNavigator() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Show top button if scrolled more than 180px
      setShowTop(scrollY > 180);

      // Show bottom button if not near the bottom
      setShowBottom(scrollY + clientHeight < scrollHeight - 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight || document.body.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <aside 
      aria-label="Floating Page Navigation" 
      className="fixed bottom-6 left-6 z-40 flex flex-col items-center gap-2.5 animate-fadeIn select-none"
    >
      {/* Scroll To Top Button */}
      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          title="چوونە سەرەوەی پەڕە"
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/40 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/30 hover:border-amber-500 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-xl cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
          {/* Tooltip on hover */}
          <span className="absolute right-14 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-amber-300 border border-amber-500/30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            سەرەوە ⬆️
          </span>
        </button>
      )}

      {/* Scroll To Bottom Button */}
      {showBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          title="چوونە خوارەوەی پەڕە"
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/40 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/30 hover:border-amber-500 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-xl cursor-pointer"
        >
          <ArrowDown className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:translate-y-0.5 transition-transform" />
          {/* Tooltip on hover */}
          <span className="absolute right-14 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-800 dark:text-amber-300 border border-amber-500/30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            خوارەوە ⬇️
          </span>
        </button>
      )}
    </aside>
  );
}
