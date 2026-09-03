import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, ShieldAlert, CheckCircle2, User, Eye, EyeOff } from 'lucide-react';
import { subscribeToStaffAccounts, DEFAULT_STAFF, logActivity } from '../utils/cloudSync';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToStaffAccounts((list) => {
        if (list && list.length > 0) {
          setStaffList(list);
        }
      });
      
      // Pre-fill last username if available
      try {
        const lastStaff = JSON.parse(localStorage.getItem('electricity_active_staff') || 'null');
        if (lastStaff?.username || lastStaff?.name) {
          setUsername(lastStaff.username || lastStaff.name);
        }
      } catch (e) {}

      setPassword('');
      setError(false);
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError(true);
      return;
    }

    // Match by username or by display name (case-insensitive)
    const matchedStaff = staffList.find(s => {
      const u = String(s.username || '').trim().toLowerCase();
      const n = String(s.name || '').trim().toLowerCase();
      const p = String(s.pin || '').trim();

      const userMatch = (u && u === cleanUser) || (n && n === cleanUser);
      const passMatch = p === cleanPass;

      return userMatch && passMatch;
    });

    // Fallback legacy support if someone types admin credentials
    const legacyPin = localStorage.getItem('electricity_portal_pin') || '075075';
    let finalStaff = matchedStaff;
    if (!finalStaff && (cleanUser === 'admin' || cleanUser === 'aram' || cleanUser === 'ئارام') && cleanPass === legacyPin) {
      finalStaff = staffList[0] || { id: 'staff-1', username: 'aram', name: 'ئارام', role: 'ADMIN', title: 'بەڕێوەبەری سەرەکی' };
    }

    if (finalStaff) {
      setError(false);
      localStorage.setItem('electricity_active_staff', JSON.stringify(finalStaff));
      logActivity('STATUS_CHANGE', `چوونەژوورەوەی فەرمانبەر: (${finalStaff.name}) بە ناوی بەکارهێنەری [${finalStaff.username || finalStaff.name}]`);
      onLoginSuccess(finalStaff);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">چوونەژوورەوەی ستاف</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ناوی بەکارهێنەر و پاسۆرد بنووسە</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>ناوی بەکارهێنەر:</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              placeholder="ناو بنووسە"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>پاسۆرد:</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="پاسۆرد بنووسە"
                className="w-full pr-4 pl-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-bold animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>ناوی بەکارهێنەر یان پاسۆرد هەڵەیە! تکایە زانیاری دروست بنووسە.</span>
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
