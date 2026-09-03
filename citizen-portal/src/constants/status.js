export const STATUS_CONFIG = {
  COMPLETED: {
    label: 'وەرگیراوەتەوە (Done)',
    shortLabel: 'وەرگیراوەتەوە',
    citizenStatusTitle: 'دۆسیەکەت تەواوبووە و ئامادەی وەرگرتنەوەیە',
    citizenStatusDesc: 'دەتوانیت سەردانی بەڕێوەبەرایەتی بکەیت بۆ وەرگرتنەوەی دۆسیەکەت',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    color: 'emerald'
  },
  IN_PROGRESS: {
    label: 'پێنەدراوەتەوە - لەلای ئێمەیە (Not Done)',
    shortLabel: 'پێنەدراوەتەوە',
    citizenStatusTitle: 'دۆسیەکەت لە قۆناغی کارکردندایە و لەلای ئێمەیە',
    citizenStatusDesc: 'تکایە چاوەڕوان بە تاوەکو پەیوەندیت پێوە دەکرێت',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
    dotClass: 'bg-amber-500',
    color: 'amber'
  },
  DELIVERED: {
    label: 'تەسلیم کرا (Delivered)',
    shortLabel: 'تەسلیم کرا',
    citizenStatusTitle: 'دۆسیەکەت بە فەرمی تەسلیم کراوەتەوە',
    citizenStatusDesc: 'دۆسیەکە وەرگیراوەتەوە و لە سیستەم بە تەسلیمکراو تۆمار کراوە',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
    dotClass: 'bg-blue-500',
    color: 'blue'
  }
};
