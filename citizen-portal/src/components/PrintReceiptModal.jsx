import React, { useState, useEffect } from 'react';
import { X, Printer, Zap, CheckCircle2, Building2, User, Hash, Phone, Calendar, Archive, QrCode } from 'lucide-react';
import { STATUS_CONFIG } from '../constants/status';
import { getKurdistanDate } from '../utils/dateUtils';
import runakiLogo from '../assets/runaki-logo.png';
import QRCode from 'qrcode';

export default function PrintReceiptModal({ record, isOpen, onClose, language = 'ku' }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const isAr = language === 'ar';

  useEffect(() => {
    if (record) {
      const qrText = isAr 
        ? `مشروع روناهي الوطني للكهرباء - مبيعات الطاقة ٢\nرقم الفايل: ${record.fileNumber}\nرقم الحساب: ${record.accountNumber || 'لا يوجد'}\nاسم المواطن: ${record.citizenName}\nالحالة: ${record.status}\nموقع الأرشيف: ${record.archiveLocation || 'صندوق ' + record.fileNumber}`
        : `پڕۆژەی ڕووناکی - فرۆشیاری وزە ٢\nژمارەی فایل: ${record.fileNumber}\nژمارەی ئەژمار: ${record.accountNumber || 'نیە'}\nناوی هاووڵاتی: ${record.citizenName}\nدۆخی دۆسیە: ${record.status}\nشوێنی ئەرشیف: ${record.archiveLocation || 'سندوقی ' + record.fileNumber}`;
      
      QRCode.toDataURL(qrText, {
        width: 150,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [record, isAr]);

  if (!isOpen || !record) return null;

  const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.IN_PROGRESS;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl p-5 sm:p-8 space-y-5 max-h-[95vh] overflow-y-auto">
        
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 no-print">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Printer className="w-5 h-5 text-amber-400" />
            <span>{isAr ? 'معاينة بطاقة المراجعة والوصل الرسمي' : 'پێشبینینی کارتی سەردان بۆ پرێنت'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/25 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة البطاقة (Print)' : 'پرێنت بکە (Print)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Royal Card Area */}
        <div id="printable-receipt" className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-amber-500/60 shadow-xl space-y-5 font-kurdish relative overflow-hidden">
          
          {/* Subtle Golden Watermark / Stamp Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5">
            <div className="flex justify-center mb-1">
              <img src={runakiLogo} alt="ڕووناکی" className="h-16 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div className="text-xs font-bold text-slate-600">
              {isAr ? 'حكومة إقليم كوردستان - وزارة الكهرباء | مشروع روناهي الوطني' : 'حکومەتی هەرێمی کوردستان - وەزارەتی کارەبا | پڕۆژەی نیشتمانیی ڕووناکی'}
            </div>
            <div className="text-lg font-black text-slate-950">
              {record.department || (isAr ? 'مديرية توزيع كهرباء - مبيعات الطاقة ٢' : 'بەڕێوەبەرایەتی دابەشکردنی کارەبا - فرۆشیاری وزە ٢')}
            </div>
            <div className="text-xs font-black text-amber-950 bg-amber-100/90 inline-block px-4 py-1 rounded-full border border-amber-400 mt-1 shadow-sm">
              {isAr ? 'بطاقة مراجعة رسمية لاستلام الإضبارة' : 'کارتی سەردانی فەرمیی هاووڵاتی بۆ وەرگرتنەوەی دۆسیە'}
            </div>
          </div>

          {/* Core Highlight: File Number & Smart QR Code */}
          <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5 text-right flex-1">
              <div className="text-xs font-black text-amber-900">
                {isAr ? 'رقم الإضبارة في الدائرة (أعطِ هذا الرقم للموظف):' : 'ژمارەی تایبەتی فایل لە ئەرشیف (ئەم ژمارەیە بدە بە فەرمانبەر):'}
              </div>
              <div className="text-4xl sm:text-5xl font-black font-mono text-slate-950 tracking-wider">
                {record.fileNumber}
              </div>
              <div className="text-xs font-bold text-amber-900">
                {isAr ? 'موقع الحفظ في الأرشيف: ' : 'شوێنی فایل لە ئەرشیف: '}
                <span className="font-mono">{record.archiveLocation || (isAr ? `صندوق ${record.fileNumber}` : `سندوقی ${record.fileNumber}`)}</span>
              </div>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-2xl border-2 border-amber-400 shadow-md shrink-0">
                <img src={qrDataUrl} alt="QR Code" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                <span className="text-[9px] font-bold text-slate-600 mt-1">{isAr ? 'مسح بالهاتف 📱' : 'سکان بە مۆبایل 📱'}</span>
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-3 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/70">
            <div>
              <span className="text-slate-500 block">{isAr ? 'اسم المواطن:' : 'ناوی هاووڵاتی:'}</span>
              <span className="font-black text-slate-900 text-sm">{record.citizenName || (isAr ? 'مشترك كهرباء' : 'هاوبەشی کارەبا')}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'رقم الحساب (ID):' : 'ژمارەی ئەژمار (Account ID):'}</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{record.accountNumber || (isAr ? 'لا يوجد' : 'نیە')}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'رقم الهاتف:' : 'ژمارەی مۆبایل:'}</span>
              <span className="font-mono font-bold text-slate-800">{record.phoneNumber || (isAr ? 'غير مسجل' : 'تۆمار نەکراوە')}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'نوع المعاملة:' : 'جۆری مامەڵە:'}</span>
              <span className="font-semibold text-slate-800">{record.transactionType || (isAr ? 'معاملة كهرباء' : 'مامەڵەی کارەبا')}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'تاريخ التقديم:' : 'بەرواری پێشکەشکردن:'}</span>
              <span className="font-mono text-slate-800">{record.submissionDate || getKurdistanDate()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'نوع الإضبارة والأرشيف:' : 'جۆری دۆسیە (شێوازی پاراستن):'}</span>
              <span className="font-bold text-amber-900">
                {(record.fileType === 'YELLOW_FOLDER' || record.isFolder === true) ? (isAr ? '📁 فايل أصفر رسمي' : '📁 فایلی زەرد') : (isAr ? '📄 أوراق ومستندات' : '📄 ئەوراق')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'حالة الإنجاز:' : 'دۆخی تەواوبوون:'}</span>
              <span className="font-bold text-emerald-700">
                {record.status === 'COMPLETED' ? (isAr ? 'منجزة وجاهزة ✅' : 'تەواوبووە و وەرگیراوەتەوە ✅') : (record.status === 'DELIVERED' ? (isAr ? 'تم التسليم 📦' : 'تەسلیم کرا 📦') : (isAr ? 'قيد المتابعة ⏳' : 'پێنەدراوەتەوە (لە کارکردندایە) ⏳'))}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">{isAr ? 'الشعبة / الدائرة:' : 'فەرمانگە:'}</span>
              <span className="font-medium text-slate-800">{record.department || (isAr ? 'مبيعات الطاقة ٢' : 'فرۆشیاری وزە ٢')}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-[11px] text-slate-700 space-y-1 bg-amber-50/80 p-3.5 rounded-xl border border-amber-300">
            <div className="font-black text-amber-950">{isAr ? '⚠️ إرشادات وتعليمات مهمة للمواطن:' : '⚠️ تێبینییە گرنگەکان بۆ سەردانیکردن:'}</div>
            <div>{isAr ? '• يرجى إبراز هذه البطاقة أو رقم الفايل لموظف الأرشيف وشعبة المشتركين.' : '• لە کاتی سەردانیکردنی بەڕێوەبەرایەتی کارەبا، تکایە ئەم کارتە یاخود ژمارەی فایلەکەت بە فەرمانبەری ئەرشیف بدە.'}</div>
            <div>{isAr ? '• يجب جلب البطاقة الوطنية أو هوية الأحوال المدنية الأصلية لاستلام الإضبارة.' : '• کارتی نیشتمانی یان پێناسی باری شارستانی هاووڵاتی پێویستە بۆ وەرگرتنەوەی دۆسیەی ئەسڵی.'}</div>
          </div>

          {/* Stamp and Date Footer */}
          <div className="flex justify-between items-end pt-2 text-[11px] text-slate-500 border-t border-slate-200">
            <div>
              {isAr ? 'تاريخ إصدار البطاقة: ' : 'بەرواری دەرچوونی کارت: '}
              <span className="font-mono">{new Date().toLocaleDateString('en-CA')}</span>
            </div>
            <div className="text-center">
              <div className="w-28 h-12 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-bold">
                {isAr ? 'ختم الدائرة الرسمي' : 'مۆری فەرمیی فەرمانگە'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
