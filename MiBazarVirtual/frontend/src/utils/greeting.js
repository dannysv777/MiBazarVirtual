export const getGreeting = () => {
  const hourText = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guatemala',
    hour: '2-digit',
    hour12: false,
  }).format(new Date());
  const hour = Number(hourText) % 24;

  if (hour >= 5 && hour < 12) return { text: 'Buenos dias', emoji: '☀️' };
  if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', emoji: '🌤️' };
  return { text: 'Buenas noches', emoji: '🌙' };
};

export const getFirstName = (fullName) => {
  if (!fullName) return '';
  return fullName.trim().split(' ')[0];
};
