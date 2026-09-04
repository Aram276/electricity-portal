export const STATUS_CONFIG = {
  COMPLETED: {
    id: 'COMPLETED',
    label: 'وەرگیراوەتەوە / تەسلیم کراوە (Done)',
    shortLabel: 'وەرگیراوەتەوە (Done)',
    color: 'emerald',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
    bgLight: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-300 dark:border-emerald-500/40',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    iconName: 'CheckCircle2',
    citizenMessage: 'ئەم فایلە تەواو بووە و بە فەرمی لەلایەن هاووڵاتی/بەشداربوو وەرگیراوەتەوە.',
    citizenAction: 'ئەم فایلە وەرگیراوەتەوە.',
    stepIndex: 3,
  },
  IN_PROGRESS: {
    id: 'IN_PROGRESS',
    label: 'پێنەدراوەتەوە - لەلای ئێمەیە (Not Done)',
    shortLabel: 'پێنەدراوەتەوە (لەلای ئێمەیە)',
    color: 'amber',
    badgeClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
    bgLight: 'bg-amber-50/80 dark:bg-amber-950/40',
    borderClass: 'border-amber-300 dark:border-amber-500/40',
    textClass: 'text-amber-700 dark:text-amber-400',
    iconName: 'Clock',
    citizenMessage: 'ئەم فایلە هێشتا پێت نەدراوەتەوە و لە ئێستادا لە ناو فەرمانگەیە لەلای ئێمە.',
    citizenAction: 'فایلەکەت پارێزراوە لەلای ئێمە.',
    stepIndex: 2,
  },
  NOT_CONTACTED: {
    id: 'NOT_CONTACTED',
    label: 'پەیوەندی نەکراوە / تەلەفۆنت بۆ نەکراوە',
    shortLabel: 'پەیوەندی نەکراوە',
    color: 'orange',
    badgeClass: 'bg-orange-100 dark:bg-orange-500/20 text-orange-900 dark:text-orange-300 border-orange-300 dark:border-orange-500/40',
    bgLight: 'bg-orange-50/80 dark:bg-orange-950/40',
    borderClass: 'border-orange-300 dark:border-orange-500/40',
    textClass: 'text-orange-700 dark:text-orange-400',
    iconName: 'PhoneMissed',
    citizenMessage: 'هێشتا پەیوەندیت پێوە نەکراوە، یان لە کاتی پەیوەندیکردندا وەڵامت نەداوەتەوە. دۆسیەکەت پارێزراوە و لە چاوەڕوانی پەیوەندیدایە.',
    citizenAction: 'تکایە دڵنیابە لە کراوەیی ژمارە مۆبایلەکەت یاخود سەردانی هۆبەی وەرگرتنی مامەڵەکان بکە.',
    stepIndex: 1,
  },
  DELIVERED: {
    id: 'DELIVERED',
    label: 'تەسلیم کراوەتەوە / وەرگیراوەتەوە',
    shortLabel: 'تەسلیم کراوە',
    color: 'blue',
    badgeClass: 'bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-500/40',
    bgLight: 'bg-blue-50/80 dark:bg-blue-950/40',
    borderClass: 'border-blue-300 dark:border-blue-500/40',
    textClass: 'text-blue-700 dark:text-blue-400',
    iconName: 'PackageCheck',
    citizenMessage: 'ئەم مامەڵەیە بە تەواوی تەسلیم کراوەتەوە و لە فەرمانگە وەرگیراوەتەوە.',
    citizenAction: 'مامەڵەکە کۆتایی هاتووە و ئەرشیف کراوە.',
    stepIndex: 4,
  },
  NEEDS_DOCS: {
    id: 'NEEDS_DOCS',
    label: 'پێویستی بە بەڵگەنامەی تەواوکارییە',
    shortLabel: 'کەموکوڕی بەڵگەنامە',
    color: 'rose',
    badgeClass: 'bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
    bgLight: 'bg-rose-50/80 dark:bg-rose-950/40',
    borderClass: 'border-rose-300 dark:border-rose-500/40',
    textClass: 'text-rose-700 dark:text-rose-400',
    iconName: 'AlertCircle',
    citizenMessage: 'مامەڵەکەت پێویستی بە هێنانی هەندێک بەڵگەنامەی تەواوکاری یان پەسەندکردنە.',
    citizenAction: 'تکایە بەزووترین کات سەردانی هۆبەی پێداچوونەوە بکە بە بەڵگەنامە پێویستەکانەوە.',
    stepIndex: 1,
  }
};

export const DEPARTMENTS = [
  'بەڕێوەبەرایەتی دابەشکردنی کارەبای هەولێر',
  'بەڕێوەبەرایەتی دابەشکردنی کارەبای دەوروبەری هەولێر',
  'فرۆشیاری وزە ٢ (هەولێر)',
  'بەڕێوەبەرایەتی دابەشکردنی کارەبای سلێمانی',
  'بەڕێوەبەرایەتی دابەشکردنی کارەبای دهۆک',
  'بەڕێوەبەرایەتی دابەشکردنی کارەبای گەرمیان',
  'بەڕێوەبەرایەتی دابەشکردنی کارەبای ڕاپەڕین',
  'هۆبەی پێوەرە زیرەکەکان',
  'هۆبەی چاککردن و بەستنەوە'
];

export const TRANSACTION_TYPES = [
  'بەستنی پێوەری نوێ (اشتراك جديد)',
  'گۆڕینی ناوی بەشداربوو (نقل ملكية)',
  'زیادکردنی بڕی ئەمپێر / توانای کارەبا',
  'چاککردنەوە و پشکنینی پێوەر',
  'جیاکردنەوەی پێوەر (تفريق مقياس)',
  'گواستنەوەی پێوەر لە شوێنێک بۆ شوێنێکی تر',
  'پاکتاوکردنی قەرز و ئەژمار'
];

export const FILE_TYPES = {
  YELLOW_FOLDER: {
    id: 'YELLOW_FOLDER',
    label: 'فایلی زەرد',
    shortLabel: 'فایلی زەرد 📁',
    badgeClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
    color: 'amber',
    icon: 'Folder'
  },
  PAPER: {
    id: 'PAPER',
    label: 'ئەوراق',
    shortLabel: 'ئەوراق 📄',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    color: 'slate',
    icon: 'FileText'
  }
};

