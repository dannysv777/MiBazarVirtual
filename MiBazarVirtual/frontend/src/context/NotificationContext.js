import { AppState } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import * as notificationsApi from '../api/notificationsApi';
import * as pushApi from '../api/pushApi';
import { useAuth } from './AuthContext';
import { getPayload } from '../utils/apiResponse';
import { getPushToken } from '../utils/pushNotifications';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const appStateRef = useRef(AppState.currentState);
  const registeredTokenRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const response = await notificationsApi.getUnreadCount();
      const payload = getPayload(response);
      const count = Number(payload?.count ?? payload?.unreadCount ?? payload ?? 0);
      setUnreadCount(count);
      return count;
    } catch (error) {
      return 0;
    }
  }, [isAuthenticated]);

  const markAllRead = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await notificationsApi.markAllAsRead();
    } finally {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    let mounted = true;

    const registerDeviceToken = async () => {
      if (!isAuthenticated) {
        registeredTokenRef.current = null;
        return;
      }

      try {
        const tokenPayload = await getPushToken();

        if (!mounted || !tokenPayload?.token || registeredTokenRef.current === tokenPayload.token) {
          return;
        }

        await pushApi.registerPushToken(tokenPayload);
        registeredTokenRef.current = tokenPayload.token;
      } catch (error) {
      }
    };

    registerDeviceToken();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshUnreadCount();
      }
    }, 60000);

    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      if (nextState === 'active') {
        refreshUnreadCount();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [isAuthenticated, refreshUnreadCount]);

  const value = useMemo(() => ({
    unreadCount,
    refreshUnreadCount,
    markAllRead,
  }), [markAllRead, refreshUnreadCount, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
}
