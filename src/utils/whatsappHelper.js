/**
 * WhatsApp Helper for Kurdistan Electricity Directorate / Roonaki Project
 */

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

export function generateWhatsAppUrl(record) {
  if (!record || !record.phoneNumber) return null;
  const cleaned = cleanIraqiPhone(record.phoneNumber);
  if (!cleaned) return null;

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
  }

  const message = `سڵاو بەڕێز ${citizenName}،
ئاگادارت دەکەینەوە لە پڕۆژەی ڕووناکی (فرۆشیاری وزە ٢):

📄 دۆخی مامەڵە: ${statusText}
📁 ژمارەی فایل لە ئەرشیف: ${record.fileNumber}
⚡ ژمارەی ئەژمار (ID): ${record.accountNumber || 'نیە'}
📍 ناونیشان: هەولێر - فرۆشیاری وزە ٢
⏰ کاتی دەوام: ٨:٣٠ بەیانی - ١:٣٠ پاشنیوەڕۆ

تکایە لە کاتی سەردانیکردن ژمارەی فایلی سەرەوە ( ${record.fileNumber} ) بە فەرمانبەر ڕابگەیەنە.
پڕۆژەی نیشتمانیی ڕووناکی`;

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}
