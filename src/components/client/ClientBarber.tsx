import { BARBER_SPECIALTIES } from '../../data/constants';

export const ClientBarber = ({ barberRef, scrollTo, bookingRef }: any) => {
  return (
    <>
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
              LALBI<span style={{
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
              PRENDRE RDV AVEC LALBI
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
              }}>LALBICUT × LALBI</span>
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
                overflow: 'hidden'
              }}>
                  <img src="/Coiffure Lalbi/photo-bilal.jpeg" alt="Lalbi" style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }} />
                </div>
                <div>
                  <p className="lbc-bebas" style={{
                  fontSize: 28,
                  color: '#F2F0E9',
                  margin: 0,
                  letterSpacing: '0.08em'
                }}>LALBI</p>
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
    </>
  );
};
