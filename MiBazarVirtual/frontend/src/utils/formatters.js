const GUATEMALA_OFFSET = -6 * 60;

export const parseAppDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;

  return new Date(date);
};

const toGuatemalaTime = (date) => {
  const d = new Date(date);
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + GUATEMALA_OFFSET * 60000);
};

export const formatPrice = (price) => `Q ${Number(price || 0).toFixed(2)}`;

export const formatDate = (date) => {
  if (!date) return '';
  const d = toGuatemalaTime(date);
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = toGuatemalaTime(date);
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = toGuatemalaTime(date);
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = toGuatemalaTime(new Date());
  const d = toGuatemalaTime(date);
  if (Number.isNaN(d.getTime())) return '';

  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days === 1) return 'Ayer';
  if (days < 7) return `hace ${days} días`;
  return formatDate(date);
};

export const formatAppTime = formatTime;
