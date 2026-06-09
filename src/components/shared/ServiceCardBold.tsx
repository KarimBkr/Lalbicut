import React from 'react';
import { Service } from '../../data/constants';

export const ServiceCardBold = ({ svc, isSelected, onSelect }: { svc: Service; isSelected: boolean; onSelect: () => void }) => {
  const headerBg = isSelected ? '#0D0D0D' : '#587373';
  const shadow = isSelected ? '4px 4px 0px #0D0D0D' : '4px 4px 0px #587373';
  const border = isSelected ? '2px solid #0D0D0D' : '2px solid #587373';
  const isAddon = svc.priceLabel.startsWith('+');

  return (
    <button 
      key={svc.id} 
      onClick={onSelect} 
      style={{
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
      }} 
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isSelected ? '4px 4px 0px #0D0D0D' : '6px 6px 0px #587373';
      }} 
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = shadow;
      }}
    >
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
    </button>
  );
};
