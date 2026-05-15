import axiosInstance from './axiosConfig';

export const getStores = (params) => axiosInstance.get('/api/stores', { params });

export const getStore = (id) => axiosInstance.get(`/api/stores/${id}`);

export const getMyStore = () => axiosInstance.get('/api/stores/mine');

export const getStoreProducts = (storeId, params) => (
  axiosInstance.get(`/api/stores/${storeId}/products`, { params })
);

export const getStoreReviews = (storeId, params) => (
  axiosInstance.get(`/api/stores/${storeId}/reviews`, { params })
);
