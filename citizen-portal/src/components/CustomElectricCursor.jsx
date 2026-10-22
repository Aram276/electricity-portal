import React, { useEffect, useState, useRef } from 'react';

export default function CustomElectricCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef(null);

  const [isPointerFine, setIsPointerFine] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    // Only mount on desktop devices with fine mouse/trackpad pointer and wide screens
    if (typeof window === 'undefined') return;
    const isTouchOrMobile = 
      'ontouchstart' in window || 
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      window.innerWidth < 1024;

    if (isTouchOrMobile) {
      setIsPointerFine(false);
      return;
    }

    const media = window.matchMedia('(pointer: fine)');
    const updateFine = () => {
      const nowTouchOrMobile = 
        'ontouchstart' in window || 
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
        window.innerWidth < 1024;
      setIsPointerFine(!nowTouchOrMobile && media.matches);
    };

    updateFine();
    media.addEventListener('change', updateFine);
    window.addEventListener('resize', updateFine, { passive: true });
    return () => {
      media.removeEventListener('change', updateFine);
      window.removeEventListener('resize', updateFine);
    };
  }, []);


  useEffect(() => {
    if (!isPointerFine) return;

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }

      // Detect if user is hovering over interactive elements
      const target = e.target;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer, [data-interactive]');
        setIsHovering(Boolean(interactive));
      }
    };

    const handleMouseDown = (e) => {
      setIsMouseDown(true);

      // Create a luxury golden & cyan electric click shockwave + sparks
      const newRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        sparks: Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          const dist = 32 + Math.random() * 20;
          return {
            id: i,
            tx: `${Math.cos(angle) * dist}px`,
            ty: `${Math.sin(angle) * dist}px`,
          };
        })
      };

      setRipples((prev) => [...prev.slice(-5), newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 550);
    };

    const handleMouseUp = () => {
      setIsMouseDown(false);
    };

    // Silky 60fps lerp trailing ring loop
    const renderLoop = () => {
      const lerp = 0.22;
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * lerp;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * lerp;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPointerFine]);

  if (!isPointerFine) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden select-none">
      {/* Precision Core Amber Dot */}
      <div
        ref={dotRef}
        style={{ willChange: 'transform' }}
        className={`fixed top-0 left-0 rounded-full transition-transform duration-75 pointer-events-none ${
          isHovering 
            ? 'w-2.5 h-2.5 bg-amber-400 scale-125 shadow-[0_0_12px_#f59e0b]' 
            : 'w-2 h-2 bg-amber-500 shadow-[0_0_7px_#f59e0b]'
        } ${isMouseDown ? 'scale-75 bg-amber-300' : ''}`}
      />

      {/* Smooth Trailing Magnetic Aura Ring */}
      <div
        ref={ringRef}
        style={{ willChange: 'transform' }}
        className={`fixed top-0 left-0 rounded-full transition-[width,height,border-color,background-color,box-shadow] duration-200 pointer-events-none ${
          isHovering
            ? 'w-11 h-11 border-2 border-amber-400 bg-amber-500/15 shadow-[0_0_22px_rgba(245,158,11,0.5)] backdrop-blur-[0.5px]'
            : 'w-8 h-8 border border-amber-500/60 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
        } ${isMouseDown ? 'scale-90 border-amber-300 bg-amber-500/25' : ''}`}
      />

      {/* Electric Click Shockwave Ripples & Sparks */}
      {ripples.map((ripple) => (
        <React.Fragment key={ripple.id}>
          {/* Main Golden Expanding Shockwave Ring */}
          <div
            className="click-shockwave-ring fixed top-0 left-0 w-12 h-12 rounded-full border-2 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.65)]"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
            }}
          />

          {/* Sub-harmonic Cyan Energy Ring */}
          <div
            className="click-shockwave-ring fixed top-0 left-0 w-9 h-9 rounded-full border border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.55)]"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
              animationDelay: '0.04s'
            }}
          />

          {/* Mini Radiant Spark Particles */}
          {ripple.sparks.map((spark) => (
            <div
              key={spark.id}
              className="click-spark-particle fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fbbf24]"
              style={{
                left: `${ripple.x}px`,
                top: `${ripple.y}px`,
                '--spark-tx': spark.tx,
                '--spark-ty': spark.ty,
              }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
