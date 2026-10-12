import React, { useEffect, useRef } from 'react';

/**
 * Antigravity 3D Particle Field Engine
 * Features:
 * - Edge-focused distribution (Left & Right margins are densely populated & prominently visible)
 * - Pure circular 3D glowing nodes (smooth, elegant, and crisp like the original Antigravity web)
 * - Antigravity continuous upward drift with natural velocity variances
 * - 3D Perspective scaling with parallax mouse inertia
 * - Soft constellation energy connections between neighboring nodes
 * - High-contrast, vibrant palette tuned specifically for Light & Dark modes
 */
export default function AntigravityBackground({ isDarkMode = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle counts: densely distributed on sides for stunning framing
    const isMobile = width < 768;
    const particleCount = isMobile ? 85 : 170;
    const depth = 900;
    const fov = 380;

    // Palette: High contrast and punchy
    // In Light mode: Rich cobalt, deep royal blue, vibrant sky, and warm amber that pop on white/pale bg
    // In Dark mode: Glowing neon cyan, electric blue, and radiant gold
    const colors = isDarkMode
      ? [
          { r: 56, g: 189, b: 248 },  // Electric Cyan (#38bdf8)
          { r: 96, g: 165, b: 250 },  // Neon Blue (#60a5fa)
          { r: 245, g: 158, b: 11 },  // Golden Amber (#f59e0b)
          { r: 129, g: 140, b: 248 }, // Cyber Indigo (#818cf8)
          { r: 14, g: 165, b: 233 },  // Radiant Sky (#0ea5e9)
        ]
      : [
          { r: 30, g: 64, b: 175 },   // Deep Cobalt (#1e40af)
          { r: 37, g: 99, b: 235 },   // Royal Blue (#2563eb)
          { r: 2, g: 132, b: 199 },   // Electric Sky (#0284c7)
          { r: 67, g: 56, b: 202 },   // Indigo (#4338ca)
          { r: 217, g: 119, b: 6 },   // Warm Amber (#d97706)
        ];

    // Helper: spawn particle biased heavily towards the LEFT and RIGHT flanks
    const createParticle = (initialY = null) => {
      // 85% on left/right flanks, 15% roaming center
      const sideRoll = Math.random();
      let normX;
      if (sideRoll < 0.44) {
        // Left flank: from -5% to 26% of screen width
        normX = -0.05 + Math.random() * 0.31;
      } else if (sideRoll < 0.88) {
        // Right flank: from 74% to 105% of screen width
        normX = 0.74 + Math.random() * 0.31;
      } else {
        // Center roaming
        normX = 0.26 + Math.random() * 0.48;
      }

      const pZ = 50 + Math.random() * (depth - 50);
      const scale = fov / (pZ + 250);
      const screenX = normX * width;
      const screenY = initialY !== null ? initialY : Math.random() * height;

      // Unproject screen coordinates back to 3D model space
      const cx = width / 2;
      const cy = height / 2;
      const modelX = (screenX - cx) / scale;
      const modelY = (screenY - cy) / scale;

      return {
        x: modelX,
        y: modelY,
        z: pZ,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.45 - Math.random() * 0.75, // Antigravity: upward drift
        vz: (Math.random() - 0.5) * 0.35,
        baseSize: 2.2 + Math.random() * 3.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      };
    };

    const particles = Array.from({ length: particleCount }).map(() => createParticle());

    // Mouse coordinates & inertia damping
    let mouseScreenX = width / 2;
    let mouseScreenY = height / 2;
    let isMouseActive = false;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e) => {
      mouseScreenX = e.clientX;
      mouseScreenY = e.clientY;
      isMouseActive = true;

      const normMouseX = (e.clientX / width - 0.5) * 2;
      const normMouseY = (e.clientY / height - 0.5) * 2;
      targetRotY = normMouseX * 0.35;
      targetRotX = -normMouseY * 0.35;
    };

    const handleMouseLeave = () => {
      isMouseActive = false;
      targetRotX = 0;
      targetRotY = 0;
    };

    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      // On mobile Safari (iPhone), address bar scrolling causes small vertical resize events.
      // Only resize the canvas when width changes or vertical change is significant to avoid flickering.
      if (Math.abs(canvas.width - newW) > 10 || Math.abs(canvas.height - newH) > 120) {
        width = canvas.width = newW;
        height = canvas.height = newH;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // 60FPS Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth inertia rotation
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);
      const cosX = Math.cos(currentRotX);
      const sinX = Math.sin(currentRotX);

      const cx = width / 2;
      const cy = height / 2;

      const projected = [];

      // 1. Process 3D particles & perspective projection
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Upward drift
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.pulse += p.pulseSpeed;

        // Wrap Z
        if (p.z < 30) p.z = depth;
        if (p.z > depth) p.z = 30;

        // 3D Matrix Rotation (Y axis then X axis)
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        // 3D Perspective Projection
        const pZ = z2 + 250;
        if (pZ <= 20) continue;

        const scale = fov / pZ;
        const x2d = cx + x1 * scale;
        const y2d = cy + y1 * scale;

        // Respawn from bottom if floated out of the top
        if (y2d < -40) {
          const respawned = createParticle(height + 30);
          particles[i] = respawned;
          continue;
        }

        // Wrap horizontal margins
        if (x2d < -80) {
          p.x = ((width + 60) - cx) / scale;
        } else if (x2d > width + 80) {
          p.x = (-60 - cx) / scale;
        }

        // Mouse proximity interaction (magnetic glow & subtle lift)
        let mouseBoost = 0;
        if (isMouseActive) {
          const mdx = x2d - mouseScreenX;
          const mdy = y2d - mouseScreenY;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 140) {
            const push = (1 - mdist / 140);
            p.x += (mdx / (mdist || 1)) * push * 0.5;
            p.y -= push * 0.8; // subtle antigravity lift
            mouseBoost = push * 0.35;
          }
        }

        // Prominent Alpha: ensure high visibility especially on light backgrounds
        const alphaPulse = 0.8 + 0.2 * Math.sin(p.pulse);
        const depthAlpha = Math.max(0.35, Math.min(1.0, 1.15 - (pZ - 40) / depth));
        const alpha = Math.min(1.0, depthAlpha * alphaPulse + mouseBoost);

        // Prominent Size scaling
        const renderSize = Math.max(1.6, p.baseSize * scale * 1.75);

        projected.push({
          x: x2d,
          y: y2d,
          z: pZ,
          scale,
          color: p.color,
          size: renderSize,
          alpha
        });
      }

      // 2. Draw Subtle Constellation Energy Lines between close neighbors
      const maxConnectDist = isMobile ? 65 : 90;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const lineAlpha = (1 - dist / maxConnectDist) * (isDarkMode ? 0.32 : 0.25) * Math.min(p1.alpha, p2.alpha);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${lineAlpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      // 3. Render Circular Glowing 3D Nodes (Antigravity Signature Look)
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const { r, g, b } = p.color;

        // Outer soft glow halo for larger/closer nodes
        if (p.size > 2.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * (isDarkMode ? 0.32 : 0.18)})`;
          ctx.fill();
        }

        // Medium halo
        if (p.size > 3.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * (isDarkMode ? 0.45 : 0.3)})`;
          ctx.fill();
        }

        // Crisp Core Circular Node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;

        // Glow shadow
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.95})`;
        ctx.shadowBlur = p.size * (isDarkMode ? 4.0 : 2.5);
        ctx.fill();
      }

      // Reset shadow blur
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
      style={{
        opacity: isDarkMode ? 0.95 : 0.9,
      }}
    />
  );
}
