import type { Booking } from '../data/constants';
import { slotToMinutes } from '../data/constants';

const FRENCH_MONTHS: Record<string, number> = {
  'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
  'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
};

function parseFrenchLabel(label: string, year: number): string | null {
  const parts = label.trim().split(' ');
  if (parts.length !== 2) return null;
  const day = parseInt(parts[0], 10);
  const month = FRENCH_MONTHS[parts[1].toLowerCase()];
  if (isNaN(day) || month === undefined) return null;
  return new Date(year, month, day).toISOString().split('T')[0];
}

// Resolves the best possible isoDate for a booking, including legacy ones without isoDate.
export function resolveIsoDate(b: Booking, now: Date): string | null {
  if (b.isoDate) return b.isoDate;
  const isoNow = now.toISOString().split('T')[0];
  if (b.date === "Aujourd'hui") return isoNow;
  // "Demain" is ambiguous for legacy bookings — skip resolution to avoid false positives
  if (b.date === 'Demain') return null;
  return parseFrenchLabel(b.date, now.getFullYear());
}

export function isPassed(b: Booking, now: Date): boolean {
  const isoDate = resolveIsoDate(b, now);
  if (!isoDate) return false;
  const isoNow = now.toISOString().split('T')[0];
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  if (isoDate < isoNow) return true;
  if (isoDate === isoNow && slotToMinutes(b.slot) < minutesNow) return true;
  return false;
}

// Returns a sortable string "YYYY-MM-DD HH:MM" for chronological ordering.
export function bookingSortKey(b: Booking, now: Date): string {
  const iso = resolveIsoDate(b, now) ?? '9999-12-31';
  return `${iso} ${b.slot}`;
}

const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// Returns a human-readable date label computed from isoDate (never stale).
// Falls back to b.date for legacy bookings without isoDate.
export function formatBookingDate(b: Booking, now: Date): string {
  const iso = resolveIsoDate(b, now);
  if (!iso) return b.date;
  const isoNow = now.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoTomorrow = tomorrow.toISOString().split('T')[0];
  if (iso === isoNow) return "Aujourd'hui";
  if (iso === isoTomorrow) return 'Demain';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]}`;
}
