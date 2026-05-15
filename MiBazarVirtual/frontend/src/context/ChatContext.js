import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import * as chatApi from '../api/chatApi';
import { useAuth } from './AuthContext';
import { getPayload } from '../utils/apiResponse';

export const ChatContext = createContext(null);

const getWebSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_WS_URL) {
    return process.env.EXPO_PUBLIC_WS_URL;
  }

  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';
  return `${apiUrl.replace(/\/$/, '')}/ws`;
};

export function ChatProvider({ children }) {
  const { accessToken, isAuthenticated, user } = useAuth();
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return 0;
    }

    try {
      const response = await chatApi.getUnreadCount();
      const payload = getPayload(response);
      const count = Number(payload?.count ?? payload?.unreadCount ?? payload ?? 0);
      setUnreadCount(count);
      return count;
    } catch (error) {
      return 0;
    }
  }, [isAuthenticated]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setIsConnected(false);
    setUnreadCount(0);
  }, []);

  const connect = useCallback((token) => {
    if (!token || clientRef.current?.active) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(getWebSocketUrl()),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        refreshUnreadCount();
      },
      onDisconnect: () => setIsConnected(false),
      onWebSocketClose: () => setIsConnected(false),
      onStompError: (frame) => {
        console.warn('STOMP error', frame?.headers?.message ?? frame);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [refreshUnreadCount]);

  const subscribeToConversation = useCallback((conversationId, onMessage, onTyping) => {
    const client = clientRef.current;

    if (!client?.connected || !conversationId) {
      return () => {};
    }

    const messageSubscription = client.subscribe(`/topic/conversation/${conversationId}`, (frame) => {
      const parsed = JSON.parse(frame.body);
      onMessage?.(parsed);
      refreshUnreadCount();
    });

    const typingSubscription = client.subscribe(`/topic/conversation/${conversationId}/typing`, (frame) => {
      const parsed = JSON.parse(frame.body);
      onTyping?.(parsed);
    });

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [refreshUnreadCount]);

  const sendMessage = useCallback((conversationId, content) => {
    if (!clientRef.current?.connected) {
      return false;
    }

    clientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({ conversationId, content }),
    });
    return true;
  }, []);

  const sendTyping = useCallback((conversationId) => {
    if (!clientRef.current?.connected) {
      return;
    }

    clientRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, username: user?.username }),
    });
  }, [user?.username]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect(accessToken);
      return () => disconnect();
    }

    disconnect();
    return undefined;
  }, [accessToken, connect, disconnect, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshUnreadCount]);

  const value = useMemo(() => ({
    isConnected,
    unreadCount,
    connect,
    disconnect,
    subscribeToConversation,
    sendMessage,
    sendTyping,
    refreshUnreadCount,
  }), [
    connect,
    disconnect,
    isConnected,
    refreshUnreadCount,
    sendMessage,
    sendTyping,
    subscribeToConversation,
    unreadCount,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }

  return context;
}
