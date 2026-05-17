import axiosInstance from './axiosConfig';

export const toggleFavorite = (productId) => axiosInstance.post(`/api/favorites/${productId}`);

export const getFavorites = () => axiosInstance.get('/api/favorites');

export const checkIsFavorite = (productId) => axiosInstance.get(`/api/favorites/${productId}/check`);
