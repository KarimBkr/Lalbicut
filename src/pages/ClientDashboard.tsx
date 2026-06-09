import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Booking, LoyaltyConfig, getDateOrder, slotToMinutes, KEYFRAMES } from '../data/constants';
import { isPassed } from '../lib/dates';
import { subscribeToUserBookings, subscribeLoyaltyProgram, updateBookingStatus } from '../lib/db';

export const ClientDashboard: React.FC = () => {
  const { user, logout, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyConfig | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/connexion'); return; }
    if (isAdmin) { navigate('/admin'); return; }
    const unsubBookings = subscribeToUserBookings(user.uid, setBookings);
    const unsubLoyalty = subscribeLoyaltyProgram(setLoyalty);
    return () => { unsubBookings(); unsubLoyalty(); };
  }, [user, loading, isAdmin, navigate]);

  if (loading || !user) return <div style={{ minHeight: '100vh', backgroundColor: '#0D0D0D' }} />;

  const handleLogout = async () => { await logout(); navigate('/'); };

  const now = new Date();

  const upcomingBookings = bookings
    .filter(b => (b.status === 'pending' || b.status === 'confirmed') && !isPassed(b, now))
    .sort((a, b) => {
      const da = getDateOrder(a.date); const db = getDateOrder(b.date);
      if (da !== db) return da - db;
      return slotToMinutes(a.slot) - slotToMinutes(b.slot);
    });

  const historyBookings = bookings
    .filter(b => isPassed(b, now) || b.status === 'cancelled')
    .sort((a, b) => {
      if (a.isoDate && b.isoDate) return b.isoDate.localeCompare(a.isoDate);
      return slotToMinutes(b.slot) - slotToMinutes(a.slot);
    });

  const confirmedCuts = bookings.filter(b => isPassed(b, now) && b.status !== 'cancelled').length;
  const threshold = loyalty?.threshold ?? 10;
  const loyaltyProgress = confirmedCuts % threshold;
  const rewardsEarned = Math.floor(confirmedCuts / threshold);

  const statusStyle = (b: Booking): { label: string; color: string; border: string; bg: string } => {
    if (b.status === 'cancelled') return { label: 'ANNULÉ', color: 'rgba(242,240,233,0.3)', border: 'rgba(242,240,233,0.1)', bg: 'rgba(242,240,233,0.04)' };
    if (isPassed(b, now)) return { label: 'TERMINÉ', color: '#587373', border: 'rgba(88,115,115,0.5)', bg: 'rgba(88,115,115,0.1)' };
    if (b.status === 'confirmed') return { label: 'CONFIRMÉ', color: '#587373', border: '#587373', bg: 'rgba(88,115,115,0.15)' };
    return { label: 'EN ATTENTE', color: 'rgba(242,240,233,0.7)', border: 'rgba(242,240,233,0.3)', bg: 'rgba(242,240,233,0.06)' };
  };

  const initials = (user.displayName || 'CL').split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F2F0E9', fontFamily: "'DM Sans', sans-serif", color: '#0D0D0D' }}>
      <style>{KEYFRAMES}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: '#F2F0E9', borderBottom: '3px solid #0D0D0D',
        boxShadow: '0 3px 0px #587373', height: 64,
        display: 'flex', alignItems: 'center', padding: '0 60px'
      }}>
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="lbc-bebas" style={{ fontSize: 28, letterSpacing: '0.15em', color: '#0D0D0D', textShadow: '2px 2px 0px #587373', lineHeight: 1 }}>LALBICUT</span>
            <span className="lbc-bebas" style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(13,13,13,0.4)', textTransform: 'uppercase', marginTop: 1 }}>BARBER SHOP</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/')} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none',
              border: '2px solid rgba(13,13,13,0.2)', boxShadow: '2px 2px 0px rgba(13,13,13,0.08)',
              borderRadius: 4, cursor: 'pointer', padding: '6px 14px',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.1em',
              color: 'rgba(13,13,13,0.55)', transition: 'all 150ms ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D0D0D'; e.currentTarget.style.color = '#0D0D0D'; e.currentTarget.style.boxShadow = '2px 2px 0px #587373'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(13,13,13,0.2)'; e.currentTarget.style.color = 'rgba(13,13,13,0.55)'; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(13,13,13,0.08)'; }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              RETOUR AU SITE
            </button>

            <div style={{ width: 1, height: 24, backgroundColor: 'rgba(13,13,13,0.1)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 4, backgroundColor: '#587373',
                border: '2px solid #0D0D0D', boxShadow: '2px 2px 0px #0D0D0D',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <span className="lbc-bebas" style={{ fontSize: 13, color: '#F2F0E9' }}>{initials}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0D0D' }}>{user.displayName || 'Client'}</span>
            </div>

            <button onClick={handleLogout} style={{
              background: '#0D0D0D', color: '#F2F0E9', border: '2px solid #0D0D0D',
              borderRadius: 4, cursor: 'pointer', padding: '6px 14px',
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.1em',
              boxShadow: '2px 2px 0px #587373', transition: 'all 150ms ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #587373'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0px #587373'; }}>
              DÉCONNEXION
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO / HEADER ═══ */}
      <section style={{ backgroundColor: '#0D0D0D', padding: '56px 60px 48px', borderBottom: '3px solid #587373' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="lbc-bebas" style={{ fontSize: 14, color: '#587373', letterSpacing: '0.22em', margin: 0 }}>ESPACE CLIENT</p>
          <h1 className="lbc-bebas" style={{ fontSize: 76, lineHeight: 0.88, color: '#F2F0E9', letterSpacing: '0.04em', margin: '6px 0 0', textTransform: 'uppercase' }}>
            MON<br />PROFIL<span style={{ color: '#587373' }}>.</span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 6, backgroundColor: '#587373',
                border: '2px solid rgba(242,240,233,0.25)', boxShadow: '3px 3px 0px rgba(88,115,115,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <span className="lbc-bebas" style={{ fontSize: 20, color: '#F2F0E9' }}>{initials}</span>
              </div>
              <div>
                <p className="lbc-bebas" style={{ fontSize: 22, color: '#F2F0E9', letterSpacing: '0.06em', margin: 0 }}>
                  {(user.displayName || 'CLIENT').toUpperCase()}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(242,240,233,0.4)', fontWeight: 600, margin: '2px 0 0' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, flexShrink: 0 }}>
              {[
                { label: 'COUPES', value: String(confirmedCuts) },
                { label: 'À VENIR', value: String(upcomingBookings.length) },
              ].map(stat => (
                <div key={stat.label} style={{
                  textAlign: 'center', borderRadius: 8, padding: '12px 20px',
                  backgroundColor: 'rgba(242,240,233,0.05)', border: '2px solid rgba(88,115,115,0.3)',
                  boxShadow: '3px 3px 0px rgba(88,115,115,0.2)'
                }}>
                  <p className="lbc-bebas" style={{ fontSize: 40, color: '#F2F0E9', margin: 0, lineHeight: 1 }}>{stat.value}</p>
                  <p className="lbc-bebas" style={{ fontSize: 10, color: 'rgba(242,240,233,0.4)', letterSpacing: '0.18em', margin: '4px 0 0' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CARTE FIDÉLITÉ ═══ */}
      {loyalty?.enabled && (
        <section style={{ backgroundColor: '#587373', padding: '28px 60px', borderBottom: '3px solid #0D0D0D' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 auto' }}>
              <p className="lbc-bebas" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(242,240,233,0.55)', margin: 0 }}>PROGRAMME FIDÉLITÉ</p>
              <p className="lbc-bebas" style={{ fontSize: 32, color: '#F2F0E9', letterSpacing: '0.04em', margin: '4px 0 0', lineHeight: 1 }}>
                {loyaltyProgress} <span style={{ fontSize: 18, color: 'rgba(242,240,233,0.5)' }}>/ {threshold}</span>
              </p>
              <p style={{ fontSize: 13, color: 'rgba(242,240,233,0.75)', fontWeight: 600, margin: '6px 0 0' }}>
                {loyalty.rewardLabel || (loyalty.rewardType === 'discount' ? `-${loyalty.discountAmount}€ sur ta prochaine coupe` : 'Récompense à venir')}
              </p>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                {Array.from({ length: threshold }, (_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 8, borderRadius: 2,
                    backgroundColor: i < loyaltyProgress ? '#F2F0E9' : 'rgba(242,240,233,0.18)',
                    border: `1.5px solid ${i < loyaltyProgress ? 'rgba(242,240,233,0.5)' : 'rgba(242,240,233,0.1)'}`,
                    boxShadow: i < loyaltyProgress ? '1px 1px 0px rgba(13,13,13,0.1)' : 'none',
                    transition: 'background-color 200ms ease'
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="lbc-bebas" style={{ fontSize: 10, color: 'rgba(242,240,233,0.45)', letterSpacing: '0.1em' }}>0 COUPE</span>
                <span className="lbc-bebas" style={{ fontSize: 10, color: 'rgba(242,240,233,0.45)', letterSpacing: '0.1em' }}>{threshold} COUPES</span>
              </div>
            </div>

            {rewardsEarned > 0 && (
              <div style={{
                flex: '0 0 auto', backgroundColor: '#F2F0E9', color: '#0D0D0D',
                border: '2px solid #0D0D0D', boxShadow: '3px 3px 0px #0D0D0D',
                borderRadius: 6, padding: '10px 18px', textAlign: 'center'
              }}>
                <p className="lbc-bebas" style={{ fontSize: 28, color: '#587373', margin: 0, lineHeight: 1 }}>{rewardsEarned}</p>
                <p className="lbc-bebas" style={{ fontSize: 9, color: '#0D0D0D', letterSpacing: '0.15em', margin: '4px 0 0' }}>
                  {rewardsEarned > 1 ? 'RÉCOMPENSES' : 'RÉCOMPENSE'}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ CONTENU PRINCIPAL ═══ */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* ── PROCHAINS RDV ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 className="lbc-bebas" style={{ fontSize: 32, color: '#0D0D0D', letterSpacing: '0.06em', margin: 0 }}>
                PROCHAINS RDV<span style={{ color: '#587373' }}>.</span>
              </h2>
              <button onClick={() => navigate('/', { state: { scrollTo: 'reservation' } })} style={{
                backgroundColor: '#587373', color: '#F2F0E9',
                border: '2px solid #0D0D0D', boxShadow: '3px 3px 0px #0D0D0D',
                borderRadius: 4, cursor: 'pointer', padding: '8px 16px',
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: '0.1em',
                transition: 'transform 150ms ease, box-shadow 150ms ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0px #0D0D0D'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = '2px 2px 0px #0D0D0D'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D0D0D'; }}>
                + RÉSERVER
              </button>
            </div>

            {upcomingBookings.length === 0 ? (
              <div style={{
                backgroundColor: '#0D0D0D', border: '2px solid rgba(88,115,115,0.25)',
                boxShadow: '4px 4px 0px rgba(88,115,115,0.15)', borderRadius: 10, padding: '40px 28px', textAlign: 'center'
              }}>
                <p className="lbc-bebas" style={{ fontSize: 20, color: 'rgba(242,240,233,0.25)', letterSpacing: '0.1em', margin: 0 }}>AUCUN RDV À VENIR</p>
                <p style={{ fontSize: 13, color: 'rgba(242,240,233,0.2)', fontWeight: 600, margin: '8px 0 20px' }}>
                  Lalbi est disponible, prends ton créneau.
                </p>
                <button onClick={() => navigate('/', { state: { scrollTo: 'reservation' } })} style={{
                  backgroundColor: '#587373', color: '#F2F0E9',
                  border: '2px solid rgba(242,240,233,0.2)', boxShadow: '3px 3px 0px rgba(242,240,233,0.1)',
                  borderRadius: 4, cursor: 'pointer', padding: '10px 24px',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: '0.1em',
                  transition: 'transform 150ms ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
                  RÉSERVER MAINTENANT
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingBookings.map(b => {
                  const s = statusStyle(b);
                  return (
                    <div key={b.id} style={{
                      backgroundColor: '#0D0D0D', border: '2px solid rgba(88,115,115,0.35)',
                      boxShadow: '4px 4px 0px rgba(88,115,115,0.2)', borderRadius: 10, overflow: 'hidden'
                    }}>
                      <div style={{ backgroundColor: 'rgba(88,115,115,0.12)', borderBottom: '1px solid rgba(88,115,115,0.2)', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="lbc-bebas" style={{ fontSize: 15, color: '#F2F0E9', letterSpacing: '0.08em' }}>{b.date}</span>
                        <span className="lbc-bebas" style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, letterSpacing: '0.1em', backgroundColor: s.bg, color: s.color, border: `1.5px solid ${s.border}` }}>{s.label}</span>
                      </div>
                      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p className="lbc-bebas" style={{ fontSize: 18, color: '#F2F0E9', letterSpacing: '0.04em', margin: 0 }}>{b.service.name}</p>
                          <p style={{ fontSize: 12, color: 'rgba(242,240,233,0.4)', fontWeight: 700, margin: '4px 0 0' }}>{b.slot} · {b.service.duration}</p>
                        </div>
                        <span className="lbc-bebas" style={{ fontSize: 32, color: '#587373', letterSpacing: '0.02em' }}>{b.price}€</span>
                      </div>
                      {/* Annulation */}
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <div style={{ borderTop: '1px solid rgba(88,115,115,0.15)', padding: '10px 20px' }}>
                          {cancelConfirm === b.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, color: 'rgba(242,240,233,0.5)', fontWeight: 700, flex: 1 }}>Confirmer l'annulation ?</span>
                              <button onClick={() => { updateBookingStatus(b.id, 'cancelled'); setCancelConfirm(null); }} style={{
                                background: 'rgba(242,240,233,0.08)', border: '1.5px solid rgba(242,240,233,0.2)',
                                borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
                                fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.1em', color: '#F2F0E9'
                              }}>OUI</button>
                              <button onClick={() => setCancelConfirm(null)} style={{
                                background: 'transparent', border: '1.5px solid rgba(88,115,115,0.3)',
                                borderRadius: 4, padding: '5px 14px', cursor: 'pointer',
                                fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.1em', color: '#587373'
                              }}>NON</button>
                            </div>
                          ) : (
                            <button onClick={() => setCancelConfirm(b.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              fontSize: 11, fontWeight: 700, color: 'rgba(242,240,233,0.25)',
                              textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif",
                              transition: 'color 150ms ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.55)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.25)'; }}>
                              Annuler ce rendez-vous
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── HISTORIQUE ── */}
          <div>
            <h2 className="lbc-bebas" style={{ fontSize: 32, color: 'rgba(13,13,13,0.45)', letterSpacing: '0.06em', margin: '0 0 24px' }}>
              HISTORIQUE<span style={{ color: '#587373' }}>.</span>
            </h2>

            {historyBookings.length === 0 ? (
              <p style={{ fontSize: 14, color: 'rgba(13,13,13,0.35)', fontWeight: 700 }}>Aucun historique pour l'instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {historyBookings.map(b => {
                  const s = statusStyle(b);
                  return (
                    <div key={b.id} style={{
                      border: '2px solid rgba(13,13,13,0.1)', boxShadow: '3px 3px 0px rgba(13,13,13,0.05)',
                      borderRadius: 8, padding: '12px 18px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', backgroundColor: 'rgba(13,13,13,0.02)'
                    }}>
                      <div>
                        <p className="lbc-bebas" style={{ fontSize: 15, color: '#0D0D0D', letterSpacing: '0.04em', margin: 0 }}>{b.service.name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(13,13,13,0.4)', fontWeight: 700, margin: '3px 0 0' }}>{b.date} · {b.slot}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                        <span className="lbc-bebas" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, letterSpacing: '0.1em', backgroundColor: 'rgba(88,115,115,0.08)', color: s.color, border: `1.5px solid ${s.border}` }}>{s.label}</span>
                        <span className="lbc-bebas" style={{ fontSize: 16, color: 'rgba(13,13,13,0.35)' }}>{b.price}€</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ backgroundColor: '#0D0D0D', padding: '20px 60px', borderTop: '3px solid #587373' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="lbc-bebas" style={{ fontSize: 18, letterSpacing: '0.15em', color: 'rgba(242,240,233,0.25)', textShadow: '1px 1px 0px rgba(88,115,115,0.3)' }}>LALBICUT</span>
          <span style={{ fontSize: 11, color: 'rgba(242,240,233,0.12)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>© 2025 LALBICUT · BARBER SHOP</span>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: '1.5px solid rgba(242,240,233,0.15)', borderRadius: 4,
            cursor: 'pointer', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, letterSpacing: '0.1em',
            color: 'rgba(242,240,233,0.3)', boxShadow: '1px 1px 0px rgba(88,115,115,0.1)',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.7)'; e.currentTarget.style.borderColor = 'rgba(242,240,233,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,240,233,0.3)'; e.currentTarget.style.borderColor = 'rgba(242,240,233,0.15)'; }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            RETOUR AU SITE
          </button>
        </div>
      </footer>
    </div>
  );
};
