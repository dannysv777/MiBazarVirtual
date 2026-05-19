import axiosInstance from './axiosConfig';

export const createOrder = (data) => axiosInstance.post('/api/orders', {
  deliveryType: data.deliveryType,
  deliveryAddress: data.deliveryAddress,
  notes: data.notes,
  items: data.items,
});

export const getOrders = (params = { page: 0, size: 20 }) => (
  axiosInstance.get('/api/orders', { params })
);

export const getOrderHistory = () => axiosInstance.get('/api/orders', { params: { page: 0, size: 50 } });

export const getOrder = (id) => axiosInstance.get(`/api/orders/${id}`);

export const cancelOrder = (id) => axiosInstance.delete(`/api/orders/${id}/cancel`);

export const getSellerOrders = (params = { page: 0, size: 20 }) => (
  axiosInstance.get('/api/seller/orders', { params })
);

export const getSellerOrder = (id) => axiosInstance.get(`/api/seller/orders/${id}`);

export const updateOrderStatus = (id, status) => (
  axiosInstance.patch(`/api/seller/orders/${id}/status`, { status })
);

export const confirmOrderItem = (orderId, itemId, data) => (
  axiosInstance.patch(`/api/seller/orders/${orderId}/items/${itemId}/confirm`, data)
);

export const createReview = (orderId, data) => (
  axiosInstance.post(`/api/orders/${orderId}/review`, data)
);

export const getAvailableDeliveryOrders = (params = { page: 0, size: 20 }) => (
  axiosInstance.get('/api/delivery/orders/available', { params })
);

export const getMyDeliveryOrders = (params = { page: 0, size: 20 }) => (
  axiosInstance.get('/api/delivery/orders/mine', { params })
);

export const acceptDeliveryOrder = (id) => axiosInstance.patch(`/api/delivery/orders/${id}/accept`);

export const pickupDeliveryOrder = (id) => axiosInstance.patch(`/api/delivery/orders/${id}/pickup`);

export const deliverDeliveryOrder = (id) => axiosInstance.patch(`/api/delivery/orders/${id}/deliver`);
