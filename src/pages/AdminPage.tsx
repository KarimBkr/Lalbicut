import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../lib/useIsMobile';
import { useBookingContext } from '../context/BookingContext';
import {
  Booking, LoyaltyConfig, DEFAULT_LOYALTY_CONFIG,
  ALL_SLOTS, LATE_SLOTS,
  ADMIN_TABS, KEYFRAMES,
  getDates, getTodayLong, getInitials, slotToMinutes, getDateOrder,
  WorkingHours, DayKey, DEFAULT_WORKING_HOURS
} from '../data/constants';

import { updateBookingStatus, saveBlockedSlots, subscribeLoyaltyProgram, saveLoyaltyProgram, saveWorkingHours } from '../lib/db';
import { isPassed, bookingSortKey } from '../lib/dates';
import { sendCustomEmail, openWhatsApp } from '../lib/email';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

const DISPLAY_DAYS: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'mon', label: 'LUNDI',    short: 'LUN' },
  { key: 'tue', label: 'MARDI',    short: 'MAR' },
  { key: 'wed', label: 'MERCREDI', short: 'MER' },
  { key: 'thu', label: 'JEUDI',    short: 'JEU' },
  { key: 'fri', label: 'VENDREDI', short: 'VEN' },
  { key: 'sat', label: 'SAMEDI',   short: 'SAM' },
  { key: 'sun', label: 'DIMANCHE', short: 'DIM' },
];

export const AdminPage = () => {
  const { bookings, blockedSlots, workingHours } = useBookingContext();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/connexion');
    }
  }, [loading, isAdmin, navigate]);

  const [adminSelectedDate, setAdminSelectedDate] = useState<string | null>(() => getDates()[0].label);
  const [adminView, setAdminView] = useState<'dashboard' | 'creneaux' | 'reservations' | 'fidelite'>('dashboard');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);
  const [localLoyalty, setLocalLoyalty] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);
  const [loyaltySaved, setLoyaltySaved] = useState(false);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const unsub = subscribeLoyaltyProgram((cfg) => {
      const c = cfg ?? DEFAULT_LOYALTY_CONFIG;
      setLoyaltyConfig(c);
      setLocalLoyalty(c);
    });
    return () => unsub();
  }, []);
  const [sortBy, setSortBy] = useState<'date' | 'prix'>('date');

  // ─── Working hours state ───────────────────────────────────────────────
  const [localHours, setLocalHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const hoursInitRef = useRef(false);
  useEffect(() => {
    if (!hoursInitRef.current) {
      hoursInitRef.current = true;
      setLocalHours(workingHours);
    }
  }, [workingHours]);
  const updateDay = (key: DayKey, field: 'open' | 'start' | 'end', value: boolean | string) => {
    setLocalHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };
  const saveHours = async () => {
    setHoursSaving(true);
    try {
      await saveWorkingHours(localHours);
      setHoursSaved(true);
      setTimeout(() => setHoursSaved(false), 2500);
    } finally {
      setHoursSaving(false);
    }
  };

  // ─── New admin state ───────────────────────────────────────────────────
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [notifMessage, setNotifMessage] = useState<Record<string, string>>({});
  const [notifSent, setNotifSent] = useState<Record<string, boolean>>({});
  const [notifType, setNotifType] = useState<Record<string, 'rappel' | 'confirmation' | 'annulation' | 'custom'>>({});
  const [reminderScheduled, setReminderScheduled] = useState<Record<string, boolean>>({});
  const [smsFeedback, setSmsFeedback] = useState<Record<string, boolean>>({});
  const [emailFeedback, setEmailFeedback] = useState<Record<string, boolean>>({});
  const dates = useMemo(() => getDates(), []);
  const confirmBooking = (id: string) => {
    updateBookingStatus(id, 'confirmed');
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      sendCustomEmail(
        booking,
        `Bonne nouvelle ! Ton rendez-vous du ${booking.date} à ${booking.slot} a été confirmé par Lalbi. On t'attend ! ✂️`
      ).catch(() => {});
    }
  };
  const cancelBooking = (id: string) => {
    updateBookingStatus(id, 'cancelled');
    const booking = bookings.find(b => b.id === id);
    if (booking && !isPassed(booking, now)) {
      sendCustomEmail(
        booking,
        `Ton rendez-vous du ${booking.date} à ${booking.slot} a malheureusement été annulé. Pour reprendre un rendez-vous, c'est sur le site. Désolé pour la gêne !`
      ).catch(() => {});
    }
  };
  const toggleSlot = (slot: string) => {
    saveBlockedSlots(blockedSlots.includes(slot) ? blockedSlots.filter(s => s !== slot) : [...blockedSlots, slot]);
  };

  // ─── Sorted & filtered bookings ───────────────────────────────────────
  const STATUS_RANK: Record<string, number> = { confirmed: 0, pending: 1, cancelled: 2 };
  const sortedBookings = [...bookings].sort((a, b) => {
    if (sortBy === 'prix') return b.price - a.price;
    const keyA = bookingSortKey(a, now);
    const keyB = bookingSortKey(b, now);
    if (keyA !== keyB) return keyA < keyB ? -1 : 1;
    return (STATUS_RANK[a.status] ?? 2) - (STATUS_RANK[b.status] ?? 2);
  });
  const filteredBookings = sortedBookings.filter(b => {
    if (bookingFilter === 'completed') return isPassed(b, now) && b.status !== 'cancelled';
    if (isPassed(b, now)) return false;
    if (bookingFilter === 'cancelled') return b.status === 'cancelled';
    if (bookingFilter === 'all') return b.status !== 'cancelled';
    return b.status === bookingFilter;
  });

  // ─── Booking for slot helper ──────────────────────────────────────────
  const adminSelectedDateIso = adminSelectedDate
    ? dates.find(d => d.label === adminSelectedDate)?.isoDate ?? null
    : null;
  const getBookingForSlot = (slot: string) => bookings.find(b =>
    b.slot === slot &&
    (b.status === 'pending' || b.status === 'confirmed') &&
    (!adminSelectedDate || (adminSelectedDateIso && b.isoDate
      ? b.isoDate === adminSelectedDateIso
      : b.date === adminSelectedDate))
  );

  // ─── Quick stats for reservations header ─────────────────────────────
  const todayIso = now.toISOString().split('T')[0];
  const todayConfirmedRevenue = bookings.filter(b => b.isoDate === todayIso && b.status === 'confirmed').reduce((s, b) => s + b.price, 0);
  const todayBookingsCount = bookings.filter(b =>
    (b.isoDate === todayIso || b.date === "Aujourd'hui") &&
    (b.status === 'pending' || b.status === 'confirmed')
  ).length;
  const nextRdv = [...bookings]
    .filter(b => (b.status === 'pending' || b.status === 'confirmed') && !isPassed(b, now))
    .sort((a, b) => bookingSortKey(a, now) < bookingSortKey(b, now) ? -1 : 1)[0] ?? null;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const totalCount = bookings.length;
  const confirmationRate = totalCount > 0 ? Math.round(confirmedCount / totalCount * 100) : 0;
  // CA uniquement sur les réservations confirmées (revenus réels encaissés ou à encaisser)
  const confirmedRevenue = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.price, 0);

  // ─── Loyalty stats per user ───────────────────────────────────────────
  const userLoyaltyStats = (() => {
    const map: Record<string, { name: string; email: string; count: number }> = {};
    bookings.forEach(b => {
      if (b.status === 'confirmed' && isPassed(b, now)) {
        if (!map[b.clientEmail]) map[b.clientEmail] = { name: b.clientName, email: b.clientEmail, count: 0 };
        map[b.clientEmail].count++;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  })();

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
  const handleSendSms = (bookingId: string) => {
    const msg = notifMessage[bookingId];
    if (!msg) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    openWhatsApp(booking.clientPhone, msg);
    setNotifSent(prev => ({ ...prev, [`${bookingId}_sms`]: true }));
    setSmsFeedback(prev => ({ ...prev, [bookingId]: true }));
    setTimeout(() => setSmsFeedback(prev => ({ ...prev, [bookingId]: false })), 2500);
  };
  const handleSendEmail = async (bookingId: string) => {
    const msg = notifMessage[bookingId];
    if (!msg) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    setEmailFeedback(prev => ({ ...prev, [bookingId]: true }));
    try {
      await sendCustomEmail(booking, msg);
      setNotifSent(prev => ({ ...prev, [`${bookingId}_email`]: true }));
    } catch {
      // Email non configuré ou erreur réseau — feedback reste visible 2s quand même
    }
    setTimeout(() => setEmailFeedback(prev => ({ ...prev, [bookingId]: false })), 2500);
  };
  const handleSaveLoyalty = async () => {
    await saveLoyaltyProgram(localLoyalty);
    setLoyaltyConfig(localLoyalty);
    setLoyaltySaved(true);
    setTimeout(() => setLoyaltySaved(false), 2000);
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

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D' }} />;
  }

  if (isAdmin) {
    const upcomingBookings = bookings
      .filter(b => (b.status === 'pending' || b.status === 'confirmed') && !isPassed(b, now))
      .sort((a, b) => {
        const da = getDateOrder(a.date);
        const db = getDateOrder(b.date);
        if (da !== db) return da - db;
        return slotToMinutes(a.slot) - slotToMinutes(b.slot);
      })
      .slice(0, 5);
    return <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0D',
      fontFamily: "'DM Sans', sans-serif",
      color: '#F2F0E9',
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
        boxShadow: '0 3px 0px rgba(88,115,115,0.3)'
      }}>
          {/* Main bar */}
          <div style={{
          maxWidth: 1200,
          width: '100%',
          margin: '0 auto',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 40px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span className="lbc-bebas" style={{
              fontSize: isMobile ? 22 : 26,
              letterSpacing: '0.15em',
              color: '#F2F0E9',
              textShadow: '2px 2px 0px rgba(88,115,115,0.4)'
            }}>LALBICUT</span>
              <span className="lbc-bebas" style={{
              marginLeft: 10,
              fontSize: 10,
              color: '#F2F0E9',
              letterSpacing: '0.15em',
              backgroundColor: '#587373',
              border: '1.5px solid rgba(242,240,233,0.3)',
              boxShadow: '2px 2px 0px rgba(13,13,13,0.3)',
              borderRadius: 4,
              padding: '3px 8px'
            }}>{isMobile ? 'ADMIN' : 'PANNEAU ADMIN'}</span>
            </div>

            {!isMobile && <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
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
            </div>}

            <button onClick={() => {
            signOut(auth).then(() => {
              navigate('/');
              setAdminView('dashboard');
            });
          }} style={{
            background: 'transparent',
            border: '2px solid rgba(242,240,233,0.2)',
            boxShadow: '2px 2px 0px rgba(88,115,115,0.3)',
            borderRadius: 4,
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 12,
            letterSpacing: '0.1em',
            color: 'rgba(242,240,233,0.6)',
            padding: isMobile ? '7px 12px' : '8px 18px',
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }} onMouseEnter={e => {
            e.currentTarget.style.color = 'rgba(242,240,233,0.9)';
            e.currentTarget.style.borderColor = 'rgba(242,240,233,0.5)';
          }} onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(242,240,233,0.6)';
            e.currentTarget.style.borderColor = 'rgba(242,240,233,0.2)';
          }}>
              {isMobile ? 'QUITTER' : "QUITTER L'ADMIN"}
            </button>
          </div>

          {/* Mobile tabs row */}
          {isMobile && <div className="lbc-scrollbar-hide" style={{
          display: 'flex',
          overflowX: 'auto',
          borderTop: '1px solid rgba(88,115,115,0.25)',
          padding: '0 16px'
        }}>
            {ADMIN_TABS.map(tab => <button key={tab.id} onClick={() => setAdminView(tab.id)} style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            borderBottom: adminView === tab.id ? '3px solid #587373' : '3px solid transparent',
            color: adminView === tab.id ? '#F2F0E9' : 'rgba(242,240,233,0.45)',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: '0.12em',
            padding: '10px 14px 8px',
            cursor: 'pointer',
            transition: 'color 150ms ease',
            whiteSpace: 'nowrap'
          }}>
              {tab.label}
            </button>)}
          </div>}
        </nav>

        {/* Admin Body */}
        <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '28px 16px' : '48px 48px'
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
              fontSize: isMobile ? 52 : 80,
              lineHeight: 0.85,
              color: '#F2F0E9',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: '4px 0 0'
            }}>
                  LALBI<span style={{
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
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 12 : 20,
            marginTop: isMobile ? 28 : 48
          }}>
                {[{
              id: 'st1',
              label: "AUJOURD'HUI",
              value: String(todayBookingsCount),
              sub: 'RDV DU JOUR',
              highlight: todayBookingsCount > 0
            }, {
              id: 'st2',
              label: 'À CONFIRMER',
              value: String(bookings.filter(b => b.status === 'pending' && !isPassed(b, now)).length),
              sub: 'EN ATTENTE DE CONFIRMATION',
              highlight: bookings.filter(b => b.status === 'pending' && !isPassed(b, now)).length > 0
            }, {
              id: 'st3',
              label: 'À VENIR',
              value: String(bookings.filter(b => b.status === 'confirmed' && !isPassed(b, now)).length),
              sub: 'RDV CONFIRMÉS FUTURS',
              highlight: false
            }, {
              id: 'st4',
              label: 'CA CONFIRMÉ',
              value: `${confirmedRevenue} EUR`,
              sub: 'RÉSERVATIONS CONFIRMÉES',
              highlight: false
            }].map(stat => <div key={stat.id} style={{
              borderRadius: 10,
              overflow: 'hidden',
              border: `2px solid ${stat.highlight ? '#F2F0E9' : '#587373'}`,
              boxShadow: `4px 4px 0px ${stat.highlight ? '#F2F0E9' : '#587373'}`,
              backgroundColor: 'rgba(242,240,233,0.04)'
            }}>
                    <div style={{
                backgroundColor: stat.highlight ? 'rgba(242,240,233,0.12)' : '#587373',
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
                padding: '20px 20px 16px'
              }}>
                      <div className="lbc-bebas" style={{
                  fontSize: 56,
                  color: stat.highlight ? '#F2F0E9' : '#F2F0E9',
                  lineHeight: 1,
                  letterSpacing: '0.04em'
                }}>{stat.value}</div>
                      <div className="lbc-bebas" style={{
                  fontSize: 10,
                  color: 'rgba(242,240,233,0.35)',
                  letterSpacing: '0.18em',
                  marginTop: 10
                }}>{stat.sub}</div>
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
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? 10 : 0
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
            fontSize: isMobile ? 52 : 80,
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

              {adminSelectedDate && <p className="lbc-bebas" style={{
            fontSize: 12,
            color: 'rgba(242,240,233,0.35)',
            letterSpacing: '0.14em',
            marginTop: 10,
            marginBottom: 0
          }}>
                  <span style={{ color: slotsReservedCount > 0 ? '#587373' : 'rgba(242,240,233,0.35)' }}>{slotsReservedCount} RÉSERVÉS</span>
                  <span style={{ margin: '0 8px', color: 'rgba(242,240,233,0.1)' }}>·</span>
                  <span>{slotsFreeCount} LIBRES</span>
                  <span style={{ margin: '0 8px', color: 'rgba(242,240,233,0.1)' }}>·</span>
                  <span>{slotsBlockedCount} BLOQUÉS</span>
                </p>}

              {/* ── Horaires de la semaine ── */}
              <div style={{
            marginTop: 32,
            backgroundColor: 'rgba(242,240,233,0.04)',
            border: '2px solid rgba(242,240,233,0.1)',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
                <div style={{
              backgroundColor: 'rgba(88,115,115,0.2)',
              borderBottom: '2px solid rgba(242,240,233,0.1)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
                  <div>
                    <p className="lbc-bebas" style={{ margin: 0, fontSize: 16, color: '#F2F0E9', letterSpacing: '0.15em' }}>HORAIRES DE LA SEMAINE</p>
                    <p className="lbc-dmsans" style={{ margin: 0, fontSize: 11, color: 'rgba(242,240,233,0.4)', marginTop: 2 }}>Ces horaires s'appliquent toutes les semaines.</p>
                  </div>
                </div>

                <div style={{ padding: '4px 0' }}>
                  {DISPLAY_DAYS.map(({ key, label, short }) => {
                const isOpen = localHours[key].open;
                const selectStyle: React.CSSProperties = {
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'rgba(242,240,233,0.08)',
                  color: '#F2F0E9',
                  border: '1.5px solid rgba(242,240,233,0.15)',
                  borderRadius: 4,
                  padding: '6px 8px',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 14,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'auto' as const,
                };
                return (
                  <div key={key} style={{
                borderBottom: '1px solid rgba(242,240,233,0.06)',
                padding: isMobile ? '10px 14px' : '0 16px',
              }}>
                    {/* Ligne 1 : nom + toggle (toujours sur une seule ligne) */}
                    <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: isMobile ? 0 : '10px 0',
                }}>
                      <span className="lbc-bebas" style={{
                    flexShrink: 0,
                    width: isMobile ? 36 : 90,
                    fontSize: isMobile ? 13 : 14,
                    letterSpacing: '0.1em',
                    color: isOpen ? '#F2F0E9' : 'rgba(242,240,233,0.3)'
                  }}>{isMobile ? short : label}</span>

                      <button onClick={() => updateDay(key, 'open', !isOpen)} style={{
                    flexShrink: 0,
                    backgroundColor: isOpen ? '#587373' : 'rgba(242,240,233,0.06)',
                    color: isOpen ? '#F2F0E9' : 'rgba(242,240,233,0.35)',
                    border: isOpen ? '1.5px solid rgba(242,240,233,0.25)' : '1.5px solid rgba(242,240,233,0.1)',
                    borderRadius: 4,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 13,
                    letterSpacing: '0.12em',
                    transition: 'all 150ms ease',
                    boxShadow: isOpen ? '2px 2px 0px rgba(13,13,13,0.25)' : 'none'
                  }}>
                        {isOpen ? '● OUVERT' : '○ FERMÉ'}
                      </button>

                      {/* Desktop : selects inline */}
                      {!isMobile && isOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                          <select value={localHours[key].start} onChange={e => updateDay(key, 'start', e.target.value)} style={selectStyle}>
                            {ALL_SLOTS.map(s => <option key={s} value={s} style={{ backgroundColor: '#1a1a1a' }}>{s}</option>)}
                          </select>
                          <span className="lbc-bebas" style={{ color: 'rgba(242,240,233,0.35)', fontSize: 16, flexShrink: 0 }}>→</span>
                          <select value={localHours[key].end} onChange={e => updateDay(key, 'end', e.target.value)} style={selectStyle}>
                            {ALL_SLOTS.filter(s => s >= localHours[key].start).map(s => <option key={s} value={s} style={{ backgroundColor: '#1a1a1a' }}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {!isOpen && <span className="lbc-dmsans" style={{ fontSize: 12, color: 'rgba(242,240,233,0.2)', fontStyle: 'italic' }}>Aucun créneau</span>}
                    </div>

                    {/* Ligne 2 mobile : selects sur toute la largeur */}
                    {isMobile && isOpen && (
                      <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 8,
                    marginBottom: 4,
                  }}>
                        <select value={localHours[key].start} onChange={e => updateDay(key, 'start', e.target.value)} style={selectStyle}>
                          {ALL_SLOTS.map(s => <option key={s} value={s} style={{ backgroundColor: '#1a1a1a' }}>{s}</option>)}
                        </select>
                        <span className="lbc-bebas" style={{ color: 'rgba(242,240,233,0.35)', fontSize: 16, flexShrink: 0 }}>→</span>
                        <select value={localHours[key].end} onChange={e => updateDay(key, 'end', e.target.value)} style={selectStyle}>
                          {ALL_SLOTS.filter(s => s >= localHours[key].start).map(s => <option key={s} value={s} style={{ backgroundColor: '#1a1a1a' }}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
                </div>

                <div style={{ padding: '12px 16px' }}>
                  <button onClick={saveHours} disabled={hoursSaving} style={{
                width: '100%',
                backgroundColor: hoursSaved ? 'rgba(88,115,115,0.3)' : '#587373',
                color: '#F2F0E9',
                border: '2px solid rgba(242,240,233,0.2)',
                borderRadius: 6,
                padding: '12px 0',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 16,
                letterSpacing: '0.15em',
                cursor: hoursSaving ? 'wait' : 'pointer',
                boxShadow: hoursSaved ? 'none' : '3px 3px 0px rgba(13,13,13,0.3)',
                transition: 'all 150ms ease',
                opacity: hoursSaving ? 0.7 : 1
              }}>
                    {hoursSaved ? '✓ HORAIRES SAUVEGARDÉS' : hoursSaving ? 'SAUVEGARDE...' : 'SAUVEGARDER LES HORAIRES'}
                  </button>
                </div>
              </div>

              {/* Date strip — grid 4-col sur mobile, scroll horizontal desktop */}
              <div className={isMobile ? '' : 'lbc-scrollbar-hide'} style={isMobile ? {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginTop: 32
          } : {
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
                width: isMobile ? '100%' : 72,
                padding: isMobile ? '10px 4px' : '14px 0',
                borderRadius: 6,
                cursor: 'pointer',
                border: isSel ? '2px solid #587373' : isToday && !isSel ? '2px solid rgba(88,115,115,0.4)' : '2px solid rgba(242,240,233,0.1)',
                backgroundColor: isSel ? '#587373' : 'rgba(242,240,233,0.05)',
                boxShadow: isSel ? '3px 3px 0px rgba(13,13,13,0.3)' : '3px 3px 0px rgba(88,115,115,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isMobile ? 2 : 4,
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
                  fontSize: isMobile ? 10 : 11,
                  letterSpacing: '0.08em',
                  color: isSel ? 'rgba(242,240,233,0.75)' : 'rgba(242,240,233,0.4)'
                }}>{date.dayName}</span>
                      <span className="lbc-bebas" style={{
                  fontSize: isMobile ? 22 : 28,
                  letterSpacing: '0.02em',
                  color: isSel ? '#F2F0E9' : 'rgba(242,240,233,0.7)',
                  lineHeight: 1
                }}>{date.dayNum}</span>
                      <span className="lbc-bebas" style={{
                  fontSize: isMobile ? 9 : 11,
                  letterSpacing: '0.06em',
                  color: isSel ? 'rgba(242,240,233,0.6)' : 'rgba(242,240,233,0.35)'
                }}>{date.monthShort.toUpperCase()}</span>
                    </button>;
            })}
              </div>

              {/* Planning list */}
              <div style={{
            marginTop: 24,
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 4 : '4px 8px'
          }}>
                {ALL_SLOTS.map(slot => {
              const booking = getBookingForSlot(slot);
              const isBooked = !!booking;
              const isBlocked = !isBooked && blockedSlots.includes(slot);
              const isLate = LATE_SLOTS.has(slot);
              if (isBooked && booking) {
                // CRÉNEAU RÉSERVÉ
                const initials = getInitials(booking.clientName);
                const slotIsPassed = isPassed(booking, now);
                return <div key={`slot-${slot}`} style={{
                  gridColumn: '1 / -1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: slotIsPassed ? '2px solid rgba(242,240,233,0.18)' : '2px solid #587373',
                  backgroundColor: slotIsPassed ? 'rgba(242,240,233,0.03)' : 'rgba(88,115,115,0.12)',
                  boxShadow: slotIsPassed ? '2px 2px 0px rgba(0,0,0,0.2)' : '3px 3px 0px rgba(88,115,115,0.3)',
                  opacity: slotIsPassed ? 0.75 : 1
                }}>
                      {isMobile ? (
                        /* ── Mobile : 2 lignes ── */
                        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {/* Ligne 1 : heure + nom + prix */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="lbc-bebas" style={{ flexShrink: 0, fontSize: 18, color: '#F2F0E9', letterSpacing: '0.06em', width: 48 }}>{slot}</span>
                            <span className="lbc-bebas" style={{ flex: 1, fontSize: 15, color: '#F2F0E9', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.clientName}</span>
                            <span className="lbc-bebas" style={{ flexShrink: 0, fontSize: 18, color: '#587373' }}>{booking.price}€</span>
                          </div>
                          {/* Ligne 2 : service + status + action */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 58 }}>
                            <span className="lbc-dmsans" style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'rgba(242,240,233,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.service.name}</span>
                            {slotIsPassed ? (
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                {booking.status === 'pending' && <button onClick={() => confirmBooking(booking.id)} style={{ backgroundColor: '#587373', border: '1.5px solid rgba(242,240,233,0.2)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: '#F2F0E9', letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>FAIT</button>}
                                {booking.status === 'confirmed' && <span className="lbc-bebas" style={{ fontSize: 10, color: 'rgba(242,240,233,0.4)', border: '1px solid rgba(242,240,233,0.15)', borderRadius: 3, padding: '4px 8px' }}>TERMINÉ</span>}
                                <button onClick={() => cancelBooking(booking.id)} style={{ backgroundColor: 'transparent', border: '1.5px solid rgba(242,240,233,0.15)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: 'rgba(242,240,233,0.35)', letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>ABSENT</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                <span className="lbc-bebas" style={{ fontSize: 10, letterSpacing: '0.1em', color: booking.status === 'pending' ? '#587373' : 'rgba(242,240,233,0.5)', border: booking.status === 'pending' ? '1px solid #587373' : '1px solid rgba(242,240,233,0.2)', borderRadius: 3, padding: '3px 7px' }}>{booking.status === 'pending' ? 'ATTENTE' : 'CONFIRMÉ'}</span>
                                <button onClick={() => { setAdminView('reservations'); setExpandedBooking(booking.id); }} style={{ backgroundColor: 'rgba(88,115,115,0.2)', border: '1.5px solid rgba(88,115,115,0.5)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: '#587373', letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 3, cursor: 'pointer' }}>DÉTAILS</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* ── Desktop : ligne unique ── */
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: 56 }}>
                          {/* Heure */}
                          <div style={{ width: 90, padding: '0 20px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                            <span className="lbc-bebas" style={{ fontSize: 22, color: '#F2F0E9', letterSpacing: '0.06em' }}>{slot}</span>
                          </div>
                          <div style={{ width: 1, height: '100%', backgroundColor: 'rgba(88,115,115,0.3)', flexShrink: 0 }} />
                          {/* Avatar */}
                          <div style={{ width: 36, height: 36, borderRadius: 4, backgroundColor: 'rgba(88,115,115,0.3)', border: '1.5px solid rgba(88,115,115,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: '0 14px' }}>
                            <span className="lbc-bebas" style={{ fontSize: 14, color: '#F2F0E9', lineHeight: '36px', textAlign: 'center' }}>{initials}</span>
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, padding: '0 4px', overflow: 'hidden' }}>
                            <p className="lbc-bebas" style={{ fontSize: 16, color: '#F2F0E9', letterSpacing: '0.04em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{booking.clientName}</p>
                            <p className="lbc-dmsans" style={{ fontSize: 11, fontWeight: 700, color: 'rgba(242,240,233,0.45)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span>{booking.service.name}</span><span> · </span><span>{booking.clientPhone}</span></p>
                          </div>
                          <div style={{ width: 1, height: '100%', backgroundColor: 'rgba(88,115,115,0.2)', flexShrink: 0 }} />
                          {/* Prix */}
                          <div style={{ padding: '0 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isLate && <span className="lbc-bebas" style={{ fontSize: 10, backgroundColor: 'rgba(88,115,115,0.2)', border: '1px solid rgba(88,115,115,0.4)', color: '#587373', borderRadius: 3, padding: '2px 6px' }}>+5 EUR</span>}
                            <span className="lbc-bebas" style={{ fontSize: 22, color: '#587373' }}>{booking.price}€</span>
                          </div>
                          {/* Actions */}
                          {slotIsPassed ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flexShrink: 0 }}>
                              {booking.status === 'pending' && <button onClick={() => confirmBooking(booking.id)} style={{ backgroundColor: '#587373', border: '1.5px solid rgba(242,240,233,0.2)', boxShadow: '2px 2px 0px rgba(88,115,115,0.3)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: '#F2F0E9', letterSpacing: '0.1em', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', transition: 'all 150ms ease' }}>EFFECTUÉE</button>}
                              {booking.status === 'confirmed' && <span className="lbc-bebas" style={{ backgroundColor: 'rgba(242,240,233,0.06)', border: '1.5px solid rgba(242,240,233,0.2)', color: 'rgba(242,240,233,0.4)', fontSize: 11, letterSpacing: '0.1em', borderRadius: 4, padding: '6px 12px' }}>TERMINÉ</span>}
                              <button onClick={() => cancelBooking(booking.id)} style={{ backgroundColor: 'transparent', border: '1.5px solid rgba(242,240,233,0.15)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: 'rgba(242,240,233,0.35)', letterSpacing: '0.1em', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', transition: 'all 150ms ease', marginRight: 16 }} onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.7)'; e.currentTarget.style.borderColor = 'rgba(242,240,233,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.35)'; e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)'; }}>ABSENT</button>
                            </div>
                          ) : (
                            <>
                              <div style={{ padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                {booking.status === 'pending' ? <span className="lbc-bebas" style={{ backgroundColor: 'rgba(88,115,115,0.2)', border: '1.5px solid #587373', color: '#587373', fontSize: 11, letterSpacing: '0.1em', borderRadius: 4, padding: '4px 10px' }}>EN ATTENTE</span> : <span className="lbc-bebas" style={{ backgroundColor: 'rgba(242,240,233,0.08)', border: '1.5px solid rgba(242,240,233,0.25)', color: 'rgba(242,240,233,0.55)', fontSize: 11, letterSpacing: '0.1em', borderRadius: 4, padding: '4px 10px' }}>CONFIRMÉ</span>}
                              </div>
                              <button onClick={() => { setAdminView('reservations'); setExpandedBooking(booking.id); }} style={{ backgroundColor: 'rgba(88,115,115,0.2)', border: '1.5px solid rgba(88,115,115,0.5)', boxShadow: '2px 2px 0px rgba(88,115,115,0.2)', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: '#587373', letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 4, marginRight: 16, cursor: 'pointer', flexShrink: 0, transition: 'all 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(88,115,115,0.35)'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(88,115,115,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(88,115,115,0.2)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(88,115,115,0.2)'; }}>DÉTAILS</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>;
              }
              if (isBlocked) {
                // CRÉNEAU BLOQUÉ
                return <div key={`slot-${slot}`} style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 6,
                  border: '1.5px solid rgba(242,240,233,0.07)',
                  backgroundColor: 'rgba(13,13,13,0.25)',
                  height: 44,
                  opacity: 0.65
                }}>
                      <div style={{ width: 80, padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <span className="lbc-bebas" style={{ fontSize: 18, color: 'rgba(242,240,233,0.25)', letterSpacing: '0.06em' }}>{slot}</span>
                      </div>
                      <div style={{ width: 1, height: '60%', backgroundColor: 'rgba(242,240,233,0.05)', flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                          <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="rgba(242,240,233,0.18)" strokeWidth="1.3" />
                          <path d="M4 6V4.5a3 3 0 016 0V6" stroke="rgba(242,240,233,0.18)" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <span className="lbc-bebas" style={{ fontSize: 10, color: 'rgba(242,240,233,0.18)', letterSpacing: '0.18em' }}>BLOQUÉ</span>
                      </div>
                      <button onClick={() => toggleSlot(slot)} style={{
                    background: 'transparent', border: '1.5px solid rgba(242,240,233,0.1)',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 10,
                    color: 'rgba(242,240,233,0.22)', letterSpacing: '0.1em',
                    padding: '5px 12px', borderRadius: 4, marginRight: 12, cursor: 'pointer', flexShrink: 0, transition: 'all 150ms ease'
                  }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.3)'; e.currentTarget.style.color = 'rgba(242,240,233,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.1)'; e.currentTarget.style.color = 'rgba(242,240,233,0.22)'; }}>
                        DÉBLOQUER
                      </button>
                    </div>;
              }

              // CRÉNEAU LIBRE
              return <div key={`slot-${slot}`} style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 6,
                border: '1.5px solid rgba(242,240,233,0.08)',
                backgroundColor: 'rgba(242,240,233,0.02)',
                height: 40,
                transition: 'all 150ms ease'
              }} onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(88,115,115,0.25)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(88,115,115,0.04)';
              }} onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(242,240,233,0.08)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(242,240,233,0.02)';
              }}>
                    <div style={{ width: 80, padding: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="lbc-bebas" style={{ fontSize: 17, color: 'rgba(242,240,233,0.5)', letterSpacing: '0.06em' }}>{slot}</span>
                      {isLate && <span className="lbc-bebas" style={{
                    fontSize: 9, backgroundColor: 'rgba(88,115,115,0.18)', border: '1px solid rgba(88,115,115,0.35)',
                    color: '#587373', borderRadius: 3, padding: '1px 5px'
                  }}>+5</span>}
                    </div>
                    <div style={{ flex: 1 }} />
                    <button onClick={e => { e.stopPropagation(); toggleSlot(slot); }} style={{
                  background: 'transparent', border: '1.5px solid rgba(242,240,233,0.08)',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 10,
                  color: 'rgba(242,240,233,0.22)', letterSpacing: '0.1em',
                  padding: '4px 12px', borderRadius: 4, marginRight: 12, cursor: 'pointer', flexShrink: 0, transition: 'all 150ms ease'
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.28)'; e.currentTarget.style.color = 'rgba(242,240,233,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.08)'; e.currentTarget.style.color = 'rgba(242,240,233,0.22)'; }}>
                      BLOQUER
                    </button>
                  </div>;
            })}
              </div>

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
            fontSize: isMobile ? 44 : 72,
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
                  {([
                    ['all', `TOUS (${bookings.filter(b => b.status !== 'cancelled' && !isPassed(b, now)).length})`],
                    ['pending', `EN ATTENTE (${bookings.filter(b => b.status === 'pending' && !isPassed(b, now)).length})`],
                    ['confirmed', `CONFIRMÉS (${bookings.filter(b => b.status === 'confirmed' && !isPassed(b, now)).length})`],
                    ['completed', `TERMINÉS (${bookings.filter(b => isPassed(b, now) && b.status !== 'cancelled').length})`],
                    ['cancelled', `ANNULÉS (${bookings.filter(b => b.status === 'cancelled').length})`]
                  ] as [typeof bookingFilter, string][]).map(([filter, label]) => <button key={filter} onClick={() => setBookingFilter(filter)} style={{
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
                                {booking.status !== 'cancelled' && <div style={{ marginTop: 20, display: 'flex', flexDirection: 'row', gap: 8 }}>
                                    {isPassed(booking, now) ? <>
                                        {/* RDV passé — confirmer que la coupe a eu lieu ou marquer absent */}
                                        {booking.status === 'pending' && <button onClick={() => confirmBooking(booking.id)} style={{
                              backgroundColor: '#587373', border: '2px solid rgba(242,240,233,0.2)',
                              boxShadow: '3px 3px 0px rgba(242,240,233,0.15)',
                              fontFamily: "'Bebas Neue', sans-serif", fontSize: 14,
                              color: '#F2F0E9', letterSpacing: '0.1em', padding: '10px 20px',
                              borderRadius: 4, cursor: 'pointer', transition: 'transform 150ms ease, box-shadow 150ms ease'
                            }} onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(242,240,233,0.15)'; }}>
                                            COUPE EFFECTUÉE
                                          </button>}
                                        <button onClick={() => cancelBooking(booking.id)} style={{
                              backgroundColor: 'transparent', border: '2px solid rgba(242,240,233,0.15)',
                              boxShadow: '2px 2px 0px rgba(88,115,115,0.1)',
                              fontFamily: "'Bebas Neue', sans-serif", fontSize: 14,
                              color: 'rgba(242,240,233,0.4)', letterSpacing: '0.1em', padding: '10px 20px',
                              borderRadius: 4, cursor: 'pointer', transition: 'all 150ms ease'
                            }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.4)'; e.currentTarget.style.color = 'rgba(242,240,233,0.7)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)'; e.currentTarget.style.color = 'rgba(242,240,233,0.4)'; }}>
                                          CLIENT ABSENT
                                        </button>
                                      </> : <>
                                        {/* RDV futur — confirmer ou annuler */}
                                        {booking.status === 'pending' && <button onClick={() => confirmBooking(booking.id)} style={{
                              backgroundColor: '#587373', border: '2px solid rgba(242,240,233,0.2)',
                              boxShadow: '3px 3px 0px rgba(242,240,233,0.15)',
                              fontFamily: "'Bebas Neue', sans-serif", fontSize: 14,
                              color: '#F2F0E9', letterSpacing: '0.1em', padding: '10px 20px',
                              borderRadius: 4, cursor: 'pointer', transition: 'transform 150ms ease, box-shadow 150ms ease'
                            }} onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px rgba(242,240,233,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(242,240,233,0.15)'; }}>
                                            CONFIRMER
                                          </button>}
                                        <button onClick={() => cancelBooking(booking.id)} style={{
                              backgroundColor: 'transparent', border: '2px solid rgba(242,240,233,0.15)',
                              boxShadow: '2px 2px 0px rgba(88,115,115,0.1)',
                              fontFamily: "'Bebas Neue', sans-serif", fontSize: 14,
                              color: 'rgba(242,240,233,0.4)', letterSpacing: '0.1em', padding: '10px 20px',
                              borderRadius: 4, cursor: 'pointer', transition: 'all 150ms ease'
                            }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.4)'; e.currentTarget.style.color = 'rgba(242,240,233,0.7)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)'; e.currentTarget.style.color = 'rgba(242,240,233,0.4)'; }}>
                                          ANNULER RDV
                                        </button>
                                      </>}
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
                                  {([['CONFIRMATION', 'confirmation', `Bonjour ${booking.clientName.split(' ')[0]}, votre RDV chez LALBICUT est confirmé ! Lalbi vous attend le ${booking.date} à ${booking.slot}. À bientôt !`], ['RAPPEL RDV', 'rappel', `Bonjour ${booking.clientName.split(' ')[0]} ! Rappel : vous avez un RDV chez LALBICUT demain à ${booking.slot}. En cas d'annulation merci de nous prévenir. À bientôt !`], ['ANNULATION', 'annulation', `Bonjour ${booking.clientName.split(' ')[0]}, nous sommes désolés mais votre RDV du ${booking.date} à ${booking.slot} doit être annulé. Contactez-nous pour reporter. LALBICUT`], ['PERSONNALISÉ', 'custom', '']] as [string, 'confirmation' | 'rappel' | 'annulation' | 'custom', string][]).map(([label, type, msg]) => <button key={`tpl-${booking.id}-${type}`} onClick={() => {
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
                          }}>WHATSAPP OUVERT !</span> : <button onClick={() => handleSendSms(booking.id)} style={{
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
                                      WHATSAPP
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

            {/* ── FIDELITE ── */}
            {adminView === 'fidelite' && <div style={{ animation: 'lbc-fadein 180ms ease' }}>
              <div style={{ marginBottom: 32 }}>
                <p className="lbc-bebas" style={{ fontSize: 18, color: '#587373', letterSpacing: '0.2em', margin: '0 0 4px 0' }}>PROGRAMME FIDELITE</p>
                <p className="lbc-bebas" style={{ fontSize: 40, color: '#F2F0E9', letterSpacing: '0.05em', margin: '0 0 0 0' }}>CONFIGUREZ LES RECOMPENSES.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                {/* Config form */}
                <div style={{ backgroundColor: '#0D0D0D', border: '2px solid rgba(242,240,233,0.12)', borderRadius: 8, padding: 28, boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}>
                  <p className="lbc-bebas" style={{ fontSize: 14, color: '#587373', letterSpacing: '0.2em', margin: '0 0 20px 0' }}>PARAMETRES</p>

                  {/* Toggle actif */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '12px 16px', backgroundColor: 'rgba(242,240,233,0.04)', borderRadius: 6, border: '1.5px solid rgba(242,240,233,0.08)' }}>
                    <span className="lbc-dmsans" style={{ fontSize: 14, fontWeight: 700, color: '#F2F0E9' }}>Programme actif</span>
                    <button onClick={() => setLocalLoyalty(p => ({ ...p, enabled: !p.enabled }))} style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 0, position: 'relative', flexShrink: 0,
                      backgroundColor: localLoyalty.enabled ? '#587373' : 'rgba(242,240,233,0.15)', transition: 'background 200ms ease'
                    }}>
                      <span style={{ position: 'absolute', top: 2, left: localLoyalty.enabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#F2F0E9', transition: 'left 200ms ease', display: 'block' }} />
                    </button>
                  </div>

                  {/* Seuil */}
                  <div style={{ marginBottom: 20 }}>
                    <p className="lbc-bebas" style={{ fontSize: 12, color: 'rgba(242,240,233,0.4)', letterSpacing: '0.15em', margin: '0 0 10px 0' }}>NOMBRE DE COUPES REQUIS</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[5, 8, 10, 12, 15, 20].map(n => (
                        <button key={n} onClick={() => setLocalLoyalty(p => ({ ...p, threshold: n }))} style={{
                          padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: '0.1em',
                          backgroundColor: localLoyalty.threshold === n ? '#587373' : 'transparent',
                          color: localLoyalty.threshold === n ? '#F2F0E9' : 'rgba(242,240,233,0.4)',
                          border: `2px solid ${localLoyalty.threshold === n ? '#587373' : 'rgba(242,240,233,0.15)'}`,
                          boxShadow: localLoyalty.threshold === n ? '3px 3px 0px rgba(88,115,115,0.4)' : 'none', transition: 'all 120ms ease'
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  {/* Type récompense */}
                  <div style={{ marginBottom: 20 }}>
                    <p className="lbc-bebas" style={{ fontSize: 12, color: 'rgba(242,240,233,0.4)', letterSpacing: '0.15em', margin: '0 0 10px 0' }}>TYPE DE RECOMPENSE</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['discount', 'service'] as const).map(t => (
                        <button key={t} onClick={() => setLocalLoyalty(p => ({ ...p, rewardType: t }))} style={{
                          flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.1em',
                          backgroundColor: localLoyalty.rewardType === t ? '#587373' : 'transparent',
                          color: localLoyalty.rewardType === t ? '#F2F0E9' : 'rgba(242,240,233,0.4)',
                          border: `2px solid ${localLoyalty.rewardType === t ? '#587373' : 'rgba(242,240,233,0.15)'}`,
                          boxShadow: localLoyalty.rewardType === t ? '3px 3px 0px rgba(88,115,115,0.4)' : 'none', transition: 'all 120ms ease'
                        }}>{t === 'discount' ? 'REDUCTION' : 'SERVICE OFFERT'}</button>
                      ))}
                    </div>
                  </div>

                  {/* Montant réduction */}
                  {localLoyalty.rewardType === 'discount' && (
                    <div style={{ marginBottom: 20 }}>
                      <p className="lbc-bebas" style={{ fontSize: 12, color: 'rgba(242,240,233,0.4)', letterSpacing: '0.15em', margin: '0 0 10px 0' }}>MONTANT DE LA REDUCTION (€)</p>
                      <input type="number" min={1} max={50} value={localLoyalty.discountAmount}
                        onChange={e => setLocalLoyalty(p => ({ ...p, discountAmount: Number(e.target.value) }))}
                        style={{
                          width: 80, padding: '10px 14px', borderRadius: 4, boxSizing: 'border-box',
                          backgroundColor: 'rgba(242,240,233,0.06)', border: '2px solid rgba(242,240,233,0.15)',
                          color: '#F2F0E9', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: '0.1em', outline: 'none'
                        }} />
                    </div>
                  )}

                  {/* Libellé */}
                  <div style={{ marginBottom: 28 }}>
                    <p className="lbc-bebas" style={{ fontSize: 12, color: 'rgba(242,240,233,0.4)', letterSpacing: '0.15em', margin: '0 0 10px 0' }}>LIBELLE DE LA RECOMPENSE</p>
                    <input type="text" value={localLoyalty.rewardLabel} placeholder="Ex : Barbe offerte"
                      onChange={e => setLocalLoyalty(p => ({ ...p, rewardLabel: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 4, boxSizing: 'border-box',
                        backgroundColor: 'rgba(242,240,233,0.06)', border: '2px solid rgba(242,240,233,0.15)',
                        color: '#F2F0E9', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, outline: 'none'
                      }} />
                  </div>

                  <button onClick={handleSaveLoyalty} style={{
                    width: '100%', padding: '14px 0', borderRadius: 4, cursor: 'pointer',
                    backgroundColor: loyaltySaved ? 'rgba(88,115,115,0.5)' : '#587373',
                    color: '#F2F0E9', border: '2px solid rgba(242,240,233,0.15)',
                    boxShadow: loyaltySaved ? 'none' : '4px 4px 0px rgba(242,240,233,0.15)',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.12em', transition: 'all 150ms ease'
                  }}>{loyaltySaved ? 'ENREGISTRE !' : 'ENREGISTRER'}</button>
                </div>

                {/* Aperçu client */}
                <div style={{ backgroundColor: '#587373', border: '2px solid #0D0D0D', borderRadius: 8, boxShadow: '6px 6px 0px #0D0D0D', padding: 28 }}>
                  <p className="lbc-bebas" style={{ fontSize: 14, color: 'rgba(242,240,233,0.6)', letterSpacing: '0.2em', margin: '0 0 20px 0' }}>APERCU CLIENT</p>
                  {localLoyalty.enabled ? (
                    <>
                      <p className="lbc-bebas" style={{ fontSize: 11, color: 'rgba(242,240,233,0.6)', letterSpacing: '0.15em', margin: '0 0 8px 0' }}>VOTRE FIDELITE</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {Array.from({ length: localLoyalty.threshold }, (_, i) => (
                          <div key={i} style={{ width: 20, height: 10, borderRadius: 2, backgroundColor: i < 3 ? '#F2F0E9' : 'rgba(242,240,233,0.25)', border: '1px solid rgba(242,240,233,0.3)' }} />
                        ))}
                      </div>
                      <p className="lbc-dmsans" style={{ fontSize: 12, color: 'rgba(242,240,233,0.7)', margin: '0 0 12px 0', fontWeight: 600 }}>3 / {localLoyalty.threshold} coupes</p>
                      <div style={{ padding: '10px 14px', backgroundColor: 'rgba(242,240,233,0.12)', borderRadius: 4, border: '1px solid rgba(242,240,233,0.2)' }}>
                        <p className="lbc-bebas" style={{ fontSize: 13, color: '#F2F0E9', letterSpacing: '0.1em', margin: 0 }}>
                          {localLoyalty.threshold - 3} COUPE{localLoyalty.threshold - 3 > 1 ? 'S' : ''} AVANT :{' '}
                          {localLoyalty.rewardType === 'discount' ? `-${localLoyalty.discountAmount}€` : localLoyalty.rewardLabel.toUpperCase()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="lbc-dmsans" style={{ fontSize: 13, color: 'rgba(242,240,233,0.55)', margin: 0 }}>Programme désactivé — activez-le pour que vos clients voient leur progression.</p>
                  )}
                </div>
              </div>

              {/* Progression clients */}
              <div>
                <p className="lbc-bebas" style={{ fontSize: 14, color: '#587373', letterSpacing: '0.2em', margin: '0 0 16px 0' }}>PROGRESSION CLIENTS</p>
                {userLoyaltyStats.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', backgroundColor: '#0D0D0D', border: '2px solid rgba(242,240,233,0.08)', borderRadius: 8 }}>
                    <p className="lbc-dmsans" style={{ color: 'rgba(242,240,233,0.3)', margin: 0, fontSize: 14 }}>Aucun client avec des coupes terminées pour l'instant.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {userLoyaltyStats.map(u => {
                      const mod = u.count % loyaltyConfig.threshold;
                      const progress = mod === 0 && u.count > 0 ? loyaltyConfig.threshold : mod;
                      const earned = Math.floor(u.count / loyaltyConfig.threshold);
                      const remaining = loyaltyConfig.threshold - progress;
                      return (
                        <div key={u.email} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 16, alignItems: 'center', padding: '14px 20px', backgroundColor: '#0D0D0D', border: '2px solid rgba(242,240,233,0.1)', borderRadius: 8, boxShadow: '3px 3px 0px rgba(0,0,0,0.3)' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#587373', border: '2px solid #F2F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="lbc-bebas" style={{ fontSize: 14, color: '#F2F0E9', letterSpacing: '0.05em' }}>{getInitials(u.name)}</span>
                          </div>
                          <div>
                            <p className="lbc-dmsans" style={{ margin: '0 0 2px 0', fontSize: 13, fontWeight: 700, color: '#F2F0E9' }}>{u.name}</p>
                            <p className="lbc-dmsans" style={{ margin: '0 0 8px 0', fontSize: 11, color: 'rgba(242,240,233,0.3)' }}>{u.email}</p>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              {Array.from({ length: loyaltyConfig.threshold }, (_, i) => (
                                <div key={i} style={{ width: 16, height: 8, borderRadius: 2, backgroundColor: i < progress ? '#587373' : 'rgba(242,240,233,0.12)', border: '1px solid rgba(242,240,233,0.15)' }} />
                              ))}
                            </div>
                            <p className="lbc-dmsans" style={{ margin: '4px 0 0 0', fontSize: 11, color: 'rgba(242,240,233,0.4)' }}>
                              {progress} / {loyaltyConfig.threshold} coupes
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {earned > 0 ? (
                              <div style={{ backgroundColor: 'rgba(88,115,115,0.2)', border: '1.5px solid #587373', borderRadius: 4, padding: '4px 12px' }}>
                                <p className="lbc-bebas" style={{ fontSize: 11, color: '#587373', letterSpacing: '0.1em', margin: 0 }}>×{earned} RECOMPENSE{earned > 1 ? 'S' : ''}</p>
                              </div>
                            ) : (
                              <p className="lbc-dmsans" style={{ fontSize: 11, color: 'rgba(242,240,233,0.2)', margin: 0 }}>{remaining} restant{remaining > 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>}

        </div>
      </div>;
  }

};
