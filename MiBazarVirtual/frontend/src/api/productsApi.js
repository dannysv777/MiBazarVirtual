import axiosInstance from './axiosConfig';

const unitMap = {
  libra: 'UNIDAD',
  lb: 'UNIDAD',
  unidad: 'UNIDAD',
  unidades: 'UNIDAD',
  kg: 'KG',
  kilogramo: 'KG',
  gramo: 'GRAMO',
  gramos: 'GRAMO',
  litro: 'LITRO',
  litros: 'LITRO',
  ml: 'ML',
  docena: 'DOCENA',
  paquete: 'PAQUETE',
  bolsa: 'PAQUETE',
  caja: 'PAQUETE',
  manojo: 'PAQUETE',
};

const normalizeUnit = (unit) => {
  if (!unit) {
    return unit;
  }

  const normalized = String(unit).trim();
  return unitMap[normalized.toLowerCase()] ?? normalized.toUpperCase();
};

const normalizeProductPayload = (data) => ({
  ...data,
  unit: normalizeUnit(data.unit),
});

const cleanImageUrl = (url) => (url?.includes('unsplash.com') ? null : url);

const cleanProduct = (product) => {
  const imageUrl = cleanImageUrl(
    product.imageUrl
    ?? product.coverImage
    ?? product.mainImageUrl
    ?? product.productImageUrl
    ?? product.image
    ?? product.images?.[0]?.url
  );

  return {
    ...product,
    imageUrl,
    coverImage: cleanImageUrl(product.coverImage),
    mainImageUrl: cleanImageUrl(product.mainImageUrl) ?? imageUrl,
    images: product.images?.map((image) => ({
      ...image,
      url: cleanImageUrl(image.url),
    })),
  };
};

const cleanResponse = (response) => {
  const payload = response.data?.data ?? response.data;

  if (Array.isArray(payload)) {
    response.data = Array.isArray(response.data) ? payload.map(cleanProduct) : { ...response.data, data: payload.map(cleanProduct) };
    return response;
  }

  if (payload?.content) {
    response.data.data = { ...payload, content: payload.content.map(cleanProduct) };
    return response;
  }

  response.data = response.data?.data ? { ...response.data, data: cleanProduct(payload) } : cleanProduct(payload);
  return response;
};

export const getProducts = async (params) => cleanResponse(await axiosInstance.get('/api/products', { params }));

export const getProduct = async (id) => cleanResponse(await axiosInstance.get(`/api/products/${id}`));

export const getMyProducts = async (params = { page: 0, size: 20 }) => (
  cleanResponse(await axiosInstance.get('/api/products/mine', { params }))
);

export const createProduct = (data) => axiosInstance.post('/api/products', normalizeProductPayload(data));

export const updateProduct = (id, data) => axiosInstance.put(`/api/products/${id}`, normalizeProductPayload(data));

export const deleteProduct = (id) => axiosInstance.delete(`/api/products/${id}`);

export const updateStock = (id, qty) => (
  axiosInstance.patch(`/api/products/${id}/stock`, { quantity: qty })
);
