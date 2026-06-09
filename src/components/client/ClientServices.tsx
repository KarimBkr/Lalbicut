import { SERVICES } from '../../data/constants';
import { ServiceCardBold } from '../shared/ServiceCardBold';
import { useIsMobile } from '../../lib/useIsMobile';

export const ClientServices = ({ servicesRef, selectedService, setSelectedService, setSelectedSlot, scrollTo, bookingRef }: any) => {
  const isMobile = useIsMobile();
  return (
    <>
      {/* ═══ PRESTATIONS ══════════════════════════════════════════════════ */}
      <section ref={servicesRef} id="prestations" style={{
      backgroundColor: '#F2F0E9',
      padding: isMobile ? '60px 20px' : '80px 60px'
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
          fontSize: isMobile ? 52 : 80,
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
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? 12 : 16
        }}>
            {SERVICES.map(svc => (
              <ServiceCardBold 
                key={svc.id}
                svc={svc} 
                isSelected={selectedService?.id === svc.id} 
                onSelect={() => {
                  setSelectedService(svc);
                  setSelectedSlot(null);
                  scrollTo(bookingRef);
                }} 
              />
            ))}
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


    </>
  );
};
