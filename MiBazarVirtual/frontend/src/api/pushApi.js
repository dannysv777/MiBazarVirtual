import axiosInstance from './axiosConfig';

export const registerPushToken = (data) => axiosInstance.post('/api/push-tokens', data);

export const removePushToken = (token) => axiosInstance.delete('/api/push-tokens', { data: { token } });
