import axiosInstance from './axiosConfig';

export const getNotifications = (params = { page: 0, size: 20 }) => (
  axiosInstance.get('/api/notifications', { params })
);

export const getUnreadCount = () => axiosInstance.get('/api/notifications/unread-count');

export const markAllAsRead = () => axiosInstance.patch('/api/notifications/read-all');

export const markOneAsRead = (id) => axiosInstance.patch(`/api/notifications/${id}/read`);

export const deleteNotification = (id) => axiosInstance.delete(`/api/notifications/${id}`);
