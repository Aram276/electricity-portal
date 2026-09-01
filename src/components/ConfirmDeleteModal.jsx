import React from 'react';
import { Trash2, X, AlertTriangle, ShieldAlert, Layers } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, fileNumber, citizenName, count = 1 }) {
  if (!isOpen) return null;

  const isBulk = count > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop Blur */}
      <div className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 shadow-2xl shadow-rose-500/10 dark:shadow-rose-500/20 overflow-hidden transition-all animate-fadeIn">

        {/* Decorative top stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Icon + Warning Title */}
          <div className="flex flex-col items-center text-center gap-4">
            {/* Animated Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-200 dark:border-rose-500/30 flex items-center justify-center shadow-inner">
                {isBulk ? (
                  <Layers className="w-9 h-9 text-rose-500 dark:text-rose-400" />
                ) : (
                  <Trash2 className="w-9 h-9 text-rose-500 dark:text-rose-400" />
                )}
              </div>
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full border-2 border-rose-400/40 animate-ping" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {isBulk ? `دڵنیایت لە سڕینەوەی ${count} فایلی هەڵبژێردراو؟` : 'دڵنیایت لە سڕینەوەی ئەم فایلە؟'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ئەم کردارە گەڕانەوەی نیە و داتاکان دەسڕدرێنەوە
              </p>
            </div>
          </div>

          {/* File Info Card */}
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/25 space-y-2.5 text-sm">
            {isBulk ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">کۆی گشتی هەڵبژێردراوەکان:</span>
                <span className="font-black font-mono text-rose-600 dark:text-rose-400 text-lg">
                  {count} فایل
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">ژمارەی فایل:</span>
                  <span className="font-black font-mono text-rose-600 dark:text-rose-400 text-lg">
                    {fileNumber}
                  </span>
                </div>
                {citizenName && citizenName !== 'هاوبەشی کارەبا' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">ناوی هاووڵاتی:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{citizenName}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Warning Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/25">
            <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
              {isBulk 
                ? `سڕینەوەی ئەم ${count} فایلە لە داتابەیسەکە دەسڕێتەوە و هاووڵاتیان ناتوانن چیتر بەدواداچوونیان بۆ بکەن.`
                : 'سڕینەوەی ئەم فایلە هەموو زانیارییەکانی پەیوەندیدار دەسڕێتەوە و ناگەڕێتەوە.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            {/* Cancel */}
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-black text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>پاشگەزبوونەوە</span>
            </button>

            {/* Confirm Delete */}
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all duration-200 active:scale-98 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isBulk ? `بەڵێ، ${count} دانە بسڕەوە` : 'بەڵێ، بسڕەوە'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
