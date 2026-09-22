'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Target,
  Mic,
  RotateCcw,
  ChartNoAxesCombined,
  Sparkles,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  Play,
  CheckCheck,
} from 'lucide-react';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { LandingPlanCard } from './LandingPlanCard';
import { LandingTestimonials } from './LandingTestimonials';
import { useLandingMotion } from './useLandingMotion';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { usePlans } from '@/hooks/queries/useBilling';
import type { PlanView, PlanPrice } from '@/services/billingApi';
import type { AuthIntent } from '@/utils/authIntent';
import { getQueryPresentation } from '@/utils/queryPresentation';
import { NEXORA_MASCOT_ASSETS } from '@/config/brandAssets';
import styles from './landing.module.css';

const loopSteps = [
  {
    title: 'Mục tiêu nghề nghiệp',
    text: 'Chọn vị trí bạn muốn chinh phục.',
    icon: Target,
  },
  {
    title: 'Luyện tập',
    text: 'CV, phỏng vấn và tình huống thực tế.',
    icon: Mic,
  },
  {
    title: 'Báo cáo',
    text: 'Hiểu câu trả lời đã tốt ở đâu.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Gợi ý cải thiện',
    text: 'Biết chính xác bước tiếp theo.',
    icon: Sparkles,
  },
  {
    title: 'Luyện lại',
    text: 'Thử lại phần cần nâng cấp.',
    icon: RotateCcw,
  },
];

const starSteps = [
  { letter: 'S', title: 'Bối cảnh', text: 'Chuyện gì đã xảy ra?' },
  { letter: 'T', title: 'Nhiệm vụ', text: 'Bạn chịu trách nhiệm điều gì?' },
  { letter: 'A', title: 'Hành động', text: 'Bạn đã trực tiếp làm gì?' },
  { letter: 'R', title: 'Kết quả', text: 'Điều gì thay đổi sau đó?' },
];

function Meter({ label, value, demo = false }: { label: string; value: number; demo?: boolean }) {
  return (
    <div className={styles.meterRow}>
      <div>
        <span>{label}</span>
        <b>{value}/100</b>
      </div>
      <div className={styles.meterTrack}>
        <span
          data-meter={demo ? undefined : ''}
          data-cv-meter={demo ? '' : undefined}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SampleLabel({ label = 'Ví dụ kết quả' }: { label?: string }) {
  return (
    <span className={styles.sample}>
      <Sparkles size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

type CvDemoStage = 'empty' | 'document' | 'scanning' | 'result';

function CvPreview({
  compact = false,
  demoStage = 'result',
  onStartDemo,
}: {
  compact?: boolean;
  demoStage?: CvDemoStage;
  onStartDemo?: () => void;
}) {
  const scoreRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (compact || demoStage !== 'result' || !resultRef.current) return undefined;

    let cancelled = false;
    let context: { revert: () => void } | undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const showFinalState = () => {
      const result = resultRef.current;
      if (!result) return;

      result.style.opacity = '1';
      result.style.transform = 'none';
      result.querySelectorAll<SVGCircleElement>('[data-cv-radial]').forEach((element) => {
        element.style.strokeDashoffset = element.dataset.radialFinal || '58';
      });
      result.querySelectorAll<HTMLElement>('[data-cv-meter]').forEach((element) => {
        element.style.transform = 'none';
      });
      if (scoreRef.current) scoreRef.current.textContent = '78';
    };
    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        context?.revert();
        showFinalState();
      }
    };

    if (reducedMotion.matches) {
      showFinalState();
      return undefined;
    }

    reducedMotion.addEventListener('change', handleMotionPreferenceChange);
    import('gsap').then(({ gsap }) => {
      if (cancelled || !resultRef.current || !scoreRef.current) return;
      if (reducedMotion.matches) {
        showFinalState();
        return;
      }

      scoreRef.current.textContent = '0';
      const score = { value: 0 };
      context = gsap.context(() => {
        const timeline = gsap.timeline();
        timeline
          .from(resultRef.current, { y: 18, opacity: 0.6, duration: 0.45, ease: 'power2.out' })
          .fromTo(
            '[data-cv-radial]',
            { strokeDashoffset: 264 },
            { strokeDashoffset: 58, duration: 0.9, ease: 'power2.out' },
            0.1,
          )
          .fromTo(
            '[data-cv-meter]',
            { scaleX: 0, transformOrigin: 'left center' },
            { scaleX: 1, duration: 0.75, stagger: 0.12, ease: 'power2.out' },
            0.2,
          )
          .to(
            score,
            {
              value: 78,
              duration: 0.9,
              ease: 'power2.out',
              onUpdate: () => {
                if (scoreRef.current) scoreRef.current.textContent = String(Math.round(score.value));
              },
            },
            0.1,
          );
      }, resultRef.current);
    }).catch((error: unknown) => {
      showFinalState();
      console.error('[cv-demo-motion] Initialization failed; using the visible fallback state.', error);
    });

    return () => {
      cancelled = true;
      reducedMotion.removeEventListener('change', handleMotionPreferenceChange);
      context?.revert();
      showFinalState();
    };
  }, [compact, demoStage]);

  const showResult = compact || demoStage === 'result';
  const showSampleContext = compact || demoStage !== 'empty';

  return (
    <div className={`${styles.productWindow} ${compact ? styles.compact : ''}`}>
      <div className={styles.windowTop}>
        <span>
          <FileText size={16} />
          Phân tích CV
        </span>
        {!compact && <SampleLabel />}
      </div>
      {showResult ? (
        <div ref={compact ? undefined : resultRef} data-cv-demo-result={compact ? undefined : ''}>
          <div className={styles.scoreSummary}>
            <div className={styles.scoreRing}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" />
                <circle
                  data-radial={compact ? '' : undefined}
                  data-cv-radial={compact ? undefined : ''}
                  data-radial-final="58"
                  cx="50"
                  cy="50"
                  r="42"
                  strokeDasharray="264"
                  strokeDashoffset="58"
                />
              </svg>
              <b
                ref={scoreRef}
                data-count={compact ? '78' : undefined}
                data-cv-count={compact ? undefined : '78'}
              >
                78
              </b>
            </div>
            <div>
              <strong>CV có nền tảng tốt.</strong>
              <p>Cần làm rõ tác động trong dự án.</p>
              <span className={styles.positive}>
                <CheckCheck size={14} />
                Mục tiêu: Lập trình viên Backend
              </span>
            </div>
          </div>
          {!compact && (
            <>
              <Meter label="Kinh nghiệm phù hợp" value={82} demo />
              <Meter label="Bằng chứng kết quả" value={64} demo />
              <div className={styles.feedback}>
                <Sparkles size={18} />
                <p>
                  <b>Một thay đổi đáng ưu tiên</b>
                  <br />
                  Thay “tham gia tối ưu API” bằng hành động cụ thể và kết quả có thể kiểm chứng.
                </p>
              </div>
              <button className={styles.textAction} type="button" onClick={onStartDemo}>
                Xem lại cách phân tích
                <RotateCcw size={16} />
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {showSampleContext && (
            <div className={styles.cvSampleContext}>
              <div>
                <FileText size={18} aria-hidden="true" />
                <span>CV ví dụ · Backend Engineer</span>
              </div>
              <span>Mục tiêu: Lập trình viên Backend</span>
            </div>
          )}
          {demoStage === 'empty' ? (
            <div className={styles.emptyState}>
              <FileText size={34} aria-hidden="true" />
              <h3>Chưa có CV chính</h3>
              <p>Chưa chọn vị trí mục tiêu · Chưa có kết quả phân tích</p>
              <button className={styles.primaryAction} type="button" onClick={onStartDemo}>
                Xem thử cách phân tích
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              {demoStage === 'scanning' && (
                <div className={styles.analyzing}>
                  <span className={styles.analyzingDots} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>Đang đối chiếu CV với vị trí mục tiêu…</span>
                </div>
              )}
              {demoStage === 'document' && (
                <div className={styles.cvDocumentState}>
                  <span className={styles.documentLine} />
                  <span className={styles.documentLine} />
                  <span className={`${styles.documentLine} ${styles.short}`} />
                  <span className={styles.documentTag}>Đã nhận CV ví dụ</span>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function InterviewPreview({ large = false }: { large?: boolean }) {
  return (
    <div className={`${styles.interviewWindow} ${large ? styles.largeInterview : ''}`}>
      <div className={styles.windowTop}>
        <span>
          <Mic size={16} />
          Phỏng vấn AI
        </span>
        {large && <SampleLabel />}
      </div>
      <div className={styles.interviewMeta}>
        <span>
          <span className={styles.statusDot} />
          Phiên luyện · Câu hỏi 1
        </span>
        <span>Lập trình viên Backend</span>
      </div>
      <div className={styles.aiAvatar}>
        <Sparkles size={25} aria-hidden="true" />
        <div>
          <strong>Nexora AI</strong>
          <span>Người đồng hành luyện phỏng vấn</span>
        </div>
      </div>
      <p className={styles.question}>
        “Hãy kể về một lần bạn xử lý vấn đề hiệu năng trong dự án. Bạn đã tiếp cận như thế nào?”
      </p>
      {large && (
        <>
          <div className={styles.answer}>
            <span>Ví dụ câu trả lời</span>
            <p>
              Trong dự án quản lý lớp học, tôi kiểm tra truy vấn chậm, bổ sung index và đo lại thời
              gian phản hồi trước khi triển khai…
            </p>
          </div>
          <div className={styles.starChips}>
            {starSteps.map((item) => (
              <span key={item.letter}>
                <b>{item.letter}</b>
                {item.title}
              </span>
            ))}
          </div>
        </>
      )}
      <div className={styles.waveform} aria-hidden="true">
        {Array.from({ length: 25 }, (_, i) => (
          <i
            key={i}
            style={{
              height: `${8 + ((i * 17) % 29)}px`,
              animationDelay: `${i * 0.09}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className={styles.checkList}>
      {items.map((text) => (
        <li key={text}>
          <Check size={16} aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  );
}

export function MarketingLanding() {
  const root = useRef<HTMLDivElement>(null);
  useLandingMotion(root);
  const router = useRouter();
  const { isAuthenticated, authReady } = useAuth();
  const plansQuery = usePlans();
  const {
    data: plans,
    isLoading: loadingPlans,
    isError: plansHaveError,
    isFetching: fetchingPlans,
    refetch: refetchPlans,
  } = plansQuery;
  const hasPlansData = plans !== undefined;
  const plansPresentation = getQueryPresentation({
    hasData: hasPlansData,
    isLoading: loadingPlans,
    isError: plansHaveError,
    isFetching: fetchingPlans,
  });
  const pricedPlans = (plans ?? []).flatMap((plan) => {
    const price = plan.prices?.[0];
    return price ? [{ plan, price }] : [];
  });

  const [pendingIntent, setPendingIntent] = useState<AuthIntent | null>(null);
  const [preview, setPreview] = useState<'cv' | 'interview' | 'recommendation'>('cv');
  const [showEmpty, setShowEmpty] = useState(true);
  const [cvDemoRun, setCvDemoRun] = useState(0);
  const [cvDemoStage, setCvDemoStage] = useState<CvDemoStage>('empty');

  useEffect(() => {
    if (cvDemoRun === 0) return undefined;
    const scanTimer = window.setTimeout(() => setCvDemoStage('scanning'), 850);
    const resultTimer = window.setTimeout(() => setCvDemoStage('result'), 2500);
    return () => {
      window.clearTimeout(scanTimer);
      window.clearTimeout(resultTimer);
    };
  }, [cvDemoRun]);

  const startCvDemo = () => {
    setCvDemoStage('document');
    setCvDemoRun((run) => run + 1);
  };

  const start = (action: AuthIntent['action'], targetUrl: string) => {
    if (!authReady) return;
    if (isAuthenticated) {
      router.push(targetUrl);
    } else {
      setPendingIntent({ action, targetUrl });
    }
  };

  const handleSelectPlan = (plan: PlanView, price: PlanPrice) => {
    if (!authReady) return;
    if (price.amountMinor === 0) {
      start('navigation', '/overview');
      return;
    }
    const checkoutUrl = `/billing?selectedPriceId=${encodeURIComponent(price.id)}`;
    if (isAuthenticated) {
      // Authenticated user selecting paid plan navigates directly to canonical billing checkout
      router.push(checkoutUrl);
    } else {
      setPendingIntent({
        action: 'checkout',
        targetUrl: checkoutUrl,
        planPriceId: price.id,
      });
    }
  };

  const actionButton = (
    text: string,
    type: AuthIntent['action'],
    url: string,
    light = false
  ) => (
    <button
      type="button"
      className={`${styles.primaryAction} ${light ? styles.lightAction : ''}`}
      disabled={!authReady}
      onClick={() => start(type, url)}
    >
      {text}
      <ArrowUpRight size={18} aria-hidden="true" />
    </button>
  );

  return (
    <div ref={root} className={styles.landing}>
      {/* 1. Hero Section */}
      <section id="hero" className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 data-hero-copy>
              Chuẩn bị đúng chỗ.
              <br />
              <span>Tự tin bước vào phỏng vấn.</span>
            </h1>
            <p data-hero-copy className={styles.heroDescription}>
              Từ CV đến câu trả lời phỏng vấn, Nexora giúp bạn nhận ra phần còn thiếu và luyện lại
              với mục tiêu rõ ràng.
            </p>
            <div data-hero-copy className={styles.actions}>
              {actionButton(
                'Bắt đầu luyện miễn phí',
                'interview',
                '/interview'
              )}
              <a className={styles.secondaryAction} href="#preparation-loop">
                <Play size={16} aria-hidden="true" />
                Khám phá cách Nexora hoạt động
              </a>
            </div>
            <div data-hero-copy className={styles.benefits}>
              <span>
                <Check size={14} />
                Bắt đầu với gói miễn phí
              </span>
              <span>
                <Target size={14} />
                Theo mục tiêu nghề nghiệp
              </span>
              <span>
                <ShieldCheck size={14} />
                Phản hồi có bằng chứng
              </span>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <span className={styles.heroDemoLabel}>Xem trước trải nghiệm</span>
            <Image
              unoptimized
              data-parallax
              className={styles.orbitArt}
              src="/assets/landing/career-orbit.webp"
              alt=""
              width={1200}
              height={800}
              sizes="(max-width: 760px) 100vw, 55vw"
              priority
            />
            <div data-hero-card className={styles.heroCv}>
              <div data-float className={styles.heroFloatLayer}>
                <CvPreview compact />
              </div>
            </div>
            <div data-hero-card className={styles.heroInterview}>
              <div data-float className={styles.heroFloatLayer}>
                <InterviewPreview />
              </div>
            </div>
            <div data-hero-card className={styles.heroRecommendation}>
              <div data-float className={styles.heroRecommendationCard}>
                <span className={styles.suggestionIcon}>
                  <RotateCcw size={18} />
                </span>
                <div>
                  <b>Bước tiếp theo của bạn</b>
                  <p>Luyện lại cách trình bày kết quả theo STAR.</p>
                </div>
                <ArrowRight size={17} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Preparation Loop Section */}
      <section id="preparation-loop" className={styles.loopSection}>
        <div className={styles.sectionHeading} data-reveal>
          <h2>
            Mỗi lần luyện tập.
            <br />
            <span>Một bước tiến có cơ sở.</span>
          </h2>
          <p>
            Không dừng lại ở một điểm số. Kết quả hôm nay trở thành định hướng cho lần luyện tiếp
            theo.
          </p>
        </div>
        <div className={styles.loopContainer}>
          <div className={styles.loopTrack} data-loop-track aria-hidden="true">
            <span className={styles.flowHighlight} />
          </div>
          <ol className={styles.loop}>
            {loopSteps.map(({ title, text, icon: Icon }, i) => (
              <li key={title} data-loop-node>
                <span className={styles.loopIcon}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className={styles.loopStep}>Bước {i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
        <p className={styles.loopReturn}>
          <RotateCcw size={15} />
          Quay lại mục tiêu. Tiếp tục hoàn thiện.
        </p>
      </section>

      {/* 3. CV Analysis Feature Section */}
      <section id="cv-analysis" className={`${styles.section} ${styles.featureGrid}`}>
        <div className={styles.featureCopy} data-reveal>
          <h2>
            CV không chỉ cần đẹp.
            <br />
            <span>Cần nói đúng điều nhà tuyển dụng tìm.</span>
          </h2>
          <p>
            Đặt CV vào bối cảnh vị trí mục tiêu. Nhìn rõ kinh nghiệm phù hợp, phần còn thiếu và
            những câu cần bằng chứng tốt hơn.
          </p>
          <Checklist
            items={[
              'So khớp hồ sơ với mục tiêu nghề nghiệp.',
              'Gợi ý chỉnh sửa cụ thể, không chỉ một điểm tổng.',
              'Dùng kết quả CV làm nền cho lần luyện tiếp theo.',
            ]}
          />
          {actionButton('Khám phá hồ sơ CV của bạn', 'cv_analysis', '/cv-analysis')}
        </div>
        <div className={styles.previewStage} data-reveal>
          <Image
            src={NEXORA_MASCOT_ASSETS.cvAnalysis}
            width={768}
            height={768}
            sizes="(max-width: 1100px) 88px, 112px"
            alt=""
            aria-hidden="true"
            className={`${styles.featureMascot} ${styles.cvMascot}`}
          />
          <div className={styles.previewTabs} aria-label="Chọn nội dung xem trước">
            {[
              { id: 'cv', name: 'CV' },
              { id: 'interview', name: 'Phỏng vấn' },
              { id: 'recommendation', name: 'Gợi ý' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={preview === item.id}
                aria-controls="product-preview"
                onClick={() => setPreview(item.id as typeof preview)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div id="product-preview" className={styles.tabPanel}>
            {preview === 'cv' ? (
              <CvPreview demoStage={cvDemoStage} onStartDemo={startCvDemo} />
            ) : preview === 'interview' ? (
              <InterviewPreview large />
            ) : (
              <div className={styles.productWindow}>
                <div className={styles.windowTop}>
                  <span>
                    <RotateCcw size={17} />
                    Kế hoạch luyện tiếp
                  </span>
                  <SampleLabel />
                </div>
                <h3>Cụ thể hơn ở phần kết quả.</h3>
                <p>Câu trả lời đã nêu rõ hành động, nhưng chưa cho thấy tác động của giải pháp.</p>
                <div className={styles.feedback}>
                  <Target size={20} />
                  <p>
                    <b>Bài luyện đề xuất</b>
                    <br />
                    Kể lại tình huống với kết quả đo được hoặc bằng chứng định tính rõ ràng.
                  </p>
                </div>
                {actionButton('Luyện lại theo STAR', 'star', '/star-builder')}
              </div>
            )}
          </div>
          <p className={styles.stageNote}>
            Ví dụ kết quả cho vị trí Lập trình viên Backend.
          </p>
        </div>
      </section>

      {/* 4. AI Interview Section */}
      <section id="ai-interview" className={styles.interviewSection}>
        <div className={`${styles.section} ${styles.featureGrid}`}>
          <div className={styles.featureCopy} data-reveal>
            <h2>
              Buổi phỏng vấn thật
              <br />
              không phải nơi để <span>thử lần đầu.</span>
            </h2>
            <p>
              Luyện theo vị trí mục tiêu, xử lý câu hỏi tiếp nối và biết câu trả lời còn thiếu bằng
              chứng ở đâu.
            </p>
            <Checklist
              items={[
                'Chuẩn bị vị trí và độ khó trước khi bắt đầu.',
                'Luyện câu hỏi tiếp nối trong một phiên liền mạch.',
                'Đọc báo cáo rồi luyện lại điểm cần cải thiện.',
              ]}
            />
            {actionButton(
              'Thử phỏng vấn AI',
              'interview',
              '/interview',
              true
            )}
            <p className={styles.freeNote}>
              Xem bảng giá để chọn hạn mức luyện tập phù hợp.
            </p>
          </div>
          <div className={styles.interviewVisual} data-reveal>
            <Image
              src={NEXORA_MASCOT_ASSETS.aiCoach}
              width={768}
              height={768}
              sizes="(max-width: 1100px) 92px, 118px"
              alt=""
              aria-hidden="true"
              className={`${styles.featureMascot} ${styles.interviewMascot}`}
            />
            <InterviewPreview large />
            <div className={styles.reportStrip}>
              <ChartNoAxesCombined size={22} />
              <div>
                <b>Từ câu trả lời đến hành động.</b>
                <p>Báo cáo → Gợi ý cụ thể → Luyện lại</p>
              </div>
              <ArrowRight size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Practice Hub Section */}
      <section id="practice" className={styles.section}>
        <div className={styles.sectionHeading} data-reveal>
          <h2>
            Câu trả lời tốt
            <br />
            <span>đến từ việc luyện đúng.</span>
          </h2>
          <p>
            Chọn cách luyện phù hợp với điểm bạn đang muốn cải thiện. Không cần bắt đầu lại cả hành
            trình.
          </p>
        </div>
        <div className={styles.practiceGrid}>
          <article className={styles.scenarioPanel} data-reveal>
            <div className={styles.practiceTitle}>
              <BookOpen size={26} />
              <h3>Thư viện tình huống</h3>
            </div>
            <p>Tập giải quyết những câu hỏi cần lập luận, lựa chọn và đánh đổi trong công việc.</p>
            <div className={styles.scenarioExample}>
              <span>Ví dụ tình huống kỹ thuật</span>
              <h4>
                Hệ thống gặp deadlock.
                <br />
                Bạn bắt đầu điều tra từ đâu?
              </h4>
              <div>
                <span>Phân tích vấn đề</span>
                <span>Giải thích lựa chọn</span>
              </div>
            </div>
            <button
              className={styles.textAction}
              type="button"
              onClick={() => start('scenario', '/scenarios')}
            >
              Mở thư viện tình huống
              <ArrowUpRight size={19} />
            </button>
          </article>
          <article className={styles.starPanel} data-reveal>
            <div className={styles.practiceTitle}>
              <MessageSquare size={26} />
              <h3>Luyện phản xạ STAR</h3>
            </div>
            <p>
              Biến một câu chuyện dài thành câu trả lời rõ bối cảnh, đúng trọng tâm và có kết quả.
            </p>
            <div className={styles.starRows}>
              {starSteps.map((item) => (
                <div key={item.letter}>
                  <b>{item.letter}</b>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <button
              className={styles.textAction}
              type="button"
              onClick={() => start('star', '/star-builder')}
            >
              Bắt đầu bài luyện STAR
              <ArrowUpRight size={19} />
            </button>
          </article>
        </div>
      </section>

      {/* 6. Capabilities Progression Section */}
      <section id="capabilities" className={`${styles.section} ${styles.featureGrid}`}>
        <div className={styles.progressStage} data-reveal>
          <div className={styles.windowTop}>
            <span>
              <ChartNoAxesCombined size={17} />
              Hồ sơ năng lực
            </span>
            <SampleLabel />
          </div>
          <button
            type="button"
            className={styles.emptyToggle}
            aria-pressed={showEmpty}
            onClick={() => setShowEmpty(!showEmpty)}
          >
            {showEmpty ? 'Xem ví dụ khi đã có dữ liệu' : 'Xem trạng thái tài khoản mới'}
            <RotateCcw size={14} />
          </button>
          {showEmpty ? (
            <div className={styles.emptyState}>
              <Image
                src={NEXORA_MASCOT_ASSETS.emptyHelper}
                width={768}
                height={768}
                sizes="96px"
                alt=""
                aria-hidden="true"
                className={styles.emptyMascot}
              />
              <h3>Chưa đủ dữ liệu đánh giá</h3>
              <p>
                Thêm mục tiêu nghề nghiệp và hoàn thành bài phân tích CV hoặc phiên luyện đầu tiên.
                Tiến độ sẽ bắt đầu từ bằng chứng của bạn.
              </p>
              {actionButton(
                'Bắt đầu phiên đầu tiên',
                'interview',
                '/interview'
              )}
            </div>
          ) : (
            <>
              <h3>Nhìn rõ điểm cần luyện tiếp.</h3>
              <Meter label="Cấu trúc câu trả lời" value={76} />
              <Meter label="Chiều sâu chuyên môn" value={68} />
              <Meter label="Bằng chứng kết quả" value={62} />
              <div className={styles.feedback}>
                <RotateCcw size={22} />
                <p>
                  <b>Ưu tiên: làm rõ kết quả</b>
                  <br />
                  Luyện lại câu trả lời về tối ưu hiệu năng. So sánh lần thử để nhận ra điều đã thay
                  đổi.
                </p>
              </div>
              <div className={styles.historyRow}>
                <span>Lần thử trước</span>
                <ArrowRight size={16} />
                <b>Lần luyện tiếp theo</b>
              </div>
            </>
          )}
        </div>
        <div className={styles.featureCopy} data-reveal>
          <h2>
            Đừng đo tiến bộ
            <br />
            <span>bằng cảm giác.</span>
          </h2>
          <p>
            Kết nối lịch sử luyện tập, báo cáo và gợi ý cải thiện theo mục tiêu của bạn. Biết điều
            gì đã thay đổi và điều gì vẫn cần thêm bằng chứng.
          </p>
          <Checklist
            items={[
              'Theo dõi các lần thử trong cùng hành trình.',
              'Từ điểm còn thiếu đến bài luyện có mục tiêu.',
              'Tài khoản mới hiển thị trạng thái chưa đủ dữ liệu.',
            ]}
          />
          {actionButton('Xem hành trình năng lực', 'navigation', '/overview')}
        </div>
      </section>

      {/* 7. Public Pricing Preview Section */}
      <section id="pricing" className={`${styles.section} ${styles.pricingSection}`}>
        <div className={styles.sectionHeading} data-reveal>
          <h2>
            Bắt đầu miễn phí.
            <br />
            <span>Đi sâu khi bạn cần.</span>
          </h2>
          <p>
            Thử phương pháp trước khi chọn gói. Nâng cấp để mở rộng luyện phỏng vấn và những tính
            năng chuyên sâu.
          </p>
        </div>
        {plansPresentation.showInitialLoading && (
          <div role="status">
            <div className={styles.pricingGrid} aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={styles.planSkeleton}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-9 w-1/2" />
                  <div className="space-y-3 pt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg mt-auto" />
                </div>
              ))}
            </div>
            <span className="sr-only">Đang tải thông tin các gói dịch vụ...</span>
          </div>
        )}
        {plansPresentation.showBlockingError && (
          <div role="alert" className={styles.pricingMessage}>
            <div>
              <h3>Chưa tải được bảng giá</h3>
              <p>Kiểm tra kết nối rồi thử tải lại. Hiện chưa thể chọn gói khi chưa có thông tin giá.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetchPlans()}>
              Thử tải lại
            </Button>
          </div>
        )}
        {plansPresentation.showBackgroundError && (
          <div role="alert" className={styles.pricingMessage}>
            <div>
              <h3>Bảng giá chưa được cập nhật</h3>
              <p>Thông tin đã tải trước đó vẫn được giữ lại.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetchPlans()}>
              Thử tải lại
            </Button>
          </div>
        )}
        {plansPresentation.showRefreshing && !plansPresentation.showBackgroundError && (
          <p role="status" className={styles.pricingStatus}>Đang cập nhật bảng giá...</p>
        )}
        {hasPlansData && pricedPlans.length === 0 && (
          <div role="status" className={styles.pricingEmpty}>
            <h3>Chưa có gói giá khả dụng</h3>
            <p>Bảng giá chưa có lựa chọn khả dụng vào lúc này. Bạn có thể quay lại sau.</p>
          </div>
        )}
        {pricedPlans.length > 0 && (
          <div className={styles.pricingGrid}>
            {pricedPlans.map(({ plan, price }) => (
              <div data-reveal className={styles.planWrap} key={plan.id}>
                <LandingPlanCard
                  plan={plan}
                  price={price}
                  isHighlighted={plan.isHighlighted}
                  disabled={!authReady}
                  onSelect={handleSelectPlan}
                />
              </div>
            ))}
          </div>
        )}
        <div className={styles.pricingNote}>
          <ShieldCheck size={17} />
          <p>
            Xem rõ giá và quyền lợi trước khi chọn gói. Bạn có thể thay đổi bất kỳ lúc nào.
          </p>
          <Link href="/pricing">
            Xem chi tiết bảng giá
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <LandingTestimonials />

      {/* 8. Final Call to Action */}
      <section className={styles.finalCta} data-reveal>
        <div>
          <h2>
            Lần phỏng vấn tiếp theo.
            <br />
            <span>Một phiên bản tốt hơn của bạn.</span>
          </h2>
          <p>Bắt đầu từ vị trí bạn hướng tới. Nexora giúp bạn tìm bước luyện tiếp theo.</p>
          {actionButton(
            'Bắt đầu hành trình miễn phí',
            'interview',
            '/interview',
            true
          )}
          <span className={styles.finalNote}>
            Không cần thẻ thanh toán để bắt đầu phiên luyện miễn phí.
          </span>
        </div>
        <Image
          src={NEXORA_MASCOT_ASSETS.celebrate}
          width={768}
          height={768}
          alt=""
          aria-hidden="true"
          sizes="(max-width: 760px) 150px, 300px"
          className={styles.finalMascot}
        />
      </section>

      {/* Auth Gate Modal */}
      <AuthGateModal
        isOpen={!!pendingIntent}
        pendingIntent={pendingIntent}
        onClose={() => setPendingIntent(null)}
      />
    </div>
  );
}
