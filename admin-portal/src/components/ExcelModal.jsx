import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  X, 
  Download, 
  CheckCircle2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { parseExcelFile, downloadStarterTemplate } from '../utils/excelHelper';

export default function ExcelModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const result = await parseExcelFile(selectedFile);
      setParsedData(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'هەڵەیەک لە خوێندنەوەی فایلی ئێکسڵدا ڕوویدا.');
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setError(null);
      setLoading(true);

      try {
        const result = await parseExcelFile(droppedFile);
        setParsedData(result);
      } catch (err) {
        console.error(err);
        setError(err.message || 'هەڵەیەک لە خوێندنەوەی فایلی ئێکسڵدا ڕوویدا.');
        setParsedData(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData || !parsedData.records.length) return;
    onImportSuccess(parsedData.records, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">هاوردەکردنی فایلی ئێکسڵ (Excel Import)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">داخڵکردنی فایلی کۆگای کارەبا و مامەڵەکان بە یەک کلیک</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        {!parsedData ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-3xl p-8 text-center space-y-4 bg-slate-50 dark:bg-slate-950/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('excel-file-input').click()}
            >
              <input
                id="excel-file-input"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">فایلی ئێکسڵەکە لێرە دابنێ یاخود کلیک بکە بۆ هەڵبژاردن</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">پشتگیری لە (.xlsx, .xls, .csv) دەکرێت</p>
              </div>
            </div>

            {loading && (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-sm text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>خەریکی خوێندنەوە و پشکنینی فایلەکەیە...</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Template Download Prompt */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block">پێویستت بە فایلی نموونەیە؟</span>
                فایلی ئامادەکراوی کوردی بە ستوونە ڕێکخراوەکانەوە دابەزێنە
              </div>
              <button
                type="button"
                onClick={downloadStarterTemplate}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>داگرتنی نموونە</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview & Confirmation Screen */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>فایلەکە بە سەرکەوتوویی خوێندرایەوە: <strong>{parsedData.records.length} مامەڵە</strong> ئامادەیە.</span>
              </div>
              <button
                onClick={() => { setParsedData(null); setFile(null); }}
                className="text-xs underline hover:text-slate-900 dark:hover:text-white font-bold"
              >
                گۆڕینی فایل
              </button>
            </div>

            {/* Detected Column mapping summary */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>پشکنینی ستوونە ناسراوەکان:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">ژمارەی ئەژمار:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedData.detectedMapping.accountNumber || 'ئۆتۆماتیک'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">ژمارەی مۆبایل:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedData.detectedMapping.phoneNumber || 'ئۆتۆماتیک'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">ناوی هاووڵاتی:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedData.detectedMapping.citizenName || 'ئۆتۆماتیک'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">ژمارەی فایل:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedData.detectedMapping.fileNumber || 'دروستکراو'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">دۆخی فایل:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedData.detectedMapping.status || 'ستاتی پێشوەختە'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">شوێنی ئەرشیف:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedData.detectedMapping.archiveLocation || 'دیاریکراو'}</span>
                </div>
              </div>
            </div>

            {/* Import Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">شێوازی داخڵکردن هەڵبژێرە:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`p-3.5 rounded-2xl border text-right transition-all ${
                    importMode === 'append'
                      ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">زیادکردن (Append)</span>
                    {importMode === 'append' && <Check className="w-4 h-4 text-amber-500" />}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">داتای نوێ بخەرە سەر داتاکانی پێشوو</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3.5 rounded-2xl border text-right transition-all ${
                    importMode === 'replace'
                      ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-500 text-rose-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-rose-600 dark:text-rose-300">جێگرتنەوە (Replace)</span>
                    {importMode === 'replace' && <Check className="w-4 h-4 text-rose-500" />}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">سڕینەوەی داتای پێشوو و دانانی ئەم فایلە</span>
                </button>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>داخڵکردنی {parsedData.records.length} مامەڵە</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
