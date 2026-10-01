import React, { useEffect, useRef } from 'react';

/**
 * HeroSphere - Multi-Chromatic Holographic Reactor
 * Renders rotating wireframe latitude/longitude rings with dynamic rainbow spectrums,
 * multi-colored orbital particles, and responds to mouse parallax.
 */
export default function HeroSphere({ size = 320, interactive = true }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let rotationAngle = 0;

    const width = size;
    const height = size;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const radius = size * 0.38;
    const centerX = width / 2;
    const centerY = height / 2;

    // Multi-color chromatic particle palette
    const colorPalette = [
      '#A855F7', // Vivid Purple
      '#EC4899', // Vivid Pink
      '#10B981', // Vivid Emerald
      '#F59E0B', // Amber Gold
      '#8B5CF6', // Royal Violet
      '#F43F5E', // Rose Coral
      '#06B6D4', // Cyan
      '#E879F9', // Fuchsia
    ];

    // Generate fixed orbital particle nodes
    const numParticles = 54;
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      particles.push({
        theta,
        phi,
        radius: radius * (0.92 + Math.random() * 0.22),
        speed: 0.008 + Math.random() * 0.014,
        size: 1.5 + Math.random() * 2.2,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      });
    }

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = x * 0.8;
      mouseRef.current.targetY = y * 0.8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      rotationAngle += 0.012;
      const pitch = mouseRef.current.y * 0.6 + 0.25;
      const yaw = rotationAngle + mouseRef.current.x * 0.8;

      // 1. Draw outer glowing scanning aura (Warm Violet to Magenta)
      const grad = ctx.createRadialGradient(centerX, centerY, radius * 0.1, centerX, centerY, radius * 1.3);
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.16)');
      grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.09)');
      grad.addColorStop(0.8, 'rgba(16, 185, 129, 0.05)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw 3D Latitude Rings with multi-color gradients
      const numLats = 7;
      const latColors = [
        'rgba(244, 63, 94, 0.35)',   // Rose
        'rgba(245, 158, 11, 0.35)',  // Amber
        'rgba(16, 185, 129, 0.4)',   // Emerald
        'rgba(217, 70, 239, 0.6)',   // Fuchsia (Equator)
        'rgba(139, 92, 246, 0.4)',   // Violet
        'rgba(99, 102, 241, 0.35)',  // Indigo
        'rgba(236, 72, 153, 0.35)',  // Pink
      ];

      for (let i = 1; i <= numLats; i++) {
        const phi = (i / (numLats + 1) - 0.5) * Math.PI;
        const ringR = radius * Math.cos(phi);
        const yOffset = radius * Math.sin(phi) * Math.cos(pitch);

        ctx.beginPath();
        ctx.ellipse(centerX, centerY - yOffset, ringR, ringR * Math.sin(pitch), 0, 0, Math.PI * 2);
        ctx.strokeStyle = latColors[i - 1];
        ctx.lineWidth = i === 4 ? 2 : 1.2;
        ctx.stroke();
      }

      // 3. Draw 3D Longitude Meridian Ellipses
      const numLongs = 8;
      for (let i = 0; i < numLongs; i++) {
        const currentYaw = yaw + (i * Math.PI) / numLongs;
        const scaleX = Math.cos(currentYaw);

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * Math.abs(scaleX), radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(168, 85, 247, 0.3)' : 'rgba(236, 72, 153, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 4. Draw Orbiting Multi-Colored Particle Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.theta += p.speed;

        // Spherical to 3D Cartesian coordinates
        const x3d = p.radius * Math.cos(p.phi) * Math.sin(p.theta + yaw);
        const y3d = p.radius * Math.sin(p.phi);
        const z3d = p.radius * Math.cos(p.phi) * Math.cos(p.theta + yaw);

        // Apply pitch tilt
        const projY = y3d * Math.cos(pitch) - z3d * Math.sin(pitch);
        const projZ = y3d * Math.sin(pitch) + z3d * Math.cos(pitch);

        // Depth perspective
        const depthFactor = (projZ + radius) / (radius * 2);
        const alpha = 0.25 + depthFactor * 0.75;
        const screenX = centerX + x3d;
        const screenY = centerY - projY;

        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * (0.7 + depthFactor * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.15, Math.min(1, alpha));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // 5. Draw Glowing Multi-Color Core Shield
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.4);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      coreGrad.addColorStop(0.3, 'rgba(217, 70, 239, 0.4)');
      coreGrad.addColorStop(0.7, 'rgba(139, 92, 246, 0.2)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, interactive]);

  return (
    <div className="relative inline-block select-none">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
      />
    </div>
  );
}
