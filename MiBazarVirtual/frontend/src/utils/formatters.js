// Guatemala is UTC-6, no daylight saving time
// Railway backend stores all timestamps in UTC
// We use Intl.DateTimeFormat with explicit timezone
// to avoid double-offset issues with device locale

const TIMEZONE = 'America/Guatemala';
const TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/;

const normalizeUtcString = (value) => (
  `${value.replace(TIMEZONE_SUFFIX, '')}Z`
);

const toDate = (value) => {
  if (!value) return null;

  let d;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value;
    d = new Date(Date.UTC(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000)));
  } else if (typeof value === 'string') {
    d = new Date(normalizeUtcString(value));
  } else if (typeof value === 'number') {
    d = new Date(value < 1000000000000 ? value * 1000 : value);
  } else {
    d = new Date(value);
  }

  if (Number.isNaN(d.getTime())) return null;
  return d;
};

export const formatPrice = (price) =>
  `Q ${Number(price || 0).toFixed(2)}`;

export const formatDate = (value) => {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const formatTime = (value) => {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

export const formatDateTime = (value) => {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

export const formatRelativeTime = (value) => {
  const d = toDate(value);
  if (!d) return '';

  // Compare against current UTC time.
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'Ayer';
  if (days < 7) return `hace ${days} días`;
  return formatDate(value);
};

// Helper for greeting, uses Guatemala local time explicitly.
export const getCurrentHour = () => (
  parseInt(
    new Intl.DateTimeFormat('es-GT', {
      timeZone: TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  )
);

export const formatAppTime = formatTime;
