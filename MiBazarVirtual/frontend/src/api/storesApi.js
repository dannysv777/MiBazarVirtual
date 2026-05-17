import axiosInstance from './axiosConfig';

const cleanStore = (store) => ({
  ...store,
  imageUrl: store.imageUrl?.includes('unsplash.com') ? null : store.imageUrl,
  logoUrl: store.logoUrl?.includes('unsplash.com') ? null : store.logoUrl,
});

const cleanProduct = (product) => {
  const imageUrl = product.imageUrl ?? product.coverImage;
  const cleanImageUrl = imageUrl?.includes('unsplash.com') ? null : imageUrl;

  return {
    ...product,
    imageUrl: cleanImageUrl,
    mainImageUrl: product.mainImageUrl?.includes('unsplash.com') ? null : product.mainImageUrl ?? cleanImageUrl,
    coverImage: product.coverImage?.includes('unsplash.com') ? null : product.coverImage,
  };
};

const cleanResponse = (response) => {
  const payload = response.data?.data ?? response.data;

  if (Array.isArray(payload)) {
    response.data = Array.isArray(response.data) ? payload.map(cleanStore) : { ...response.data, data: payload.map(cleanStore) };
    return response;
  }

  if (payload?.content) {
    response.data.data = { ...payload, content: payload.content.map(cleanStore) };
    return response;
  }

  response.data = response.data?.data ? { ...response.data, data: cleanStore(payload) } : cleanStore(payload);
  return response;
};

export const getStores = async (params) => cleanResponse(await axiosInstance.get('/api/stores', { params }));

export const getStore = async (id) => cleanResponse(await axiosInstance.get(`/api/stores/${id}`));

export const getMyStore = () => axiosInstance.get('/api/stores/mine');

export const createStore = (data) => axiosInstance.post('/api/stores', data);

export const updateStore = (id, data) => axiosInstance.put(`/api/stores/${id}`, data);

export const getStoreProducts = async (storeId, params) => {
  const response = await axiosInstance.get(`/api/stores/${storeId}/products`, { params });
  const payload = response.data?.data ?? response.data;

  if (Array.isArray(payload)) {
    response.data = Array.isArray(response.data)
      ? payload.map(cleanProduct)
      : { ...response.data, data: payload.map(cleanProduct) };
    return response;
  }

  if (payload?.content) {
    response.data.data = { ...payload, content: payload.content.map(cleanProduct) };
  }

  return response;
};

export const getStoreReviews = (storeId, params) => (
  axiosInstance.get(`/api/stores/${storeId}/reviews`, { params })
);
