import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, ShieldAlert, CheckCircle2, User, Eye, EyeOff, AlertTriangle, Timer } from 'lucide-react';
import { subscribeToStaffAccounts, DEFAULT_STAFF, logActivity } from '../utils/cloudSync';

const FAILED_ATTEMPTS_KEY = 'electricity_auth_failed_attempts';
const LOCKOUT_UNTIL_KEY = 'electricity_auth_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  // Check lockout on mount & tick timer
  useEffect(() => {
    const checkLock = () => {
      const lockUntil = parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || '0', 10);
      const now = Date.now();
      if (lockUntil > now) {
        setLockoutSecondsLeft(Math.ceil((lockUntil - now) / 1000));
      } else {
        setLockoutSecondsLeft(0);
      }
      const savedAttempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10);
      setAttemptsCount(savedAttempts);
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

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
    if (lockoutSecondsLeft > 0) return;

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
      // Clear security attempts
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_UNTIL_KEY);
      setAttemptsCount(0);
      setLockoutSecondsLeft(0);
      setError(false);

      localStorage.setItem('electricity_active_staff', JSON.stringify(finalStaff));
      logActivity('STATUS_CHANGE', `چوونەژوورەوەی سەرکەوتووی فەرمانبەر: (${finalStaff.name}) بە ناوی بەکارهێنەری [${finalStaff.username || finalStaff.name}]`);
      onLoginSuccess(finalStaff);
      onClose();
    } else {
      const newAttempts = attemptsCount + 1;
      setAttemptsCount(newAttempts);
      localStorage.setItem(FAILED_ATTEMPTS_KEY, String(newAttempts));
      setPassword('');
      setError(true);

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + (LOCKOUT_SECONDS * 1000);
        localStorage.setItem(LOCKOUT_UNTIL_KEY, String(lockUntil));
        setLockoutSecondsLeft(LOCKOUT_SECONDS);
        logActivity('SECURITY_ALERT', `🛑 ئاگاداری ئەمنی: چەندین هەوڵی هەڵەی پاسۆرد بۆ ناوی (${cleanUser})! ئەژمێر بۆ ماوەی ${LOCKOUT_SECONDS} چرکە کفڵ کرا.`);
      } else {
        logActivity('SECURITY_ALERT', `⚠️ هەوڵی هەڵەی پاسۆرد (${newAttempts}/${MAX_ATTEMPTS}) بۆ ناوی (${cleanUser})`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-kurdish">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">چوونەژوورەوەی پارێزراو</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ناوی بەکارهێنەر و تێپەڕەوشە بنووسە</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lockout Banner */}
        {lockoutSecondsLeft > 0 ? (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-center space-y-2 animate-pulse">
            <div className="flex items-center justify-center gap-2 font-black text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>ئەژمێر بە شێوەی کاتی کفڵ کراوە!</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              بەهۆی ٥ هەوڵی لەسەریەکی هەڵە، تکایە ڕابوەستە تا کاتەکە تەواو دەبێت:
            </p>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600 text-white font-mono font-black text-sm">
              <Timer className="w-4 h-4" />
              <span>{lockoutSecondsLeft} چرکە</span>
            </div>
          </div>
        ) : null}

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
              disabled={lockoutSecondsLeft > 0}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              placeholder="ناوی بەکارهێنەر بنووسە"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>تێپەڕەوشە / پاسۆرد:</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={lockoutSecondsLeft > 0}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="تێپەڕەوشە بنووسە"
                className="w-full pr-4 pl-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-amber-500 disabled:opacity-50 transition-colors"
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

          {error && lockoutSecondsLeft === 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-bold animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>ناوی بەکارهێنەر یان پاسۆرد هەڵەیە! (هەوڵی {attemptsCount} لە {MAX_ATTEMPTS})</span>
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
              disabled={lockoutSecondsLeft > 0}
              className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
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

