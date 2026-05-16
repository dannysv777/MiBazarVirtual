export { formatDate, formatPrice, formatRelativeTime } from './formatters';

export const getPayload = (response) => response.data?.data ?? response.data;

export const getList = (response) => {
  const payload = getPayload(response);
  return payload?.content ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
};

export const getPageMeta = (response) => {
  const payload = getPayload(response);
  return {
    last: payload?.last ?? true,
    number: payload?.number ?? 0,
    totalPages: payload?.totalPages ?? 1,
  };
};

export const getErrorMessage = (error, fallback = 'Ocurrió un error. Intenta de nuevo.') => {
  if (error.message === 'SESSION_EXPIRED') {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }

  if (!error.response) {
    return 'Sin conexión. Verifica tu internet.';
  }

  return error.response?.data?.message ?? fallback;
};
