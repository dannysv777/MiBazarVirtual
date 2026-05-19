import axiosInstance from './axiosConfig';

export const getProfile = () => axiosInstance.get('/api/profile');

export const updateProfile = (data) => axiosInstance.put('/api/profile', data);

export const getSellerStats = () => axiosInstance.get('/api/seller/stats');

export const getBuyerStats = () => axiosInstance.get('/api/buyer/stats');

export const getDeliveryStats = () => axiosInstance.get('/api/delivery/stats');

export const getAppInfo = () => axiosInstance.get('/api/app/info');
