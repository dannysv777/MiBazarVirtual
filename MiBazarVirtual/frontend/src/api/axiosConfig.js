import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080',
  timeout: 10000,
});

let refreshPromise = null;
const networkListeners = new Set();

export const subscribeNetworkStatus = (listener) => {
  networkListeners.add(listener);
  return () => networkListeners.delete(listener);
};

const notifyNetworkStatus = (isOnline) => {
  networkListeners.forEach((listener) => listener(isOnline));
};

axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = await AsyncStorage.getItem('accessToken');

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    notifyNetworkStatus(true);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.code === 'ECONNABORTED') {
      notifyNetworkStatus(false);
      return Promise.reject({ ...error, response: { data: { message: 'El servidor tardó demasiado. Intenta de nuevo.' } } });
    }

    if (!error.response) {
      notifyNetworkStatus(false);
      return Promise.reject({ ...error, response: { data: { message: 'Sin conexión. Verifica tu internet.' } } });
    }

    if (error.response?.status !== 401 || originalRequest?._retry) {
      if (error.response?.status === 500) {
        error.response.data = { ...error.response.data, message: 'Error del servidor. Intenta más tarde.' };
      }

      if (error.response?.status === 404) {
        error.response.data = { ...error.response.data, message: 'No encontrado.' };
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        throw new Error('SESSION_EXPIRED');
      }

      if (!refreshPromise) {
        refreshPromise = axios.post(
          `${axiosInstance.defaults.baseURL}/api/auth/refresh`,
          { refreshToken: storedRefreshToken }
        );
      }

      const response = await refreshPromise;
      refreshPromise = null;
      const accessToken = response.data?.data?.accessToken ?? response.data?.accessToken;

      if (!accessToken) {
        throw new Error('SESSION_EXPIRED');
      }

      await AsyncStorage.setItem('accessToken', accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      return Promise.reject(new Error('SESSION_EXPIRED'));
    }
  }
);

export default axiosInstance;
