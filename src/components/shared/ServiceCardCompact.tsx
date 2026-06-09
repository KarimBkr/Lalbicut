import React from 'react';
import { Service } from '../../data/constants';

export const ServiceCardCompact = ({ svc, isSelected, onSelect }: { svc: Service; isSelected: boolean; onSelect: () => void }) => {
  const headerBg = isSelected ? '#0D0D0D' : '#587373';
  const shadow = isSelected ? '3px 3px 0px #0D0D0D' : '3px 3px 0px #587373';
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
        borderRadius: 10,
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
        e.currentTarget.style.boxShadow = isSelected ? '3px 3px 0px #0D0D0D' : '5px 5px 0px #587373';
      }} 
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = shadow;
      }}
    >
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
        {isSelected ? (
          <span style={{
            fontSize: 12,
            color: '#F2F0E9',
            fontWeight: 700
          }}>✓</span>
        ) : (
          <span className="lbc-bebas" style={{
            fontSize: 10,
            color: '#587373',
            backgroundColor: '#F2F0E9',
            padding: '2px 7px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            letterSpacing: '0.08em',
            border: '1.5px solid #587373'
          }}>{svc.duration}</span>
        )}
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
    </button>
  );
};
