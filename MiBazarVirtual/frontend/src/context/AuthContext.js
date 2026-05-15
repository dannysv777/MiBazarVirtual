import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import axiosInstance from '../api/axiosConfig';
import * as authApi from '../api/authApi';

export const AuthContext = createContext(null);

const unwrapAuthResponse = (response) => response.data?.data ?? response.data;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const storedAccessToken = await AsyncStorage.getItem('accessToken');

        if (!storedAccessToken) {
          setIsAuthenticated(false);
          return;
        }

        setAccessToken(storedAccessToken);
        const response = await axiosInstance.get('/api/profile');
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        setAccessToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const authData = unwrapAuthResponse(response);

    await AsyncStorage.multiSet([
      ['accessToken', authData.accessToken],
      ['refreshToken', authData.refreshToken],
    ]);

    setAccessToken(authData.accessToken);
    setUser(authData.user);
    setIsAuthenticated(true);
    return authData.user;
  };

  const register = async (userData) => {
    await authApi.register(userData);
    return login(userData.email, userData.password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (nextUser) => {
    setUser((current) => ({ ...current, ...nextUser }));
  };

  const value = useMemo(() => ({
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  }), [accessToken, isAuthenticated, isLoading, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
