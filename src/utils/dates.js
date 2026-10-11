export const TZ = 'America/Mexico_City';

export function todayMX() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

export function daysAgoMX(n) {
  const [y, m, d] = todayMX().split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

export function fmtDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-MX', { timeZone: TZ });
}

export function fmtTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('es-MX', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDay(day) {
  if (!day) return '—';
  const [y, m, d] = String(day).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-MX', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}