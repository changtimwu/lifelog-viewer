// Local-time parsing (the ISO strings have no Z, so they parse as local).
export const toMs = (iso) => new Date(iso).getTime();

const pad = (n) => String(n).padStart(2, "0");

export function fmtClock(ms) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function fmtDate(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

// YYYY-MM-DD key for matching a timestamp back to a day in the trip.
export function dateKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtDuration(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// Absolute ms for a timeline event ("HH:MM" on a given YYYY-MM-DD).
export function eventMs(date, time) {
  return new Date(`${date}T${time}:00`).getTime();
}
