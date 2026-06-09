import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../lib/useIsMobile';
import { ServiceCardCompact } from '../components/shared/ServiceCardCompact';
import { ClientServices } from '../components/client/ClientServices';
import { ClientBarber } from '../components/client/ClientBarber';
import { ClientGallery } from '../components/client/ClientGallery';
import { useBookingContext } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { saveBooking } from '../lib/db';
import { sendConfirmationEmail, sendAdminNotification } from '../lib/email';
import {
  Service, Booking,
  SERVICES, ALL_SLOTS, LATE_SLOTS,
  REASSURANCE_DATA, FOOTER_LINKS_DATA, STEP_LABELS,
  KEYFRAMES, LATE_SURCHARGE,
  getDates, slotToMinutes
} from '../data/constants';

export const ClientPage = () => {
  const { bookings, blockedSlots } = useBookingContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState(user?.displayName || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [confirmed, setConfirmed] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (user) {
      if (!clientName) setClientName(user.displayName || '');
      if (!clientEmail) setClientEmail(user.email || '');
    }
  }, [user]);
  useEffect(() => {
    if (location.state?.scrollTo === 'reservation') {
      const t = setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      return () => clearTimeout(t);
    }
  }, []);
  const servicesRef = useRef<HTMLElement>(null);
  const barberRef = useRef<HTMLElement>(null);
  const bookingRef = useRef<HTMLElement>(null);
  const gallerieRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
      if (window.scrollY > 64) setMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);
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
  const dates = useMemo(() => getDates(), []);
  const selectedDateIso = selectedDate ? dates.find(d => d.label === selectedDate)?.isoDate ?? null : null;
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  const isLateSlot = (slot: string | null): boolean => slot !== null && LATE_SLOTS.has(slot);
  const availableSlots = selectedService?.onlyLate ? ALL_SLOTS.filter(slot => LATE_SLOTS.has(slot)) : ALL_SLOTS;
  const getTotal = (): number | null => {
    if (!selectedService) return null;
    const basePrice = selectedService.price;
    if (selectedService.lateSurchargeExempt) return basePrice;
    return basePrice + (isLateSlot(selectedSlot) ? LATE_SURCHARGE : 0);
  };
  const handleConfirmBooking = async () => {
    if (isSubmitting) return;
    const errors: Record<string, string> = {};
    if (!clientName.trim()) errors.clientName = 'Votre nom est requis.';
    if (!clientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) errors.clientEmail = 'Email invalide.';
    if (!clientPhone.trim()) errors.clientPhone = 'Votre téléphone est requis.';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setIsSubmitting(true);
    try {
      const total = getTotal() ?? selectedService!.price;
      const selectedDateObj = dates.find(d => d.label === selectedDate);
      const newBooking: Booking = {
        id: `b${Date.now()}`,
        clientName: clientName.trim().slice(0, 80),
        clientEmail: clientEmail.trim().slice(0, 254),
        clientPhone: clientPhone.trim().slice(0, 20),
        service: selectedService!,
        date: selectedDate!,
        isoDate: selectedDateObj?.isoDate,
        slot: selectedSlot!,
        price: total,
        status: 'pending',
        ...(user?.uid ? { userId: user.uid } : {})
      };
      await saveBooking(newBooking);
      sendConfirmationEmail(newBooking).catch(() => {});
      sendAdminNotification(newBooking).catch(() => {});
      setConfirmed(true);
      setBookingStep(4);
    } catch (err) {
      console.error('[handleConfirmBooking] saveBooking failed:', err);
      setFormErrors({ submit: 'Une erreur est survenue. Vérifie ta connexion et réessaie.' });
      setIsSubmitting(false);
    }
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
    setIsSubmitting(false);
    scrollTo(bookingRef);
  };
  const isSlotUnavailable = (slot: string, dateLabel: string | null): boolean => {
    if (blockedSlots.includes(slot)) return true;
    if (!dateLabel) return false;
    // Bloquer les créneaux passés pour aujourd'hui
    if (selectedDateIso === dates[0].isoDate) {
      const n = new Date();
      if (slotToMinutes(slot) <= n.getHours() * 60 + n.getMinutes()) return true;
    }
    return bookings.some(b =>
      b.slot === slot &&
      (b.status === 'pending' || b.status === 'confirmed') &&
      (selectedDateIso && b.isoDate ? b.isoDate === selectedDateIso : b.date === dateLabel)
    );
  };


  const total = getTotal();

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
              {!isMobile && <span className="lbc-bebas" style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: isActive ? '#0D0D0D' : isPast ? 'rgba(13,13,13,0.5)' : 'rgba(13,13,13,0.3)',
            marginTop: 6,
            whiteSpace: 'nowrap',
            fontWeight: 400
          }}>
                {label}
              </span>}
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
      transition: 'box-shadow 200ms ease'
    }}>
        <div style={{
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 60px'
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

          {isMobile ? (
            <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5
          }}>
              <span style={{ display: 'block', width: 22, height: 2, backgroundColor: '#0D0D0D' }} />
              <span style={{ display: 'block', width: 22, height: 2, backgroundColor: '#0D0D0D' }} />
              <span style={{ display: 'block', width: 22, height: 2, backgroundColor: '#0D0D0D' }} />
            </button>
          ) : <>
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
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(13,13,13,0.1)' }} />
            
            <button onClick={() => navigate(user ? '/profil' : '/connexion')} style={{
              background: '#0D0D0D',
              border: 'none',
              color: '#F2F0E9',
              padding: '6px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '2px 2px 0px #587373'
            }}>
              {user ? 'Mon Profil' : 'Se Connecter'}
            </button>
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
          </>}
        </div>

        {isMobile && menuOpen && <div style={{
        backgroundColor: '#F2F0E9',
        borderTop: '2px solid rgba(13,13,13,0.1)',
        padding: '8px 0 16px'
      }}>
          {([{
          id: 'nl1', label: 'Prestations', sectionId: 'prestations', ref: servicesRef
        }, {
          id: 'nl2', label: 'Le Barber', sectionId: 'barber', ref: barberRef
        }, {
          id: 'nl3', label: 'Réalisations', sectionId: 'realisations', ref: gallerieRef
        }, {
          id: 'nl4', label: 'Réserver', sectionId: 'reservation', ref: bookingRef
        }] as { id: string; label: string; sectionId: string; ref: React.RefObject<HTMLElement | null> }[]).map(link => <button key={link.id} onClick={() => { scrollTo(link.ref); setMenuOpen(false); }} style={{
          display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
          borderLeft: activeSection === link.sectionId ? '3px solid #587373' : '3px solid transparent',
          padding: '13px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 800,
          fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: activeSection === link.sectionId ? '#0D0D0D' : 'rgba(13,13,13,0.55)', cursor: 'pointer'
        }}>{link.label}</button>)}
          <div style={{ height: 1, backgroundColor: 'rgba(13,13,13,0.08)', margin: '8px 20px' }} />
          <div style={{ display: 'flex', gap: 10, padding: '4px 20px 0' }}>
            <button onClick={() => { navigate(user ? '/profil' : '/connexion'); setMenuOpen(false); }} style={{
            flex: 1, background: '#0D0D0D', border: 'none', color: '#F2F0E9',
            padding: '11px 0', borderRadius: '4px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 12,
            letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '2px 2px 0px #587373'
          }}>{user ? 'Mon Profil' : 'Se Connecter'}</button>
            <button onClick={() => { scrollTo(bookingRef); setMenuOpen(false); }} style={{
            flex: 1, backgroundColor: '#587373', color: '#F2F0E9',
            border: '2px solid #0D0D0D', fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 16, letterSpacing: '0.1em', padding: '11px 0',
            borderRadius: 4, cursor: 'pointer', boxShadow: '3px 3px 0px #0D0D0D'
          }}>RÉSERVER</button>
          </div>
        </div>}
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
          <source src="/Coiffure Lalbi/hero.mp4" type="video/mp4" />
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
        padding: isMobile ? '0 24px' : '0 60px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
          <div style={{
          maxWidth: 580,
          flex: '0 0 auto',
          width: isMobile ? '100%' : 'auto'
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
            fontSize: isMobile ? 62 : 96,
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
              Lalbi t'accueille dans son shop pour une expérience barber premium — coupes nettes, barbe impeccable, ambiance authentique.
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
          display: isMobile ? 'none' : 'flex',
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
                overflow: 'hidden'
              }}>
                  <img src="/Coiffure Lalbi/photo-bilal.jpeg" alt="Lalbi" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }} />
                </div>
                <p className="lbc-bebas" style={{
                fontSize: 20,
                color: '#F2F0E9',
                margin: '12px 0 0',
                letterSpacing: '0.08em'
              }}>LALBI</p>
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

<ClientServices servicesRef={servicesRef} selectedService={selectedService} setSelectedService={setSelectedService} setSelectedSlot={setSelectedSlot} scrollTo={scrollTo} bookingRef={bookingRef} />
      <ClientBarber barberRef={barberRef} scrollTo={scrollTo} bookingRef={bookingRef} />
      <ClientGallery gallerieRef={gallerieRef} scrollTo={scrollTo} bookingRef={bookingRef} />
            {/* ═══ BOOKING MODULE ═══════════════════════════════════════════════ */}
      <section ref={bookingRef} id="reservation" style={{
      backgroundColor: '#F2F0E9',
      padding: isMobile ? '60px 20px' : '100px 60px'
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
          fontSize: isMobile ? 52 : 80,
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
            Choisis ta prestation, puis ton créneau — Lalbi s'occupe du reste.
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
                Lalbi vous attend le <strong>{selectedDate}</strong> à <strong>{selectedSlot}</strong>.
              </p>
              <p className="lbc-dmsans" style={{
            fontSize: 13,
            color: 'rgba(13,13,13,0.45)',
            margin: '0 0 32px'
          }}>
                <span>{selectedService?.name}</span>
                <span> · </span>
                <span>{total ?? selectedService?.price}€</span>
                {isLateSlot(selectedSlot) && selectedService && !selectedService.lateSurchargeExempt && <span style={{
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
          gridTemplateColumns: isMobile ? '1fr' : '62% 38%',
          gap: isMobile ? 24 : 40,
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
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: 14
              }}>
                      {SERVICES.map(svc => (
                        <ServiceCardCompact 
                          key={svc.id}
                          svc={svc} 
                          isSelected={selectedService?.id === svc.id} 
                          onSelect={() => {
                            setSelectedService(svc);
                            setSelectedSlot(null);
                          }} 
                        />
                      ))}
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
                    overflow: 'hidden'
                  }}>
                          <img src="/Coiffure Lalbi/photo-bilal.jpeg" alt="Lalbi" style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }} />
                        </div>
                        <span className="lbc-bebas" style={{
                    fontSize: 26,
                    color: '#F2F0E9',
                    letterSpacing: '0.06em'
                  }}>LALBI</span>
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
                    {selectedService?.onlyLate && <p className="lbc-dmsans" style={{
                fontSize: 14,
                color: '#587373',
                margin: '0 0 16px',
                lineHeight: 1.5
              }}>
                        Coupe Nocturne est réservée aux horaires nocturnes. Choisissez 22h00 ou 22h30.
                      </p>}
                    <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)',
                gap: 10
              }}>
                      {availableSlots.map(slot => {
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
                    }}>{selectedService?.lateSurchargeExempt ? 'NOCTURNE' : '+5€'}</span>}
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
                          <input type={field.type} value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} maxLength={field.key === 'clientEmail' ? 254 : field.key === 'clientPhone' ? 20 : 80} style={{
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
                    {formErrors.submit && <p className="lbc-dmsans" style={{
                fontSize: 13,
                color: '#0D0D0D',
                fontWeight: 700,
                backgroundColor: 'rgba(88,115,115,0.12)',
                border: '2px solid #0D0D0D',
                borderRadius: 4,
                padding: '10px 14px',
                marginTop: 16
              }}>{formErrors.submit}</p>}
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
                      <button onClick={handleConfirmBooking} disabled={isSubmitting} style={{
                  backgroundColor: isSubmitting ? 'rgba(88,115,115,0.5)' : '#587373',
                  color: '#F2F0E9',
                  border: '2px solid #0D0D0D',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: isMobile ? 14 : 18,
                  letterSpacing: '0.12em',
                  padding: isMobile ? '14px 16px' : '14px 40px',
                  borderRadius: 4,
                  cursor: isSubmitting ? 'default' : 'pointer',
                  boxShadow: isSubmitting ? '2px 2px 0px #0D0D0D' : '4px 4px 0px #0D0D0D',
                  transition: 'transform 150ms ease, box-shadow 150ms ease'
                }} onMouseEnter={e => {
                  if (!isSubmitting) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D'; }
                }} onMouseLeave={e => {
                  if (!isSubmitting) { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D'; }
                }} onMouseDown={e => {
                  if (!isSubmitting) { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0D0D0D'; }
                }} onMouseUp={e => {
                  if (!isSubmitting) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #0D0D0D'; }
                }}>
                        {isSubmitting ? 'ENVOI EN COURS…' : 'CONFIRMER MA RÉSERVATION'}
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
                  value: 'Lalbi',
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

                    {isLateSlot(selectedSlot) && selectedService && !selectedService.lateSurchargeExempt && <div style={{
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
      padding: isMobile ? '48px 20px' : '64px 60px',
      borderTop: '3px solid #0D0D0D',
      borderBottom: '3px solid #0D0D0D'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? 16 : 20
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
      padding: isMobile ? '24px 20px' : '28px 60px',
      borderTop: '3px solid #587373'
    }}>
        <div style={{
        maxWidth: 1140,
        margin: '0 auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'space-between',
        gap: isMobile ? 12 : 0,
        textAlign: isMobile ? 'center' : 'left'
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
                <a
              href={link.href ?? '#'}
              onClick={link.href ? undefined : e => e.preventDefault()}
              target={link.href ? '_blank' : undefined}
              rel={link.href ? 'noopener noreferrer' : undefined}
              style={{
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
          </div>
        </div>
      </footer>
    </div>;
};