import axiosInstance from './axiosConfig';

export const createOrder = (orderData) => axiosInstance.post('/api/orders', orderData);

export const getOrders = (params = { page: 0, size: 20 }) => (
  axiosInstance.get('/api/orders', { params })
);

export const getOrderHistory = () => axiosInstance.get('/api/orders', { params: { page: 0, size: 50 } });

export const getOrder = (id) => axiosInstance.get(`/api/orders/${id}`);

export const cancelOrder = (id) => axiosInstance.delete(`/api/orders/${id}/cancel`);

export const getSellerOrders = (params = { page: 0, size: 20 }) => (
  axiosInstance.get('/api/seller/orders', { params })
);

export const updateOrderStatus = (id, status) => (
  axiosInstance.patch(`/api/seller/orders/${id}/status`, { status })
);

export const createReview = (orderId, data) => (
  axiosInstance.post(`/api/orders/${orderId}/review`, data)
);
