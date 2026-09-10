/**
 * Role-Based Access Control (RBAC) & Permissions Helper
 * Projects: Electricity Directorate & Room 19 Admin Portal
 */

export const ROLES = {
  ADMIN: 'ADMIN',     // بەڕێوەبەری سەرەکی - Full access
  STAFF: 'STAFF',     // فەرمانبەری ژووری ١٩ - Create, Edit, Deliver, WhatsApp
  VIEWER: 'VIEWER'    // تەنها بینەر - Read-only, Search, Print, Export Excel
};

export const ROLE_CONFIG = {
  ADMIN: {
    label: 'بەڕێوەبەری سەرەکی',
    badgeClass: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    description: 'دەسەڵاتی تەواو بەسەر سەرجەم بەشەکان، سڕینەوە، و بەڕێوەبردنی ستاف'
  },
  STAFF: {
    label: 'فەرمانبەری ژووری ١٩',
    badgeClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
    description: 'دەسەڵاتی داخڵکردنی خێرا، تەسلیمکردنەوە، و دەستکاریکردنی فایل'
  },
  VIEWER: {
    label: 'تەنها بینەر (Viewer)',
    badgeClass: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    description: 'تەنها بینینی داتاکان، گەڕان، چاپی پسوولە و داگرتنی ئێکسڵ'
  }
};

/**
 * Check if the active staff has a specific role
 */
export function getStaffRole(staff) {
  if (!staff) return ROLES.ADMIN;
  const raw = String(staff.role || 'ADMIN').toUpperCase().trim();
  if (raw === 'VIEWER') return ROLES.VIEWER;
  if (raw === 'STAFF') return ROLES.STAFF;
  return ROLES.ADMIN;
}

/**
 * Can create new records or use Daily Quick Intake
 */
export function canCreate(staff) {
  const role = getStaffRole(staff);
  return role === ROLES.ADMIN || role === ROLES.STAFF;
}

/**
 * Can edit existing records or change status/KYC
 */
export function canEdit(staff) {
  const role = getStaffRole(staff);
  return role === ROLES.ADMIN || role === ROLES.STAFF;
}

/**
 * Can deliver records (Fast Delivery Checkout)
 */
export function canDeliver(staff) {
  const role = getStaffRole(staff);
  return role === ROLES.ADMIN || role === ROLES.STAFF;
}

/**
 * Can send WhatsApp broadcasts
 */
export function canSendBroadcast(staff) {
  const role = getStaffRole(staff);
  return role === ROLES.ADMIN || role === ROLES.STAFF;
}

/**
 * Can delete records or move to Recycle Bin
 */
export function canDelete(staff) {
  const role = getStaffRole(staff);
  return role === ROLES.ADMIN;
}

/**
 * Can import Excel files (Overwrite / Merge)
 */
export function canImportExcel(staff) {
  const role = getStaffRole(staff);
  return role === ROLES.ADMIN;
}

/**
 * Can manage staff accounts, roles, and reset data
 */
export function canManageSettings(staff) {
  const role = getStaffRole(staff);
  return role === ROLES.ADMIN;
}

/**
 * Is the user restricted to read-only mode?
 */
export function isViewer(staff) {
  return getStaffRole(staff) === ROLES.VIEWER;
}
