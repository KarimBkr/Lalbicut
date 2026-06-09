import React from 'react';
import { Service, GALLERY_CARDS, BARBER_SPECIALTIES, REASSURANCE_DATA, FOOTER_LINKS_DATA } from '../../data/constants';
import { ServiceCardBold } from '../shared/ServiceCardBold';

export const ClientGallery = ({ gallerieRef, scrollTo, bookingRef }: any) => {
  return (
    <>
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
            Quelques coupes récentes de Lalbi. Chaque détail compte.
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
              RÉSERVER AVEC LALBI
            </button>
          </div>
        </div>
      </section>


    </>
  );
};
