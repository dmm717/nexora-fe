'use client';

import { Component, useCallback, useState, type ReactNode, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Mic, Sparkles } from 'lucide-react';
import { useVisualPolicy } from '@/components/brand/useVisualPolicy';
import { NEXORA_MASCOT_ASSETS } from '@/config/brandAssets';
import styles from './cinematic.module.css';

const BrandScene = dynamic(() => import('./NexoraBrandScene'), { ssr: false, loading: () => null });
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function CinematicHero({ action }: { action: ReactNode }) {
  const allowed = useVisualPolicy();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setFailed(true); setReady(false); }, []);
  const mode = ready && allowed && !failed ? '3d' : 'image';
  return (
    <div className={styles.journey} data-cinematic-journey data-render-mode={mode} data-render-policy={allowed ? 'enhanced' : 'conservative'} data-scene-failed={failed}>
      <div className={styles.environment} aria-hidden="true">
        <div className={styles.halo} />
        <div className={styles.horizon} />
        <div className={`${styles.emblemFallback} ${mode === '3d' ? styles.hidden : ''}`}>
          <svg viewBox="0 0 512 512"><polygon points="276.7,42.1 274.6,256.0 106.5,133.8 106.5,378.2 232.0,469.9 233.1,250.5 401.2,372.8 401.2,133.8" /></svg>
        </div>
        {allowed && !failed && <SceneBoundary onError={onError}><BrandScene onReady={onReady} onError={onError} /></SceneBoundary>}
      </div>
      <section id="hero" className={styles.opening} aria-labelledby="cinematic-title">
        <div className={styles.sceneIndex} data-cinematic-copy><span>01 — Enter Nexora</span><span>Không gian luyện phỏng vấn cùng AI</span></div>
        <div className={styles.openingCopy}>
          {/* Each glyph uses the unchanged official logo sprite, preserving its geometry. */}
          <div className={styles.wordmark} aria-hidden="true" data-brand-wordmark>
            {[[160, 76], [240, 76], [318, 146], [464, 67], [532, 75]].map(([offset, width], index) => (
              <span key={index} className={styles.brandLetter} data-brand-letter style={{ '--glyph-x': offset, '--glyph-width': width } as CSSProperties} />
            ))}
          </div>
          <p className={styles.kicker} data-cinematic-copy><span /> Chuẩn bị cho điều tiếp theo.</p>
          <h1 id="cinematic-title" data-cinematic-copy>Luyện tập hôm nay.<br /><span>Tự tin chinh phục<br className={styles.mobileBreak} /> ngày mai.</span></h1>
          <p className={styles.description} data-cinematic-copy data-hero-support>Luyện phỏng vấn với AI, hiểu câu trả lời của bạn<br className={styles.desktopBreak} /> và bước vào buổi phỏng vấn thật với sự chuẩn bị.</p>
          <div className={styles.actions} data-cinematic-copy data-hero-support>{action}<noscript><Link href="/interviews/new" prefetch={false}>Bắt đầu luyện tập <ArrowUpRight size={17} /></Link></noscript><a href="#ai-interview">Khám phá hành trình <ArrowUpRight size={17} /></a></div>
        </div>
        <a href="#ai-interview" className={styles.scrollCue}><ArrowDown size={16} /><span>Cuộn để bước vào studio</span></a>
        <div className={styles.openingFooter}><span>Practice. Reflect. Grow.</span><span>Phỏng vấn · CV · Năng lực</span></div>
      </section>
      <section id="ai-interview" className={styles.practiceScene} aria-labelledby="practice-scene-title">
        <div className={styles.practiceCopy} data-depth-copy>
          <p className={styles.kicker}>02 — Practice with AI</p>
          <h2 id="practice-scene-title">Cuộc trò chuyện hôm nay.<br /><span>Sự tự tin ngày mai.</span></h2>
          <p>Thử trả lời theo vị trí bạn hướng tới. Luyện cách lập luận, xử lý câu hỏi tiếp nối và kể rõ đóng góp của mình.</p>
          <a href="#report-story">Điều gì xảy ra sau câu trả lời? <ArrowDown size={17} /></a>
        </div>
        <div className={styles.studioPreview} data-depth-panel aria-label="Minh họa Nexora Interview Studio, không phải phiên trực tiếp">
          <div className={styles.previewTop}><span><span /> Nexora Interview Studio</span><small>Minh họa trải nghiệm</small></div>
          <div className={styles.previewStage}>
            <Image src={NEXORA_MASCOT_ASSETS.aiCoach} width={768} height={768} sizes="(max-width: 600px) 150px, 220px" alt="Nexora AI, người đồng hành luyện phỏng vấn" />
            <div><span>Câu hỏi minh họa / Kinh nghiệm dự án</span><p>“Hãy kể về một lần bạn giải quyết vấn đề khó trong dự án. Bạn đã tiếp cận như thế nào?”</p></div>
          </div>
          <div className={styles.previewDock}><span><Mic size={18} /> Giọng nói</span><span>Trả lời bằng bàn phím</span><Sparkles size={17} /><small>Thử. Hiểu. Luyện lại.</small></div>
        </div>
      </section>
    </div>
  );
}
