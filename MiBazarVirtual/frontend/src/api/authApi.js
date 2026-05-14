import AsyncStorage from '@react-native-async-storage/async-storage';

import axiosInstance from './axiosConfig';

export const login = (email, password) => (
  axiosInstance.post('/api/auth/login', { email, password })
);

export const register = (data) => (
  axiosInstance.post('/api/auth/register', data)
);

export const refreshToken = (refreshTokenValue) => (
  axiosInstance.post('/api/auth/refresh', { refreshToken: refreshTokenValue })
);

export const logout = async () => {
  const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
  return axiosInstance.post('/api/auth/logout', { refreshToken: refreshTokenValue });
};
