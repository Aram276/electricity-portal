import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Camera, 
  Upload, 
  Copy, 
  Check, 
  Search, 
  RefreshCw, 
  X, 
  FileText, 
  Phone, 
  User, 
  Hash, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ClipboardPaste,
  Edit3,
  Sparkles,
  Sliders,
  Maximize2,
  ScanLine,
  ArrowRight,
  Crop,
  Delete,
  RotateCcw,
  MessageSquare,
  DollarSign,
  Calendar,
  Box
} from 'lucide-react';
import { performSmartOCR, extractElectricityNumbers, toLatinDigits, preprocessImage } from '../utils/smartOcrEngine';
import runakiLogo from '../assets/runaki-logo.png';

const KURDISH_DIGITS = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠', '/', '-'];

export default function RunakiSmartScanner({
  isOpen = true,
  onClose,
  records = [],
  onSelectRecord,
  onSearchInSystem
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('ئامادەیە — وێنەی وەسڵەکە بگرە یان ژمارەکە بە کیبۆرد لێبدە.');
  const [progressPercent, setProgressPercent] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [matchedRecord, setMatchedRecord] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [editedPrimary, setEditedPrimary] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  // Haptic feedback
  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([35, 50, 35]);
      }
    } catch (e) {}
  };

  // Keyboard and paste listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target.result;
              setImageSrc(dataUrl);
              runOcrPipeline(dataUrl);
            };
            reader.readAsDataURL(blob);
          }
          break;
        } else if (items[i].type === 'text/plain') {
          items[i].getAsString((text) => {
            if (text && text.trim().length >= 1) {
              handleNumberInput(text.trim());
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, records, onClose]);

  // Handle number input (both typed and keypad)
  const handleNumberInput = (rawVal) => {
    setManualInput(rawVal);
    const cleanLatin = toLatinDigits(rawVal);
    if (cleanLatin && cleanLatin.trim().length >= 1) {
      const parsed = extractElectricityNumbers(cleanLatin);
      const primary = parsed.primaryAccount || cleanLatin.trim();
      setExtractedData(prev => ({
        ...(prev || {}),
        ...parsed,
        primaryAccount: primary
      }));
      setEditedPrimary(primary);
      findMatchingRecord(primary);
    } else {
      setEditedPrimary('');
      setMatchedRecord(null);
    }
  };

  // Keypad button click
  const handleKeypadPress = (char) => {
    triggerHaptic();
    const updated = manualInput + char;
    handleNumberInput(updated);
  };

  const handleKeypadBackspace = () => {
    triggerHaptic();
    const updated = manualInput.slice(0, -1);
    handleNumberInput(updated);
  };

  const handleKeypadClear = () => {
    triggerHaptic();
    setManualInput('');
    setExtractedData(null);
    setEditedPrimary('');
    setMatchedRecord(null);
  };

  // Match in local records
  const findMatchingRecord = (accountOrFileNum) => {
    if (!accountOrFileNum || !Array.isArray(records)) return;
    const cleanKey = String(accountOrFileNum).trim();
    const found = records.find(r => 
      String(r.accountNumber || '').trim() === cleanKey ||
      String(r.fileNumber || '').trim() === cleanKey ||
      String(r.phone || '').trim() === cleanKey
    );
    if (found) {
      setMatchedRecord(found);
      triggerHaptic();
    }
  };

  // Open camera/gallery
  const handleTriggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImageSrc(dataUrl);
      runOcrPipeline(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setImageSrc(dataUrl);
        runOcrPipeline(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run multi-stage OCR
  const runOcrPipeline = async (dataUrl) => {
    setIsProcessing(true);
    setProgressPercent(15);
    setStatusMessage('دەستپێکردنی پشکنینی وێنەی وەسڵ...');
    setExtractedData(null);
    setMatchedRecord(null);
    setIsEditingPrimary(false);

    try {
      const parsed = await performSmartOCR(dataUrl, (p, msg) => {
        setProgressPercent(p);
        setStatusMessage(msg);
      });

      setExtractedData(parsed);

      if (parsed.primaryAccount) {
        setEditedPrimary(parsed.primaryAccount);
        findMatchingRecord(parsed.primaryAccount);
        triggerHaptic();
        setStatusMessage(`ژمارەی ئەژمار بە سەرکەوتوویی دۆزرایەوە: ${parsed.primaryAccount}`);
      } else if (parsed.phoneNumbers.length > 0 || parsed.accountNumbers.length > 0) {
        triggerHaptic();
        setStatusMessage('زانیاری و ژمارە لە وێنەکەدا دۆزرایەوە.');
      } else {
        setStatusMessage('ژمارەکە بە ڕوونی نەخوێندرایەوە. دەتوانیت بە کیبۆردی خوارەوە دەستنیشانی بکەیت.');
      }
    } catch (err) {
      console.error('Smart OCR Error:', err);
      setStatusMessage('دەتوانیت لە خوارەوە ژمارەی ئەژمار بە دوگمەکان لێبدەیت.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    triggerHaptic();
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleNumberInput(text.trim());
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  // Candidate selection
  const handleSelectCandidate = (num) => {
    if (!num) return;
    setEditedPrimary(num);
    setExtractedData(prev => ({ ...(prev || {}), primaryAccount: num }));
    findMatchingRecord(num);
    handleCopy(num, `candidate-${num}`);
  };

  if (!isOpen) return null;

  const currentActiveAccount = editedPrimary || extractedData?.primaryAccount || (manualInput ? toLatinDigits(manualInput) : '');
  const detectedPhone = extractedData?.primaryPhone || (extractedData?.phoneNumbers && extractedData.phoneNumbers[0]);

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto font-kurdish text-right animate-fadeIn"
      dir="rtl"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Main Dialog Modal Container */}
      <div 
        className={`relative w-full max-w-xl bg-gradient-to-b from-[#111827] via-[#0b0f19] to-[#080b12] text-slate-100 rounded-t-[2.5rem] sm:rounded-3xl border border-amber-500/20 shadow-2xl shadow-black/80 overflow-hidden max-h-[94vh] flex flex-col my-0 sm:my-auto transition-all duration-300 ${
          dragActive ? 'ring-4 ring-amber-400/50 scale-[1.01]' : ''
        }`}
      >
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-6 pt-5 pb-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <img 
                src={runakiLogo} 
                alt="پڕۆژەی ڕووناکی" 
                className="w-11 h-11 object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Runaki Smart Scanner
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                سکانەری زیرەکی وەسڵ، ژمارەی ئەژمار و تەلەفۆن
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="relative z-10 p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Main Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Camera Button */}
            <button
              type="button"
              onClick={handleTriggerCamera}
              disabled={isProcessing}
              className="group relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-97 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-amber-300/60"
            >
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
              <span className="text-xs sm:text-sm font-black text-slate-950">وێنەی وەسڵ بگرە 📸</span>
            </button>

            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={handleTriggerCamera}
              disabled={isProcessing}
              className="group p-3.5 sm:p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:scale-97 text-slate-200 font-bold border border-white/10 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
            >
              <Upload className="w-5 h-5 text-amber-400" />
              <span className="text-xs sm:text-sm font-bold text-slate-200">هەڵبژاردنی وێنە 🖼️</span>
            </button>
          </div>

          {/* Status Bar */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col items-center justify-center gap-1.5 text-center">
            {isProcessing && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold">
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-300">{statusMessage}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300">{statusMessage}</span>
                </>
              )}
            </div>
          </div>

          {/* ── 1. PRIMARY ACCOUNT NUMBER CARD (ژمارەی ئەژمار) ── */}
          {currentActiveAccount && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-amber-500/40 shadow-xl space-y-3 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Hash className="w-4 h-4 text-amber-400" />
                  <span>ژمارەی ئەژمار (Account ID):</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPrimary(!isEditingPrimary)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingPrimary ? 'تەواو' : 'دەستکاری'}</span>
                </button>
              </div>

              {isEditingPrimary ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedPrimary}
                    onChange={(e) => setEditedPrimary(toLatinDigits(e.target.value))}
                    className="flex-1 px-3 py-2 bg-black/60 border border-amber-400 rounded-xl font-mono text-xl text-amber-300 text-center font-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPrimary(false);
                      findMatchingRecord(editedPrimary);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                  >
                    پاشەکەوت
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-black/80 via-slate-950 to-black/80 border border-amber-400/40 flex items-center justify-between gap-2 shadow-inner">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wider">
                    {currentActiveAccount}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(currentActiveAccount, 'primary')}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                      copiedKey === 'primary' 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950'
                    }`}
                  >
                    {copiedKey === 'primary' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>کۆپی کرا! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>کۆپیکردن 📋</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Action Buttons: Instant Search & Open File */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {onSearchInSystem && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchInSystem(currentActiveAccount);
                      if (onClose) onClose();
                    }}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-97 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>گەڕان لە سیستەم 🔍</span>
                  </button>
                )}

                {onSelectRecord && matchedRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRecord(matchedRecord);
                      if (onClose) onClose();
                    }}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-97 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>کردنەوەی فایل (#{matchedRecord.fileNumber})</span>
                  </button>
                )}
              </div>

              {/* Matched Citizen Record Card */}
              {matchedRecord && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>فایلی هاووڵاتی لە سیستەم دۆزرایەوە!</span>
                    </span>
                    <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded-md text-[11px] text-emerald-300 font-black">
                      فایل: #{matchedRecord.fileNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-bold truncate">{matchedRecord.citizenName || 'هاووڵاتی'}</span>
                    </div>
                    {matchedRecord.phone && (
                      <div className="flex items-center gap-1.5 font-mono text-emerald-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{matchedRecord.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 2. ALL DETECTED NUMBERS SECTION (سەرجەم ژمارە دۆزراوەکانی وەسڵ) ── */}
          {extractedData?.accountNumbers && extractedData.accountNumbers.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>سەرجەم ژمارە ئەژمارە دۆزراوەکان ({extractedData.accountNumbers.length} دانە):</span>
                </span>
                {extractedData.accountNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleCopy(extractedData.accountNumbers.join('\n'), 'all_accounts')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedKey === 'all_accounts' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">هەمووی کۆپی کرا!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>کۆپیکردنی هەموویان</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {extractedData.accountNumbers.map((num, idx) => {
                  const pure = num.replace(/\D/g, '');
                  const is11Kurd = pure.length === 11 && (pure.startsWith('63') || pure.startsWith('70') || /^(?:6[1-5]|7[0-5])/.test(pure));
                  const isSelected = currentActiveAccount === num;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/40'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleSelectCandidate(num)}
                          className="font-mono text-base sm:text-lg font-black text-amber-300 hover:text-amber-200 cursor-pointer text-left tracking-wider"
                        >
                          {num}
                        </button>
                        {is11Kurd && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold shrink-0">
                            ⚡ ۱۱ ژمارەیی کوردستان
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold shrink-0">
                            سەرەکی
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(num, `acc-${idx}`)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            copiedKey === `acc-${idx}`
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-700 hover:bg-amber-500/30 text-slate-200 hover:text-amber-300 border border-white/10'
                          }`}
                        >
                          {copiedKey === `acc-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>کۆپی کرا</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>کۆپی</span>
                            </>
                          )}
                        </button>

                        {onSearchInSystem && (
                          <button
                            type="button"
                            onClick={() => {
                              onSearchInSystem(num);
                              if (onClose) onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="گەڕان لە سیستەم"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>گەڕان</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 3. PHONE NUMBER CARD (ژمارەی تەلەفۆن / مۆبایل) ── */}
          {detectedPhone && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-md space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>ژمارەی تەلەفۆن / مۆبایلی وەسڵ:</span>
                </span>
                <span className="text-[10px] text-emerald-300/80 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  📞 مۆبایل
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/30 flex items-center justify-between gap-2">
                <div className="font-mono text-lg font-black text-emerald-300 tracking-wider">
                  {detectedPhone}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(detectedPhone, 'phone')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    {copiedKey === 'phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>کۆپی کرا!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کۆپی 📋</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/${detectedPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all border border-emerald-500/30"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>واتسئاپ</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. EXTRA EXTRACTED DETAILS (ناوی هاووڵاتی، سندوق، بڕی پارە) ── */}
          {extractedData && (extractedData.citizenName || extractedData.boxNumber || extractedData.totalAmount) && (
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5 text-xs animate-fadeIn">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>زانیارییە دۆزراوەکانی تری وەسڵەکە:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Citizen Name */}
                {extractedData.citizenName && (
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>ناو:</span>
                    </span>
                    <span className="font-bold text-white truncate">{extractedData.citizenName}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(extractedData.citizenName, 'name')}
                      className="text-amber-400 hover:text-amber-300 p-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Box Number */}
                {extractedData.boxNumber && (
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Box className="w-3 h-3 text-cyan-400" />
                      <span>سندوق:</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300">{extractedData.boxNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(extractedData.boxNumber, 'box')}
                      className="text-cyan-400 hover:text-cyan-300 p-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Total Bill Amount */}
                {extractedData.totalAmount && (
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2 sm:col-span-2">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>کۆی گشتی پسوولە:</span>
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {extractedData.totalAmount} دینار
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 5. FAST KURDISH/ENGLISH NUMPAD & DIRECT TRANSLATOR ── */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>کیبۆردی خێرای ژمارەی دەستنووس و ئەژمار:</span>
              </span>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-black"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>پیست 📋</span>
              </button>
            </div>

            {/* Input display bar */}
            <div className="relative">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => handleNumberInput(e.target.value)}
                placeholder="ژمارەکە لێرە بنووسە (کوردی یان ئینگلیزی)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-base text-amber-300 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {manualInput && (
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Kurdish / Arabic Numeral Touch Pad */}
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {KURDISH_DIGITS.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-base font-black font-mono shadow-sm active:scale-90 transition-all border border-white/5 cursor-pointer"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Quick Actions Row */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-white/5"
              >
                ⌫ سڕینەوەی دوا پیت
              </button>
              <button
                type="button"
                onClick={handleKeypadClear}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-400 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-white/5"
              >
                پاککردنەوە 🗑️
              </button>
            </div>
          </div>

          {/* Micro Helper Note */}
          <p className="text-[11px] text-slate-500 text-center font-medium">
            💡 سکانەرەکە بە شێوەیەکی زیرەک لەدوای ژمارەی ئەژمار و تەلەفۆن دەگەڕێت و هەردووکت پێ دەدات.
          </p>

        </div>
      </div>
    </div>
  );
}
