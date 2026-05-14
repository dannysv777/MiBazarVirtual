import axiosInstance from './axiosConfig';

export const getCategories = () => axiosInstance.get('/api/categories');
