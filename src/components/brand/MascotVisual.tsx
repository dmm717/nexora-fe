'use client';

import React, { Component, useCallback, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { NEXORA_MASCOT_ASSETS } from '@/config/brandAssets';
import type { InterviewPresenceState } from '@/components/features/interview/AiInterviewerPresence';
import styles from './MascotVisual.module.css';
import { useVisualPolicy } from './useVisualPolicy';

const MascotCanvas = dynamic(() => import('./MascotCanvas'), { ssr: false, loading: () => null });

class MascotBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

interface MascotVisualProps {
  state?: InterviewPresenceState;
  variant?: 'welcome' | 'aiCoach';
  priority?: boolean;
  sizes?: string;
}

// Character remains official art until the refined asset passes visual review.
// This quality gate is independent of WebGL capability; no unfinished model is forced into the product.
const CHARACTER_3D_READY = false;

/** Automatic visual layer. Nothing here reads or writes interview business state. */
export function MascotVisual({ state = 'idle', variant = 'aiCoach', priority = false, sizes = '220px' }: MascotVisualProps) {
  const allowed = useVisualPolicy();
  const requested = CHARACTER_3D_READY && allowed;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setReady(false); setFailed(true); }, []);
  const artwork = variant === 'welcome' ? 'welcome' : state === 'thinking' ? 'thinking' : state === 'error' ? 'emptyHelper' : 'aiCoach';

  return (
    <div className={`${styles.visual} ${ready && requested && !failed ? styles.ready : ''}`} data-mascot-mode={ready && requested && !failed ? '3d' : '2d'}>
      <Image src={NEXORA_MASCOT_ASSETS[artwork]} width={768} height={768} alt="Mascot Nexora, đầu hình chiếc cặp, mắt ngôi sao và áo tím" priority={priority} sizes={sizes} className={styles.image} />
      {requested && !failed && (
        <MascotBoundary onError={onError}>
          <MascotCanvas state={state} welcome={variant === 'welcome'} onReady={onReady} onError={onError} />
        </MascotBoundary>
      )}
    </div>
  );
}
