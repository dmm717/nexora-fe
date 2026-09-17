'use client';

import { useEffect, type RefObject } from 'react';

/** Landing-only bundle. Defaults stay visible if JS or the animation import fails. */
export function useLandingMotion(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let disposed = false;
    let revert: (() => void) | undefined;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        media.add(
          {
            motion: '(prefers-reduced-motion: no-preference)',
            narrow: '(max-width: 760px)',
            wide: '(min-width: 761px)',
          },
          (match) => {
            if (!match.conditions?.motion) return;
            const counts = root.current?.querySelectorAll<HTMLElement>('[data-count]');
            const ctx = gsap.context(() => {
              gsap.from('[data-hero-copy]', {
                y: 26,
                opacity: 0.8,
                duration: 1,
                stagger: 0.13,
                ease: 'expo.out',
              });
              gsap.from('[data-hero-card]', {
                y: 38,
                rotation: -3,
                opacity: 0.8,
                duration: 1.15,
                stagger: 0.16,
                ease: 'expo.out',
              });
              gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el, index) => {
                gsap.from(el, {
                  y: index % 2 ? 32 : 45,
                  opacity: 0.7,
                  immediateRender: false,
                  duration: 0.9,
                  delay: (index % 3) * 0.06,
                  ease: 'expo.out',
                  scrollTrigger: { trigger: el, start: 'top 90%', once: true },
                });
              });
              gsap.utils.toArray<HTMLElement>('[data-float]').forEach((el, index) => {
                const tween = gsap.to(el, {
                  y: index % 2 ? 9 : -11,
                  duration: 3 + index * 0.4,
                  repeat: -1,
                  yoyo: true,
                  ease: 'sine.inOut',
                  paused: true,
                });
                ScrollTrigger.create({
                  trigger: el,
                  start: 'top bottom',
                  end: 'bottom top',
                  onToggle: (self) => (self.isActive ? tween.resume() : tween.pause()),
                });
              });
              gsap.to('[data-parallax]', {
                y: 55,
                rotation: 7,
                ease: 'none',
                scrollTrigger: {
                  trigger: '#hero',
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 1,
                },
              });
              gsap.from('[data-loop-node]', {
                y: 24,
                opacity: 0.7,
                immediateRender: false,
                stagger: 0.14,
                duration: 0.8,
                ease: 'expo.out',
                scrollTrigger: {
                  trigger: '#preparation-loop',
                  start: 'top 80%',
                  once: true,
                },
              });
              const narrow = !!match.conditions?.narrow;
              gsap.from('[data-loop-track]', {
                ...(narrow
                  ? { scaleY: 0, transformOrigin: 'top center' }
                  : { scaleX: 0, transformOrigin: 'left center' }),
                ease: 'none',
                scrollTrigger: {
                  trigger: '#preparation-loop',
                  start: 'top 85%',
                  end: 'bottom 45%',
                  scrub: 0.5,
                },
              });
              gsap.utils.toArray<SVGCircleElement>('[data-radial]').forEach((el) => {
                gsap.from(el, {
                  strokeDashoffset: 264,
                  immediateRender: false,
                  duration: 1.7,
                  ease: 'expo.out',
                  scrollTrigger: { trigger: el, start: 'top 95%', once: true },
                });
              });
              gsap.utils.toArray<HTMLElement>('[data-meter]').forEach((el) => {
                gsap.from(el, {
                  scaleX: 0,
                  immediateRender: false,
                  transformOrigin: 'left',
                  duration: 1.4,
                  ease: 'expo.out',
                  scrollTrigger: { trigger: el, start: 'top 90%', once: true },
                });
              });
              gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
                const target = Number(el.dataset.count);
                const counter = { value: 0 };
                gsap.to(counter, {
                  value: target,
                  duration: 1.5,
                  ease: 'power2.out',
                  onUpdate: () => {
                    el.textContent = String(Math.round(counter.value));
                  },
                  scrollTrigger: { trigger: el, start: 'top 95%', once: true },
                });
              });
            }, root);
            return () => {
              ctx.revert();
              counts?.forEach((el) => {
                el.textContent = el.dataset.count || '';
              });
            };
          },
        );
        revert = () => media.revert();
      })
      .catch(() => {
        /* Animation is enhancement; content and actions remain usable. */
      });
    return () => {
      disposed = true;
      revert?.();
    };
  }, [root]);
}
