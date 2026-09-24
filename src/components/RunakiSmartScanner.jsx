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
  ArrowRight
} from 'lucide-react';
import { performSmartOCR, extractElectricityNumbers, toLatinDigits } from '../utils/smartOcrEngine';
import runakiLogo from '../assets/runaki-logo.png';

export default function RunakiSmartScanner({
  isOpen = true,
  onClose,
  records = [],
  onSelectRecord,
  onSearchInSystem
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('ئامادەیە — وێنەی وەسڵەکە بگرە یان هەڵیبژێرە.');
  const [progressPercent, setProgressPercent] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [rawOcrText, setRawOcrText] = useState('');
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
            if (text && text.trim().length >= 3) {
              const clean = toLatinDigits(text.trim());
              setManualInput(clean);
              const parsed = extractElectricityNumbers(clean);
              if (parsed.primaryAccount) {
                setExtractedData(parsed);
                setEditedPrimary(parsed.primaryAccount);
                findMatchingRecord(parsed.primaryAccount);
              }
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

      setRawOcrText(parsed.rawText || '');
      setExtractedData(parsed);

      if (parsed.primaryAccount) {
        setEditedPrimary(parsed.primaryAccount);
        findMatchingRecord(parsed.primaryAccount);
        triggerHaptic();
        setStatusMessage(`ژمارەی ئەژمار بە سەرکەوتوویی دەرهێنرا: ${parsed.primaryAccount}`);
      } else if (parsed.phoneNumbers.length > 0 || parsed.accountNumbers.length > 0) {
        triggerHaptic();
        setStatusMessage('ژمارە لە وێنەکەدا دۆزرایەوە.');
      } else {
        setStatusMessage('ژمارەکە بە ڕوونی نەخوێندرایەوە. دەتوانیت لە خوارەوە بینوسیت.');
      }
    } catch (err) {
      console.error('Smart OCR Error:', err);
      setStatusMessage('هەڵەیەک لە خوێندنەوەی وێنەکە ڕوویدا. دەتوانیت ژمارەکە بنووسیت.');
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
        const clean = toLatinDigits(text.trim());
        setManualInput(clean);
        const parsed = extractElectricityNumbers(clean);
        if (parsed.primaryAccount) {
          setExtractedData(parsed);
          setEditedPrimary(parsed.primaryAccount);
          findMatchingRecord(parsed.primaryAccount);
        }
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

  // Manual search
  const handleManualSearch = (e) => {
    e.preventDefault();
    const query = (isEditingPrimary && editedPrimary) ? editedPrimary : manualInput;
    if (!query || !query.trim()) return;
    const cleanNum = toLatinDigits(query.trim());
    if (onSearchInSystem) {
      onSearchInSystem(cleanNum);
      if (onClose) onClose();
    }
  };

  if (!isOpen) return null;

  const currentActiveAccount = editedPrimary || extractedData?.primaryAccount;

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
        className={`relative w-full max-w-lg bg-gradient-to-b from-[#111827] via-[#0b0f19] to-[#080b12] text-slate-100 rounded-t-[2.5rem] sm:rounded-3xl border border-amber-500/20 shadow-2xl shadow-black/80 overflow-hidden max-h-[92vh] flex flex-col my-0 sm:my-auto transition-all duration-300 ${
          dragActive ? 'ring-4 ring-amber-400/50 scale-[1.01]' : ''
        }`}
      >
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-6 pt-5 pb-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl">
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
                سکانەری زیرەکی وەسڵ و ژمارەی ئەژمار
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
        <div className="relative z-10 p-5 sm:p-6 space-y-4.5 overflow-y-auto">
          
          {/* Main Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Camera Button */}
            <button
              type="button"
              onClick={handleTriggerCamera}
              disabled={isProcessing}
              className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-97 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-amber-300/60"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-slate-950" />
              </div>
              <span className="text-sm font-black text-slate-950">وێنەی وەسڵ بگرە 📸</span>
            </button>

            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={handleTriggerCamera}
              disabled={isProcessing}
              className="group p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:scale-97 text-slate-200 font-bold border border-white/10 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm font-bold text-slate-200">هەڵبژاردنی وێنە 🖼️</span>
            </button>
          </div>

          {/* Status Bar */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col items-center justify-center gap-2 text-center">
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

          {/* ── DETECTED RESULT LUXURY CARD ── */}
          {extractedData && (extractedData.primaryAccount || extractedData.accountNumbers.length > 0 || extractedData.phoneNumbers.length > 0) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-4 animate-scaleUp">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <ScanLine className="w-4 h-4 text-amber-400" />
                  <span>ئەنجامی پشکنین:</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>دۆزرایەوە</span>
                </div>
              </div>

              {/* Primary Account ID Hero Card */}
              {currentActiveAccount && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold">ژمارەی ئەژمار (Account ID):</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingPrimary(!isEditingPrimary)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold"
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
                        className="flex-1 px-4 py-2.5 bg-black/60 border border-amber-400/80 rounded-xl font-mono text-xl text-amber-300 text-center font-black focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPrimary(false);
                          findMatchingRecord(editedPrimary);
                        }}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                      >
                        پاشەکەوت
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-black/80 via-slate-950 to-black/80 border border-amber-400/40 flex items-center justify-between gap-3 shadow-inner">
                      <div className="font-mono text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wider">
                        {currentActiveAccount}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(currentActiveAccount, 'primary')}
                        className={`px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                          copiedKey === 'primary' 
                            ? 'bg-emerald-500 text-slate-950' 
                            : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950'
                        }`}
                      >
                        {copiedKey === 'primary' ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>کۆپی کرا!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>کۆپیکردن</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Candidate Selector */}
              {(extractedData.accountNumbers?.length > 1 || extractedData.phoneNumbers?.length > 0) && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400">ژمارە پەیوەندیدارەکانی تر:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.accountNumbers?.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelectCandidate(num)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          currentActiveAccount === num 
                            ? 'bg-amber-400 text-slate-950 shadow-sm' 
                            : 'bg-white/5 hover:bg-white/10 text-amber-300 border border-white/5'
                        }`}
                      >
                        <Hash className="w-3 h-3 opacity-60" />
                        <span>{num}</span>
                      </button>
                    ))}
                    {extractedData.phoneNumbers?.map((phone) => (
                      <button
                        key={phone}
                        type="button"
                        onClick={() => handleCopy(phone, `phone-${phone}`)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{phone}</span>
                        {copiedKey === `phone-${phone}` && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Instant Search & Open File */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {onSearchInSystem && currentActiveAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchInSystem(currentActiveAccount);
                      if (onClose) onClose();
                    }}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-97 transition-all cursor-pointer"
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
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-97 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>کردنەوەی فایل (#{matchedRecord.fileNumber})</span>
                  </button>
                )}
              </div>

              {/* Matched Citizen Record Card */}
              {matchedRecord && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>فایل لە داتابەیس دۆزرایەوە:</span>
                    </span>
                    <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded-md text-[11px] text-emerald-300 border border-emerald-500/30 font-black">
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

          {/* ── MANUAL SEARCH BAR ── */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">گەڕانی دەستی یان پیستکردن:</span>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>پیست لە مۆبایل</span>
              </button>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(toLatinDigits(e.target.value))}
                  placeholder="ژمارەی ئەژمار یان مۆبایل..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  title="پیست کردن"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>گەڕان</span>
              </button>
            </form>
          </div>

          {/* Micro Helper Note */}
          <p className="text-[11px] text-slate-500 text-center font-medium">
            💡 لە مۆبایل دەتوانیت وێنە بگریت یان لە گەلەری دایبنێیت.
          </p>

        </div>
      </div>
    </div>
  );
}
