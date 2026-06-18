// ─── Types ─────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  priceLabel: string;
  desc: string;
  onlyLate?: boolean;
  lateSurchargeExempt?: boolean;
  onlyWeekday?: boolean;
  onlyWeekend?: boolean;
}
export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: Service;
  date: string;
  isoDate?: string;
  slot: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  userId?: string;
}
export interface DateItem {
  label: string;
  dayName: string;
  dayNum: number;
  monthShort: string;
  full: string;
  isoDate: string;
}

// ─── Data ──────────────────────────────────────────────────────────────────

// ─── Constantes métier ─────────────────────────────────────────────────────
export const ADMIN_EMAIL = 'admin@lalbicut.com';
export const LATE_SURCHARGE = 5;

export const SERVICES: Service[] = [{
  id: 's1',
  name: 'Coupe en Semaine',
  duration: '45 min',
  price: 20,
  priceLabel: '20€',
  desc: 'Du lundi au vendredi, contours nets et dégradé propre.',
  onlyWeekday: true
}, {
  id: 's2',
  name: 'Coupe le Weekend',
  duration: '45 min',
  price: 15,
  priceLabel: '15€',
  desc: 'Tarif spécial samedi et dimanche, même qualité moins cher.',
  onlyWeekend: true
}, {
  id: 's3',
  name: 'Coupe + Barbe',
  duration: '50 min',
  price: 0,
  priceLabel: '+5€',
  desc: "Ajoute +5 euros sur n'importe quelle coupe pour intégrer la barbe."
}, {
  id: 's4',
  name: 'Coupe Transfo',
  duration: '45 min',
  price: 25,
  priceLabel: '25€',
  desc: 'Changement de style complet. Nouvelle coupe, nouvelle identité.'
}, {
  id: 's5',
  name: 'Coupe Nocturne',
  duration: '45 min',
  price: 25,
  priceLabel: '25€',
  desc: 'Disponible uniquement après 22h. Ambiance nocturne, coupe 45 min.',
  onlyLate: true,
  lateSurchargeExempt: true
}];
export const ALL_SLOTS: string[] = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
export const LATE_SLOTS = new Set(['22:00', '22:30']);
export const DAY_LABELS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
export type DaySchedule = { open: boolean; start: string; end: string };
export type WorkingHours = Record<DayKey, DaySchedule>;
// Indexé par getDay() : 0=sun, 1=mon, 2=tue, 3=wed, 4=thu, 5=fri, 6=sat
export const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  sun: { open: false, start: '09:00', end: '22:30' },
  mon: { open: true,  start: '09:00', end: '19:00' },
  tue: { open: true,  start: '09:00', end: '19:00' },
  wed: { open: true,  start: '09:00', end: '19:00' },
  thu: { open: true,  start: '09:00', end: '22:30' },
  fri: { open: true,  start: '09:00', end: '22:30' },
  sat: { open: true,  start: '09:00', end: '22:30' },
};
export function getSlotsForDay(dayKey: DayKey, workingHours: WorkingHours): string[] {
  const s = workingHours[dayKey];
  if (!s.open) return [];
  return ALL_SLOTS.filter(slot => slot >= s.start && slot <= s.end);
}
export const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
export const BARBER_SPECIALTIES = ['Coupes', 'Barbes', 'Rasage traditionnel', 'Lame droite'];
export const REASSURANCE_DATA = [{
  id: 'r1',
  title: 'Barber certifié',
  text: 'Lalbi met son expertise à votre service depuis 8 ans.',
  svg: <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 8C10 6 13 5.5 16 7C19 5.5 22 6 24 8" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" strokeLinecap="round" /><path d="M10 14C10 14 9 22 16 22C23 22 22 14 22 14" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M13 14L10 8M19 14L22 8" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" strokeLinecap="round" /><path d="M13 14H19" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" strokeLinecap="round" /></svg>
}, {
  id: 'r2',
  title: 'Ponctualité garantie',
  text: "Votre temps est précieux. On commence à l'heure.",
  svg: <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="17" r="10" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" /><path d="M16 12V17L19.5 19.5" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 5H20" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" strokeLinecap="round" /></svg>
}, {
  id: 'r3',
  title: 'Expérience premium',
  text: 'Un shop pensé pour les hommes. Détendu, propre, authentique.',
  svg: <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4L18.5 11.5H26.5L20 16.5L22.5 24L16 19L9.5 24L12 16.5L5.5 11.5H13.5L16 4Z" stroke="rgba(242,240,233,0.9)" strokeWidth="1.5" strokeLinejoin="round" /></svg>
}];
export const CLIENT_NAV_LINKS = [{
  id: 'nl1',
  label: 'Prestations',
  target: 'services'
}, {
  id: 'nl2',
  label: 'Le Barber',
  target: 'barber'
}, {
  id: 'nl3',
  label: 'Réalisations',
  target: 'realisations'
}, {
  id: 'nl4',
  label: 'Réserver',
  target: 'booking'
}];
export const FOOTER_LINKS_DATA = [{
  id: 'fl1',
  label: 'Mentions légales',
  href: null
}, {
  id: 'fl2',
  label: 'Contact',
  href: null
}, {
  id: 'fl3',
  label: 'Instagram',
  href: 'https://www.instagram.com/lalbicuttz/'
}, {
  id: 'fl4',
  label: 'TikTok',
  href: 'https://www.tiktok.com/@lalbicuttz'
}];
export const STEP_LABELS = ['Prestation', 'Date & Heure', 'Vos infos', 'Confirmation'];
export const GALLERY_CARDS = [{
  id: 'gc1',
  src: '/Coiffure Lalbi/cut1.png',
  tag: 'Coupe Transfo',
  title: 'Style & Précision',
  sub: 'par Lalbi'
}, {
  id: 'gc2',
  src: '/Coiffure Lalbi/cut2.png',
  tag: 'Coupe + Barbe',
  title: 'Le Combo Signature',
  sub: 'par Lalbi'
}, {
  id: 'gc3',
  src: '/Coiffure Lalbi/cut3.png',
  tag: 'Coupe en Semaine',
  title: 'Contours Nets',
  sub: 'par Lalbi'
}];
export interface LoyaltyConfig {
  enabled: boolean;
  threshold: number;
  rewardType: 'discount' | 'service';
  discountAmount: number;
  rewardLabel: string;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: false,
  threshold: 10,
  rewardType: 'discount',
  discountAmount: 5,
  rewardLabel: 'Barbe offerte',
};

export const ADMIN_TABS: {
  id: 'dashboard' | 'creneaux' | 'reservations' | 'fidelite';
  label: string;
}[] = [{
  id: 'dashboard',
  label: 'TABLEAU DE BORD'
}, {
  id: 'creneaux',
  label: 'CRENEAUX'
}, {
  id: 'reservations',
  label: 'RESERVATIONS'
}, {
  id: 'fidelite',
  label: 'FIDELITE'
}];

// Date order for sorting: Aujourd'hui=0, Demain=1, Samedi=2, others=3
export const DATE_ORDER: Record<string, number> = {
  "Aujourd'hui": 0,
  'Demain': 1,
  'Samedi': 2
};
export const KEYFRAMES = `
@keyframes lbc-pulse {
  0%, 100% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}
@keyframes lbc-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}
@keyframes lbc-fadein {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
html { scroll-behavior: smooth; }
::selection { background: #587373; color: #F2F0E9; }
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #F2F0E9; }
::-webkit-scrollbar-thumb { background: #587373; border: 2px solid #F2F0E9; border-radius: 4px; }
.lbc-scrollbar-hide::-webkit-scrollbar { display: none; }
.lbc-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;
export function getDates(): DateItem[] {
  return Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    });
    return {
      label,
      dayName: DAY_LABELS[d.getDay()],
      dayNum: d.getDate(),
      monthShort: MONTH_SHORT[d.getMonth()],
      full: d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      isoDate: d.toISOString().split('T')[0]
    };
  });
}
export function getTodayLong(): string {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
export function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}
export function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
}
export function getDateOrder(date: string): number {
  if (DATE_ORDER[date] !== undefined) return DATE_ORDER[date];
  // check if it matches "Samedi" in label
  if (date.toLowerCase().includes('samedi')) return 2;
  return 3;
}

