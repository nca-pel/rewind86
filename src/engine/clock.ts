/**
 * Spielzeit als ISO-ähnlicher lokaler Zeitstempel "YYYY-MM-DDTHH:MM".
 * Rechnung in UTC, damit die Zeitzone des Browsers keinen Einfluss hat (Determinismus).
 */

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export function toMinutes(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Ungültige Spielzeit: ${iso}`);
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return Math.floor(ms / 60000);
}

export function fromMinutes(min: number): string {
  const d = new Date(min * 60000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(
    d.getUTCMinutes(),
  )}`;
}

export function addMinutes(iso: string, minutes: number): string {
  return fromMinutes(toMinutes(iso) + minutes);
}

export function diffMinutes(a: string, b: string): number {
  return toMinutes(a) - toMinutes(b);
}

export function isBefore(a: string, b: string): boolean {
  return toMinutes(a) < toMinutes(b);
}

export function weekday(iso: string): string {
  return WEEKDAYS[new Date(toMinutes(iso) * 60000).getUTCDay()];
}

export function formatClock(iso: string): string {
  const [date, time] = iso.split('T');
  const [y, mo, d] = date.split('-');
  return `${weekday(iso)}, ${d}.${mo}.${y}, ${time} Uhr`;
}

export function formatTime(iso: string): string {
  return iso.split('T')[1];
}

/** "Freitag, 16:00" – kurze Statuszeile */
export function formatShort(iso: string): string {
  return `${weekday(iso).slice(0, 2)}. ${iso.slice(8, 10)}.${iso.slice(5, 7)}. ${formatTime(iso)}`;
}

export function formatDm(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} DM`;
}
