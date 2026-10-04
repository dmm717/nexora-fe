'use client';

import { useEffect, type RefObject } from 'react';
import { publishBrandMotion, type BrandMotion } from './brandMotion.ts';

function listenForIntroInterruption(settle: () => void) {
  const interruptKey = (event: KeyboardEvent) => {
    if (['Tab', 'Enter', 'Escape', 'ArrowDown', 'PageDown', ' '].includes(event.key)) settle();
  };
  window.addEventListener('wheel', settle, { passive: true });
  window.addEventListener('touchstart', settle, { passive: true });
  window.addEventListener('pointerdown', settle, { passive: true });
  window.addEventListener('keydown', interruptKey);
  return () => {
    window.removeEventListener('wheel', settle);
    window.removeEventListener('touchstart', settle);
    window.removeEventListener('pointerdown', settle);
    window.removeEventListener('keydown', interruptKey);
  };
}

export function applyLandingFinalState(rootElement: HTMLElement | null) {
  if (!rootElement) return;

  for (const selector of ['[data-cinematic-copy] > *', '[data-depth-panel]', '[data-depth-copy]', '[data-story-panel]']) {
    rootElement.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = '';
    });
  }

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
    let introPlayed = false;
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
            journeyVertical: '(max-width: 1359px)',
          },
          (match) => {
            const container = root.current;
            if (!container) return;

            if (match.conditions?.reducedMotion || !match.conditions?.normalMotion) {
              container.dataset.motionMode = 'reduced';
              container.dataset.motionTriggerCount = '0';
              applyLandingFinalState(container);
              let removeInterrupts: (() => void) | undefined;
              const ctx = gsap.context(() => {
                const stage = container.querySelector<HTMLElement>('[data-cinematic-journey]');
                if (!stage) return;
                stage.dataset.introBeat = 'settled';
                publishBrandMotion(stage, { entrance: 1, travel: 0, light: 1 });
                if (introPlayed || window.scrollY > 40) return;
                introPlayed = true;
                // Keep the brand sequence legible without spatial motion, WebGL or hidden content.
                const letters = stage.querySelectorAll('[data-brand-letter]');
                stage.dataset.introBeat = 'establish';
                const intro = gsap.timeline({ defaults: { ease: 'power2.inOut' },
                  onComplete: () => { stage.dataset.introBeat = 'settled'; } });
                intro.to(letters, { opacity: .4, duration: .22, stagger: .03 }, .05)
                  .add(() => { stage.dataset.introBeat = 'deconstruct'; }, .35)
                  .to(letters, { opacity: .12, duration: .18, stagger: .03 }, .35)
                  .add(() => { stage.dataset.introBeat = 'recompose'; }, .65)
                  .to(letters, { opacity: 1, duration: .42, stagger: .08, clearProps: 'opacity' }, .65)
                  .add(() => { stage.dataset.introBeat = 'slogan'; }, .95);
                removeInterrupts = listenForIntroInterruption(() => intro.progress(1));
              }, container);
              return () => {
                removeInterrupts?.();
                ctx.revert();
                applyLandingFinalState(container);
              };
            }

            // Normal-motion GSAP animations
            container.dataset.motionMode = 'normal';
            let removeInterrupts: (() => void) | undefined;
            const ctx = gsap.context(() => {
              const stage = container.querySelector<HTMLElement>('[data-cinematic-journey]');
              if (stage) {
                const letters = stage.querySelectorAll('[data-brand-letter]');
                const title = stage.querySelector('#cinematic-title');
                const bridge: BrandMotion = { entrance: 0, travel: 0, light: .25 };
                const render = () => publishBrandMotion(stage, bridge);
                // One intro clock coordinates official DOM glyphs, lighting and 3D depth.
                const intro = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onUpdate: render,
                  onComplete: () => { stage.dataset.introBeat = 'settled'; } });
                stage.dataset.introBeat = 'establish';
                intro.to(bridge, { entrance: 1, light: 1, duration: .8 }, 0)
                  .from(letters, { y: 18, rotationX: -24, opacity: .5, duration: .55, stagger: .035 }, .12)
                  .add(() => { stage.dataset.introBeat = 'deconstruct'; }, .85)
                  .to(letters, { y: (i: number) => i % 2 ? -26 : 26, z: -100, rotationX: 65, opacity: 0, duration: .32, stagger: .025 }, .85)
                  .to(bridge, { light: .55, duration: .3 }, .85)
                  .add(() => { stage.dataset.introBeat = 'recompose'; }, 1.25)
                  .to(letters, { y: 0, z: 0, rotationX: 0, opacity: 1, duration: .65,
                    stagger: { each: .09, from: 'start' }, ease: 'expo.out' }, 1.25)
                  .to(bridge, { light: 1, duration: .7 }, 1.25)
                  .add(() => { stage.dataset.introBeat = 'slogan'; }, 1.9)
                  .fromTo(title, { clipPath: 'inset(0 0 100% 0)', y: 12 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .65, ease: 'power3.out', clearProps: 'clipPath,transform' }, 1.9)
                  .to('[data-brand-wordmark]', { scale: .92, duration: .65, ease: 'power3.out' }, 1.9)
                  .from('[data-hero-support]', { y: 10, opacity: .82, duration: .55, stagger: .06, clearProps: 'transform,opacity' }, 2.05);
                if (introPlayed || window.scrollY > 40) intro.progress(1);
                introPlayed = true;
                const settle = () => {
                  if (intro.progress() < 1) intro.progress(1);
                  stage.dataset.introBeat = 'settled';
                };
                removeInterrupts = listenForIntroInterruption(settle);
                gsap.to(bridge, { travel: 1, ease: 'none', onUpdate: render, scrollTrigger: {
                  trigger: stage, start: 'top top', end: 'bottom 75%', scrub: .6,
                } });
                // The wordmark becomes a quiet signature as the same camera enters the studio.
                gsap.to('[data-brand-wordmark]', { y: -35, scale: .82, opacity: .15, ease: 'none', scrollTrigger: {
                  trigger: '#hero', start: 'top top', end: 'bottom 25%', scrub: .6,
                } });
              }
              const journey = gsap.timeline({ scrollTrigger: {
                trigger: '#ai-interview', start: 'top 95%', end: 'center 55%', scrub: .7,
              } });
              journey.from('[data-depth-panel]', {
                y: 70, z: -180, rotationY: -12, rotationX: 8, scale: .94,
                transformPerspective: 1400, ease: 'none',
              }, 0).from('[data-depth-copy]', { x: -28, ease: 'none' }, 0);
              gsap.utils.toArray<HTMLElement>('[data-story-panel]').forEach((panel, index) => {
                gsap.from(panel, {
                  x: index % 2 ? 22 : -22, rotationY: index % 2 ? -6 : 6,
                  transformPerspective: 900, duration: .85, ease: 'power3.out',
                  immediateRender: false, clearProps: 'transform',
                  scrollTrigger: { trigger: panel, start: 'top 92%', once: true },
                });
              });
              gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el, index) => {
                if (el.closest('[data-story-chapter]')) return;
                gsap.from(el, {
                  x: index % 2 ? 20 : -20,
                  rotationX: 4,
                  transformPerspective: 1000,
                  opacity: 0.94,
                  immediateRender: false,
                  duration: 0.6,
                  delay: (index % 3) * 0.04,
                  ease: 'power2.out',
                  scrollTrigger: { trigger: el, start: 'top 90%', once: true },
                  clearProps: 'transform,opacity',
                });
              });

              // Chapters share the same spatial grammar: headline wipe, then depth panels.
              gsap.utils.toArray<HTMLElement>('[data-story-chapter]').forEach((chapter) => {
                const heading = chapter.querySelector('h2');
                const surfaces = chapter.querySelectorAll('[data-reveal]');
                const transition = gsap.timeline({ scrollTrigger: {
                  trigger: chapter, start: 'top 88%', end: 'top 35%', scrub: .5,
                } });
                if (heading) transition.from(heading, chapter.id === 'preparation-loop'
                  ? { opacity: .72, ease: 'none' }
                  : { clipPath: 'inset(0 100% 0 0)', x: -8, ease: 'none' }, 0);
                if (surfaces.length) transition.from(surfaces, { z: -60, rotationY: -3, transformPerspective: 1400, x: 14, ease: 'none', stagger: .12 }, 0);
              });

              gsap.from('[data-loop-node]', {
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

              const narrow = !!match.conditions?.journeyVertical;
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

            }, container);

            ScrollTrigger.refresh();
            container.dataset.motionTriggerCount = String(
              ScrollTrigger.getAll().filter((trigger) => {
                const triggerElement = trigger.trigger;
                return triggerElement instanceof Element && container.contains(triggerElement);
              }).length,
            );

            return () => {
              removeInterrupts?.();
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
      .catch((error: unknown) => {
        /* Animation is enhancement; content and actions remain usable. */
        if (root.current) {
          root.current.dataset.motionMode = 'fallback';
          root.current.dataset.motionTriggerCount = '0';
          applyLandingFinalState(root.current);
        }
        console.error('[landing-motion] Initialization failed; using the visible fallback state.', error);
      });

    return () => {
      disposed = true;
      revert?.();
    };
  }, [root]);
}
