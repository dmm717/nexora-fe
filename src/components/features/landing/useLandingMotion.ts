'use client';

import { useEffect, type RefObject } from 'react';

export function applyLandingFinalState(rootElement: HTMLElement | null) {
  if (!rootElement) return;

  const heroCopy = rootElement.querySelectorAll<HTMLElement>('[data-hero-copy]');
  heroCopy.forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  const heroCards = rootElement.querySelectorAll<HTMLElement>('[data-hero-card]');
  heroCards.forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  const floats = rootElement.querySelectorAll<HTMLElement>('[data-float]');
  floats.forEach((el) => {
    el.style.transform = 'none';
  });

  const reveals = rootElement.querySelectorAll<HTMLElement>('[data-reveal]');
  reveals.forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  const loopNodes = rootElement.querySelectorAll<HTMLElement>('[data-loop-node]');
  loopNodes.forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  const loopTrack = rootElement.querySelector<HTMLElement>('[data-loop-track]');
  if (loopTrack) {
    loopTrack.style.transform = 'none';
  }

  const radials = rootElement.querySelectorAll<SVGCircleElement>('[data-radial]');
  radials.forEach((el) => {
    el.style.strokeDashoffset = el.dataset.radialFinal || '58';
  });

  const meters = rootElement.querySelectorAll<HTMLElement>('[data-meter]');
  meters.forEach((el) => {
    el.style.transform = 'none';
  });

  const counts = rootElement.querySelectorAll<HTMLElement>('[data-count]');
  counts.forEach((el) => {
    if (el.dataset.count) {
      el.textContent = el.dataset.count;
    }
  });

  const parallax = rootElement.querySelectorAll<HTMLElement>('[data-parallax]');
  parallax.forEach((el) => {
    el.style.transform = 'none';
  });
}

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
            normalMotion: '(prefers-reduced-motion: no-preference)',
            reducedMotion: '(prefers-reduced-motion: reduce)',
            narrow: '(max-width: 760px)',
            wide: '(min-width: 761px)',
          },
          (match) => {
            const container = root.current;
            if (!container) return;

            if (match.conditions?.reducedMotion || !match.conditions?.normalMotion) {
              applyLandingFinalState(container);
              return () => {
                applyLandingFinalState(container);
              };
            }

            // Normal-motion GSAP animations
            const ctx = gsap.context(() => {
              gsap.from('[data-hero-copy]', {
                y: 26,
                opacity: 0.8,
                duration: 1,
                stagger: 0.13,
                ease: 'expo.out',
                clearProps: 'transform,opacity',
              });

              let heroEntranceComplete = false;
              const floatTriggers: Array<{
                trigger: { isActive: boolean };
                tween: { resume: () => void; pause: () => void };
              }> = [];

              gsap.from('[data-hero-card]', {
                y: 38,
                rotation: -3,
                opacity: 0.8,
                duration: 1.15,
                stagger: 0.16,
                ease: 'expo.out',
                clearProps: 'transform,opacity',
                onComplete: () => {
                  heroEntranceComplete = true;
                  floatTriggers.forEach(({ trigger, tween }) => {
                    if (trigger.isActive) {
                      tween.resume();
                    }
                  });
                },
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
                  clearProps: 'transform,opacity',
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
                const trigger = ScrollTrigger.create({
                  trigger: el,
                  start: 'top bottom',
                  end: 'bottom top',
                  onToggle: (self) => {
                    if (!heroEntranceComplete) return;
                    if (self.isActive) {
                      tween.resume();
                    } else {
                      tween.pause();
                    }
                  },
                });
                floatTriggers.push({ trigger, tween });
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
                clearProps: 'transform,opacity',
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
                  clearProps: 'transform',
                });
              });

              gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
                const target = Number(el.dataset.count);
                if (Number.isNaN(target)) return;
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
            }, container);

            return () => {
              ctx.revert();
              applyLandingFinalState(container);
            };
          },
        );

        revert = () => {
          media.revert();
          if (root.current) {
            applyLandingFinalState(root.current);
          }
        };
      })
      .catch(() => {
        /* Animation is enhancement; content and actions remain usable. */
        if (root.current) {
          applyLandingFinalState(root.current);
        }
      });

    return () => {
      disposed = true;
      revert?.();
    };
  }, [root]);
}
