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
    categoryBadge: 'بەستنی پێوەری نوێ',
    color: '#059669', // Emerald
    lightBg: '#ecfdf5',
    borderColor: '#10b981',
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
    resultNote: 'بەستنی پێوەری زیرەک و کارابوونی کارەبای ٢٤ کاتژمێری'
  },
  {
    id: 2,
    title: 'ناو گۆڕین',
    categoryBadge: 'گواستنەوەی خاوەندارێتی',
    color: '#0284c7', // Sky / Cyan
    lightBg: '#f0f9ff',
    borderColor: '#0ea5e9',
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
    categoryBadge: 'چاکسازی و گۆڕینی پێوەر',
    color: '#d97706', // Amber
    lightBg: '#fffbeb',
    borderColor: '#f59e0b',
    steps: [
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١٨', name: 'تەکنیک' }
    ],
    infoBox: {
      title: 'بەڵگەنامە پێویستەکان',
      items: [
        'کۆتا پسووڵەی کارەبا',
        'وێنەی ڕوونی پێوەر',
        'کارتی نیشتمانی / ناسنامە',
        'ماوە: ٢٤ بۆ ٤٨ کاتژمێر'
      ]
    },
    resultNote: 'بەستنی پێوەری نوێ لەلایەن تیمی تەکنیک و نوێکردنەوە لە سیستەم'
  },
  {
    id: 4,
    title: 'بڕینی کۆتایی',
    categoryBadge: 'هەڵوەشاندنەوەی هاوبەشی',
    color: '#dc2626', // Red
    lightBg: '#fef2f2',
    borderColor: '#ef4444',
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
    categoryBadge: 'گۆڕینی پۆلی بەکارهێنان',
    color: '#7c3aed', // Purple
    lightBg: '#f5f3ff',
    borderColor: '#8b5cf6',
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
    categoryBadge: 'Rebilling - إلغاء مبلغ',
    color: '#ea580c', // Orange
    lightBg: '#fff7ed',
    borderColor: '#f97316',
    steps: [
      { room: 'ژووری ١١', name: 'هۆبەی خزمەتگوزاری' },
      { room: 'ژووری ٢٣', name: 'بەڕێوەبەر' },
      { room: 'ژووری ١٨', name: 'تەکنیک' }
    ],
    infoBox: {
      title: 'بەڵگەنامە پێویستەکان',
      items: [
        'پسووڵەی گوماناوی / هەڵە',
        'وێنەی ڕوونی سەر پێوەر',
        'کارتی نیشتمانیی هاوبەش',
        'ماوە: لە هەمان ڕۆژدا'
      ]
    },
    resultNote: 'ڕاستکردنەوەی بڕی پسووڵە و لێبڕینی بڕی پارەی زیادە'
  },
  {
    id: 7,
    title: 'گەڕانەوەی تەزوو',
    categoryBadge: 'بەستنەوە و چالاککردنەوە',
    color: '#0d9488', // Teal
    lightBg: '#f0fdfa',
    borderColor: '#14b8a6',
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
    categoryBadge: 'پێوەری دووسەرە (Net-Metering)',
    color: '#ca8a04', // Dark Yellow/Gold
    lightBg: '#fefce8',
    borderColor: '#eab308',
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
    resultNote: 'بەستنی پێوەری Net-Metering و بەستنەوە بە تۆڕی نیشتمانی'
  },
  {
    id: 9,
    title: 'بڕینی کاتی',
    categoryBadge: 'ڕاگرتنی کاتی بەکارهێنان',
    color: '#db2777', // Pink / Rose
    lightBg: '#fdf2f8',
    borderColor: '#ec4899',
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

// Generate Light Luxury HTML
function buildLightPosterHTML() {
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
      background-color: #f8fafc;
      color: #0f172a;
      position: relative;
      direction: rtl;
      text-align: right;
    }

    .poster-container {
      width: 420mm;
      height: 297mm;
      padding: 5.5mm 7.5mm 4.5mm 7.5mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: 
        radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 60%),
        radial-gradient(ellipse at 10% 100%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
        linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 100%);
    }

    /* Elegant Subtle Border Frame */
    .outer-frame {
      position: absolute;
      inset: 3mm;
      border: 1.5px solid #cbd5e1;
      border-radius: 4mm;
      pointer-events: none;
      z-index: 2;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.04);
    }
    .outer-frame::before {
      content: '';
      position: absolute;
      inset: 1.5mm;
      border: 1px dashed rgba(245, 158, 11, 0.4);
      border-radius: 3mm;
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
    /* 1. HEADER SECTION (LIGHT THEME)                                */
    /* ============================================================== */
    .header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2.8mm 5.5mm;
      background: #ffffff;
      border: 1.5px solid #fbbf24;
      border-radius: 3.5mm;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
      margin-bottom: 2.5mm;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 3.5mm;
    }
    .logo-img {
      height: 17.5mm;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(245, 158, 11, 0.35));
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 0.5mm;
    }
    .header-titles h1 {
      font-size: 7mm;
      font-weight: 900;
      line-height: 1.15;
      color: #0f172a;
    }
    .header-titles h1 span.gold-highlight {
      color: #d97706;
    }
    .header-titles .sub-title {
      font-size: 3mm;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .badge-gold {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
      padding: 0.4mm 2.2mm;
      border-radius: 1.8mm;
      font-size: 2.7mm;
      font-weight: 800;
    }

    .header-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6mm;
      text-align: center;
    }
    .gov-badge {
      display: inline-flex;
      align-items: center;
      gap: 1.8mm;
      font-size: 2.7mm;
      font-weight: 700;
      color: #334155;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.6mm 3mm;
      border-radius: 2.5mm;
    }
    .directorate-title {
      font-size: 3.7mm;
      font-weight: 900;
      color: #b45309;
    }
    .division-tag {
      font-size: 2.7mm;
      font-weight: 700;
      color: #0284c7;
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
      padding: 0.9mm 3mm;
      border-radius: 2.5mm;
      background: #ecfdf5;
      border: 1.2px solid #a7f3d0;
      color: #047857;
      font-size: 2.8mm;
      font-weight: 800;
      box-shadow: 0 1px 4px rgba(16, 185, 129, 0.15);
    }
    .official-seal {
      font-size: 2.5mm;
      color: #64748b;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }

    /* ============================================================== */
    /* 2. NINE FLOW COLUMNS (CLEAN LIGHT DESIGN - NO ICONS)            */
    /* ============================================================== */
    .columns-grid {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      gap: 2.4mm;
      flex: 1;
      height: 240mm;
      max-height: 240mm;
    }

    .flow-column {
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 3mm;
      border: 1.4px solid #e2e8f0;
      padding: 1.8mm 1.6mm;
      box-shadow: 0 2px 7px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
      justify-content: space-between;
    }
    /* Distinct colored top bar */
    .flow-column::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--col-color, #0284c7);
    }

    /* Responsive, Clean Column Header (Stacked, No collisions, No icons) */
    .col-header {
      text-align: center;
      padding-top: 0.8mm;
      padding-bottom: 1.6mm;
      margin-bottom: 1.4mm;
      border-bottom: 1.2px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8mm;
      shrink: 0;
      width: 100%;
    }
    
    .col-top-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.4mm;
      width: 100%;
    }
    .col-id-badge {
      font-size: 2.1mm;
      font-weight: 800;
      color: #64748b;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.3mm 1.6mm;
      border-radius: 1.5mm;
    }
    .col-steps-pill {
      font-size: 2.1mm;
      font-weight: 800;
      color: var(--col-color);
      background: var(--col-light);
      border: 1px solid var(--col-border);
      padding: 0.3mm 2mm;
      border-radius: 1.5mm;
    }

    .col-title {
      font-size: 3.5mm;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin-top: 0.4mm;
      width: 100%;
      text-align: center;
    }

    .col-category-tag {
      font-size: 2mm;
      font-weight: 700;
      color: #475569;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.4mm 1.5mm;
      border-radius: 1.5mm;
      width: 100%;
      text-align: center;
      line-height: 1.2;
      white-space: normal;
      word-break: break-word;
    }

    /* Steps List Container */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 0.7mm;
      justify-content: flex-start;
      flex: 1;
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
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 1.8mm;
      padding: 1.1mm 1.5mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      position: relative;
    }

    .step-num-badge {
      width: 4.2mm;
      height: 4.2mm;
      border-radius: 50%;
      background: #ffffff;
      color: #475569;
      font-size: 2.1mm;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      shrink: 0;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .step-body {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
      min-width: 0;
    }

    .room-tag {
      font-size: 2.05mm;
      font-weight: 800;
      color: #b45309;
      line-height: 1;
    }
    .step-name {
      font-size: 2.4mm;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.25;
      margin-top: 0.25mm;
    }

    /* Downward Flow Arrow */
    .step-arrow {
      height: 1.8mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }
    .step-arrow svg {
      width: 2.2mm;
      height: 2.2mm;
      stroke-width: 2.4;
    }

    /* Final Step Highlight */
    .step-card.final-step {
      background: #ecfdf5;
      border: 1.3px solid #10b981;
      box-shadow: 0 1px 5px rgba(16, 185, 129, 0.15);
    }
    .step-card.final-step .step-num-badge {
      background: #10b981;
      color: #ffffff;
      font-weight: 900;
      border: none;
    }
    .step-card.final-step .room-tag {
      color: #047857;
    }
    .step-card.final-step .step-name {
      color: #064e3b;
      font-weight: 800;
    }

    /* Info Box for shorter columns to balance layout */
    .col-info-card {
      margin-top: 1.2mm;
      margin-bottom: 1.2mm;
      background: #f8fafc;
      border: 1px dashed var(--col-border);
      border-radius: 1.8mm;
      padding: 1.4mm 1.6mm;
      font-size: 1.95mm;
      line-height: 1.3;
      color: #334155;
    }
    .col-info-card .info-title {
      font-size: 2mm;
      font-weight: 800;
      color: var(--col-color);
      display: flex;
      align-items: center;
      gap: 1mm;
      margin-bottom: 0.6mm;
      border-bottom: 0.8px solid #e2e8f0;
      padding-bottom: 0.4mm;
    }
    .col-info-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6mm;
    }
    .col-info-card li {
      display: flex;
      align-items: center;
      gap: 1mm;
    }
    .col-info-card li::before {
      content: '•';
      color: var(--col-color);
      font-weight: 900;
    }

    /* Column Outcome Result Card at bottom */
    .col-outcome-card {
      margin-top: auto;
      background: var(--col-light);
      border: 1px solid var(--col-border);
      border-radius: 1.8mm;
      padding: 1.3mm 1.6mm;
      font-size: 1.9mm;
      line-height: 1.25;
      color: #1e293b;
      text-align: center;
    }
    .col-outcome-card .outcome-title {
      font-weight: 800;
      color: var(--col-color);
      font-size: 2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1mm;
      margin-bottom: 0.3mm;
    }

    /* ============================================================== */
    /* 3. FOOTER SECTION (LIGHT THEME)                                */
    /* ============================================================== */
    .footer-bar {
      margin-top: 2.5mm;
      padding: 2.2mm 5.5mm;
      background: #ffffff;
      border: 1.2px solid #e2e8f0;
      border-radius: 2.8mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    }

    .footer-item-pill {
      display: inline-flex;
      align-items: center;
      gap: 1.5mm;
      padding: 0.7mm 2.4mm;
      border-radius: 1.6mm;
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #b45309;
      font-size: 2.7mm;
      font-weight: 800;
    }

    .footer-text {
      font-size: 2.7mm;
      font-weight: 700;
      color: #334155;
    }
    .footer-sub {
      font-size: 2.6mm;
      font-weight: 600;
      color: #64748b;
    }
    .footer-link {
      font-size: 2.7mm;
      font-weight: 800;
      color: #0284c7;
      display: flex;
      align-items: center;
      gap: 1.6mm;
    }
  </style>
</head>
<body>
  <div class="poster-container">
    <div class="outer-frame"></div>

    <div class="content-layer">
      <!-- 1. HEADER -->
      <header class="header-banner">
        <div class="header-right">
          ${logoBase64 ? `
            <div class="logo-container">
              <img src="${logoBase64}" class="logo-img" alt="ڕووناکی">
            </div>
          ` : ''}
          <div class="header-titles">
            <h1>نەخشەی پرۆسەی ڕێڕەوی <span class="gold-highlight">کاروباری هاوبەشان</span></h1>
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

      <!-- 2. NINE FLOW COLUMNS (LIGHT THEME, NO ICONS, FULLY RESPONSIVE) -->
      <main class="columns-grid">
        ${WORKFLOWS.map((wf) => `
          <div class="flow-column" style="--col-color: ${wf.color}; --col-light: ${wf.lightBg}; --col-border: ${wf.borderColor};">
            <!-- Clean Header without icons -->
            <div class="col-header">
              <div class="col-top-indicator">
                <span class="col-id-badge">مامەڵەی ${toKurdishNum(wf.id)}</span>
                <span class="col-steps-pill">${toKurdishNum(wf.steps.length)} قۆناغ</span>
              </div>
              <div class="col-title">${wf.title}</div>
              <div class="col-category-tag">${wf.categoryBadge}</div>
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
  console.log('Generating Flowchart Poster HTML (Light Mode)...');
  const htmlContent = buildLightPosterHTML();
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

  // Also copy to artifact directory
  const artifactPngPath = 'C:/Users/LEDS GAMING/.gemini/antigravity/brain/4ed3a3ca-1935-4789-bcdd-f4b3ffd52478/runaki-account-process-flowchart.png';
  try {
    fs.copyFileSync(pngOutPath, artifactPngPath);
    console.log('Copied PNG to artifact directory');
  } catch(e) {}

  await browser.close();
  console.log('SUCCESS: All files generated flawlessly!');
}

run().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
