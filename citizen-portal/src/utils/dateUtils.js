/**
 * Kurdistan / Iraq Timezone Utility (Asia/Baghdad, UTC+3)
 * Provides accurate local date and time formatting throughout the citizen portal.
 */

const KURDISTAN_TIMEZONE = 'Asia/Baghdad';
const UTC_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3

function toDate(input) {
  if (!input) return new Date();
  if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
  if (typeof input === 'number') return new Date(input);
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function getKurdistanDateTime(includeSeconds = false, dateInput = null) {
  const d = dateInput ? toDate(dateInput) : new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: KURDISTAN_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type) => parts.find(p => p.type === type)?.value || '00';
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = getPart('hour');
    const minute = getPart('minute');
    if (includeSeconds) {
      const second = getPart('second');
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch (e) {
    const local = new Date(d.getTime() + UTC_OFFSET_MS);
    const iso = local.toISOString().replace('T', ' ');
    return includeSeconds ? iso.slice(0, 19) : iso.slice(0, 16);
  }
}

export function getKurdistanDate(dateInput = null) {
  return getKurdistanDateTime(false, dateInput).slice(0, 10);
}

export function getKurdistanTime(includeSeconds = false, dateInput = null) {
  const full = getKurdistanDateTime(includeSeconds, dateInput);
  return includeSeconds ? full.slice(11, 19) : full.slice(11, 16);
}

export function getKurdistanTime12(includeSeconds = false, dateInput = null) {
  const d = dateInput ? toDate(dateInput) : new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: KURDISTAN_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    });
    return formatter.format(d);
  } catch (e) {
    const full = getKurdistanTime(includeSeconds, dateInput);
    let hour = parseInt(full.slice(0, 2), 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    const padHour = String(hour).padStart(2, '0');
    return `${padHour}:${full.slice(3)} ${ampm}`;
  }
}

export function formatKurdistanDateTime(dateInput, includeSeconds = false) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed.includes('T') || trimmed.endsWith('Z')) {
      return getKurdistanDateTime(includeSeconds, trimmed);
    }
    if (trimmed.length === 16 && includeSeconds) {
      return `${trimmed}:00`;
    }
    if (trimmed.length > 16 && !includeSeconds) {
      return trimmed.slice(0, 16);
    }
    return trimmed;
  }
  return getKurdistanDateTime(includeSeconds, dateInput);
}

export function formatKurdistanDate(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed.length >= 10 && !trimmed.includes('T')) {
      return trimmed.slice(0, 10);
    }
  }
  return getKurdistanDate(dateInput);
}

export const getLocalTimestamp = getKurdistanDateTime;
