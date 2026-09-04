/**
 * WhatsApp Helper for Kurdistan Electricity Directorate / Roonaki Project
 */

export const DEFAULT_WHATSAPP_TEMPLATE = `سڵاو بەڕێز {ناو}،
ئاگادارت دەکەینەوە لە پڕۆژەی ڕووناکی (فرۆشیاری وزە ٢):

📄 دۆخی مامەڵە: {دۆخ}
📁 ژمارەی فایل لە ئەرشیف: {ژمارەی_فایل}
⚡ ژمارەی ئەژمار (ID): {ژمارەی_ئەژمار}
🚪 ژووری سەردانیکردن: ژووری ژمارە ١٩
📍 ناونیشان: هەولێر - بەڕێوەبەرایەتی دابەشکردنی کارەبا (فرۆشیاری وزە ٢)
⏰ کاتی دەوام: یەکشەممە تا پێنجشەممە (٨:٣٠ بەیانی - ١:٣٠ پاشنیوەڕۆ)

تکایە لە کاتی سەردانیکردنی ژووری ژمارە ١٩، ژمارەی فایلی سەرەوە ( {ژمارەی_فایل} ) بە فەرمانبەر ڕابگەیەنە.
پڕۆژەی نیشتمانیی ڕووناکی`;

export function cleanIraqiPhone(phoneStr) {
  if (!phoneStr) return null;
  const digits = String(phoneStr).replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return null;

  // Already starts with 964
  if (digits.startsWith('964')) {
    return digits;
  }
  // Starts with 07 (e.g. 07501234567) -> 9647501234567
  if (digits.startsWith('07')) {
    return '964' + digits.slice(1);
  }
  // Starts with 7 (e.g. 7501234567) -> 9647501234567
  if (digits.startsWith('7')) {
    return '964' + digits;
  }

  return digits;
}

export function getCustomWhatsAppTemplate() {
  return localStorage.getItem('electricity_whatsapp_template') || DEFAULT_WHATSAPP_TEMPLATE;
}

export function saveCustomWhatsAppTemplate(template) {
  if (template && typeof template === 'string') {
    localStorage.setItem('electricity_whatsapp_template', template);
  }
}

export function buildWhatsAppMessage(record, customTemplate) {
  if (!record) return '';
  const template = customTemplate || getCustomWhatsAppTemplate();

  const citizenName = (record.citizenName && record.citizenName !== 'هاوبەشی کارەبا') 
    ? record.citizenName 
    : 'هاوبەشی بەڕێز';

  const isCompleted = record.status === 'COMPLETED';
  const isDelivered = record.status === 'DELIVERED';
  
  let statusText = 'لە جێبەجێکردندایە و لە ئەرشیف پارێزراوە';
  if (isCompleted) {
    statusText = '✅ تەواوبووە (Done) و ئامادەیە بۆ وەرگرتنەوە';
  } else if (isDelivered) {
    statusText = '📦 بە فەرمی تەسلیم کراوەتەوە';
  } else if (record.status === 'NOT_CONTACTED') {
    statusText = '⏳ لە چاوەڕوانی پەیوەندیدایە';
  }

  let msg = template
    .replaceAll('{ناو}', citizenName)
    .replaceAll('{name}', citizenName)
    .replaceAll('{ژمارەی_فایل}', record.fileNumber || 'نادیار')
    .replaceAll('{fileNumber}', record.fileNumber || 'نادیار')
    .replaceAll('{ژمارەی_ئەژمار}', record.accountNumber || 'نیە')
    .replaceAll('{accountNumber}', record.accountNumber || 'نیە')
    .replaceAll('{دۆخ}', statusText)
    .replaceAll('{status}', statusText)
    .replaceAll('{ژوور}', 'ژووری ژمارە ١٩')
    .replaceAll('{فەرمانگە}', 'فرۆشیاری وزە ٢ (هەولێر)');

  return msg;
}

export function generateWhatsAppUrl(record, customTemplate) {
  if (!record || !record.phoneNumber) return null;
  const cleaned = cleanIraqiPhone(record.phoneNumber);
  if (!cleaned) return null;

  const message = buildWhatsAppMessage(record, customTemplate);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}
