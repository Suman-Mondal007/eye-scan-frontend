import React from 'react';

export default function EyePulseVisual({ size = 160 }) {
  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      animation: 'floatGentle 4s ease-in-out infinite'
    }}>
      {/* Outer Pulse Ripple 1 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '2px solid rgba(56, 189, 248, 0.5)',
        animation: 'wavePulse 3s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
        pointerEvents: 'none'
      }} />

      {/* Outer Pulse Ripple 2 (Delayed) */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        border: '1.5px solid rgba(2, 132, 199, 0.35)',
        animation: 'wavePulse 3s cubic-bezier(0.2, 0.8, 0.2, 1) 1.5s infinite',
        pointerEvents: 'none'
      }} />

      {/* Rotating Medical Radar Ticks */}
      <div style={{
        position: 'absolute',
        width: '84%',
        height: '84%',
        borderRadius: '50%',
        border: '2px dashed rgba(2, 132, 199, 0.3)',
        animation: 'spinSlow 25s linear infinite',
        pointerEvents: 'none'
      }} />

      {/* Optical Reticle Base in Light Blue Glass */}
      <div style={{
        position: 'relative',
        width: size * 0.72,
        height: size * 0.72,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #E0F2FE 0%, #BAE6FD 60%, #7DD3FC 100%)',
        border: '3px solid #0284C7',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25), inset 0 0 16px rgba(2, 132, 199, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Iris Glow Ring */}
        <div style={{
          width: '64%',
          height: '64%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #38BDF8 0%, #0284C7 60%, #0369A1 100%)',
          boxShadow: '0 0 20px rgba(2, 132, 199, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulseGlow 2.8s ease-in-out infinite'
        }}>
          {/* Pupil */}
          <div style={{
            width: '46%',
            height: '46%',
            borderRadius: '50%',
            background: '#091E3A',
            position: 'relative',
            boxShadow: 'inset 0 0 8px #000000, 0 0 8px rgba(9, 30, 58, 0.5)'
          }}>
            {/* Light Catch Highlight */}
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '20%',
              width: '32%',
              height: '32%',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 0 6px #FFFFFF'
            }} />
          </div>
        </div>

        {/* Optical Target Crosshairs */}
        <div style={{
          position: 'absolute',
          top: '6%',
          bottom: '6%',
          width: '1px',
          background: 'rgba(2, 132, 199, 0.35)'
        }} />
        <div style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          height: '1px',
          background: 'rgba(2, 132, 199, 0.35)'
        }} />

        {/* Laser Sweep within Reticle */}
        <div className="laser-line" style={{ height: '2px' }} />
      </div>
    </div>
  );
}
