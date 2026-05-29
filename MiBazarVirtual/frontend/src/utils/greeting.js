import { getCurrentHour } from './formatters';

export const getGreeting = () => {
  const hour = getCurrentHour();
  if (hour >= 5 && hour < 12) return { text: 'Buenos días', emoji: '☀️' };
  if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', emoji: '🌤️' };
  return { text: 'Buenas noches', emoji: '🌙' };
};

export const getFirstName = (fullName) => {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
};
