'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionTokens } from '../motion/tokens';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useGsapScope(
  rootRef: RefObject<HTMLElement | null>,
  setup: (root: HTMLElement) => void | (() => void),
  dependencies: unknown[] = [],
) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let cleanup: (() => void) | undefined;
    const context = gsap.context(() => {
      cleanup = setup(root) || undefined;
    }, root);
    return () => {
      cleanup?.();
      context.revert();
    };
    // The caller intentionally controls the route-level lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

function runPageIntro(root: HTMLElement) {
  const intro = root.querySelectorAll<HTMLElement>('[data-product-intro], h1');
  if (!intro.length) return;
  gsap.fromTo(
    intro,
    { opacity: 0, y: motionTokens.distance.medium },
    {
      opacity: 1,
      y: 0,
      duration: motionTokens.duration.slow,
      stagger: motionTokens.stagger.fast,
      ease: 'power3.out',
    },
  );
}

function runSectionReveal(root: HTMLElement) {
  const sections = root.querySelectorAll<HTMLElement>('[data-product-reveal]');
  sections.forEach((section) => {
    if (section.matches('[data-product-intro]')) return;
    gsap.fromTo(
      section,
      { opacity: 0.01, y: motionTokens.distance.medium },
      {
        opacity: 1,
        y: 0,
        duration: motionTokens.duration.slow,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 88%', once: true },
      },
    );
  });
}

function runMetricReveal(root: HTMLElement) {
  const metrics = root.querySelectorAll<HTMLElement>('[data-product-metric]');
  metrics.forEach((metric) => {
    gsap.fromTo(
      metric,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: motionTokens.duration.count,
        delay: motionTokens.duration.instant,
        ease: 'power3.out',
        transformOrigin: 'left center',
        scrollTrigger: { trigger: metric, start: 'top 90%', once: true },
      },
    );
  });
}

function runEvidenceTimeline(root: HTMLElement) {
  const steps = root.querySelectorAll<HTMLElement>('[data-evidence-step]');
  if (!steps.length) return;
  gsap.fromTo(
    steps,
    { opacity: 0.01, x: -motionTokens.distance.small },
    {
      opacity: 1,
      x: 0,
      duration: motionTokens.duration.normal,
      stagger: motionTokens.stagger.normal,
      ease: 'power2.out',
      scrollTrigger: { trigger: steps[0], start: 'top 88%', once: true },
    },
  );
}

function runAmbientParallax(root: HTMLElement) {
  const ambient = root.querySelectorAll<HTMLElement>('[data-ambient-parallax]');
  ambient.forEach((item) => {
    gsap.to(item, {
      y: -motionTokens.distance.medium,
      ease: 'none',
      scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
    });
  });
}

export function useProductMotion(rootRef: RefObject<HTMLElement | null>, routeKey: string) {
  useGsapScope(
    rootRef,
    (root) => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        runPageIntro(root);
        runSectionReveal(root);
        runMetricReveal(root);
        runEvidenceTimeline(root);
        runAmbientParallax(root);
      });
      return () => media.revert();
    },
    [routeKey],
  );
}

export { runAmbientParallax, runEvidenceTimeline, runMetricReveal, runPageIntro, runSectionReveal };
