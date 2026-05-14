import axiosInstance from './axiosConfig';

export const getProducts = (params) => axiosInstance.get('/api/products', { params });

export const getProduct = (id) => axiosInstance.get(`/api/products/${id}`);
