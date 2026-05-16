import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'search_history';
const MAX_ITEMS = 5;

export const getHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

export const saveSearch = async (query) => {
  const normalized = query.trim();
  if (!normalized) return [];

  const current = await getHistory();
  const next = [
    normalized,
    ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
  ].slice(0, MAX_ITEMS);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const removeSearch = async (query) => {
  const current = await getHistory();
  const next = current.filter((item) => item !== query);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearHistory = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
