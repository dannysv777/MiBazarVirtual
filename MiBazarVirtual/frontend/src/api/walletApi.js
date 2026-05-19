import axiosInstance from './axiosConfig';

export const getCards = () => axiosInstance.get('/api/wallet/cards');

export const addCard = (data) => axiosInstance.post('/api/wallet/cards', data);

export const removeCard = (id) => axiosInstance.delete(`/api/wallet/cards/${id}`);

export const setDefaultCard = (id) => axiosInstance.patch(`/api/wallet/cards/${id}/default`);

export const getBankAccount = () => axiosInstance.get('/api/wallet/bank-account');

export const saveBankAccount = (data) => axiosInstance.post('/api/wallet/bank-account', data);
