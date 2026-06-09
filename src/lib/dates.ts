import type { Booking } from '../data/constants';
import { slotToMinutes } from '../data/constants';

export function isPassed(b: Booking, now: Date): boolean {
  if (!b.isoDate) return false;
  const isoNow = now.toISOString().split('T')[0];
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  if (b.isoDate < isoNow) return true;
  if (b.isoDate === isoNow && slotToMinutes(b.slot) < minutesNow) return true;
  return false;
}
