import React, { useState, useRef, useEffect } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  priceLabel: string;
  desc: string;
}
interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: Service;
  date: string;
  slot: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}
interface DateItem {
  label: string;
  dayName: string;
  dayNum: number;
  monthShort: string;
  full: string;
}

// ─── Data ──────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [{
  id: 's1',
  name: 'Coupe en Semaine',
  duration: '30 min',
  price: 20,
  priceLabel: '20€',
  desc: 'Du lundi au vendredi, contours nets et dégradé propre.'
}, {
  id: 's2',
  name: 'Coupe le Weekend',
  duration: '30 min',
  price: 15,
  priceLabel: '15€',
  desc: 'Tarif spécial samedi et dimanche, même qualité moins cher.'
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
  duration: '30 min',
  price: 25,
  priceLabel: '25€',
  desc: "Disponible jusqu'à 22h. Même tarif, ambiance soirée."
}];
const ALL_SLOTS: string[] = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
const LATE_SLOTS = new Set(['22:00', '22:30']);
const DAY_LABELS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
const BARBER_SPECIALTIES = ['Coupes', 'Barbes', 'Rasage traditionnel', 'Lame droite'];
const REASSURANCE_DATA = [{
  id: 'r1',
  title: 'Barber certifié',
  text: 'Bilal met son expertise à votre service depuis 8 ans.',
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
const CLIENT_NAV_LINKS = [{
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
const FOOTER_LINKS_DATA = [{
  id: 'fl1',
  label: 'Mentions légales'
}, {
  id: 'fl2',
  label: 'Contact'
}, {
  id: 'fl3',
  label: 'Instagram'
}];
const STEP_LABELS = ['Prestation', 'Date & Heure', 'Vos infos', 'Confirmation'];
const INITIAL_BOOKINGS: Booking[] = [{
  id: 'b1',
  clientName: 'Maxime Leroy',
  clientEmail: 'maxime.leroy@gmail.com',
  clientPhone: '06 12 34 56 78',
  service: {
    id: 's4',
    name: 'Coupe + Barbe',
    duration: '50 min',
    price: 42,
    priceLabel: '42€',
    desc: ''
  },
  date: "Aujourd'hui",
  slot: '14:30',
  price: 42,
  status: 'pending'
}, {
  id: 'b2',
  clientName: 'Karim Benali',
  clientEmail: 'karim.benali@gmail.com',
  clientPhone: '07 98 76 54 32',
  service: {
    id: 's1',
    name: 'Coupe en Semaine',
    duration: '30 min',
    price: 20,
    priceLabel: '20€',
    desc: ''
  },
  date: 'Demain',
  slot: '10:00',
  price: 20,
  status: 'confirmed'
}, {
  id: 'b3',
  clientName: 'Lucas Martin',
  clientEmail: 'lucas.martin@outlook.fr',
  clientPhone: '06 55 44 33 22',
  service: {
    id: 's3',
    name: 'Rasage Traditionnel',
    duration: '40 min',
    price: 35,
    priceLabel: '35€',
    desc: ''
  },
  date: 'Demain',
  slot: '16:00',
  price: 35,
  status: 'pending'
}, {
  id: 'b4',
  clientName: 'Amine Diallo',
  clientEmail: 'amine.diallo@gmail.com',
  clientPhone: '06 77 88 99 00',
  service: {
    id: 's2',
    name: 'Coupe le Weekend',
    duration: '30 min',
    price: 15,
    priceLabel: '15€',
    desc: ''
  },
  date: 'Samedi',
  slot: '11:00',
  price: 15,
  status: 'confirmed'
}];
const GALLERY_CARDS = [{
  id: 'gc1',
  src: '/Coiffure Bilal/cut1.png',
  tag: 'Coupe Transfo',
  title: 'Style & Précision',
  sub: 'par Bilal'
}, {
  id: 'gc2',
  src: '/Coiffure Bilal/cut2.png',
  tag: 'Coupe + Barbe',
  title: 'Le Combo Signature',
  sub: 'par Bilal'
}, {
  id: 'gc3',
  src: '/Coiffure Bilal/cut3.png',
  tag: 'Coupe en Semaine',
  title: 'Contours Nets',
  sub: 'par Bilal'
}];
const ADMIN_TABS: {
  id: 'dashboard' | 'creneaux' | 'reservations';
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
}];

// Date order for sorting: Aujourd'hui=0, Demain=1, Samedi=2, others=3
const DATE_ORDER: Record<string, number> = {
  "Aujourd'hui": 0,
  'Demain': 1,
  'Samedi': 2
};
const KEYFRAMES = `
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
`;
function getDates(): DateItem[] {
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
      })
    };
  });
}
function getTodayLong(): string {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}
function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number);
  return h * 60 + m;
}
function getDateOrder(date: string): number {
  if (DATE_ORDER[date] !== undefined) return DATE_ORDER[date];
  // check if it matches "Samedi" in label
  if (date.toLowerCase().includes('samedi')) return 2;
  return 3;
}

// ─── Component ─────────────────────────────────────────────────────────────

export const GentlemanBarber = () => {
  const [mode, setMode] = useState<'client' | 'admin'>('client');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmed, setConfirmed] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [blockedSlots, setBlockedSlots] = useState<string[]>(['09:30', '11:00', '14:30', '16:00']);
  const [adminSelectedDate, setAdminSelectedDate] = useState<string | null>(null);
  const [adminView, setAdminView] = useState<'dashboard' | 'creneaux' | 'reservations'>('dashboard');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'prix'>('date');

  // ─── New admin state ───────────────────────────────────────────────────
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [notifMessage, setNotifMessage] = useState<Record<string, string>>({});
  const [notifSent, setNotifSent] = useState<Record<string, boolean>>({});
  const [notifType, setNotifType] = useState<Record<string, 'rappel' | 'confirmation' | 'annulation' | 'custom'>>({});
  const [reminderScheduled, setReminderScheduled] = useState<Record<string, boolean>>({});
  const [smsFeedback, setSmsFeedback] = useState<Record<string, boolean>>({});
  const [emailFeedback, setEmailFeedback] = useState<Record<string, boolean>>({});
  const servicesRef = useRef<HTMLElement>(null);
  const barberRef = useRef<HTMLElement>(null);
  const bookingRef = useRef<HTMLElement>(null);
  const adminRef = useRef<HTMLElement>(null);
  const gallerieRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    const sections = [{
      id: 'hero',
      ref: heroRef
    }, {
      id: 'prestations',
      ref: servicesRef
    }, {
      id: 'realisations',
      ref: gallerieRef
    }, {
      id: 'barber',
      ref: barberRef
    }, {
      id: 'reservation',
      ref: bookingRef
    }];
    const observers = sections.map(({
      id,
      ref
    }) => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActiveSection(id);
      }, {
        threshold: 0.35,
        rootMargin: '-64px 0px 0px 0px'
      });
      if (ref.current) observer.observe(ref.current);
      return observer;
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);
  const dates = getDates();
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  const isLateSlot = (slot: string | null): boolean => slot !== null && LATE_SLOTS.has(slot);
  const getTotal = (): number | null => {
    if (!selectedService) return null;
    return selectedService.price + (isLateSlot(selectedSlot) ? 5 : 0);
  };
  const handleAdminLogin = () => {
    if (adminPassword === 'bilal2025') {
      setAdminUnlocked(true);
      setAdminError(false);
    } else {
      setAdminError(true);
    }
  };
  const handleConfirmBooking = () => {
    const errors: Record<string, string> = {};
    if (!clientName.trim()) errors.clientName = 'Votre nom est requis.';
    if (!clientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) errors.clientEmail = 'Email invalide.';
    if (!clientPhone.trim()) errors.clientPhone = 'Votre téléphone est requis.';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const total = getTotal() ?? selectedService!.price;
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      clientName,
      clientEmail,
      clientPhone,
      service: selectedService!,
      date: selectedDate!,
      slot: selectedSlot!,
      price: total,
      status: 'pending'
    };
    setBookings(prev => [...prev, newBooking]);
    setConfirmed(true);
    setBookingStep(4);
  };
  const handleResetBooking = () => {
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setConfirmed(false);
    setBookingStep(1);
    setFormErrors({});
    scrollTo(bookingRef);
  };
  const isSlotUnavailable = (slot: string, dateLabel: string | null): boolean => {
    if (blockedSlots.includes(slot)) return true;
    if (!dateLabel) return false;
    return bookings.some(b => b.slot === slot && b.date === dateLabel && (b.status === 'pending' || b.status === 'confirmed'));
  };
  const confirmBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? {
      ...b,
      status: 'confirmed' as const
    } : b));
  };
  const cancelBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? {
      ...b,
      status: 'cancelled' as const
    } : b));
  };
  const toggleSlot = (slot: string) => {
    setBlockedSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };

  // ─── Sorted & filtered bookings ───────────────────────────────────────
  const sortedBookings = [...bookings].sort((a, b) => {
    if (sortBy === 'prix') {
      return b.price - a.price;
    }
    const dateA = getDateOrder(a.date);
    const dateB = getDateOrder(b.date);
    if (dateA !== dateB) return dateA - dateB;
    return slotToMinutes(a.slot) - slotToMinutes(b.slot);
  });
  const filteredBookings = sortedBookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter);

  // ─── Booking for slot helper ──────────────────────────────────────────
  const getBookingForSlot = (slot: string) => bookings.find(b => b.slot === slot && (b.status === 'pending' || b.status === 'confirmed'));

  // ─── Quick stats for reservations header ─────────────────────────────
  const todayConfirmedRevenue = bookings.filter(b => b.date === "Aujourd'hui" && b.status === 'confirmed').reduce((s, b) => s + b.price, 0);
  const nextRdv = [...bookings].filter(b => b.status === 'pending' || b.status === 'confirmed').sort((a, b) => {
    const da = getDateOrder(a.date);
    const db = getDateOrder(b.date);
    if (da !== db) return da - db;
    return slotToMinutes(a.slot) - slotToMinutes(b.slot);
  })[0] ?? null;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalCount = bookings.length;
  const confirmationRate = totalCount > 0 ? Math.round(confirmedCount / totalCount * 100) : 0;

  // ─── Slot counts for selected date ────────────────────────────────────
  const slotsReservedCount = adminSelectedDate ? ALL_SLOTS.filter(s => {
    const b = bookings.find(bk => bk.slot === s && bk.date === adminSelectedDate && (bk.status === 'pending' || bk.status === 'confirmed'));
    return !!b;
  }).length : 0;
  const slotsBlockedCount = adminSelectedDate ? ALL_SLOTS.filter(s => {
    const b = bookings.find(bk => bk.slot === s && bk.date === adminSelectedDate && (bk.status === 'pending' || bk.status === 'confirmed'));
    return !b && blockedSlots.includes(s);
  }).length : 0;
  const slotsFreeCount = ALL_SLOTS.length - slotsReservedCount - slotsBlockedCount;
  const total = getTotal();
  const handleSendSms = (bookingId: string) => {
    if (!notifMessage[bookingId]) return;
    setNotifSent(prev => ({
      ...prev,
      [`${bookingId}_sms`]: true
    }));
    setSmsFeedback(prev => ({
      ...prev,
      [bookingId]: true
    }));
    setTimeout(() => {
      setSmsFeedback(prev => ({
        ...prev,
        [bookingId]: false
      }));
    }, 2000);
  };
  const handleSendEmail = (bookingId: string) => {
    if (!notifMessage[bookingId]) return;
    setNotifSent(prev => ({
      ...prev,
      [`${bookingId}_email`]: true
    }));
    setEmailFeedback(prev => ({
      ...prev,
      [bookingId]: true
    }));
    setTimeout(() => {
      setEmailFeedback(prev => ({
        ...prev,
        [bookingId]: false
      }));
    }, 2000);
  };

  // ─── Admin Status Badge ─────────────────────────────────────────────────
  const adminStatusBadge = (status: Booking['status']) => {
    if (status === 'pending') return <span className="lbc-bebas" style={{
      backgroundColor: 'rgba(88,115,115,0.2)',
      color: '#587373',
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 4,
      letterSpacing: '0.1em',
      border: '1.5px solid #587373'
    }}>EN ATTENTE</span>;
    if (status === 'confirmed') return <span className="lbc-bebas" style={{
      backgroundColor: 'rgba(242,240,233,0.08)',
      color: 'rgba(242,240,233,0.6)',
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 4,
      letterSpacing: '0.1em',
      border: '1.5px solid rgba(242,240,233,0.3)'
    }}>CONFIRMÉ</span>;
    return <span className="lbc-bebas" style={{
      color: 'rgba(242,240,233,0.2)',
      fontSize: 11,
      padding: '3px 10px',
      borderRadius: 4,
      letterSpacing: '0.1em',
      border: '1.5px solid rgba(242,240,233,0.1)'
    }}>ANNULÉ</span>;
  };

  // ─── Step bar ──────────────────────────────────────────────────────────
  const renderStepBar = () => <div style={{
    display: 'flex',
    alignItems: 'center',
    marginBottom: 48
  }}>
      {STEP_LABELS.map((label, idx) => {
      const stepNum = idx + 1;
      const isPast = bookingStep > stepNum;
      const isActive = bookingStep === stepNum;
      return <div key={`step-${stepNum}`} style={{
        display: 'flex',
        alignItems: 'center',
        flex: idx < 3 ? 1 : 'none'
      }}>
            <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0
        }}>
              <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: isPast ? '#0D0D0D' : isActive ? '#587373' : '#F2F0E9',
            border: isPast ? '2.5px solid #0D0D0D' : isActive ? '2.5px solid #587373' : '2.5px solid rgba(13,13,13,0.25)',
            boxShadow: isPast ? '3px 3px 0px #587373' : isActive ? '3px 3px 0px #0D0D0D' : '3px 3px 0px rgba(13,13,13,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            color: isPast || isActive ? '#F2F0E9' : 'rgba(13,13,13,0.3)',
            transition: 'all 150ms ease'
          }}>
                {isPast ? '✓' : stepNum}
              </div>
              <span className="lbc-bebas" style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: isActive ? '#0D0D0D' : isPast ? 'rgba(13,13,13,0.5)' : 'rgba(13,13,13,0.3)',
            marginTop: 6,
            whiteSpace: 'nowrap',
            fontWeight: 400
          }}>
                {label}
              </span>
            </div>
            {idx < 3 && <div style={{
          flex: 1,
          height: 2.5,
          marginBottom: 20,
          marginLeft: 8,
          marginRight: 8,
          backgroundColor: isPast ? '#0D0D0D' : 'rgba(13,13,13,0.15)',
          transition: 'background-color 150ms ease'
        }} />}
          </div>;
    })}
    </div>;

  // ─── Service card bold ─────────────────────────────────────────────────
  const renderServiceCardBold = (svc: Service, isSelected: boolean, onSelect: () => void) => {
    const headerBg = isSelected ? '#0D0D0D' : '#587373';
    const shadow = isSelected ? '4px 4px 0px #0D0D0D' : '4px 4px 0px #587373';
    const border = isSelected ? '2px solid #0D0D0D' : '2px solid #587373';
    const isAddon = svc.priceLabel.startsWith('+');
    return <button key={svc.id} onClick={onSelect} style={{
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      borderRadius: 12,
      cursor: 'pointer',
      textAlign: 'left',
      border,
      backgroundColor: '#F2F0E9',
      boxShadow: shadow,
      overflow: 'hidden',
      width: '100%',
      transition: 'transform 150ms ease, box-shadow 150ms ease'
    }} onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = isSelected ? '4px 4px 0px #0D0D0D' : '6px 6px 0px #587373';
    }} onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = shadow;
    }}>
        <div style={{
        backgroundColor: headerBg,
        padding: '12px 20px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 200ms ease'
      }}>
          <span className="lbc-bebas" style={{
          fontSize: 22,
          letterSpacing: '0.08em',
          color: '#F2F0E9',
          textTransform: 'uppercase',
          lineHeight: 1
        }}>{svc.name}</span>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
            {isSelected && <span style={{
            fontSize: 13,
            color: '#F2F0E9',
            fontWeight: 700,
            lineHeight: 1
          }}>✓</span>}
            <span className="lbc-bebas" style={{
            fontSize: 12,
            color: '#587373',
            backgroundColor: '#F2F0E9',
            padding: '3px 10px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            border: '1.5px solid #587373'
          }}>{svc.duration}</span>
          </div>
        </div>
        <div style={{
        backgroundColor: '#F2F0E9',
        padding: '16px 20px'
      }}>
          <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
            <span className="lbc-dmsans" style={{
            fontSize: 12,
            color: 'rgba(13,13,13,0.45)'
          }}>{svc.id === 's3' ? 'Sur base coupe' : 'Prix fixe'}</span>
            <span className="lbc-bebas" style={{
            fontSize: isAddon ? 28 : 38,
            color: '#0D0D0D',
            lineHeight: 1,
            letterSpacing: '0.04em'
          }}>{svc.priceLabel}</span>
          </div>
          <p className="lbc-dmsans" style={{
          fontSize: 12,
          fontStyle: 'italic',
          color: 'rgba(13,13,13,0.5)',
          margin: '8px 0 0',
          lineHeight: 1.5
        }}>{svc.desc}</p>
        </div>
      </button>;
  };

  // ─── Service card compact ──────────────────────────────────────────────
  const renderServiceCardCompact = (svc: Service, isSelected: boolean, onSelect: () => void) => {
    const headerBg = isSelected ? '#0D0D0D' : '#587373';
    const shadow = isSelected ? '3px 3px 0px #0D0D0D' : '3px 3px 0px #587373';
    const border = isSelected ? '2px solid #0D0D0D' : '2px solid #587373';
    const isAddon = svc.priceLabel.startsWith('+');
    return <button key={svc.id} onClick={onSelect} style={{
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      borderRadius: 10,
      cursor: 'pointer',
      textAlign: 'left',
      border,
      backgroundColor: '#F2F0E9',
      boxShadow: shadow,
      overflow: 'hidden',
      width: '100%',
      transition: 'transform 150ms ease, box-shadow 150ms ease'
    }} onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = isSelected ? '3px 3px 0px #0D0D0D' : '5px 5px 0px #587373';
    }} onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = shadow;
    }}>
        <div style={{
        backgroundColor: headerBg,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 200ms ease'
      }}>
          <span className="lbc-bebas" style={{
          fontSize: 16,
          letterSpacing: '0.08em',
          color: '#F2F0E9',
          textTransform: 'uppercase',
          lineHeight: 1,
          flex: 1,
          marginRight: 6
        }}>{svc.name}</span>
          {isSelected ? <span style={{
          fontSize: 12,
          color: '#F2F0E9',
          fontWeight: 700
        }}>✓</span> : <span className="lbc-bebas" style={{
          fontSize: 10,
          color: '#587373',
          backgroundColor: '#F2F0E9',
          padding: '2px 7px',
          borderRadius: 3,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          letterSpacing: '0.08em',
          border: '1.5px solid #587373'
        }}>{svc.duration}</span>}
        </div>
        <div style={{
        backgroundColor: '#F2F0E9',
        padding: '10px 14px'
      }}>
          <span className="lbc-bebas" style={{
          fontSize: isAddon ? 22 : 28,
          color: '#0D0D0D',
          lineHeight: 1,
          letterSpacing: '0.04em',
          display: 'block'
        }}>{svc.priceLabel}</span>
          <p className="lbc-dmsans" style={{
          fontSize: 11,
          fontStyle: 'italic',
          color: 'rgba(13,13,13,0.45)',
          margin: '5px 0 0',
          lineHeight: 1.4
        }}>{svc.desc}</p>
        </div>
      </button>;
  };

  // ─── ADMIN LOGIN PAGE ──────────────────────────────────────────────────
  if (mode === 'admin' && !adminUnlocked) {
    return <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0D',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif"
    }}>
        <style>{KEYFRAMES}</style>
        {/* Login Header */}
        <div style={{
        backgroundColor: '#0D0D0D',
        borderBottom: '2px solid rgba(88,115,115,0.2)',
        height: 64,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
          <span className="lbc-bebas" style={{
          fontSize: 26,
          letterSpacing: '0.15em',
          color: '#F2F0E9',
          textShadow: '2px 2px 0px rgba(88,115,115,0.4)'
        }}>LALBICUT</span>
          <button onClick={() => setMode('client')} style={{
          background: 'transparent',
          border: '2px solid rgba(242,240,233,0.15)',
          boxShadow: '2px 2px 0px rgba(88,115,115,0.2)',
          borderRadius: 4,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 13,
          letterSpacing: '0.1em',
          color: 'rgba(242,240,233,0.5)',
          padding: '8px 18px',
          cursor: 'pointer',
          transition: 'all 150ms ease'
        }} onMouseEnter={e => {
          e.currentTarget.style.color = 'rgba(242,240,233,0.8)';
          e.currentTarget.style.borderColor = 'rgba(242,240,233,0.4)';
        }} onMouseLeave={e => {
          e.currentTarget.style.color = 'rgba(242,240,233,0.5)';
          e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)';
        }}>
            RETOUR AU SITE
          </button>
        </div>

        {/* Login Card */}
        <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
          <div style={{
          maxWidth: 400,
          width: '100%',
          borderRadius: 10,
          overflow: 'hidden',
          border: '2px solid #587373',
          boxShadow: '6px 6px 0px #587373',
          backgroundColor: 'rgba(242,240,233,0.04)'
        }}>
            <div style={{
            backgroundColor: '#587373',
            borderBottom: '2px solid rgba(242,240,233,0.2)',
            padding: '14px 28px'
          }}>
              <span className="lbc-bebas" style={{
              fontSize: 16,
              color: '#F2F0E9',
              letterSpacing: '0.18em'
            }}>ACCÈS ADMIN</span>
            </div>
            <div style={{
            padding: 32
          }}>
              <p className="lbc-dmsans" style={{
              fontSize: 13,
              color: 'rgba(242,240,233,0.4)',
              marginBottom: 28,
              textAlign: 'center',
              fontWeight: 700
            }}>
                Espace réservé à Bilal.
              </p>
              <label className="lbc-bebas" style={{
              display: 'block',
              fontSize: 12,
              color: '#F2F0E9',
              letterSpacing: '0.15em',
              marginBottom: 8
            }}>
                MOT DE PASSE
              </label>
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter') handleAdminLogin();
            }} placeholder="••••••••••" style={{
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: 'rgba(242,240,233,0.06)',
              border: '2px solid rgba(242,240,233,0.15)',
              boxShadow: '3px 3px 0px rgba(88,115,115,0.3)',
              borderRadius: 6,
              color: '#F2F0E9',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              padding: '14px 16px',
              outline: 'none',
              transition: 'all 150ms ease'
            }} onFocus={e => {
              e.currentTarget.style.borderColor = '#587373';
              e.currentTarget.style.boxShadow = '4px 4px 0px #587373';
            }} onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)';
              e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.3)';
            }} />
              {adminError && <p className="lbc-bebas" style={{
              fontSize: 13,
              color: 'rgba(242,240,233,0.55)',
              letterSpacing: '0.1em',
              textAlign: 'center',
              marginTop: 12
            }}>
                  MOT DE PASSE INCORRECT.
                </p>}
              <button onClick={handleAdminLogin} style={{
              width: '100%',
              marginTop: 16,
              backgroundColor: '#587373',
              color: '#F2F0E9',
              border: '2px solid rgba(242,240,233,0.2)',
              boxShadow: '4px 4px 0px rgba(242,240,233,0.15)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18,
              letterSpacing: '0.12em',
              padding: 15,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'transform 150ms ease, box-shadow 150ms ease'
            }} onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-2px,-2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0px rgba(242,240,233,0.2)';
            }} onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(0,0)';
              e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.15)';
            }} onMouseDown={e => {
              e.currentTarget.style.transform = 'translate(2px,2px)';
              e.currentTarget.style.boxShadow = '2px 2px 0px rgba(242,240,233,0.1)';
            }} onMouseUp={e => {
              e.currentTarget.style.transform = 'translate(-2px,-2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0px rgba(242,240,233,0.2)';
            }}>
                ACCÉDER
              </button>
            </div>
          </div>
        </div>
      </div>;
  }

  // ─── ADMIN APP (full page) ─────────────────────────────────────────────
  if (mode === 'admin' && adminUnlocked) {
    const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').slice(0, 5);
    return <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0D',
      fontFamily: "'DM Sans', sans-serif",
      color: '#F2F0E9'
    }}>
        <style>{KEYFRAMES}</style>

        {/* Admin Navbar */}
        <nav style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: '#0D0D0D',
        borderBottom: '3px solid #587373',
        boxShadow: '0 3px 0px rgba(88,115,115,0.3)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px'
      }}>
          <div style={{
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0
          }}>
              <span className="lbc-bebas" style={{
              fontSize: 26,
              letterSpacing: '0.15em',
              color: '#F2F0E9',
              textShadow: '2px 2px 0px rgba(88,115,115,0.4)'
            }}>LALBICUT</span>
              <span className="lbc-bebas" style={{
              marginLeft: 14,
              fontSize: 11,
              color: '#F2F0E9',
              letterSpacing: '0.15em',
              backgroundColor: '#587373',
              border: '1.5px solid rgba(242,240,233,0.3)',
              boxShadow: '2px 2px 0px rgba(13,13,13,0.3)',
              borderRadius: 4,
              padding: '3px 10px'
            }}>PANNEAU ADMIN</span>
            </div>

            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32
          }}>
              {ADMIN_TABS.map(tab => <button key={tab.id} onClick={() => setAdminView(tab.id)} style={{
              background: 'none',
              border: 'none',
              borderBottom: adminView === tab.id ? '3px solid #587373' : '3px solid transparent',
              color: adminView === tab.id ? '#F2F0E9' : 'rgba(242,240,233,0.35)',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 13,
              letterSpacing: '0.12em',
              padding: '4px 0',
              paddingBottom: 2,
              cursor: 'pointer',
              transition: 'color 150ms ease'
            }} onMouseEnter={e => {
              if (adminView !== tab.id) e.currentTarget.style.color = 'rgba(242,240,233,0.7)';
            }} onMouseLeave={e => {
              if (adminView !== tab.id) e.currentTarget.style.color = 'rgba(242,240,233,0.35)';
            }}>
                  {tab.label}
                </button>)}
            </div>

            <button onClick={() => {
            setAdminUnlocked(false);
            setMode('client');
            setAdminView('dashboard');
          }} style={{
            background: 'transparent',
            border: '2px solid rgba(242,240,233,0.2)',
            boxShadow: '2px 2px 0px rgba(88,115,115,0.3)',
            borderRadius: 4,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: '0.1em',
            color: 'rgba(242,240,233,0.6)',
            padding: '8px 18px',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }} onMouseEnter={e => {
            e.currentTarget.style.color = 'rgba(242,240,233,0.9)';
            e.currentTarget.style.borderColor = 'rgba(242,240,233,0.5)';
          }} onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(242,240,233,0.6)';
            e.currentTarget.style.borderColor = 'rgba(242,240,233,0.2)';
          }}>
              QUITTER L'ADMIN
            </button>
          </div>
        </nav>

        {/* Admin Body */}
        <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '48px 48px'
      }}>

          {/* ── DASHBOARD ── */}
          {adminView === 'dashboard' && <div>
              <div>
                <p className="lbc-bebas" style={{
              fontSize: 18,
              color: '#587373',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: 0
            }}>BONJOUR,</p>
                <h1 className="lbc-bebas" style={{
              fontSize: 80,
              lineHeight: 0.85,
              color: '#F2F0E9',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: '4px 0 0'
            }}>
                  BILAL<span style={{
                color: '#587373'
              }}>.</span>
                </h1>
                <p className="lbc-dmsans" style={{
              fontSize: 14,
              color: 'rgba(242,240,233,0.4)',
              fontWeight: 700,
              marginTop: 8,
              textTransform: 'capitalize'
            }}>{getTodayLong()}</p>
              </div>

              {/* Stats grid */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            marginTop: 48
          }}>
                {[{
              id: 'st1',
              label: 'RÉSERVATIONS',
              value: String(bookings.length)
            }, {
              id: 'st2',
              label: 'EN ATTENTE',
              value: String(bookings.filter(b => b.status === 'pending').length)
            }, {
              id: 'st3',
              label: 'CONFIRMÉS',
              value: String(bookings.filter(b => b.status === 'confirmed').length)
            }, {
              id: 'st4',
              label: 'CA TOTAL',
              value: `${bookings.reduce((s, b) => s + b.price, 0)} EUR`
            }].map(stat => <div key={stat.id} style={{
              borderRadius: 10,
              overflow: 'hidden',
              border: '2px solid #587373',
              boxShadow: '4px 4px 0px #587373',
              backgroundColor: 'rgba(242,240,233,0.04)'
            }}>
                    <div style={{
                backgroundColor: '#587373',
                borderBottom: '2px solid rgba(242,240,233,0.15)',
                padding: '8px 20px'
              }}>
                      <span className="lbc-bebas" style={{
                  fontSize: 11,
                  color: '#F2F0E9',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase'
                }}>{stat.label}</span>
                    </div>
                    <div style={{
                padding: '20px 20px 24px'
              }}>
                      <div className="lbc-bebas" style={{
                  fontSize: 56,
                  color: '#F2F0E9',
                  lineHeight: 1,
                  letterSpacing: '0.04em'
                }}>{stat.value}</div>
                    </div>
                  </div>)}
              </div>

              {/* Upcoming */}
              <div style={{
            marginTop: 48
          }}>
                <h2 className="lbc-bebas" style={{
              fontSize: 28,
              color: '#F2F0E9',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0
            }}>PROCHAINS RDV</h2>
                <div style={{
              height: 2,
              backgroundColor: '#587373',
              marginTop: 4,
              marginBottom: 24
            }} />
                {upcomingBookings.length === 0 ? <p className="lbc-bebas" style={{
              fontSize: 16,
              color: 'rgba(242,240,233,0.3)',
              letterSpacing: '0.1em'
            }}>AUCUN RENDEZ-VOUS À VENIR</p> : <div>
                    {upcomingBookings.map(booking => <div key={booking.id} style={{
                backgroundColor: 'rgba(242,240,233,0.03)',
                border: '2px solid rgba(88,115,115,0.2)',
                boxShadow: '3px 3px 0px rgba(88,115,115,0.15)',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 12
              }}>
                        <div style={{
                  backgroundColor: 'rgba(88,115,115,0.15)',
                  borderBottom: '1px solid rgba(88,115,115,0.2)',
                  padding: '8px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                          <span className="lbc-dmsans" style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#F2F0E9'
                  }}>{booking.clientName}</span>
                          {adminStatusBadge(booking.status)}
                        </div>
                        <div style={{
                  padding: '14px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                          <div>
                            <p className="lbc-bebas" style={{
                      fontSize: 16,
                      color: '#F2F0E9',
                      letterSpacing: '0.06em',
                      margin: 0
                    }}>{booking.service.name}</p>
                            <p className="lbc-dmsans" style={{
                      fontSize: 12,
                      color: 'rgba(242,240,233,0.45)',
                      margin: '4px 0 0'
                    }}>{booking.date} à {booking.slot}</p>
                          </div>
                          <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                            <span className="lbc-bebas" style={{
                      fontSize: 28,
                      color: '#587373',
                      letterSpacing: '0.04em'
                    }}>{booking.price}€</span>
                            {booking.status === 'pending' && <div style={{
                      display: 'flex',
                      gap: 8
                    }}>
                                <button onClick={() => confirmBooking(booking.id)} style={{
                        backgroundColor: '#587373',
                        color: '#F2F0E9',
                        border: '2px solid rgba(242,240,233,0.2)',
                        boxShadow: '2px 2px 0px rgba(242,240,233,0.15)',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 12,
                        letterSpacing: '0.1em',
                        padding: '7px 16px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'transform 150ms ease'
                      }} onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translate(-1px,-1px)';
                      }} onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translate(0,0)';
                      }}>
                                  CONFIRMER
                                </button>
                                <button onClick={() => cancelBooking(booking.id)} style={{
                        backgroundColor: 'transparent',
                        color: 'rgba(242,240,233,0.4)',
                        border: '2px solid rgba(242,240,233,0.15)',
                        boxShadow: '2px 2px 0px rgba(88,115,115,0.1)',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 12,
                        letterSpacing: '0.1em',
                        padding: '7px 16px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }} onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(242,240,233,0.35)';
                      }} onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)';
                      }}>
                                  ANNULER
                                </button>
                              </div>}
                            <button onClick={() => {
                      setAdminView('reservations');
                      setExpandedBooking(booking.id);
                    }} style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(242,240,233,0.12)',
                      boxShadow: '1px 1px 0px rgba(88,115,115,0.1)',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      color: 'rgba(242,240,233,0.35)',
                      padding: '5px 12px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }} onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(88,115,115,0.3)';
                      e.currentTarget.style.color = '#587373';
                    }} onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(242,240,233,0.12)';
                      e.currentTarget.style.color = 'rgba(242,240,233,0.35)';
                    }}>
                              VOIR DÉTAILS
                            </button>
                          </div>
                        </div>
                      </div>)}
                  </div>}
              </div>
            </div>}

          {/* ── CRÉNEAUX ── */}
          {adminView === 'creneaux' && <div>
              <p className="lbc-bebas" style={{
            fontSize: 18,
            color: '#587373',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0
          }}>GESTION DES</p>
              <h1 className="lbc-bebas" style={{
            fontSize: 80,
            lineHeight: 0.85,
            color: '#F2F0E9',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: '4px 0 0'
          }}>
                CRÉNEAUX<span style={{
              color: '#587373'
            }}>.</span>
              </h1>

              {/* Compteur stats ligne */}
              {adminSelectedDate ? <p className="lbc-bebas" style={{
            fontSize: 13,
            color: 'rgba(242,240,233,0.4)',
            letterSpacing: '0.12em',
            marginTop: 12,
            marginBottom: 0
          }}>
                  <span>{slotsReservedCount} RÉSERVÉS</span>
                  <span style={{
              margin: '0 8px',
              color: 'rgba(242,240,233,0.15)'
            }}>·</span>
                  <span>{slotsFreeCount} LIBRES</span>
                  <span style={{
              margin: '0 8px',
              color: 'rgba(242,240,233,0.15)'
            }}>·</span>
                  <span>{slotsBlockedCount} BLOQUÉS</span>
                </p> : <p className="lbc-dmsans" style={{
            fontSize: 14,
            color: 'rgba(242,240,233,0.4)',
            fontWeight: 700,
            marginTop: 8
          }}>
                  Sélectionne une date pour voir le planning.
                </p>}

              {/* Date strip */}
              <div className="lbc-scrollbar-hide" style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 4,
            marginTop: 32
          }}>
                {dates.map((date, idx) => {
              const isSel = adminSelectedDate === date.label;
              const isToday = idx === 0;
              return <button key={`ad-${date.dayNum}-${date.monthShort}`} onClick={() => setAdminSelectedDate(date.label)} style={{
                flexShrink: 0,
                width: 72,
                padding: '14px 0',
                borderRadius: 6,
                cursor: 'pointer',
                border: isSel ? '2px solid #587373' : isToday && !isSel ? '2px solid rgba(88,115,115,0.4)' : '2px solid rgba(242,240,233,0.1)',
                backgroundColor: isSel ? '#587373' : 'rgba(242,240,233,0.05)',
                boxShadow: isSel ? '3px 3px 0px rgba(13,13,13,0.3)' : '3px 3px 0px rgba(88,115,115,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 150ms ease'
              }} onMouseEnter={e => {
                if (!isSel) {
                  e.currentTarget.style.borderColor = 'rgba(88,115,115,0.4)';
                  e.currentTarget.style.transform = 'translate(-1px,-1px)';
                }
              }} onMouseLeave={e => {
                if (!isSel) {
                  e.currentTarget.style.borderColor = isToday ? 'rgba(88,115,115,0.4)' : 'rgba(242,240,233,0.1)';
                  e.currentTarget.style.transform = 'translate(0,0)';
                }
              }}>
                      <span className="lbc-bebas" style={{
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  color: isSel ? 'rgba(242,240,233,0.75)' : 'rgba(242,240,233,0.4)'
                }}>{date.dayName}</span>
                      <span className="lbc-bebas" style={{
                  fontSize: 28,
                  letterSpacing: '0.02em',
                  color: isSel ? '#F2F0E9' : 'rgba(242,240,233,0.7)',
                  lineHeight: 1
                }}>{date.dayNum}</span>
                      <span className="lbc-bebas" style={{
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  color: isSel ? 'rgba(242,240,233,0.6)' : 'rgba(242,240,233,0.35)'
                }}>{date.monthShort.toUpperCase()}</span>
                    </button>;
            })}
              </div>

              {/* Légende visuelle */}
              <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 20,
            marginTop: 28,
            marginBottom: 16,
            alignItems: 'center'
          }}>
                <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
                  <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'rgba(88,115,115,0.3)',
                border: '1.5px solid #587373',
                flexShrink: 0
              }} />
                  <span className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.4)',
                letterSpacing: '0.12em'
              }}>RÉSERVÉ</span>
                </div>
                <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
                  <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'rgba(242,240,233,0.08)',
                border: '1.5px solid rgba(242,240,233,0.2)',
                flexShrink: 0
              }} />
                  <span className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.4)',
                letterSpacing: '0.12em'
              }}>DISPONIBLE</span>
                </div>
                <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
                  <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'rgba(13,13,13,0.4)',
                border: '1.5px solid rgba(242,240,233,0.08)',
                flexShrink: 0
              }} />
                  <span className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.4)',
                letterSpacing: '0.12em'
              }}>BLOQUÉ</span>
                </div>
              </div>

              {/* Planning list */}
              <div style={{
            marginTop: 8
          }}>
                {ALL_SLOTS.map(slot => {
              const booking = adminSelectedDate ? getBookingForSlot(slot) : undefined;
              const isBooked = !!booking && (!adminSelectedDate || booking.date === adminSelectedDate);
              const isBlocked = !isBooked && blockedSlots.includes(slot);
              const isFree = !isBooked && !isBlocked;
              const isLate = LATE_SLOTS.has(slot);
              if (isBooked && booking && (!adminSelectedDate || booking.date === adminSelectedDate)) {
                // CRÉNEAU RÉSERVÉ
                const initials = getInitials(booking.clientName);
                return <div key={`slot-${slot}`} style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 8,
                  marginBottom: 8,
                  overflow: 'hidden',
                  border: '2px solid #587373',
                  backgroundColor: 'rgba(88,115,115,0.12)',
                  boxShadow: '3px 3px 0px rgba(88,115,115,0.3)',
                  height: 64
                }}>
                      {/* Heure */}
                      <div style={{
                    width: 90,
                    padding: '0 20px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                        <span className="lbc-bebas" style={{
                      fontSize: 22,
                      color: '#F2F0E9',
                      letterSpacing: '0.06em'
                    }}>{slot}</span>
                      </div>
                      {/* Sep */}
                      <div style={{
                    width: 1,
                    height: '100%',
                    backgroundColor: 'rgba(88,115,115,0.3)',
                    flexShrink: 0
                  }} />
                      {/* Avatar */}
                      <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    backgroundColor: 'rgba(88,115,115,0.3)',
                    border: '1.5px solid rgba(88,115,115,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    margin: '0 14px'
                  }}>
                        <span className="lbc-bebas" style={{
                      fontSize: 14,
                      color: '#F2F0E9',
                      lineHeight: '36px',
                      textAlign: 'center'
                    }}>{initials}</span>
                      </div>
                      {/* Info client */}
                      <div style={{
                    flex: 1,
                    padding: '0 4px',
                    overflow: 'hidden'
                  }}>
                        <p className="lbc-bebas" style={{
                      fontSize: 16,
                      color: '#F2F0E9',
                      letterSpacing: '0.04em',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{booking.clientName}</p>
                        <p className="lbc-dmsans" style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'rgba(242,240,233,0.45)',
                      margin: '2px 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                          <span>{booking.service.name}</span>
                          <span> · </span>
                          <span>{booking.clientPhone}</span>
                        </p>
                      </div>
                      {/* Sep */}
                      <div style={{
                    width: 1,
                    height: '100%',
                    backgroundColor: 'rgba(88,115,115,0.2)',
                    flexShrink: 0
                  }} />
                      {/* Prix */}
                      <div style={{
                    padding: '0 20px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                        {isLate && <span className="lbc-bebas" style={{
                      fontSize: 10,
                      backgroundColor: 'rgba(88,115,115,0.2)',
                      border: '1px solid rgba(88,115,115,0.4)',
                      color: '#587373',
                      borderRadius: 3,
                      padding: '2px 6px'
                    }}>+5 EUR</span>}
                        <span className="lbc-bebas" style={{
                      fontSize: 22,
                      color: '#587373'
                    }}>{booking.price}€</span>
                      </div>
                      {/* Badge status */}
                      <div style={{
                    padding: '0 16px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                        {booking.status === 'pending' ? <span className="lbc-bebas" style={{
                      backgroundColor: 'rgba(88,115,115,0.2)',
                      border: '1.5px solid #587373',
                      color: '#587373',
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      borderRadius: 4,
                      padding: '4px 10px'
                    }}>EN ATTENTE</span> : <span className="lbc-bebas" style={{
                      backgroundColor: 'rgba(242,240,233,0.08)',
                      border: '1.5px solid rgba(242,240,233,0.25)',
                      color: 'rgba(242,240,233,0.55)',
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      borderRadius: 4,
                      padding: '4px 10px'
                    }}>CONFIRMÉ</span>}
                      </div>
                      {/* Bouton DETAILS */}
                      <button onClick={() => {
                    setAdminView('reservations');
                    setExpandedBooking(booking.id);
                  }} style={{
                    backgroundColor: 'rgba(88,115,115,0.2)',
                    border: '1.5px solid rgba(88,115,115,0.5)',
                    boxShadow: '2px 2px 0px rgba(88,115,115,0.2)',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 11,
                    color: '#587373',
                    letterSpacing: '0.1em',
                    padding: '6px 14px',
                    borderRadius: 4,
                    marginRight: 16,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 150ms ease'
                  }} onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(88,115,115,0.35)';
                    e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.3)';
                  }} onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(88,115,115,0.2)';
                    e.currentTarget.style.boxShadow = '2px 2px 0px rgba(88,115,115,0.2)';
                  }}>DÉTAILS</button>
                    </div>;
              }
              if (isBlocked) {
                // CRÉNEAU BLOQUÉ
                return <div key={`slot-${slot}`} style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 8,
                  marginBottom: 8,
                  overflow: 'hidden',
                  border: '2px solid rgba(242,240,233,0.08)',
                  backgroundColor: 'rgba(13,13,13,0.3)',
                  boxShadow: '2px 2px 0px rgba(13,13,13,0.2)',
                  height: 64,
                  opacity: 0.7
                }}>
                      {/* Heure */}
                      <div style={{
                    width: 90,
                    padding: '0 20px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                        <span className="lbc-bebas" style={{
                      fontSize: 22,
                      color: 'rgba(242,240,233,0.3)',
                      letterSpacing: '0.06em'
                    }}>{slot}</span>
                      </div>
                      {/* Sep */}
                      <div style={{
                    width: 1,
                    height: '100%',
                    backgroundColor: 'rgba(242,240,233,0.06)',
                    flexShrink: 0
                  }} />
                      {/* Cadenas + label */}
                      <div style={{
                    flex: 1,
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="rgba(242,240,233,0.2)" strokeWidth="1.3" />
                          <path d="M4 6V4.5a3 3 0 016 0V6" stroke="rgba(242,240,233,0.2)" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <span className="lbc-bebas" style={{
                      fontSize: 11,
                      color: 'rgba(242,240,233,0.2)',
                      letterSpacing: '0.15em'
                    }}>BLOQUÉ</span>
                      </div>
                      {/* Dash prix */}
                      <div style={{
                    padding: '0 20px',
                    flexShrink: 0
                  }}>
                        <span className="lbc-dmsans" style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(242,240,233,0.1)'
                    }}>--</span>
                      </div>
                      {/* Bouton DÉBLOQUER */}
                      <button onClick={() => toggleSlot(slot)} style={{
                    background: 'transparent',
                    border: '1.5px solid rgba(242,240,233,0.12)',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 11,
                    color: 'rgba(242,240,233,0.25)',
                    letterSpacing: '0.1em',
                    padding: '6px 14px',
                    borderRadius: 4,
                    marginRight: 16,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 150ms ease'
                  }} onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(242,240,233,0.3)';
                    e.currentTarget.style.color = 'rgba(242,240,233,0.5)';
                    e.currentTarget.style.boxShadow = '1px 1px 0px rgba(88,115,115,0.1)';
                  }} onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(242,240,233,0.12)';
                    e.currentTarget.style.color = 'rgba(242,240,233,0.25)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>DÉBLOQUER</button>
                    </div>;
              }

              // CRÉNEAU LIBRE
              return <div key={`slot-${slot}`} style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 8,
                marginBottom: 8,
                overflow: 'hidden',
                border: '2px solid rgba(242,240,233,0.1)',
                backgroundColor: 'rgba(242,240,233,0.04)',
                boxShadow: '2px 2px 0px rgba(88,115,115,0.1)',
                height: 64,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }} onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(88,115,115,0.3)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(88,115,115,0.06)';
              }} onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(242,240,233,0.1)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(242,240,233,0.04)';
              }}>
                    {/* Heure */}
                    <div style={{
                  width: 90,
                  padding: '0 20px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                      <span className="lbc-bebas" style={{
                    fontSize: 22,
                    color: 'rgba(242,240,233,0.6)',
                    letterSpacing: '0.06em'
                  }}>{slot}</span>
                    </div>
                    {/* Sep */}
                    <div style={{
                  width: 1,
                  height: '100%',
                  backgroundColor: 'rgba(242,240,233,0.08)',
                  flexShrink: 0
                }} />
                    {/* Tag disponible */}
                    <div style={{
                  flex: 1,
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                      <span className="lbc-bebas" style={{
                    fontSize: 11,
                    color: 'rgba(242,240,233,0.25)',
                    letterSpacing: '0.15em'
                  }}>DISPONIBLE</span>
                      {isLate && <span className="lbc-bebas" style={{
                    fontSize: 10,
                    backgroundColor: 'rgba(88,115,115,0.2)',
                    border: '1px solid rgba(88,115,115,0.4)',
                    color: '#587373',
                    borderRadius: 3,
                    padding: '2px 6px'
                  }}>+5 EUR</span>}
                    </div>
                    {/* Dash prix */}
                    <div style={{
                  padding: '0 20px',
                  flexShrink: 0
                }}>
                      <span className="lbc-dmsans" style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(242,240,233,0.15)'
                  }}>--</span>
                    </div>
                    {/* Bouton BLOQUER */}
                    <button onClick={e => {
                  e.stopPropagation();
                  toggleSlot(slot);
                }} style={{
                  background: 'transparent',
                  border: '1.5px solid rgba(242,240,233,0.1)',
                  boxShadow: '1px 1px 0px rgba(88,115,115,0.1)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 11,
                  color: 'rgba(242,240,233,0.3)',
                  letterSpacing: '0.1em',
                  padding: '6px 14px',
                  borderRadius: 4,
                  marginRight: 16,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 150ms ease'
                }} onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(242,240,233,0.3)';
                  e.currentTarget.style.color = 'rgba(242,240,233,0.6)';
                }} onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(242,240,233,0.1)';
                  e.currentTarget.style.color = 'rgba(242,240,233,0.3)';
                }}>BLOQUER</button>
                  </div>;
            })}
              </div>

              <p className="lbc-dmsans" style={{
            fontSize: 12,
            color: 'rgba(242,240,233,0.3)',
            marginTop: 20,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
                Créneaux bloqués = non réservables par les clients
              </p>
            </div>}

          {/* ── RÉSERVATIONS ── */}
          {adminView === 'reservations' && <div>
              <p className="lbc-bebas" style={{
            fontSize: 18,
            color: '#587373',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0
          }}>TOUTES LES</p>
              <h1 className="lbc-bebas" style={{
            fontSize: 72,
            lineHeight: 0.85,
            color: '#F2F0E9',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: '4px 0 0'
          }}>
                RÉSERVATIONS<span style={{
              color: '#587373'
            }}>.</span>
              </h1>

              {/* Quick stats header */}
              <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
            marginTop: 16,
            marginBottom: 32
          }}>
                {/* CA Aujourd'hui */}
                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
                  <span className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.3)',
                letterSpacing: '0.15em'
              }}>CA AUJOURD'HUI</span>
                  <span className="lbc-bebas" style={{
                fontSize: 22,
                color: '#F2F0E9',
                letterSpacing: '0.04em',
                lineHeight: 1
              }}>{todayConfirmedRevenue}€</span>
                </div>
                <div style={{
              width: 1,
              height: 32,
              backgroundColor: 'rgba(242,240,233,0.08)',
              margin: '0 24px'
            }} />
                {/* Prochain RDV */}
                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
                  <span className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.3)',
                letterSpacing: '0.15em'
              }}>PROCHAIN RDV</span>
                  {nextRdv ? <span className="lbc-bebas" style={{
                fontSize: 22,
                color: '#F2F0E9',
                letterSpacing: '0.04em',
                lineHeight: 1
              }}>
                    <span>{nextRdv.date}</span>
                    <span style={{
                  color: 'rgba(242,240,233,0.4)',
                  fontSize: 16
                }}> à </span>
                    <span>{nextRdv.slot}</span>
                  </span> : <span className="lbc-bebas" style={{
                fontSize: 22,
                color: 'rgba(242,240,233,0.2)',
                letterSpacing: '0.04em',
                lineHeight: 1
              }}>—</span>}
                </div>
                <div style={{
              width: 1,
              height: 32,
              backgroundColor: 'rgba(242,240,233,0.08)',
              margin: '0 24px'
            }} />
                {/* Taux confirmation */}
                <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
                  <span className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.3)',
                letterSpacing: '0.15em'
              }}>TAUX CONFIRM.</span>
                  <span className="lbc-bebas" style={{
                fontSize: 22,
                color: '#587373',
                letterSpacing: '0.04em',
                lineHeight: 1
              }}>{confirmationRate}%</span>
                </div>
              </div>

              {/* Filter tabs + tri */}
              <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 0,
            flexWrap: 'wrap'
          }}>
                {/* Filter tabs avec compteurs */}
                <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap'
            }}>
                  {([['all', `TOUS (${bookings.length})`], ['pending', `EN ATTENTE (${bookings.filter(b => b.status === 'pending').length})`], ['confirmed', `CONFIRMÉS (${bookings.filter(b => b.status === 'confirmed').length})`], ['cancelled', `ANNULÉS (${bookings.filter(b => b.status === 'cancelled').length})`]] as [typeof bookingFilter, string][]).map(([filter, label]) => <button key={filter} onClick={() => setBookingFilter(filter)} style={{
                background: bookingFilter === filter ? '#587373' : 'transparent',
                border: bookingFilter === filter ? '2px solid #587373' : '2px solid rgba(242,240,233,0.12)',
                boxShadow: bookingFilter === filter ? '3px 3px 0px rgba(13,13,13,0.3)' : '2px 2px 0px rgba(88,115,115,0.1)',
                color: bookingFilter === filter ? '#F2F0E9' : 'rgba(242,240,233,0.4)',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 13,
                letterSpacing: '0.1em',
                padding: '8px 18px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }} onMouseEnter={e => {
                if (bookingFilter !== filter) {
                  e.currentTarget.style.borderColor = 'rgba(88,115,115,0.4)';
                  e.currentTarget.style.color = 'rgba(242,240,233,0.7)';
                }
              }} onMouseLeave={e => {
                if (bookingFilter !== filter) {
                  e.currentTarget.style.borderColor = 'rgba(242,240,233,0.12)';
                  e.currentTarget.style.color = 'rgba(242,240,233,0.4)';
                }
              }}>
                      {label}
                    </button>)}
                </div>

                {/* Sort selector */}
                <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0
            }}>
                  <span className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.3)',
                letterSpacing: '0.15em'
              }}>TRIER PAR</span>
                  {(['date', 'prix'] as const).map(s => <button key={s} onClick={() => setSortBy(s)} style={{
                background: sortBy === s ? 'rgba(88,115,115,0.2)' : 'transparent',
                border: `1.5px solid ${sortBy === s ? 'rgba(88,115,115,0.5)' : 'rgba(242,240,233,0.12)'}`,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 12,
                color: sortBy === s ? '#587373' : 'rgba(242,240,233,0.4)',
                letterSpacing: '0.05em',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}>
                    {s.toUpperCase()}
                  </button>)}
                </div>
              </div>

              {/* Bookings list */}
              <div style={{
            marginTop: 24
          }}>
                {filteredBookings.length === 0 ? <div style={{
              backgroundColor: 'rgba(242,240,233,0.03)',
              border: '2px solid rgba(242,240,233,0.08)',
              borderRadius: 8,
              padding: 48,
              textAlign: 'center'
            }}>
                    <p className="lbc-bebas" style={{
                fontSize: 28,
                color: 'rgba(242,240,233,0.2)',
                letterSpacing: '0.1em',
                margin: 0
              }}>AUCUNE RÉSERVATION</p>
                  </div> : <div>
                    {filteredBookings.map(booking => {
                const isExpanded = expandedBooking === booking.id;
                const initials = getInitials(booking.clientName);
                const hasSmsLog = notifSent[`${booking.id}_sms`];
                const hasEmailLog = notifSent[`${booking.id}_email`];
                const hasLog = hasSmsLog || hasEmailLog;
                return <div key={booking.id} style={{
                  backgroundColor: 'rgba(242,240,233,0.04)',
                  border: `2px solid ${isExpanded ? 'rgba(88,115,115,0.5)' : 'rgba(88,115,115,0.25)'}`,
                  boxShadow: isExpanded ? '4px 4px 0px rgba(88,115,115,0.3)' : '3px 3px 0px rgba(88,115,115,0.15)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  marginBottom: 14,
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(88,115,115,0.5)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '4px 4px 0px rgba(88,115,115,0.3)';
                  }
                }} onMouseLeave={e => {
                  if (!isExpanded) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(88,115,115,0.25)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '3px 3px 0px rgba(88,115,115,0.15)';
                  }
                }}>

                        {/* Card Header */}
                        <div onClick={() => setExpandedBooking(isExpanded ? null : booking.id)} style={{
                    backgroundColor: 'rgba(88,115,115,0.1)',
                    borderBottom: isExpanded ? '1px solid rgba(88,115,115,0.2)' : '1px solid transparent',
                    padding: '12px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                          {/* Left */}
                          <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 16
                    }}>
                            <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 6,
                        backgroundColor: 'rgba(88,115,115,0.2)',
                        border: '2px solid rgba(88,115,115,0.4)',
                        boxShadow: '2px 2px 0px rgba(88,115,115,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                              <span className="lbc-bebas" style={{
                          fontSize: 16,
                          color: '#587373',
                          letterSpacing: '0.05em'
                        }}>{initials}</span>
                            </div>
                            <div>
                              <span className="lbc-bebas" style={{
                          fontSize: 18,
                          color: '#F2F0E9',
                          letterSpacing: '0.06em',
                          display: 'block'
                        }}>{booking.clientName}</span>
                              <span className="lbc-dmsans" style={{
                          fontSize: 12,
                          color: 'rgba(242,240,233,0.45)',
                          display: 'block',
                          marginTop: 2
                        }}>{booking.service.name} · {booking.date} à {booking.slot}</span>
                            </div>
                          </div>
                          {/* Right */}
                          <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10
                    }}>
                            <span className="lbc-bebas" style={{
                        fontSize: 24,
                        color: '#587373',
                        letterSpacing: '0.04em'
                      }}>{booking.price}€</span>
                            {adminStatusBadge(booking.status)}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
                        transition: 'transform 200ms ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0
                      }}>
                              <path d="M3 6L8 11L13 6" stroke="rgba(242,240,233,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>

                        {/* Card Expanded Body */}
                        {isExpanded && <div style={{
                    animation: 'lbc-fadein 200ms ease'
                  }}>
                            <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 24,
                      padding: 24
                    }}>

                              {/* Left col - INFOS CLIENT */}
                              <div>
                                <p className="lbc-bebas" style={{
                          fontSize: 13,
                          color: '#587373',
                          letterSpacing: '0.18em',
                          borderBottom: '1px solid rgba(88,115,115,0.2)',
                          paddingBottom: 8,
                          marginBottom: 16,
                          margin: '0 0 0 0'
                        }}>INFOS CLIENT</p>
                                <div style={{
                          marginTop: 16
                        }}>
                                  {/* NOM */}
                                  <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12
                          }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" /><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" strokeLinecap="round" /></svg>
                                    <span className="lbc-bebas" style={{
                              fontSize: 11,
                              color: 'rgba(242,240,233,0.3)',
                              letterSpacing: '0.15em',
                              width: 80,
                              flexShrink: 0
                            }}>NOM</span>
                                    <span className="lbc-dmsans" style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#F2F0E9'
                            }}>{booking.clientName}</span>
                                  </div>
                                  {/* EMAIL */}
                                  <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12
                          }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" /><path d="M1 5l7 5 7-5" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" strokeLinecap="round" /></svg>
                                    <span className="lbc-bebas" style={{
                              fontSize: 11,
                              color: 'rgba(242,240,233,0.3)',
                              letterSpacing: '0.15em',
                              width: 80,
                              flexShrink: 0
                            }}>EMAIL</span>
                                    <a href={`mailto:${booking.clientEmail}`} style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#F2F0E9',
                              textDecoration: 'underline',
                              textDecorationColor: '#587373',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif"
                            }}>{booking.clientEmail}</a>
                                  </div>
                                  {/* TEL */}
                                  <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12
                          }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 4-2 1.5a10 10 0 004 4L11 9.5l4 1.5v3a2 2 0 01-2 2A14 14 0 011 4a2 2 0 012-2z" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <span className="lbc-bebas" style={{
                              fontSize: 11,
                              color: 'rgba(242,240,233,0.3)',
                              letterSpacing: '0.15em',
                              width: 80,
                              flexShrink: 0
                            }}>TÉL</span>
                                    <a href={`tel:${booking.clientPhone}`} style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#F2F0E9',
                              textDecoration: 'underline',
                              textDecorationColor: '#587373',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif"
                            }}>{booking.clientPhone}</a>
                                  </div>
                                  {/* SERVICE */}
                                  <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12
                          }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M4 5h5M4 11h6" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" strokeLinecap="round" /><rect x="1" y="1" width="14" height="14" rx="2" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" /></svg>
                                    <span className="lbc-bebas" style={{
                              fontSize: 11,
                              color: 'rgba(242,240,233,0.3)',
                              letterSpacing: '0.15em',
                              width: 80,
                              flexShrink: 0
                            }}>SERVICE</span>
                                    <span className="lbc-dmsans" style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#F2F0E9'
                            }}>{booking.service.name} — {booking.service.duration}</span>
                                  </div>
                                  {/* DATE */}
                                  <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12
                          }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" /><path d="M1 6h14M5 1v2M11 1v2" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" strokeLinecap="round" /></svg>
                                    <span className="lbc-bebas" style={{
                              fontSize: 11,
                              color: 'rgba(242,240,233,0.3)',
                              letterSpacing: '0.15em',
                              width: 80,
                              flexShrink: 0
                            }}>DATE</span>
                                    <span className="lbc-dmsans" style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#F2F0E9'
                            }}>{booking.date}</span>
                                  </div>
                                  {/* HEURE */}
                                  <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12
                          }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" /><path d="M8 5v3l2 1.5" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <span className="lbc-bebas" style={{
                              fontSize: 11,
                              color: 'rgba(242,240,233,0.3)',
                              letterSpacing: '0.15em',
                              width: 80,
                              flexShrink: 0
                            }}>HEURE</span>
                                    <span className="lbc-dmsans" style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#F2F0E9'
                            }}>{booking.slot}</span>
                                  </div>
                                  {/* PRIX */}
                                  <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 12
                          }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" /><path d="M8 5v6M6 7h3.5a1.5 1.5 0 010 3H6" stroke="rgba(242,240,233,0.4)" strokeWidth="1.3" strokeLinecap="round" /></svg>
                                    <span className="lbc-bebas" style={{
                              fontSize: 11,
                              color: 'rgba(242,240,233,0.3)',
                              letterSpacing: '0.15em',
                              width: 80,
                              flexShrink: 0
                            }}>PRIX</span>
                                    <span className="lbc-dmsans" style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#F2F0E9'
                            }}>{booking.price} EUR</span>
                                  </div>
                                </div>

                                {/* Action buttons */}
                                {booking.status !== 'cancelled' && <div style={{
                          marginTop: 20,
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 8
                        }}>
                                    {booking.status === 'pending' && <button onClick={() => confirmBooking(booking.id)} style={{
                            backgroundColor: '#587373',
                            border: '2px solid rgba(242,240,233,0.2)',
                            boxShadow: '3px 3px 0px rgba(242,240,233,0.15)',
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 14,
                            color: '#F2F0E9',
                            letterSpacing: '0.1em',
                            padding: '10px 20px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            transition: 'transform 150ms ease, box-shadow 150ms ease'
                          }} onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translate(-1px,-1px)';
                            e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.2)';
                          }} onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translate(0,0)';
                            e.currentTarget.style.boxShadow = '3px 3px 0px rgba(242,240,233,0.15)';
                          }}>
                                        CONFIRMER
                                      </button>}
                                    <button onClick={() => cancelBooking(booking.id)} style={{
                            backgroundColor: 'transparent',
                            border: '2px solid rgba(242,240,233,0.15)',
                            boxShadow: '2px 2px 0px rgba(88,115,115,0.1)',
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 14,
                            color: 'rgba(242,240,233,0.4)',
                            letterSpacing: '0.1em',
                            padding: '10px 20px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            transition: 'all 150ms ease'
                          }} onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(242,240,233,0.4)';
                            e.currentTarget.style.color = 'rgba(242,240,233,0.7)';
                          }} onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)';
                            e.currentTarget.style.color = 'rgba(242,240,233,0.4)';
                          }}>
                                      ANNULER RDV
                                    </button>
                                  </div>}
                              </div>

                              {/* Right col - NOTIFICATIONS */}
                              <div>
                                <p className="lbc-bebas" style={{
                          fontSize: 13,
                          color: '#587373',
                          letterSpacing: '0.18em',
                          borderBottom: '1px solid rgba(88,115,115,0.2)',
                          paddingBottom: 8,
                          margin: '0 0 16px 0'
                        }}>NOTIFICATIONS</p>

                                {/* Quick templates */}
                                <p className="lbc-bebas" style={{
                          fontSize: 11,
                          color: 'rgba(242,240,233,0.3)',
                          letterSpacing: '0.15em',
                          margin: '0 0 8px 0'
                        }}>MODÈLE RAPIDE</p>
                                <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 6,
                          flexWrap: 'wrap',
                          marginBottom: 14
                        }}>
                                  {([['CONFIRMATION', 'confirmation', `Bonjour ${booking.clientName.split(' ')[0]}, votre RDV chez LALBICUT est confirmé ! Bilal vous attend le ${booking.date} à ${booking.slot}. À bientôt !`], ['RAPPEL RDV', 'rappel', `Bonjour ${booking.clientName.split(' ')[0]} ! Rappel : vous avez un RDV chez LALBICUT demain à ${booking.slot}. En cas d'annulation merci de nous prévenir. À bientôt !`], ['ANNULATION', 'annulation', `Bonjour ${booking.clientName.split(' ')[0]}, nous sommes désolés mais votre RDV du ${booking.date} à ${booking.slot} doit être annulé. Contactez-nous pour reporter. LALBICUT`], ['PERSONNALISÉ', 'custom', '']] as [string, 'confirmation' | 'rappel' | 'annulation' | 'custom', string][]).map(([label, type, msg]) => <button key={`tpl-${booking.id}-${type}`} onClick={() => {
                            setNotifMessage(prev => ({
                              ...prev,
                              [booking.id]: msg
                            }));
                            setNotifType(prev => ({
                              ...prev,
                              [booking.id]: type
                            }));
                          }} style={{
                            backgroundColor: notifType[booking.id] === type ? 'rgba(88,115,115,0.3)' : 'rgba(88,115,115,0.15)',
                            border: `1.5px solid ${notifType[booking.id] === type ? '#587373' : 'rgba(88,115,115,0.4)'}`,
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 11,
                            color: '#587373',
                            letterSpacing: '0.08em',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            transition: 'background-color 150ms ease'
                          }} onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(88,115,115,0.25)';
                          }} onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = notifType[booking.id] === type ? 'rgba(88,115,115,0.3)' : 'rgba(88,115,115,0.15)';
                          }}>
                                      {label}
                                    </button>)}
                                </div>

                                {/* Message textarea */}
                                <p className="lbc-bebas" style={{
                          fontSize: 11,
                          color: 'rgba(242,240,233,0.3)',
                          letterSpacing: '0.15em',
                          margin: '14px 0 8px 0'
                        }}>MESSAGE</p>
                                <textarea value={notifMessage[booking.id] || ''} onChange={e => setNotifMessage(prev => ({
                          ...prev,
                          [booking.id]: e.target.value
                        }))} placeholder="Composez votre message..." style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          backgroundColor: 'rgba(242,240,233,0.05)',
                          border: '2px solid rgba(242,240,233,0.12)',
                          boxShadow: '3px 3px 0px rgba(88,115,115,0.2)',
                          borderRadius: 6,
                          color: '#F2F0E9',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                          padding: '12px 14px',
                          minHeight: 100,
                          resize: 'vertical',
                          outline: 'none',
                          lineHeight: 1.5,
                          transition: 'border-color 150ms ease, box-shadow 150ms ease'
                        }} onFocus={e => {
                          e.currentTarget.style.borderColor = '#587373';
                          e.currentTarget.style.boxShadow = '4px 4px 0px rgba(88,115,115,0.4)';
                        }} onBlur={e => {
                          e.currentTarget.style.borderColor = 'rgba(242,240,233,0.12)';
                          e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.2)';
                        }} />

                                {/* Type badge */}
                                {notifType[booking.id] && <p className="lbc-bebas" style={{
                          fontSize: 10,
                          letterSpacing: '0.15em',
                          marginTop: 6,
                          color: notifType[booking.id] === 'confirmation' ? '#587373' : notifType[booking.id] === 'rappel' ? 'rgba(242,240,233,0.6)' : notifType[booking.id] === 'annulation' ? 'rgba(242,240,233,0.35)' : 'rgba(242,240,233,0.5)',
                          margin: '6px 0 0 0'
                        }}>
                                    {notifType[booking.id] === 'confirmation' ? '● CONFIRMATION' : notifType[booking.id] === 'rappel' ? '● RAPPEL' : notifType[booking.id] === 'annulation' ? '● ANNULATION' : '● PERSONNALISÉ'}
                                  </p>}

                                {/* Send buttons */}
                                <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 8,
                          marginTop: 12
                        }}>
                                  {smsFeedback[booking.id] ? <span className="lbc-bebas" style={{
                            fontSize: 12,
                            color: '#587373',
                            letterSpacing: '0.1em',
                            padding: '11px 0'
                          }}>SMS ENVOYÉ !</span> : <button onClick={() => handleSendSms(booking.id)} style={{
                            backgroundColor: '#587373',
                            border: '2px solid rgba(242,240,233,0.2)',
                            boxShadow: '3px 3px 0px rgba(242,240,233,0.15)',
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 14,
                            color: '#F2F0E9',
                            letterSpacing: '0.1em',
                            padding: '11px 20px',
                            borderRadius: 4,
                            cursor: notifMessage[booking.id] ? 'pointer' : 'not-allowed',
                            opacity: notifMessage[booking.id] ? 1 : 0.35,
                            transition: 'transform 150ms ease, box-shadow 150ms ease'
                          }} onMouseEnter={e => {
                            if (notifMessage[booking.id]) {
                              e.currentTarget.style.transform = 'translate(-1px,-1px)';
                              e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.2)';
                            }
                          }} onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translate(0,0)';
                            e.currentTarget.style.boxShadow = '3px 3px 0px rgba(242,240,233,0.15)';
                          }}>
                                      ENVOYER SMS
                                    </button>}
                                  {emailFeedback[booking.id] ? <span className="lbc-bebas" style={{
                            fontSize: 12,
                            color: '#587373',
                            letterSpacing: '0.1em',
                            padding: '11px 0'
                          }}>EMAIL ENVOYÉ !</span> : <button onClick={() => handleSendEmail(booking.id)} style={{
                            backgroundColor: 'transparent',
                            border: '2px solid rgba(88,115,115,0.4)',
                            boxShadow: '2px 2px 0px rgba(88,115,115,0.2)',
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 14,
                            color: '#587373',
                            letterSpacing: '0.1em',
                            padding: '11px 20px',
                            borderRadius: 4,
                            cursor: notifMessage[booking.id] ? 'pointer' : 'not-allowed',
                            opacity: notifMessage[booking.id] ? 1 : 0.35,
                            transition: 'all 150ms ease'
                          }} onMouseEnter={e => {
                            if (notifMessage[booking.id]) {
                              e.currentTarget.style.backgroundColor = 'rgba(88,115,115,0.12)';
                              e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.3)';
                            }
                          }} onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.boxShadow = '2px 2px 0px rgba(88,115,115,0.2)';
                          }}>
                                      ENVOYER EMAIL
                                    </button>}
                                </div>

                                {/* Auto reminder */}
                                <div style={{
                          height: 1,
                          backgroundColor: 'rgba(242,240,233,0.06)',
                          margin: '14px 0'
                        }} />
                                <p className="lbc-bebas" style={{
                          fontSize: 11,
                          color: 'rgba(242,240,233,0.3)',
                          letterSpacing: '0.15em',
                          margin: '0 0 10px 0'
                        }}>RAPPEL AUTOMATIQUE</p>
                                {!reminderScheduled[booking.id] ? <button onClick={() => setReminderScheduled(prev => ({
                          ...prev,
                          [booking.id]: true
                        }))} style={{
                          backgroundColor: 'rgba(242,240,233,0.05)',
                          border: '2px solid rgba(242,240,233,0.12)',
                          boxShadow: '2px 2px 0px rgba(88,115,115,0.1)',
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: 12,
                          color: 'rgba(242,240,233,0.5)',
                          letterSpacing: '0.1em',
                          padding: '10px 16px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          transition: 'all 150ms ease'
                        }} onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'rgba(88,115,115,0.4)';
                          e.currentTarget.style.color = 'rgba(242,240,233,0.7)';
                        }} onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(242,240,233,0.12)';
                          e.currentTarget.style.color = 'rgba(242,240,233,0.5)';
                        }}>
                                    + PROGRAMMER RAPPEL J-1
                                  </button> : <div style={{
                          backgroundColor: 'rgba(88,115,115,0.1)',
                          border: '1.5px solid rgba(88,115,115,0.35)',
                          borderRadius: 6,
                          padding: '10px 14px',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8
                        }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#587373" strokeWidth="1.3" /><path d="M4 7l2 2 4-4" stroke="#587373" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <span className="lbc-bebas" style={{
                            fontSize: 12,
                            color: '#587373',
                            letterSpacing: '0.1em',
                            flex: 1
                          }}>RAPPEL PROGRAMMÉ — J-1</span>
                                    <button onClick={() => setReminderScheduled(prev => ({
                            ...prev,
                            [booking.id]: false
                          }))} style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(242,240,233,0.3)',
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: 14,
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1,
                            transition: 'color 150ms ease',
                            marginLeft: 'auto'
                          }} onMouseEnter={e => {
                            e.currentTarget.style.color = 'rgba(242,240,233,0.6)';
                          }} onMouseLeave={e => {
                            e.currentTarget.style.color = 'rgba(242,240,233,0.3)';
                          }}>×</button>
                                  </div>}
                              </div>
                            </div>

                            {/* Notification log */}
                            {hasLog && <div style={{
                      backgroundColor: 'rgba(242,240,233,0.02)',
                      borderTop: '1px solid rgba(242,240,233,0.06)',
                      padding: '10px 20px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}>
                                <span className="lbc-bebas" style={{
                        fontSize: 10,
                        color: 'rgba(242,240,233,0.2)',
                        letterSpacing: '0.15em'
                      }}>HISTORIQUE :</span>
                                {hasSmsLog && <span className="lbc-dmsans" style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(242,240,233,0.3)'
                      }}>· SMS envoyé</span>}
                                {hasEmailLog && <span className="lbc-dmsans" style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(242,240,233,0.3)'
                      }}>· Email envoyé</span>}
                              </div>}
                          </div>}
                      </div>;
              })}
                  </div>}
              </div>
            </div>}
        </div>
      </div>;
  }

  // ─── CLIENT APP ────────────────────────────────────────────────────────
  return <div style={{
    minHeight: '100vh',
    backgroundColor: '#F2F0E9',
    fontFamily: "'DM Sans', sans-serif",
    color: '#0D0D0D',
    margin: 0,
    padding: 0
  }}>
      <style>{KEYFRAMES}</style>

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════ */}
      <nav style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backgroundColor: '#F2F0E9',
      borderBottom: '3px solid #0D0D0D',
      boxShadow: scrolled ? '0 3px 0px #587373, 0 4px 20px rgba(13,13,13,0.08)' : '0 3px 0px #587373',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      padding: '0 60px',
      transition: 'box-shadow 200ms ease'
    }}>
        <div style={{
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1,
          cursor: 'default'
        }}>
            <span className="lbc-bebas" style={{
            fontSize: 32,
            letterSpacing: '0.15em',
            color: '#0D0D0D',
            lineHeight: 1,
            textShadow: '2px 2px 0px #587373'
          }}>LALBICUT</span>
            <span className="lbc-bebas" style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'rgba(13,13,13,0.4)',
            textTransform: 'uppercase',
            marginTop: 1
          }}>BARBER SHOP</span>
          </div>

          <div style={{
          display: 'flex',
          gap: 32
        }}>
            {([{
            id: 'nl1',
            label: 'Prestations',
            sectionId: 'prestations',
            ref: servicesRef
          }, {
            id: 'nl2',
            label: 'Le Barber',
            sectionId: 'barber',
            ref: barberRef
          }, {
            id: 'nl3',
            label: 'Réalisations',
            sectionId: 'realisations',
            ref: gallerieRef
          }, {
            id: 'nl4',
            label: 'Réserver',
            sectionId: 'reservation',
            ref: bookingRef
          }] as {
            id: string;
            label: string;
            sectionId: string;
            ref: React.RefObject<HTMLElement | null>;
          }[]).map(link => <button key={link.id} onClick={() => scrollTo(link.ref)} style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: activeSection === link.sectionId ? '#0D0D0D' : 'rgba(13,13,13,0.6)',
            transition: 'color 200ms ease',
            textDecoration: 'none'
          }}>
                {link.label}
                <span style={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: activeSection === link.sectionId ? '100%' : '0%',
              height: '2.5px',
              background: '#587373',
              borderRadius: '2px',
              transition: 'width 220ms ease',
              display: 'block'
            }} />
              </button>)}
          </div>

          <button onClick={() => scrollTo(bookingRef)} style={{
          backgroundColor: '#587373',
          color: '#F2F0E9',
          border: '2px solid #0D0D0D',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 16,
          letterSpacing: '0.1em',
          padding: '10px 24px',
          borderRadius: 4,
          cursor: 'pointer',
          boxShadow: '3px 3px 0px #0D0D0D',
          transition: 'transform 150ms ease, box-shadow 150ms ease',
          display: 'flex',
          alignItems: 'center',
          gap: 0
        }} onMouseEnter={e => {
          e.currentTarget.style.transform = 'translate(-1px,-1px)';
          e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D';
        }} onMouseLeave={e => {
          e.currentTarget.style.transform = 'translate(0,0)';
          e.currentTarget.style.boxShadow = '3px 3px 0px #0D0D0D';
        }} onMouseDown={e => {
          e.currentTarget.style.transform = 'translate(2px,2px)';
          e.currentTarget.style.boxShadow = '1px 1px 0px #0D0D0D';
        }} onMouseUp={e => {
          e.currentTarget.style.transform = 'translate(-1px,-1px)';
          e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D';
        }}>
            {activeSection === 'reservation' && <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#F2F0E9',
            marginRight: 8,
            display: 'inline-block',
            animation: 'lbc-pulse 1.5s infinite',
            flexShrink: 0
          }} />}
            {activeSection === 'reservation' ? 'VOUS ÊTES ICI' : 'RÉSERVER'}
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
      <header ref={heroRef} style={{
      position: 'relative',
      height: '100vh',
      minHeight: 600,
      overflow: 'hidden'
    }}>
        <video autoPlay muted loop playsInline style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0
      }}>
          <source src="/Coiffure Bilal/hero.mp4" type="video/mp4" />
        </video>
        <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'linear-gradient(to right, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.6) 55%, rgba(13,13,13,0.25) 100%)'
      }} />

        <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        padding: '0 60px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
          <div style={{
          maxWidth: 580,
          flex: '0 0 auto'
        }}>
            <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#F2F0E9',
            border: '2px solid #587373',
            boxShadow: '3px 3px 0px #587373',
            borderRadius: 4,
            padding: '6px 14px'
          }}>
              <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: '#587373',
              animation: 'lbc-pulse 2s infinite'
            }} />
              <span className="lbc-bebas" style={{
              fontSize: 13,
              color: '#587373',
              letterSpacing: '0.18em'
            }}>DISPONIBLE AUJOURD'HUI</span>
            </div>

            <h1 className="lbc-bebas" style={{
            fontSize: 96,
            fontWeight: 400,
            lineHeight: 0.88,
            color: '#F2F0E9',
            margin: '24px 0 0',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
              <span>LA COUPE<br /></span>
              <span>QUE TU </span>
              <span style={{
              color: '#587373'
            }}>MÉRITES</span>
            </h1>

            <div style={{
            width: 56,
            height: 4,
            backgroundColor: '#587373',
            margin: '24px 0',
            boxShadow: '2px 2px 0px rgba(242,240,233,0.15)'
          }} />

            <p className="lbc-dmsans" style={{
            fontSize: 16,
            lineHeight: 1.65,
            color: 'rgba(242,240,233,0.65)',
            margin: 0,
            maxWidth: 460
          }}>
              Bilal t'accueille dans son shop pour une expérience barber premium — coupes nettes, barbe impeccable, ambiance authentique.
            </p>

            <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 40,
            gap: 20
          }}>
              <button onClick={() => scrollTo(bookingRef)} style={{
              backgroundColor: '#F2F0E9',
              color: '#0D0D0D',
              border: '2px solid #F2F0E9',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18,
              letterSpacing: '0.1em',
              padding: '16px 40px',
              borderRadius: 4,
              cursor: 'pointer',
              boxShadow: '4px 4px 0px #587373',
              transition: 'transform 150ms ease, box-shadow 150ms ease'
            }} onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-2px,-2px)';
              e.currentTarget.style.boxShadow = '6px 6px 0px #587373';
            }} onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(0,0)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #587373';
            }}>
                RÉSERVER MAINTENANT
              </button>
              <button onClick={() => scrollTo(servicesRef)} style={{
              background: 'none',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: 'rgba(242,240,233,0.5)',
              cursor: 'pointer',
              transition: 'color 200ms ease',
              padding: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }} onMouseEnter={e => {
              e.currentTarget.style.color = '#F2F0E9';
            }} onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(242,240,233,0.5)';
            }}>
                Voir les prestations ↓
              </button>
            </div>
          </div>

          <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          paddingBottom: 60
        }}>
            <div style={{
            backgroundColor: 'rgba(242,240,233,0.1)',
            border: '2px solid rgba(242,240,233,0.35)',
            boxShadow: '4px 4px 0px rgba(88,115,115,0.5)',
            borderRadius: 8,
            overflow: 'hidden',
            minWidth: 220
          }}>
              <div style={{
              backgroundColor: 'rgba(88,115,115,0.8)',
              borderBottom: '2px solid rgba(242,240,233,0.3)',
              padding: '10px 16px'
            }}>
                <span className="lbc-bebas" style={{
                fontSize: 13,
                color: '#F2F0E9',
                letterSpacing: '0.15em'
              }}>VOTRE BARBER</span>
              </div>
              <div style={{
              padding: '20px 24px'
            }}>
                <div style={{
                width: 52,
                height: 52,
                borderRadius: 6,
                backgroundColor: 'rgba(88,115,115,0.4)',
                border: '2px solid rgba(242,240,233,0.3)',
                boxShadow: '3px 3px 0px #587373',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                  <span className="lbc-bebas" style={{
                  fontSize: 20,
                  color: '#F2F0E9',
                  letterSpacing: '0.05em'
                }}>DJ</span>
                </div>
                <p className="lbc-bebas" style={{
                fontSize: 20,
                color: '#F2F0E9',
                margin: '12px 0 0',
                letterSpacing: '0.08em'
              }}>BILAL</p>
                <p className="lbc-dmsans" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.45)',
                margin: '2px 0 0',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>Expert coupes &amp; barbes</p>
                <div style={{
                height: 1,
                backgroundColor: 'rgba(242,240,233,0.12)',
                margin: '12px 0'
              }} />
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                  <span style={{
                  fontSize: 13,
                  color: '#587373'
                }}>★★★★★</span>
                  <span className="lbc-bebas" style={{
                  fontSize: 14,
                  color: 'rgba(242,240,233,0.7)',
                  letterSpacing: '0.08em'
                }}>5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6
      }}>
          <span className="lbc-bebas" style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(242,240,233,0.4)'
        }}>DÉFILER</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
          animation: 'lbc-bounce 1.2s ease-in-out infinite'
        }}>
            <path d="M3 6L8 11L13 6" stroke="rgba(242,240,233,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </header>

      {/* ═══ PRESTATIONS ══════════════════════════════════════════════════ */}
      <section ref={servicesRef} id="prestations" style={{
      backgroundColor: '#F2F0E9',
      padding: '80px 60px'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto'
      }}>
          <div style={{
          display: 'inline-block',
          backgroundColor: '#0D0D0D',
          border: '2px solid #0D0D0D',
          boxShadow: '5px 5px 0px #587373',
          borderRadius: 6,
          padding: '10px 22px',
          marginBottom: 16
        }}>
            <span className="lbc-bebas" style={{
            fontSize: 11,
            color: '#F2F0E9',
            letterSpacing: '0.25em'
          }}>PRESTATIONS</span>
          </div>
          <h2 className="lbc-bebas" style={{
          fontSize: 80,
          lineHeight: 0.88,
          color: '#0D0D0D',
          margin: '0 0 8px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'block'
        }}>
            PRESTATION CHEZ<br />LALBICUT
          </h2>
          <p className="lbc-dmsans" style={{
          fontSize: 15,
          color: 'rgba(13,13,13,0.45)',
          margin: '0 0 40px',
          lineHeight: 1.5
        }}>
            Coupes nettes, barbes au cordeau — chaque prestation taillée pour toi.
          </p>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16
        }}>
            {SERVICES.map(svc => renderServiceCardBold(svc, selectedService?.id === svc.id, () => {
            setSelectedService(svc);
            scrollTo(bookingRef);
          }))}
          </div>

          <div style={{
          marginTop: 24,
          backgroundColor: '#F2F0E9',
          border: '2px solid #587373',
          boxShadow: '3px 3px 0px #587373',
          borderRadius: 6,
          padding: '14px 20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12
        }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
            flexShrink: 0
          }}>
              <circle cx="10" cy="10.5" r="7" stroke="#587373" strokeWidth="1.5" />
              <path d="M10 7.5V10.5L12 12" stroke="#587373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 3.5H13" stroke="#587373" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="lbc-dmsans" style={{
            fontSize: 13,
            color: '#0D0D0D',
            lineHeight: 1.5
          }}>
              <strong>Toute prestation après 22h</strong> = +5 euros sur le prix de base.
            </span>
          </div>
        </div>
      </section>

      {/* ═══ BARBER ════════════════════════════════════════════════════════ */}
      <section ref={barberRef} id="barber" style={{
      backgroundColor: '#0D0D0D',
      padding: '80px 60px'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'center'
      }}>
          <div>
            <div style={{
            display: 'inline-block',
            backgroundColor: '#587373',
            border: '2px solid #F2F0E9',
            boxShadow: '4px 4px 0px rgba(242,240,233,0.3)',
            borderRadius: 4,
            padding: '8px 18px',
            marginBottom: 16
          }}>
              <span className="lbc-bebas" style={{
              fontSize: 12,
              color: '#F2F0E9',
              letterSpacing: '0.2em'
            }}>VOTRE BARBER</span>
            </div>
            <h2 className="lbc-bebas" style={{
            fontSize: 88,
            fontWeight: 400,
            color: '#F2F0E9',
            margin: '0 0 20px',
            lineHeight: 0.88,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'block'
          }}>
              BILAL<span style={{
              color: '#587373'
            }}>.</span>
            </h2>
            <p className="lbc-dmsans" style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: 'rgba(242,240,233,0.6)',
            margin: '0 0 24px'
          }}>
              8 ans d'expérience. Expert coupes nettes, barbes travaillées, rasage à l'ancienne. LALBICUT, c'est son œuvre.
            </p>
            <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 32
          }}>
              {BARBER_SPECIALTIES.map(tag => <span key={tag} className="lbc-bebas" style={{
              border: '1.5px solid #587373',
              color: '#587373',
              fontSize: 11,
              padding: '5px 14px',
              borderRadius: 20,
              letterSpacing: '0.1em'
            }}>{tag}</span>)}
            </div>
            <button onClick={() => scrollTo(bookingRef)} style={{
            backgroundColor: '#587373',
            color: '#F2F0E9',
            border: '2px solid #F2F0E9',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: '0.1em',
            padding: '14px 32px',
            borderRadius: 4,
            cursor: 'pointer',
            boxShadow: '4px 4px 0px rgba(242,240,233,0.25)',
            transition: 'transform 150ms ease, box-shadow 150ms ease'
          }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translate(-2px,-2px)';
            e.currentTarget.style.boxShadow = '6px 6px 0px rgba(242,240,233,0.3)';
          }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'translate(0,0)';
            e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.25)';
          }}>
              PRENDRE RDV AVEC BILAL
            </button>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
            <div style={{
            borderRadius: 10,
            overflow: 'hidden',
            border: '2px solid rgba(242,240,233,0.2)',
            boxShadow: '5px 5px 0px #587373',
            backgroundColor: 'rgba(242,240,233,0.05)',
            width: 280
          }}>
              <div style={{
              backgroundColor: '#587373',
              borderBottom: '2px solid #F2F0E9',
              padding: '12px 20px'
            }}>
                <span className="lbc-bebas" style={{
                fontSize: 14,
                color: '#F2F0E9',
                letterSpacing: '0.15em'
              }}>LALBICUT × BILAL</span>
              </div>
              <div style={{
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16
            }}>
                <div style={{
                width: 120,
                height: 120,
                borderRadius: 8,
                backgroundColor: 'rgba(88,115,115,0.25)',
                border: '2px solid rgba(242,240,233,0.3)',
                boxShadow: '3px 3px 0px #587373',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                  <span className="lbc-bebas" style={{
                  fontSize: 48,
                  color: '#F2F0E9',
                  letterSpacing: '0.05em'
                }}>DJ</span>
                </div>
                <div>
                  <p className="lbc-bebas" style={{
                  fontSize: 28,
                  color: '#F2F0E9',
                  margin: 0,
                  letterSpacing: '0.08em'
                }}>BILAL</p>
                  <p className="lbc-dmsans" style={{
                  fontSize: 12,
                  color: 'rgba(242,240,233,0.45)',
                  margin: '4px 0 0',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>Barber Expert</p>
                </div>
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                  <span style={{
                  fontSize: 14,
                  color: '#587373'
                }}>★★★★★</span>
                  <span className="lbc-bebas" style={{
                  fontSize: 16,
                  color: 'rgba(242,240,233,0.7)',
                  letterSpacing: '0.08em'
                }}>5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GALERIE ════════════════════════════════════════════════════════ */}
      <section ref={gallerieRef} id="realisations" style={{
      backgroundColor: '#0D0D0D',
      padding: '100px 60px'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto'
      }}>
          <div style={{
          display: 'inline-block',
          backgroundColor: '#F2F0E9',
          border: '2px solid #0D0D0D',
          boxShadow: '4px 4px 0px #587373',
          borderRadius: 4,
          padding: '8px 18px',
          marginBottom: 16
        }}>
            <span className="lbc-bebas" style={{
            fontSize: 11,
            color: '#0D0D0D',
            letterSpacing: '0.2em'
          }}>RÉALISATIONS</span>
          </div>
          <h2 className="lbc-bebas" style={{
          fontSize: 80,
          fontWeight: 400,
          color: '#F2F0E9',
          margin: '0 0 0',
          lineHeight: 0.88,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'block'
        }}>
            LE TRAVAIL PARLE<span style={{
            color: '#587373'
          }}>.</span>
          </h2>
          <p className="lbc-dmsans" style={{
          fontSize: 16,
          color: 'rgba(242,240,233,0.45)',
          marginTop: 16,
          marginBottom: 0,
          lineHeight: 1.5
        }}>
            Quelques coupes récentes de Bilal. Chaque détail compte.
          </p>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginTop: 56
        }}>
            {GALLERY_CARDS.map(card => <div key={card.id} style={{
            borderRadius: 10,
            overflow: 'hidden',
            cursor: 'pointer',
            height: 420,
            border: '2px solid #587373',
            boxShadow: '5px 5px 0px #587373',
            transition: 'transform 150ms ease, box-shadow 150ms ease',
            backgroundColor: 'rgba(88,115,115,0.2)',
            position: 'relative'
          }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translate(-2px,-2px)';
            e.currentTarget.style.boxShadow = '7px 7px 0px #587373';
          }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'translate(0,0)';
            e.currentTarget.style.boxShadow = '5px 5px 0px #587373';
          }}>
                <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(88,115,115,0.2)',
              zIndex: 0
            }}>
                  <span className="lbc-bebas" style={{
                fontSize: 48,
                color: 'rgba(242,240,233,0.15)',
                letterSpacing: '0.08em'
              }}>LBC</span>
                </div>
                <img src={card.src} alt={card.title} style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }} />
                <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              background: 'linear-gradient(to top, rgba(13,13,13,0.88) 0%, rgba(13,13,13,0.2) 55%, transparent 100%)'
            }} />
                <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 24,
              zIndex: 3
            }}>
                  <span className="lbc-bebas" style={{
                display: 'inline-block',
                backgroundColor: '#587373',
                color: '#F2F0E9',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '4px 12px',
                borderRadius: 4,
                marginBottom: 10,
                border: '1.5px solid #F2F0E9'
              }}>{card.tag}</span>
                  <p className="lbc-bebas" style={{
                fontSize: 20,
                color: '#F2F0E9',
                margin: 0,
                letterSpacing: '0.06em'
              }}>{card.title}</p>
                  <p className="lbc-bebas" style={{
                fontSize: 11,
                color: 'rgba(242,240,233,0.55)',
                margin: '4px 0 0',
                letterSpacing: '0.1em'
              }}>{card.sub.toUpperCase()}</p>
                </div>
              </div>)}
          </div>

          <div style={{
          textAlign: 'center',
          marginTop: 48
        }}>
            <p className="lbc-dmsans" style={{
            fontSize: 14,
            color: 'rgba(242,240,233,0.4)',
            margin: 0,
            fontWeight: 600
          }}>Tu veux le même résultat ?</p>
            <button onClick={() => scrollTo(bookingRef)} style={{
            backgroundColor: '#587373',
            color: '#F2F0E9',
            border: '2px solid #F2F0E9',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            letterSpacing: '0.1em',
            padding: '16px 48px',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 16,
            boxShadow: '4px 4px 0px rgba(242,240,233,0.2)',
            transition: 'transform 150ms ease, box-shadow 150ms ease'
          }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translate(-2px,-2px)';
            e.currentTarget.style.boxShadow = '6px 6px 0px rgba(242,240,233,0.25)';
          }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'translate(0,0)';
            e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.2)';
          }}>
              RÉSERVER AVEC BILAL
            </button>
          </div>
        </div>
      </section>

      {/* ═══ BOOKING MODULE ═══════════════════════════════════════════════ */}
      <section ref={bookingRef} id="reservation" style={{
      backgroundColor: '#F2F0E9',
      padding: '100px 60px'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto'
      }}>
          <div style={{
          display: 'inline-block',
          backgroundColor: '#0D0D0D',
          border: '2px solid #0D0D0D',
          boxShadow: '4px 4px 0px #587373',
          borderRadius: 6,
          padding: '10px 22px',
          marginBottom: 16
        }}>
            <span className="lbc-bebas" style={{
            fontSize: 11,
            color: '#F2F0E9',
            letterSpacing: '0.22em'
          }}>RÉSERVATION</span>
          </div>
          <h2 className="lbc-bebas" style={{
          fontSize: 80,
          fontWeight: 400,
          color: '#0D0D0D',
          margin: '0 0 12px',
          lineHeight: 0.88,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'block'
        }}>
            PRENDS TON<br />RENDEZ-VOUS<span style={{
            color: '#587373'
          }}>.</span>
          </h2>
          <p className="lbc-dmsans" style={{
          fontSize: 16,
          color: 'rgba(13,13,13,0.45)',
          margin: '12px 0 48px'
        }}>
            Choisis ta prestation, puis ton créneau — Bilal s'occupe du reste.
          </p>

          {confirmed && bookingStep === 4 ? <div style={{
          backgroundColor: 'rgba(88,115,115,0.15)',
          border: '2px solid #587373',
          boxShadow: '4px 4px 0px #587373',
          borderRadius: 8,
          padding: 48,
          textAlign: 'center',
          maxWidth: 520,
          margin: '0 auto'
        }}>
              <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" stroke="#587373" strokeWidth="2.5" />
                  <path d="M13 20.5L17.5 25L27 14" stroke="#587373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="lbc-bebas" style={{
            fontSize: 28,
            color: '#0D0D0D',
            margin: '16px 0 8px',
            letterSpacing: '0.08em'
          }}>C'EST CONFIRMÉ !</h3>
              <p className="lbc-dmsans" style={{
            fontSize: 16,
            color: 'rgba(13,13,13,0.7)',
            margin: '0 0 8px'
          }}>
                Bilal vous attend le <strong>{selectedDate}</strong> à <strong>{selectedSlot}</strong>.
              </p>
              <p className="lbc-dmsans" style={{
            fontSize: 13,
            color: 'rgba(13,13,13,0.45)',
            margin: '0 0 32px'
          }}>
                <span>{selectedService?.name}</span>
                <span> · </span>
                <span>{total ?? selectedService?.price}€</span>
                {isLateSlot(selectedSlot) && <span style={{
              color: '#587373'
            }}> (dont +5€ après 22h)</span>}
              </p>
              <button onClick={handleResetBooking} style={{
            backgroundColor: '#587373',
            color: '#F2F0E9',
            border: '2px solid #0D0D0D',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: '0.1em',
            padding: '14px 32px',
            borderRadius: 4,
            cursor: 'pointer',
            boxShadow: '4px 4px 0px #0D0D0D',
            transition: 'transform 150ms ease, box-shadow 150ms ease'
          }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translate(-2px,-2px)';
            e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D';
          }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'translate(0,0)';
            e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D';
          }}>
                NOUVELLE RÉSERVATION
              </button>
            </div> : <div style={{
          display: 'grid',
          gridTemplateColumns: '62% 38%',
          gap: 40,
          alignItems: 'start'
        }}>
              {/* Left column */}
              <div>
                {renderStepBar()}

                {/* STEP 1 */}
                {bookingStep === 1 && <div>
                    <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20
              }}>
                      <span className="lbc-bebas" style={{
                  backgroundColor: '#0D0D0D',
                  color: '#F2F0E9',
                  fontSize: 14,
                  padding: '4px 10px',
                  borderRadius: 4,
                  letterSpacing: '0.1em',
                  border: '2px solid #0D0D0D',
                  boxShadow: '3px 3px 0px #587373'
                }}>01</span>
                      <span className="lbc-bebas" style={{
                  fontSize: 24,
                  color: '#0D0D0D',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>CHOISIR TA PRESTATION</span>
                    </div>
                    <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14
              }}>
                      {SERVICES.map(svc => renderServiceCardCompact(svc, selectedService?.id === svc.id, () => setSelectedService(svc)))}
                    </div>
                    <div style={{
                marginTop: 16,
                backgroundColor: '#F2F0E9',
                border: '2px solid #587373',
                boxShadow: '3px 3px 0px #587373',
                borderRadius: 6,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8
              }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                  flexShrink: 0
                }}>
                        <circle cx="10" cy="10.5" r="7" stroke="#587373" strokeWidth="1.5" />
                        <path d="M10 7.5V10.5L12 12" stroke="#587373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 3.5H13" stroke="#587373" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span className="lbc-dmsans" style={{
                  fontSize: 12,
                  color: 'rgba(13,13,13,0.6)'
                }}>Toute prestation après 22h = +5€ sur le prix de base.</span>
                    </div>
                    <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 24
              }}>
                      <button disabled={!selectedService} onClick={() => setBookingStep(2)} style={{
                  backgroundColor: selectedService ? '#587373' : 'rgba(13,13,13,0.12)',
                  color: selectedService ? '#F2F0E9' : 'rgba(13,13,13,0.3)',
                  border: selectedService ? '2px solid #0D0D0D' : '2px solid rgba(13,13,13,0.12)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  padding: '14px 40px',
                  borderRadius: 4,
                  cursor: selectedService ? 'pointer' : 'not-allowed',
                  boxShadow: selectedService ? '4px 4px 0px #0D0D0D' : 'none',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  if (selectedService) {
                    e.currentTarget.style.transform = 'translate(-2px,-2px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D';
                  }
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translate(0,0)';
                  e.currentTarget.style.boxShadow = selectedService ? '4px 4px 0px #0D0D0D' : 'none';
                }} onMouseDown={e => {
                  if (selectedService) {
                    e.currentTarget.style.transform = 'translate(2px,2px)';
                    e.currentTarget.style.boxShadow = '2px 2px 0px #0D0D0D';
                  }
                }} onMouseUp={e => {
                  if (selectedService) {
                    e.currentTarget.style.transform = 'translate(-2px,-2px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D';
                  }
                }}>
                        SUIVANT →
                      </button>
                    </div>
                  </div>}

                {/* STEP 2 */}
                {bookingStep === 2 && <div>
                    <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20
              }}>
                      <span className="lbc-bebas" style={{
                  backgroundColor: '#0D0D0D',
                  color: '#F2F0E9',
                  fontSize: 14,
                  padding: '4px 10px',
                  borderRadius: 4,
                  letterSpacing: '0.1em',
                  border: '2px solid #0D0D0D',
                  boxShadow: '3px 3px 0px #587373'
                }}>02</span>
                      <span className="lbc-bebas" style={{
                  fontSize: 24,
                  color: '#0D0D0D',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>DATE &amp; HORAIRE</span>
                    </div>

                    <div style={{
                borderRadius: 8,
                overflow: 'hidden',
                border: '2px solid #0D0D0D',
                boxShadow: '4px 4px 0px #0D0D0D',
                backgroundColor: '#587373',
                marginBottom: 20,
                display: 'inline-flex',
                flexDirection: 'column'
              }}>
                      <div style={{
                  backgroundColor: '#0D0D0D',
                  borderBottom: '2px solid #F2F0E9',
                  padding: '6px 16px'
                }}>
                        <span className="lbc-bebas" style={{
                    fontSize: 13,
                    color: '#F2F0E9',
                    letterSpacing: '0.15em'
                  }}>TON BARBER</span>
                      </div>
                      <div style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                        <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    backgroundColor: 'rgba(242,240,233,0.15)',
                    border: '2px solid rgba(242,240,233,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                          <span className="lbc-bebas" style={{
                      fontSize: 14,
                      color: '#F2F0E9',
                      letterSpacing: '0.05em'
                    }}>DJ</span>
                        </div>
                        <span className="lbc-bebas" style={{
                    fontSize: 26,
                    color: '#F2F0E9',
                    letterSpacing: '0.06em'
                  }}>BILAL</span>
                      </div>
                    </div>

                    {/* Date strip */}
                    <div className="lbc-scrollbar-hide" style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                paddingBottom: 4
              }}>
                      {dates.map((date, idx) => {
                  const isSel = selectedDate === date.label;
                  const isToday = idx === 0;
                  return <button key={`d-${date.dayNum}-${date.monthShort}`} onClick={() => {
                    setSelectedDate(date.label);
                    setSelectedSlot(null);
                  }} style={{
                    flexShrink: 0,
                    width: 72,
                    padding: '14px 0',
                    textAlign: 'center',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: isSel ? '2px solid #587373' : isToday && !isSel ? '2px solid rgba(88,115,115,0.4)' : '2px solid rgba(13,13,13,0.18)',
                    backgroundColor: isSel ? '#587373' : '#F2F0E9',
                    boxShadow: isSel ? '3px 3px 0px #0D0D0D' : '3px 3px 0px rgba(13,13,13,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease'
                  }} onMouseEnter={e => {
                    if (!isSel) {
                      e.currentTarget.style.borderColor = 'rgba(88,115,115,0.5)';
                      e.currentTarget.style.transform = 'translate(-1px,-1px)';
                      e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,13,13,0.15)';
                    }
                  }} onMouseLeave={e => {
                    if (!isSel) {
                      e.currentTarget.style.borderColor = isToday ? 'rgba(88,115,115,0.4)' : 'rgba(13,13,13,0.18)';
                      e.currentTarget.style.transform = 'translate(0,0)';
                      e.currentTarget.style.boxShadow = '3px 3px 0px rgba(13,13,13,0.1)';
                    }
                  }}>
                            <span className="lbc-bebas" style={{
                      fontSize: 12,
                      letterSpacing: '0.1em',
                      color: isSel ? 'rgba(242,240,233,0.75)' : 'rgba(13,13,13,0.4)'
                    }}>{date.dayName}</span>
                            <span className="lbc-bebas" style={{
                      fontSize: 28,
                      color: isSel ? '#F2F0E9' : '#0D0D0D',
                      lineHeight: 1,
                      letterSpacing: '0.02em'
                    }}>{date.dayNum}</span>
                            <span className="lbc-bebas" style={{
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      color: isSel ? 'rgba(242,240,233,0.6)' : 'rgba(13,13,13,0.4)'
                    }}>{date.monthShort.toUpperCase()}</span>
                            {isToday && <div style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: isSel ? 'rgba(242,240,233,0.6)' : '#587373'
                    }} />}
                          </button>;
                })}
                    </div>

                    <p className="lbc-bebas" style={{
                fontSize: 16,
                color: '#0D0D0D',
                margin: '28px 0 14px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>CRÉNEAUX DISPONIBLES</p>
                    <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 10
              }}>
                      {ALL_SLOTS.map(slot => {
                  const unavail = isSlotUnavailable(slot, selectedDate);
                  const isSel = selectedSlot === slot;
                  const isLate = LATE_SLOTS.has(slot);
                  return <button key={slot} disabled={unavail} onClick={() => {
                    if (!unavail) setSelectedSlot(slot);
                  }} style={{
                    padding: '10px 0 8px',
                    borderRadius: 6,
                    textAlign: 'center',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 16,
                    letterSpacing: '0.06em',
                    cursor: unavail ? 'not-allowed' : 'pointer',
                    border: isSel ? '2px solid #587373' : unavail ? '2px solid rgba(13,13,13,0.06)' : '2px solid rgba(13,13,13,0.18)',
                    backgroundColor: isSel ? '#587373' : unavail ? 'rgba(13,13,13,0.02)' : '#F2F0E9',
                    color: isSel ? '#F2F0E9' : unavail ? 'rgba(13,13,13,0.2)' : '#0D0D0D',
                    boxShadow: isSel ? '3px 3px 0px #0D0D0D' : unavail ? 'none' : '2px 2px 0px rgba(13,13,13,0.1)',
                    transition: 'transform 150ms ease, box-shadow 150ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }} onMouseEnter={e => {
                    if (!unavail && !isSel) {
                      e.currentTarget.style.borderColor = 'rgba(88,115,115,0.6)';
                      e.currentTarget.style.transform = 'translate(-1px,-1px)';
                      e.currentTarget.style.boxShadow = '3px 3px 0px rgba(13,13,13,0.15)';
                    }
                  }} onMouseLeave={e => {
                    if (!unavail && !isSel) {
                      e.currentTarget.style.borderColor = 'rgba(13,13,13,0.18)';
                      e.currentTarget.style.transform = 'translate(0,0)';
                      e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,13,13,0.1)';
                    }
                  }}>
                            <span>{slot}</span>
                            {isLate && !unavail && <span style={{
                      fontSize: 9,
                      fontFamily: "'Bebas Neue', sans-serif",
                      letterSpacing: '0.08em',
                      backgroundColor: isSel ? 'rgba(242,240,233,0.15)' : '#0D0D0D',
                      color: isSel ? 'rgba(242,240,233,0.9)' : '#F2F0E9',
                      padding: '1px 5px',
                      borderRadius: 2
                    }}>+5€</span>}
                          </button>;
                })}
                    </div>

                    <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24
              }}>
                      <button onClick={() => setBookingStep(1)} style={{
                  background: 'transparent',
                  border: '2px solid #0D0D0D',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  color: '#0D0D0D',
                  cursor: 'pointer',
                  padding: '12px 28px',
                  borderRadius: 4,
                  boxShadow: '3px 3px 0px rgba(13,13,13,0.15)',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translate(-1px,-1px)';
                  e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,13,13,0.2)';
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translate(0,0)';
                  e.currentTarget.style.boxShadow = '3px 3px 0px rgba(13,13,13,0.15)';
                }}>
                        ← RETOUR
                      </button>
                      <button disabled={!selectedDate || !selectedSlot} onClick={() => setBookingStep(3)} style={{
                  backgroundColor: selectedDate && selectedSlot ? '#587373' : 'rgba(13,13,13,0.12)',
                  color: selectedDate && selectedSlot ? '#F2F0E9' : 'rgba(13,13,13,0.3)',
                  border: selectedDate && selectedSlot ? '2px solid #0D0D0D' : '2px solid rgba(13,13,13,0.12)',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  padding: '14px 40px',
                  borderRadius: 4,
                  cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
                  boxShadow: selectedDate && selectedSlot ? '4px 4px 0px #0D0D0D' : 'none',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  if (selectedDate && selectedSlot) {
                    e.currentTarget.style.transform = 'translate(-2px,-2px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D';
                  }
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translate(0,0)';
                  e.currentTarget.style.boxShadow = selectedDate && selectedSlot ? '4px 4px 0px #0D0D0D' : 'none';
                }} onMouseDown={e => {
                  if (selectedDate && selectedSlot) {
                    e.currentTarget.style.transform = 'translate(2px,2px)';
                    e.currentTarget.style.boxShadow = '2px 2px 0px #0D0D0D';
                  }
                }} onMouseUp={e => {
                  if (selectedDate && selectedSlot) {
                    e.currentTarget.style.transform = 'translate(-2px,-2px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D';
                  }
                }}>
                        SUIVANT →
                      </button>
                    </div>
                  </div>}

                {/* STEP 3 */}
                {bookingStep === 3 && <div>
                    <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24
              }}>
                      <span className="lbc-bebas" style={{
                  backgroundColor: '#0D0D0D',
                  color: '#F2F0E9',
                  fontSize: 14,
                  padding: '4px 10px',
                  borderRadius: 4,
                  letterSpacing: '0.1em',
                  border: '2px solid #0D0D0D',
                  boxShadow: '3px 3px 0px #587373'
                }}>03</span>
                      <span className="lbc-bebas" style={{
                  fontSize: 24,
                  color: '#0D0D0D',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>VOS INFORMATIONS</span>
                    </div>
                    <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}>
                      {[{
                  key: 'clientName',
                  label: 'VOTRE NOM',
                  type: 'text',
                  value: clientName,
                  setter: setClientName,
                  placeholder: 'Ex : Maxime Leroy'
                }, {
                  key: 'clientEmail',
                  label: 'VOTRE EMAIL',
                  type: 'email',
                  value: clientEmail,
                  setter: setClientEmail,
                  placeholder: 'Ex : maxime@email.com'
                }, {
                  key: 'clientPhone',
                  label: 'VOTRE TÉLÉPHONE',
                  type: 'tel',
                  value: clientPhone,
                  setter: setClientPhone,
                  placeholder: 'Ex : 06 12 34 56 78'
                }].map(field => <div key={field.key}>
                          <label className="lbc-bebas" style={{
                    display: 'block',
                    fontSize: 13,
                    color: '#0D0D0D',
                    letterSpacing: '0.12em',
                    marginBottom: 6
                  }}>{field.label}</label>
                          <input type={field.type} value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    backgroundColor: '#F2F0E9',
                    padding: '14px 16px',
                    borderRadius: 6,
                    border: '2px solid #0D0D0D',
                    boxShadow: '3px 3px 0px #587373',
                    outline: 'none',
                    color: '#0D0D0D',
                    transition: 'box-shadow 150ms ease'
                  }} onFocus={e => {
                    e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D';
                  }} onBlur={e => {
                    e.currentTarget.style.boxShadow = '3px 3px 0px #587373';
                  }} />
                          {formErrors[field.key] && <p className="lbc-dmsans" style={{
                    fontSize: 11,
                    color: '#0D0D0D',
                    margin: '4px 0 0',
                    fontWeight: 700
                  }}>{formErrors[field.key]}</p>}
                        </div>)}
                    </div>
                    <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24
              }}>
                      <button onClick={() => setBookingStep(2)} style={{
                  background: 'transparent',
                  border: '2px solid #0D0D0D',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  color: '#0D0D0D',
                  cursor: 'pointer',
                  padding: '12px 28px',
                  borderRadius: 4,
                  boxShadow: '3px 3px 0px rgba(13,13,13,0.15)',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translate(-1px,-1px)';
                  e.currentTarget.style.boxShadow = '4px 4px 0px rgba(13,13,13,0.2)';
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translate(0,0)';
                  e.currentTarget.style.boxShadow = '3px 3px 0px rgba(13,13,13,0.15)';
                }}>
                        ← RETOUR
                      </button>
                      <button onClick={handleConfirmBooking} style={{
                  backgroundColor: '#587373',
                  color: '#F2F0E9',
                  border: '2px solid #0D0D0D',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  padding: '14px 40px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px #0D0D0D',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translate(-2px,-2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D';
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translate(0,0)';
                  e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D';
                }} onMouseDown={e => {
                  e.currentTarget.style.transform = 'translate(2px,2px)';
                  e.currentTarget.style.boxShadow = '2px 2px 0px #0D0D0D';
                }} onMouseUp={e => {
                  e.currentTarget.style.transform = 'translate(-2px,-2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D';
                }}>
                        CONFIRMER MA RÉSERVATION
                      </button>
                    </div>
                  </div>}
              </div>

              {/* ── Right: recap sticky ── */}
              <div style={{
            position: 'sticky',
            top: 80
          }}>
                <div style={{
              borderRadius: 10,
              overflow: 'hidden',
              border: '2px solid #587373',
              boxShadow: '6px 6px 0px #587373',
              backgroundColor: '#0D0D0D'
            }}>
                  <div style={{
                backgroundColor: '#587373',
                borderBottom: '2px solid #F2F0E9',
                padding: '12px 24px'
              }}>
                    <span className="lbc-bebas" style={{
                  fontSize: 14,
                  color: '#F2F0E9',
                  letterSpacing: '0.18em'
                }}>RÉCAPITULATIF</span>
                  </div>
                  <div style={{
                padding: 28
              }}>
                    {[{
                  id: 'rec-prestation',
                  label: 'PRESTATION',
                  value: selectedService?.name ?? '—',
                  empty: !selectedService
                }, {
                  id: 'rec-duree',
                  label: 'DURÉE',
                  value: selectedService?.duration ?? '—',
                  empty: !selectedService
                }, {
                  id: 'rec-barber',
                  label: 'BARBER',
                  value: 'Bilal',
                  empty: false
                }, {
                  id: 'rec-date',
                  label: 'DATE',
                  value: selectedDate ?? '—',
                  empty: !selectedDate
                }, {
                  id: 'rec-heure',
                  label: 'HEURE',
                  value: selectedSlot ?? '—',
                  empty: !selectedSlot
                }].map(row => <div key={row.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 14
                }}>
                        <span className="lbc-bebas" style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: 'rgba(242,240,233,0.45)'
                  }}>{row.label}</span>
                        <span className="lbc-dmsans" style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: row.empty ? 'rgba(242,240,233,0.25)' : '#F2F0E9',
                    textAlign: 'right',
                    maxWidth: 160
                  }}>{row.value}</span>
                      </div>)}

                    {isLateSlot(selectedSlot) && selectedService && <div style={{
                  backgroundColor: 'rgba(88,115,115,0.15)',
                  border: '1.5px solid #587373',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                        <span className="lbc-bebas" style={{
                    fontSize: 11,
                    color: '#587373',
                    letterSpacing: '0.1em'
                  }}>SUPPLÉMENT 22H</span>
                        <span className="lbc-bebas" style={{
                    fontSize: 14,
                    color: '#587373',
                    letterSpacing: '0.06em'
                  }}>+5€</span>
                      </div>}

                    <div style={{
                  height: 2,
                  backgroundColor: 'rgba(242,240,233,0.12)',
                  margin: '8px 0 20px'
                }} />
                    <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 24
                }}>
                      <span className="lbc-bebas" style={{
                    fontSize: 12,
                    letterSpacing: '0.15em',
                    color: 'rgba(242,240,233,0.45)'
                  }}>TOTAL</span>
                      <span className="lbc-bebas" style={{
                    fontSize: 40,
                    color: selectedService ? '#F2F0E9' : 'rgba(242,240,233,0.2)',
                    lineHeight: 1,
                    letterSpacing: '0.04em'
                  }}>
                        {selectedService ? selectedService.id === 's3' ? isLateSlot(selectedSlot) ? '+10€' : '+5€' : total !== null ? `${total}€` : `${selectedService.price}€` : '—'}
                      </span>
                    </div>

                    <button disabled={bookingStep !== 3} onClick={bookingStep === 3 ? handleConfirmBooking : undefined} style={{
                  width: '100%',
                  backgroundColor: '#587373',
                  color: '#F2F0E9',
                  border: '2px solid #F2F0E9',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 20,
                  letterSpacing: '0.12em',
                  padding: 18,
                  borderRadius: 4,
                  cursor: bookingStep === 3 ? 'pointer' : 'default',
                  boxShadow: bookingStep === 3 ? '4px 4px 0px rgba(242,240,233,0.25)' : 'none',
                  opacity: bookingStep === 3 ? 1 : 0.3,
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  if (bookingStep === 3) {
                    e.currentTarget.style.transform = 'translate(-2px,-2px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px rgba(242,240,233,0.3)';
                  }
                }} onMouseLeave={e => {
                  if (bookingStep === 3) {
                    e.currentTarget.style.transform = 'translate(0,0)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.25)';
                  }
                }}>
                      CONFIRMER
                    </button>
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </section>

      {/* ═══ REASSURANCE ══════════════════════════════════════════════════ */}
      <section style={{
      backgroundColor: '#587373',
      padding: '64px 60px',
      borderTop: '3px solid #0D0D0D',
      borderBottom: '3px solid #0D0D0D'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20
      }}>
          {REASSURANCE_DATA.map(item => <div key={item.id} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '28px 32px',
          borderRadius: 8,
          backgroundColor: 'rgba(242,240,233,0.1)',
          border: '2px solid rgba(242,240,233,0.25)',
          boxShadow: '4px 4px 0px rgba(13,13,13,0.25)'
        }}>
              <div style={{
            width: 52,
            height: 52,
            borderRadius: 6,
            backgroundColor: 'rgba(242,240,233,0.1)',
            border: '2px solid rgba(242,240,233,0.3)',
            boxShadow: '2px 2px 0px rgba(13,13,13,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            padding: 8
          }}>
                {item.svg}
              </div>
              <h4 className="lbc-bebas" style={{
            fontSize: 22,
            color: '#F2F0E9',
            margin: '0 0 6px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>{item.title}</h4>
              <p className="lbc-dmsans" style={{
            fontSize: 13,
            color: 'rgba(242,240,233,0.65)',
            margin: 0,
            lineHeight: 1.6
          }}>{item.text}</p>
            </div>)}
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{
      backgroundColor: '#0D0D0D',
      padding: '28px 60px',
      borderTop: '3px solid #587373'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
          <span className="lbc-bebas" style={{
          fontSize: 20,
          letterSpacing: '0.15em',
          color: 'rgba(242,240,233,0.45)',
          textShadow: '2px 2px 0px rgba(88,115,115,0.3)'
        }}>LALBICUT</span>
          <span className="lbc-dmsans" style={{
          fontSize: 11,
          color: 'rgba(242,240,233,0.2)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>© 2025 LALBICUT · BARBER SHOP</span>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0
        }}>
            {FOOTER_LINKS_DATA.map((link, i) => <span key={link.id} style={{
            display: 'flex',
            alignItems: 'center'
          }}>
                {i > 0 && <span style={{
              margin: '0 8px',
              color: 'rgba(242,240,233,0.15)',
              fontSize: 11
            }}>·</span>}
                <a href="#" onClick={e => e.preventDefault()} style={{
              fontSize: 11,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(242,240,233,0.3)',
              textDecoration: 'none',
              transition: 'color 150ms ease'
            }} onMouseEnter={e => {
              e.currentTarget.style.color = 'rgba(242,240,233,0.7)';
            }} onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(242,240,233,0.3)';
            }}>
                  {link.label}
                </a>
              </span>)}
            <span style={{
            margin: '0 12px',
            color: 'rgba(242,240,233,0.08)',
            fontSize: 11
          }}>·</span>
            <button onClick={() => {
            setMode('admin');
          }} style={{
            background: 'none',
            border: 'none',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: 10,
            color: 'rgba(242,240,233,0.12)',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 150ms ease'
          }} onMouseEnter={e => {
            e.currentTarget.style.color = 'rgba(242,240,233,0.35)';
          }} onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(242,240,233,0.12)';
          }}>
              Admin
            </button>
          </div>
        </div>
      </footer>
    </div>;
};