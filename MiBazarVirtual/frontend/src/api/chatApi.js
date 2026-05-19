import axiosInstance from './axiosConfig';

export const startConversation = (data) => (
  axiosInstance.post('/api/conversations/start', data)
);

export const startDirectConversation = (data) => (
  axiosInstance.post('/api/conversations/start-direct', data)
);

export const getConversations = () => axiosInstance.get('/api/conversations');

export const getMessages = (conversationId, params) => (
  axiosInstance.get(`/api/conversations/${conversationId}/messages`, { params })
);

export const sendMessage = (conversationId, content) => (
  axiosInstance.post(`/api/conversations/${conversationId}/messages`, { conversationId, content })
);

export const getUnreadCount = () => axiosInstance.get('/api/conversations/unread-count');
