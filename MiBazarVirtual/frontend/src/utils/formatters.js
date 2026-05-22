export const formatPrice = (price) => `Q ${Number(price ?? 0).toFixed(2)}`;

const APP_TIME_ZONE = 'America/Guatemala';
const LOCAL_BACKEND_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export const parseAppDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;

  // Older API responses serialized LocalDateTime without a zone. MySQL TIMESTAMP
  // values are read through a UTC connection, so preserve that instant here.
  const normalizedDate = typeof date === 'string' && LOCAL_BACKEND_TIMESTAMP.test(date)
    ? `${date}Z`
    : date;

  return new Date(normalizedDate);
};

export const formatDate = (date) => (
  (parseAppDate(date) ?? new Date()).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
);

export const formatAppTime = (date) => {
  const parsedDate = parseAppDate(date);
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) return '';

  return parsedDate.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  });
};

export const formatRelativeTime = (date) => {
  const parsedDate = parseAppDate(date);
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) return '';

  const diff = Math.max(0, Date.now() - parsedDate.getTime());
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'Ayer';
  return formatDate(parsedDate);
};
