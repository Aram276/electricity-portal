import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import xlsx from 'xlsx';

// Read and convert logo to base64
const logoPath = 'C:/Prject/ubereats-clone-main/public/runaki-logo.png';
const logoBase64 = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : '';

// Kurdish Numerals Converter
function toKurdishNum(n) {
  const kNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).replace(/[0-9]/g, d => kNums[d]);
}

// 9 Workflows with full accurate steps, room numbers, and supplementary documents
const WORKFLOWS = [
  {
    id: 1,
    title: 'هاوبەشی نوێ',
    subtitle: 'New Subscription',
    categoryBadge: 'بەستنی پێوەری نوێ',
    color: '#10b981',
    lightColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    steps: [
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ١٠', name: 'فایل کردنەوە' },
      { room: 'ژووری ٣', name: 'وردبینی' },
      { room: 'ژووری ١٥', name: 'بەڕێوەبردنی ئەژمار' },
      { room: 'ژووری ٨', name: 'سکان' },
      { room: 'ژووری ١٦', name: 'گرێبەست' },
      { room: 'ژووری ٢', name: 'خەزنە' },
      { room: 'ژووری ١٦', name: 'پەسەندکردنی گرێبەست' },
      { room: 'ژووری ١٨', name: 'تەکنیک' }
    ],
    infoBox: null,
    resultNote: 'بەستنی پێوەری زیرەک و چالاکبوونی کارەبا'
  },
  {
    id: 2,
    title: 'ناو گۆڕین',
    subtitle: 'Ownership Transfer',
    categoryBadge: 'گواستنەوەی خاوەندارێتی',
    color: '#06b6d4',
    lightColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
    steps: [
      { room: 'دەستپێک', name: 'نووسینی عەریزە' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ١٧', name: 'پاکانە' },
      { room: 'ژووری ٤', name: 'مامەڵات' },
      { room: 'ژووری ١٢', name: 'ڕسوومات' },
      { room: 'ژووری ٣', name: 'وردبینی' },
      { room: 'ژووری ٨', name: 'سکان' },
      { room: 'ژووری ١٥', name: 'بەڕێوەبردنی ئەژمار' }
    ],
    infoBox: null,
    resultNote: 'نوێبوونەوەی فەرمی ناوی هاوبەش لە سەرجەم سیستەمەکان'
  },
  {
    id: 3,
    title: 'پێوەر گۆڕین',
    subtitle: 'Meter Replacement',
    categoryBadge: 'چاکسازی و گۆڕین',
    color: '#f59e0b',
    lightColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    steps: [
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١٨', name: 'تەکنیک' }
    ],
    infoBox: {
      title: 'بەڵگەنامە پێویستەکان',
      items: [
        'کۆتا پسووڵەی کارەبا',
        'وێنەی ڕوونی سەر پێوەر',
        'کارتی نیشتمانی / ناسنامە',
        'کاتی خەمڵێنراو: ٢٤-٤٨ کاتژمێر'
      ]
    },
    resultNote: 'بەستنی پێوەری نوێ لەلایەن تیمی تەکنیک و نوێکردنەوە لە سیستەم'
  },
  {
    id: 4,
    title: 'بڕینی کۆتایی',
    subtitle: 'Final Disconnection',
    categoryBadge: 'هەڵوەشاندنەوەی هاوبەشی',
    color: '#ef4444',
    lightColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    steps: [
      { room: 'دەستپێک', name: 'نووسینی عەریزە' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ١٧', name: 'پاکانە' },
      { room: 'ژووری ٤', name: 'مامەڵات' },
      { room: 'ژووری ١٢', name: 'ڕسوومات' },
      { room: 'ژووری ٢٨', name: 'هاوبەشی ماڵان' },
      { room: 'ژووری ٣', name: 'وردبینی' },
      { room: 'ژووری ٨', name: 'سکان' },
      { room: 'ژووری ١٥', name: 'بەڕێوەبردنی ئەژمار' }
    ],
    infoBox: null,
    resultNote: 'داخستنی فەرمی ئەژمار لە سیستەم و لێکردنەوەی پێوەر'
  },
  {
    id: 5,
    title: 'جۆر گۆڕین (پۆل)',
    subtitle: 'Tariff / Category Change',
    categoryBadge: 'گۆڕینی پۆلی بەکارهێنان',
    color: '#a855f7',
    lightColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    steps: [
      { room: 'دەستپێک', name: 'نووسینی عەریزە' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ١٧', name: 'پاکانە' },
      { room: 'ژووری ٤', name: 'مامەڵات' },
      { room: 'ژووری ٣', name: 'وردبینی' },
      { room: 'ژووری ٨', name: 'سکان' },
      { room: 'ژووری ١٥', name: 'بەڕێوەبردنی ئەژمار' }
    ],
    infoBox: null,
    resultNote: 'گۆڕینی پۆل بۆ (ماڵان / بازرگانی / پیشەسازی / کشتوکاڵی)'
  },
  {
    id: 6,
    title: 'ڕێکخستنەوەی پارە',
    subtitle: 'Rebilling - إلغاء مبلغ',
    categoryBadge: 'چاکسازی و ڕاستکردنەوە',
    color: '#f97316',
    lightColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    steps: [
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١٨', name: 'تەکنیک' }
    ],
    infoBox: {
      title: 'بەڵگەنامە پێویستەکان',
      items: [
        'پسووڵەی گوماناوی / هەڵە',
        'وێنەی ڕوونی خوێندنەوەی سەر پێوەر',
        'کارتی نیشتمانیی هاوبەش',
        'کاتی تەواوبوون: لە هەمان ڕۆژدا'
      ]
    },
    resultNote: 'ڕاستکردنەوەی بڕی پسووڵە و لێبڕینی بڕی پارەی زیادە'
  },
  {
    id: 7,
    title: 'گەڕانەوەی تەزوو',
    subtitle: 'Power Reconnection',
    categoryBadge: 'بەستنەوە و چالاککردنەوە',
    color: '#14b8a6',
    lightColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: 'rgba(20, 184, 166, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    steps: [
      { room: 'دەستپێک', name: 'نووسینی عەریزە' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ١٧', name: 'پاکانە' },
      { room: 'ژووری ٤', name: 'مامەڵات' },
      { room: 'ژووری ١٥', name: 'بەڕێوەبردنی ئەژمار' }
    ],
    infoBox: {
      title: 'مەرجی سەرەکی',
      items: [
        'پاکتاوکردنی سەرجەم قەرزەکان',
        'وەرگرتنی فۆڕمی پاکانەی ژووری ١٧'
      ]
    },
    resultNote: 'کردنەوەی کارەبا لە سیستەمی مەرکەزی و گەڕانەوەی ٢٤ کاتژمێری'
  },
  {
    id: 8,
    title: 'وزەی خۆر',
    subtitle: 'Solar PV System',
    categoryBadge: 'پێوەری دووسەرە (Net-Metering)',
    color: '#eab308',
    lightColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    steps: [
      { room: 'ژووری ١٧', name: 'پاکانە' },
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ٧', name: 'خوێندنەوە و دابەشکردن' },
      { room: 'ژووری ٢٤', name: 'ڕاپۆرتی زیرەک' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'دابەشکردن', name: 'بەڕێوەبەرایەتی دابەشکردن' },
      { room: 'گشتی', name: 'بەڕێوەبەرایەتی گشتی' },
      { room: 'ژووری ١٧', name: 'دووبارە پاکانە' },
      { room: 'ژووری ٣', name: 'وردبینی' },
      { room: 'ژووری ٨', name: 'سکان' },
      { room: 'ژووری ١٥', name: 'بەڕێوەبردنی ئەژمار' }
    ],
    infoBox: null,
    resultNote: 'بەستنی پێوەری دووسەرەی Net-Metering و بەستنەوە بە تۆڕی نیشتمانی'
  },
  {
    id: 9,
    title: 'بڕینی کاتی',
    subtitle: 'Temporary Disconnection',
    categoryBadge: 'ڕاگرتنی کاتی بەکارهێنان',
    color: '#ec4899',
    lightColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.5)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    steps: [
      { room: 'دەستپێک', name: 'نووسینی عەریزە' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ١٧', name: 'پاکانە' },
      { room: 'ژووری ٤', name: 'مامەڵات' },
      { room: 'ژووری ١٢', name: 'ڕسوومات' },
      { room: 'ژووری ٢٨', name: 'هاوبەشی ماڵان' },
      { room: 'ژووری ٣', name: 'وردبینی' },
      { room: 'ژووری ٨', name: 'سکان' },
      { room: 'ژووری ١٥', name: 'بەڕێوەبردنی ئەژمار' }
    ],
    infoBox: null,
    resultNote: 'ڕاگرتنی هەژمارکردنی پارە تا کاتی داواکاری گەڕاندنەوە'
  }
];

// Generate Full Ultra-Luxury HTML
function buildPosterHTML() {
  return `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>نەخشەی پرۆسەی کاروباری هاوبەشان | پڕۆژەی نیشتمانیی ڕووناکی</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      letter-spacing: normal !important;
      word-spacing: normal !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    }

    @page {
      size: 420mm 297mm; /* Standard ISO A3 Landscape */
      margin: 0;
    }

    body {
      width: 420mm;
      height: 297mm;
      max-width: 420mm;
      max-height: 297mm;
      overflow: hidden;
      font-family: 'Vazirmatn', 'Segoe UI', Tahoma, Arial, sans-serif;
      background-color: #060b18;
      color: #f1f5f9;
      position: relative;
      direction: rtl;
      text-align: right;
    }

    .poster-container {
      width: 420mm;
      height: 297mm;
      padding: 7mm 9mm 5mm 9mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: 
        radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.18) 0%, transparent 50%),
        radial-gradient(ellipse at 10% 100%, rgba(6, 182, 212, 0.15) 0%, transparent 45%),
        radial-gradient(ellipse at 90% 100%, rgba(245, 158, 11, 0.14) 0%, transparent 45%),
        linear-gradient(180deg, #070d1e 0%, #050914 100%);
    }

    /* Ambient Circuit & Grid lines */
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 14mm 14mm;
      pointer-events: none;
      z-index: 1;
    }

    /* Royal Golden Outer Frame Border */
    .outer-frame {
      position: absolute;
      inset: 3.5mm;
      border: 1.5px solid rgba(245, 158, 11, 0.45);
      border-radius: 4.5mm;
      pointer-events: none;
      z-index: 2;
      box-shadow: inset 0 0 30px rgba(245, 158, 11, 0.06), 0 0 35px rgba(0, 0, 0, 0.85);
    }
    .outer-frame::before {
      content: '';
      position: absolute;
      inset: 1.5mm;
      border: 1px dashed rgba(245, 158, 11, 0.25);
      border-radius: 3.5mm;
      pointer-events: none;
    }

    .content-layer {
      position: relative;
      z-index: 10;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* ============================================================== */
    /* 1. HEADER SECTION                                             */
    /* ============================================================== */
    .header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3mm 6mm;
      background: rgba(15, 23, 42, 0.85);
      border: 1.2px solid rgba(245, 158, 11, 0.45);
      border-radius: 3.8mm;
      backdrop-filter: blur(14px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      margin-bottom: 3mm;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 4mm;
    }
    .logo-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-glow {
      position: absolute;
      inset: -5mm;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(10px);
    }
    .logo-img {
      height: 19mm;
      width: auto;
      object-fit: contain;
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 0 14px rgba(245, 158, 11, 0.7));
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 0.6mm;
    }
    .header-titles h1 {
      font-size: 7.2mm;
      font-weight: 900;
      line-height: 1.15;
      background: linear-gradient(135deg, #ffffff 15%, #fef08a 60%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 25px rgba(245, 158, 11, 0.25);
    }
    .header-titles .sub-title {
      font-size: 3.1mm;
      font-weight: 600;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 2.2mm;
    }
    .badge-gold {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15));
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.45);
      padding: 0.6mm 2.4mm;
      border-radius: 2mm;
      font-size: 2.8mm;
      font-weight: 800;
    }

    .header-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8mm;
      text-align: center;
    }
    .gov-badge {
      display: inline-flex;
      align-items: center;
      gap: 2mm;
      font-size: 2.8mm;
      font-weight: 700;
      color: #e2e8f0;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.8mm 3.2mm;
      border-radius: 3mm;
    }
    .directorate-title {
      font-size: 3.8mm;
      font-weight: 900;
      color: #f59e0b;
    }
    .division-tag {
      font-size: 2.8mm;
      font-weight: 700;
      color: #38bdf8;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1.2mm;
    }
    .hours-pill {
      display: inline-flex;
      align-items: center;
      gap: 1.8mm;
      padding: 1.2mm 3.2mm;
      border-radius: 3mm;
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(16, 185, 129, 0.45);
      color: #34d399;
      font-size: 2.9mm;
      font-weight: 800;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
    }
    .official-seal {
      font-size: 2.6mm;
      color: #94a3b8;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }

    /* ============================================================== */
    /* 2. NINE FLOW COLUMNS GRID                                      */
    /* ============================================================== */
    .columns-grid {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      gap: 2.8mm;
      flex: 1;
      height: 232mm;
      max-height: 232mm;
    }

    .flow-column {
      display: flex;
      flex-direction: column;
      background: rgba(15, 23, 42, 0.74);
      border-radius: 3.5mm;
      border: 1.2px solid rgba(255, 255, 255, 0.08);
      padding: 2.2mm 1.8mm;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
      position: relative;
      overflow: hidden;
      justify-content: space-between;
    }
    .flow-column::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--col-color, #f59e0b);
      box-shadow: 0 0 12px var(--col-color, #f59e0b);
    }

    /* Column Header */
    .col-header {
      text-align: center;
      padding-bottom: 1.8mm;
      margin-bottom: 1.8mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8mm;
      shrink: 0;
    }
    .col-icon-wrapper {
      width: 7.6mm;
      height: 7.6mm;
      border-radius: 2.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--col-light);
      color: var(--col-color);
      border: 1.2px solid var(--col-border);
      box-shadow: 0 0 12px var(--col-light);
    }
    .col-icon-wrapper svg {
      width: 4.5mm;
      height: 4.5mm;
    }
    .col-title {
      font-size: 3.4mm;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.15;
    }
    .col-meta-row {
      display: flex;
      align-items: center;
      gap: 1.2mm;
    }
    .col-badge {
      font-size: 2.1mm;
      font-weight: 700;
      color: var(--col-color);
      background: var(--col-light);
      padding: 0.3mm 1.8mm;
      border-radius: 1.5mm;
      border: 0.8px solid var(--col-border);
      white-space: nowrap;
    }
    .col-count {
      font-size: 2.1mm;
      font-weight: 800;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.08);
      padding: 0.3mm 1.6mm;
      border-radius: 1.5mm;
    }

    /* Steps List Container */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 1mm;
      justify-content: flex-start;
    }

    /* Step Item & Card */
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .step-card {
      width: 100%;
      background: rgba(30, 41, 59, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 2.2mm;
      padding: 1.2mm 1.6mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
      position: relative;
    }

    .step-num-badge {
      width: 4.2mm;
      height: 4.2mm;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 2.1mm;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      shrink: 0;
      border: 0.8px solid rgba(255, 255, 255, 0.15);
    }

    .step-body {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
      min-width: 0;
    }

    .room-tag {
      font-size: 2.15mm;
      font-weight: 900;
      color: #fbbf24;
      line-height: 1;
    }
    .step-name {
      font-size: 2.5mm;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.25;
      margin-top: 0.3mm;
    }

    /* Minimal Step Arrow */
    .step-arrow {
      height: 2.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.22);
    }
    .step-arrow svg {
      width: 2.4mm;
      height: 2.4mm;
      stroke-width: 2.4;
    }

    /* Final Step Success Highlight */
    .step-card.final-step {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.45) 100%);
      border: 1.2px solid rgba(16, 185, 129, 0.6);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    }
    .step-card.final-step .step-num-badge {
      background: #10b981;
      color: #064e3b;
      font-weight: 900;
      border: none;
    }
    .step-card.final-step .room-tag {
      color: #34d399;
    }

    /* Info Box for shorter columns to balance layout */
    .col-info-card {
      margin-top: 2mm;
      margin-bottom: 2mm;
      background: rgba(30, 41, 59, 0.65);
      border: 1px dashed var(--col-border);
      border-radius: 2.2mm;
      padding: 1.8mm 2mm;
      font-size: 2mm;
      line-height: 1.35;
      color: #e2e8f0;
    }
    .col-info-card .info-title {
      font-size: 2.1mm;
      font-weight: 800;
      color: var(--col-color);
      display: flex;
      align-items: center;
      gap: 1mm;
      margin-bottom: 1mm;
      border-bottom: 0.8px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.6mm;
    }
    .col-info-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.8mm;
    }
    .col-info-card li {
      display: flex;
      align-items: center;
      gap: 1.2mm;
    }
    .col-info-card li::before {
      content: '•';
      color: var(--col-color);
      font-weight: 900;
    }

    /* Column Outcome Result Card at bottom */
    .col-outcome-card {
      margin-top: auto;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid var(--col-border);
      border-radius: 2.2mm;
      padding: 1.5mm 1.8mm;
      font-size: 1.95mm;
      line-height: 1.3;
      color: #cbd5e1;
      text-align: center;
      box-shadow: inset 0 0 8px var(--col-light);
    }
    .col-outcome-card .outcome-title {
      font-weight: 800;
      color: var(--col-color);
      font-size: 2.05mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1mm;
      margin-bottom: 0.5mm;
    }

    /* ============================================================== */
    /* 3. FOOTER SECTION                                              */
    /* ============================================================== */
    .footer-bar {
      margin-top: 3mm;
      padding: 2.6mm 6mm;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 3.5mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(12px);
    }

    .footer-item-pill {
      display: inline-flex;
      align-items: center;
      gap: 1.6mm;
      padding: 1mm 2.8mm;
      border-radius: 2mm;
      background: rgba(245, 158, 11, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      font-size: 2.8mm;
      font-weight: 800;
    }

    .footer-text {
      font-size: 2.8mm;
      font-weight: 700;
      color: #cbd5e1;
    }
    .footer-sub {
      font-size: 2.7mm;
      font-weight: 600;
      color: #94a3b8;
    }
    .footer-link {
      font-size: 2.8mm;
      font-weight: 800;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 1.8mm;
    }
  </style>
</head>
<body>
  <div class="poster-container">
    <div class="bg-grid"></div>
    <div class="outer-frame"></div>

    <div class="content-layer">
      <!-- 1. HEADER -->
      <header class="header-banner">
        <div class="header-right">
          ${logoBase64 ? `
            <div class="logo-container">
              <div class="logo-glow"></div>
              <img src="${logoBase64}" class="logo-img" alt="ڕووناکی">
            </div>
          ` : ''}
          <div class="header-titles">
            <h1>نەخشەی پرۆسەی ڕێڕەوی کاروباری هاوبەشان</h1>
            <div class="sub-title">
              <span class="badge-gold">پڕۆژەی نیشتمانیی ڕووناکی</span>
              <span>Customer Account Process Flowchart • بەشی خزمەتگوزاری هاوبەشان</span>
            </div>
          </div>
        </div>

        <div class="header-center">
          <div class="gov-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
            حکومەتی هەرێمی کوردستان • وەزارەتی کارەبا
          </div>
          <div class="directorate-title">
            بەڕێوەبەرایەتی دابەشکردنی کارەبای هەولێر / فرۆشیاری وزە ٢
          </div>
          <div class="division-tag">
            هۆبەی خزمەتگوزاری و بەڕێوەبردنی دۆسیەکانی هاوبەشان (ژووری ١٩)
          </div>
        </div>

        <div class="header-left">
          <div class="hours-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            کارەبای ٢٤ کاتژمێری
          </div>
          <div class="official-seal">
            ڕێبەری فەرمی قۆناغەکان بۆ هاووڵاتیان و کارمەندان
          </div>
        </div>
      </header>

      <!-- 2. NINE FLOW COLUMNS -->
      <main class="columns-grid">
        ${WORKFLOWS.map((wf) => `
          <div class="flow-column" style="--col-color: ${wf.color}; --col-light: ${wf.lightColor}; --col-border: ${wf.borderColor};">
            <!-- Column Header -->
            <div class="col-header">
              <div class="col-icon-wrapper">
                ${wf.icon}
              </div>
              <div class="col-title">${wf.title}</div>
              <div class="col-meta-row">
                <span class="col-badge">${wf.categoryBadge}</span>
                <span class="col-count">${toKurdishNum(wf.steps.length)} قۆناغ</span>
              </div>
            </div>

            <!-- Steps List -->
            <div class="steps-list">
              ${wf.steps.map((st, sIdx) => {
                const isFinal = sIdx === wf.steps.length - 1;
                return `
                  <div class="step-item">
                    <div class="step-card ${isFinal ? 'final-step' : ''}">
                      <div class="step-num-badge">${toKurdishNum(sIdx + 1)}</div>
                      <div class="step-body">
                        <span class="room-tag">${st.room}</span>
                        <span class="step-name" title="${st.name}">${st.name}</span>
                      </div>
                    </div>
                    ${!isFinal ? `
                      <div class="step-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <polyline points="19 12 12 19 5 12"></polyline>
                        </svg>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}

              ${wf.infoBox ? `
                <div class="col-info-card">
                  <div class="info-title">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    ${wf.infoBox.title}
                  </div>
                  <ul>
                    ${wf.infoBox.items.map(it => `<li>${it}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>

            <!-- Column Outcome Card at bottom -->
            <div class="col-outcome-card">
              <div class="outcome-title">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                ئەنجامی کۆتایی
              </div>
              <div>${wf.resultNote}</div>
            </div>
          </div>
        `).join('')}
      </main>

      <!-- 3. FOOTER -->
      <footer class="footer-bar">
        <div style="display: flex; align-items: center; gap: 4mm;">
          <div class="footer-item-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            هێڵی گەرم: ۱۹۹۲
          </div>
          <span class="footer-text">بەڕێوەبەرایەتی دابەشکردنی کارەبای هەولێر - فرۆشیاری وزە ٢ (ژووری ١٩)</span>
        </div>

        <div class="footer-sub">
          مافی لەبەرگرتنەوە و دیزاین پارێزراوە بۆ پڕۆژەی نیشتمانیی ڕووناکی © ${new Date().getFullYear()}
        </div>

        <div class="footer-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          runaki.gov.krd
        </div>
      </footer>
    </div>
  </div>
</body>
</html>`;
}

// 2. Export HTML, PDF, and PNG
async function run() {
  console.log('Generating Flowchart Poster HTML...');
  const htmlContent = buildPosterHTML();
  const htmlOutPath = path.resolve('C:/Prject/ubereats-clone-main/runaki-account-process-flowchart.html');
  fs.writeFileSync(htmlOutPath, htmlContent, 'utf8');
  console.log('Saved HTML to:', htmlOutPath);

  console.log('Launching Puppeteer for PDF & PNG rendering...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  
  // High-res viewport for A3 landscape
  await page.setViewport({
    width: 2381,  // A3 landscape width at ~144 DPI
    height: 1684, // A3 landscape height at ~144 DPI
    deviceScaleFactor: 2
  });

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Wait for web fonts to be completely ready
  await page.evaluateHandle('document.fonts.ready');

  // 1. Generate PDF
  const pdfOutPath = path.resolve('C:/Prject/ubereats-clone-main/runaki-account-process-flowchart.pdf');
  await page.pdf({
    path: pdfOutPath,
    width: '420mm',
    height: '297mm',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    preferCSSPageSize: true
  });
  console.log('Generated PDF at:', pdfOutPath);

  // 2. Generate High-Res PNG
  const pngOutPath = path.resolve('C:/Prject/ubereats-clone-main/runaki-account-process-flowchart.png');
  await page.screenshot({
    path: pngOutPath,
    fullPage: true,
    type: 'png'
  });
  console.log('Generated PNG at:', pngOutPath);

  await browser.close();
  console.log('SUCCESS: All files generated flawlessly!');
}

run().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
