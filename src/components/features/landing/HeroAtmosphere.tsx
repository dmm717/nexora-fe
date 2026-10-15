'use client';

import { useEffect, useRef } from 'react';
import { publishBrandPresence } from './brandMotion';
import styles from './cinematic.module.css';

/** One bounded 30fps GSAP ticker feeds both the cursor field and the existing WebGL scene. */
export function HeroAtmosphere({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>('#hero');
    const journey = hero?.closest<HTMLElement>('[data-cinematic-journey]');
    if (!enabled || !canvas || !hero || !journey) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let disposed = false;
    let removeTicker: (() => void) | undefined;
    let width = 1, height = 1, elapsed = 0, last = 0;
    let visible = false, running = false;
    let targetX = 0, targetY = 0, x = 0, y = 0;
    let pointer: { x: number; y: number } | null = null;
    let previous: { x: number; y: number } | null = null;
    const dust: { x: number; y: number; life: number; size: number; vx: number; vy: number }[] = [];
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const resize = () => {
      const bounds = hero.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const ratio = Math.min(devicePixelRatio, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dust.length = 0; previous = null;
    };
    const move = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      targetX = (pointer.x / width - .5) * 2;
      targetY = (pointer.y / height - .5) * 2;
    };
    const leave = () => { pointer = null; previous = null; targetX = 0; targetY = 0; };
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', leave);
    fine.addEventListener('change', leave);
    const sizing = new ResizeObserver(resize); sizing.observe(hero); resize();
    let sync = () => {};
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    intersection.observe(hero);
    const beats = new MutationObserver(() => sync());
    beats.observe(journey, { attributes: true, attributeFilter: ['data-intro-beat'] });
    // Use a named listener so cleanup removes it even when the page is hidden.
    const visibilityChanged = () => sync();
    document.addEventListener('visibilitychange', visibilityChanged);
    import('gsap').then(({ gsap }) => {
      if (disposed) return;
      const tick = (now: number) => {
        if (now - last < 1 / 30) return;
        const dt = Math.min(now - last, .05); last = now; elapsed += dt;
        x += (targetX - x) * .11; y += (targetY - y) * .11;
        publishBrandPresence(journey, { time: elapsed, x, y });
        hero.dataset.presenceTime = elapsed.toFixed(2);
        context.clearRect(0, 0, width, height);
        if (pointer) {
          const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190);
          glow.addColorStop(0, 'rgba(124,165,255,.16)'); glow.addColorStop(.4, 'rgba(140,115,245,.08)'); glow.addColorStop(1, 'rgba(100,140,255,0)');
          context.fillStyle = glow; context.fillRect(0, 0, width, height);
          if (previous && Math.hypot(pointer.x - previous.x, pointer.y - previous.y) > 2) {
            const distance = Math.hypot(pointer.x - previous.x, pointer.y - previous.y);
            const count = Math.min(12, Math.ceil(distance / 8));
            for (let i = 0; i < count; i++) {
              const fraction = i / count;
              dust.push({ x: previous.x + (pointer.x - previous.x) * fraction + (Math.random() - .5) * 18,
                y: previous.y + (pointer.y - previous.y) * fraction + (Math.random() - .5) * 18,
                life: .6 + Math.random() * .4, size: .45 + Math.random() * 1.1,
                vx: (Math.random() - .5) * 14, vy: (Math.random() - .5) * 14 });
            }
            if (dust.length > 90) dust.splice(0, dust.length - 90);
          }
          previous = { ...pointer };
        }
        for (let i = dust.length - 1; i >= 0; i--) {
          const star = dust[i]; star.life -= dt * .8;
          if (star.life <= 0) { dust.splice(i, 1); continue; }
          star.x += star.vx * dt; star.y += star.vy * dt;
          const bloom = context.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 6);
          bloom.addColorStop(0, `rgba(160,185,255,${star.life * .35})`);
          bloom.addColorStop(1, 'rgba(160,185,255,0)');
          context.fillStyle = bloom;
          context.fillRect(star.x - star.size * 6, star.y - star.size * 6, star.size * 12, star.size * 12);
          context.fillStyle = `rgba(225,235,255,${star.life * .8})`;
          context.beginPath(); context.arc(star.x, star.y, star.size, 0, Math.PI * 2); context.fill();
        }
        hero.dataset.cursorParticles = String(dust.length);
      };
      sync = () => {
        const active = visible && !document.hidden && journey.dataset.introBeat === 'settled';
        if (active === running) return;
        running = active;
        hero.dataset.presenceActive = String(active);
        if (active) { last = gsap.ticker.time; gsap.ticker.add(tick); }
        else { gsap.ticker.remove(tick); leave(); dust.length = 0; context.clearRect(0, 0, width, height); }
      };
      removeTicker = () => gsap.ticker.remove(tick);
      sync();
    }).catch(() => { /* The complete hero remains usable without ambient effects. */ });
    return () => {
      disposed = true; removeTicker?.(); sizing.disconnect(); intersection.disconnect(); beats.disconnect();
      hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave);
      fine.removeEventListener('change', leave); document.removeEventListener('visibilitychange', visibilityChanged);
      context.clearRect(0, 0, width, height);
      delete hero.dataset.presenceActive; delete hero.dataset.presenceTime; delete hero.dataset.cursorParticles;
      publishBrandPresence(journey, { time: 0, x: 0, y: 0 });
    };
  }, [enabled]);
  return <canvas ref={canvasRef} className={styles.cursorField} aria-hidden="true" data-hero-atmosphere />;
}
