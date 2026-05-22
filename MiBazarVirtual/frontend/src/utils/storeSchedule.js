import { colors } from '../theme';

const dayMap = {
  domingo: 0,
  dom: 0,
  lunes: 1,
  lun: 1,
  martes: 2,
  mar: 2,
  miercoles: 3,
  mie: 3,
  jueves: 4,
  jue: 4,
  viernes: 5,
  vie: 5,
  sabado: 6,
  sab: 6,
};

const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const dayPattern = 'lunes|lun|martes|mar|miercoles|mie|jueves|jue|viernes|vie|sabado|sab|domingo|dom';

const normalize = (value = '') => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const toMinutes = (time) => {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const period = match[3]?.toLowerCase();

  if (hour > 23 || minute > 59) return null;

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return hour * 60 + minute;
};

const toClock = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')}${period}`;
};

const rangeDays = (start, end) => {
  const days = [];
  let current = start;
  while (true) {
    days.push(current);
    if (current === end) break;
    current = (current + 1) % 7;
  }
  return days;
};

export const parseSchedule = (scheduleString) => {
  if (!scheduleString || typeof scheduleString !== 'string') {
    return null;
  }

  const normalized = normalize(scheduleString);
  const timeMatch = normalized.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|a|hasta|–|—)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);

  if (!timeMatch) {
    return null;
  }

  const openMinutes = toMinutes(timeMatch[1]);
  const closeMinutes = toMinutes(timeMatch[2]);

  if (openMinutes === null || closeMinutes === null) {
    return null;
  }

  let openDays = [0, 1, 2, 3, 4, 5, 6];
  const dayRangeMatch = normalized.match(new RegExp(`(${dayPattern})\\s*(?:a|-|hasta)\\s*(${dayPattern})`));
  const singleDayMatches = [...normalized.matchAll(new RegExp(`\\b(${dayPattern})\\b`, 'g'))].map((match) => dayMap[match[1]]);

  if (!normalized.includes('todos los dias') && !normalized.includes('diario')) {
    if (dayRangeMatch) {
      openDays = rangeDays(dayMap[dayRangeMatch[1]], dayMap[dayRangeMatch[2]]);
    } else if (singleDayMatches.length) {
      openDays = [...new Set(singleDayMatches)];
    }
  }

  return {
    openTime: toClock(openMinutes),
    closeTime: toClock(closeMinutes),
    openMinutes,
    closeMinutes,
    openDays,
  };
};

const findNextOpenDay = (schedule, today) => {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = (today + offset) % 7;
    if (schedule.openDays.includes(candidate)) {
      return { day: candidate, offset };
    }
  }

  return null;
};

export const isStoreOpen = (scheduleString, now = new Date()) => {
  const schedule = parseSchedule(scheduleString);

  if (!schedule) {
    return {
      isOpen: null,
      statusText: 'Horario no disponible',
      detailText: '',
      color: colors.textLight,
    };
  }

  const today = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const closesAfterMidnight = schedule.closeMinutes <= schedule.openMinutes;
  const isOpenDay = schedule.openDays.includes(today);
  const previousDay = (today + 6) % 7;
  const openedYesterday = closesAfterMidnight && schedule.openDays.includes(previousDay) && minutesNow < schedule.closeMinutes;
  const inTodayRange = closesAfterMidnight
    ? minutesNow >= schedule.openMinutes || minutesNow < schedule.closeMinutes
    : minutesNow >= schedule.openMinutes && minutesNow < schedule.closeMinutes;
  const isOpen = openedYesterday || (isOpenDay && inTodayRange);

  if (isOpen) {
    return {
      isOpen: true,
      statusText: 'Abierto',
      detailText: `Cierra a las ${schedule.closeTime}`,
      color: colors.success,
    };
  }

  if (isOpenDay && minutesNow < schedule.openMinutes) {
    return {
      isOpen: false,
      statusText: 'Cerrado',
      detailText: `Abre a las ${schedule.openTime}`,
      color: colors.error,
    };
  }

  const nextOpen = findNextOpenDay(schedule, today);
  const prefix = nextOpen?.offset === 1 ? 'manana' : `el ${dayNames[nextOpen?.day]}`;

  return {
    isOpen: false,
    statusText: 'Cerrado',
    detailText: `Abre ${prefix} a las ${schedule.openTime}`,
    color: colors.error,
  };
};
