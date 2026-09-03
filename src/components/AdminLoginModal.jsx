import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, ShieldAlert, CheckCircle2, User, Users, ShieldCheck } from 'lucide-react';
import { subscribeToStaffAccounts, DEFAULT_STAFF, logActivity } from '../utils/cloudSync';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToStaffAccounts((list) => {
        if (list && list.length > 0) {
          setStaffList(list);
        }
      });
      setPin('');
      setError(false);
      setSelectedStaff(null);
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPin = pin.trim();

    // Check against selected staff or all staff
    let matchedStaff = null;
    if (selectedStaff) {
      if (selectedStaff.pin === cleanPin) {
        matchedStaff = selectedStaff;
      }
    } else {
      matchedStaff = staffList.find(s => s.pin === cleanPin);
    }

    // Fallback legacy PIN support
    const legacyPin = localStorage.getItem('electricity_portal_pin') || '075075';
    if (!matchedStaff && cleanPin === legacyPin) {
      matchedStaff = staffList[0] || { id: 'staff-1', name: 'ئارام', role: 'ADMIN', title: 'بەڕێوەبەری سەرەکی' };
    }

    if (matchedStaff) {
      setError(false);
      localStorage.setItem('electricity_active_staff', JSON.stringify(matchedStaff));
      logActivity('STATUS_CHANGE', `چوونەژوورەوەی سەرکەوتووی (${matchedStaff.name}) بۆ سیستەم`);
      onLoginSuccess(matchedStaff);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">چوونەژوورەوەی فەرمانبەران</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ئەکاونتی خۆت هەڵبژێرە و پاسۆرد بنووسە</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff Quick Selection Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            هەڵبژاردنی فەرمانبەر:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {staffList.map((staff) => {
              const isSelected = selectedStaff?.id === staff.id;
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => { setSelectedStaff(staff); setError(false); }}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-600'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">{staff.name}</div>
                    <div className="text-[10px] opacity-75 truncate">{staff.title || staff.role}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>پاسۆردی {selectedStaff ? `(${selectedStaff.name})` : 'فەرمانبەر'}:</span>
              </span>
              {selectedStaff && (
                <button 
                  type="button" 
                  onClick={() => setSelectedStaff(null)} 
                  className="text-[11px] text-amber-600 dark:text-amber-400 underline font-bold"
                >
                  گۆڕین
                </button>
              )}
            </label>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              placeholder="••••"
              className="w-full text-center tracking-[0.8em] text-2xl px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-bold animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>پاسۆردی هەڵبژێردراو هەڵەیە! تکایە پاسۆردی دروست بنووسە.</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>چوونەژوورەوە</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
