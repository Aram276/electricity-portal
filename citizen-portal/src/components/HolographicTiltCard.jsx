import React, { useRef, useState, useCallback } from 'react';

export default function HolographicTiltCard({ children, className = '', style = {}, ...props }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    isHovered: false
  });
  const [sheen, setSheen] = useState({
    x: 50,
    y: 50,
    opacity: 0
  });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // Calculate rotation: smooth ±6 degrees
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6.5;
    const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 6.5;

    setTilt({
      rotateX: Number(rotateX.toFixed(2)),
      rotateY: Number(rotateY.toFixed(2)),
      scale: 1.015,
      isHovered: true
    });

    setSheen({
      x: Number(xPct.toFixed(1)),
      y: Number(yPct.toFixed(1)),
      opacity: 1
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      isHovered: false
    });
    setSheen(prev => ({
      ...prev,
      opacity: 0
    }));
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale}, ${tilt.scale}, ${tilt.scale})`,
        transition: tilt.isHovered 
          ? 'transform 0.08s ease-out, box-shadow 0.25s ease-out' 
          : 'transform 0.65s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.65s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* 💳 Dynamic Holographic Sheen Layer (Prism Iridescence) */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
        style={{
          opacity: sheen.opacity,
          background: `
            radial-gradient(
              circle 360px at ${sheen.x}% ${sheen.y}%,
              rgba(251, 191, 36, 0.28) 0%,
              rgba(6, 182, 212, 0.20) 28%,
              rgba(168, 85, 247, 0.16) 52%,
              rgba(236, 72, 153, 0.08) 70%,
              transparent 85%
            ),
            linear-gradient(
              ${115 + (sheen.x - 50) * 0.3}deg,
              transparent 18%,
              rgba(255, 255, 255, 0.08) 36%,
              rgba(251, 191, 36, 0.22) 48%,
              rgba(56, 189, 248, 0.20) 58%,
              rgba(168, 85, 247, 0.14) 68%,
              transparent 84%
            )
          `,
          mixBlendMode: 'screen'
        }}
      />

      {/* 🌌 Holographic Golden & Cyan Specular Glint */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: sheen.opacity ? 0.95 : 0,
          boxShadow: `
            inset 0 0 35px rgba(245, 158, 11, 0.22),
            0 25px 50px -12px rgba(245, 158, 11, 0.25),
            0 0 30px rgba(6, 182, 212, 0.18)
          `,
          borderColor: 'rgba(245, 158, 11, 0.75)'
        }}
      />

      {/* Holographic Angle Glare Spot */}
      <div
        className="pointer-events-none absolute w-48 h-48 rounded-full blur-2xl z-25 transition-opacity duration-200"
        style={{
          opacity: sheen.opacity ? 0.6 : 0,
          left: `calc(${sheen.x}% - 96px)`,
          top: `calc(${sheen.y}% - 96px)`,
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)',
          mixBlendMode: 'overlay'
        }}
      />

      {children}
    </div>
  );
}
