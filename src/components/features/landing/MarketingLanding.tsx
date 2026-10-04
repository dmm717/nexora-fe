'use client';

import React, { useRef, useState } from 'react';
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
import { resolveCheckoutDestination, type AuthIntent } from '@/utils/authIntent';
import { getQueryPresentation } from '@/utils/queryPresentation';
import { NEXORA_MASCOT_ASSETS } from '@/config/brandAssets';
import { CinematicHero } from './CinematicHero';
import { INTERVIEW_START_PATH } from '@/config/navigation';
import journey from './PreparationJourney.module.css';
import styles from './landing.module.css';

const loopSteps = [
  {
    title: 'Mục tiêu nghề nghiệp',
    text: 'Chọn vị trí bạn muốn chinh phục.',
    icon: Target,
    href: '/career-goals', action: 'Đặt mục tiêu',
  },
  {
    title: 'Luyện tập',
    text: 'CV, phỏng vấn và tình huống thực tế.',
    icon: Mic,
    href: INTERVIEW_START_PATH, action: 'Bắt đầu luyện',
  },
  {
    title: 'Báo cáo',
    text: 'Hiểu câu trả lời đã tốt ở đâu.',
    icon: ChartNoAxesCombined,
    href: '/interviews/history', action: 'Xem báo cáo',
  },
  {
    title: 'Gợi ý cải thiện',
    text: 'Biết chính xác bước tiếp theo.',
    icon: Sparkles,
    href: '/learning-path', action: 'Xem lộ trình',
  },
  {
    title: 'Luyện lại',
    text: 'Thử lại phần cần nâng cấp.',
    icon: RotateCcw,
    href: INTERVIEW_START_PATH, action: 'Luyện thêm',
  },
];

const starSteps = [
  { letter: 'S', title: 'Bối cảnh', text: 'Chuyện gì đã xảy ra?' },
  { letter: 'T', title: 'Nhiệm vụ', text: 'Bạn chịu trách nhiệm điều gì?' },
  { letter: 'A', title: 'Hành động', text: 'Bạn đã trực tiếp làm gì?' },
  { letter: 'R', title: 'Kết quả', text: 'Điều gì thay đổi sau đó?' },
];

function SampleLabel({ label = 'Ví dụ kết quả' }: { label?: string }) {
  return (
    <span className={styles.sample}>
      <Sparkles size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

function CvPreview() {
  return (
    <div className={`${styles.productWindow} ${styles.documentPreview}`} data-document-preview>
      <div className={styles.windowTop}><span><FileText size={16} /> Phân tích CV</span><SampleLabel label="Minh họa cấu trúc báo cáo" /></div>
      <div className={styles.documentLayout}>
        <div className={styles.documentArtifact} data-story-panel>
          <span>HỒ SƠ NGHỀ NGHIỆP</span><h3>Câu chuyện<br />của bạn.</h3>
          <div /><div /><div />
          <strong>Kinh nghiệm & dự án</strong><div /><div />
          <strong>Kỹ năng & công nghệ</strong><div /><div />
        </div>
        <div className={styles.documentInsights}>
          <span>Đặt hồ sơ vào đúng bối cảnh.</span>
          <div data-story-panel><b>Kinh nghiệm phù hợp</b><p>Đối chiếu với vị trí hoặc JD bạn chọn.</p></div>
          <div data-story-panel><b>Bằng chứng trong dự án</b><p>Làm rõ hành động và tác động của bạn.</p></div>
          <div data-story-panel><b>Những điều cần bổ sung</b><p>Gợi ý từ nội dung phân tích thực tế.</p></div>
        </div>
      </div>
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
        <SampleLabel label="Minh họa trải nghiệm" />
      </div>
      <div className={styles.interviewMeta}>
        <span>
          <span className={styles.statusDot} />
          Phiên luyện · Câu hỏi 1
        </span>
        <span>Lập trình viên Backend</span>
      </div>
      <div className={styles.aiAvatar}>
        <Image src={NEXORA_MASCOT_ASSETS.sticker} width={56} height={56} alt="" />
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
    const checkoutUrl = resolveCheckoutDestination(price.id) ?? '/pricing';
    if (isAuthenticated) {
      // Authenticated user selecting a paid plan uses the canonical pricing checkout.
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
      <ArrowRight size={18} aria-hidden="true" />
    </button>
  );

  return (
    <div ref={root} className={styles.landing}>
      <CinematicHero action={actionButton('Bắt đầu luyện tập', 'interview', INTERVIEW_START_PATH)} />

      <section data-story-chapter id="report-story" className={`${styles.section} ${styles.featureGrid} ${styles.reportScene}`}>
        <div className={styles.featureCopy} data-reveal>
          <p className={styles.eyebrow}>03 / Understand your performance</p>
          <h2>Không chỉ trả lời.<br /><span>Hiểu vì sao.</span></h2>
          <p>Đọc lại câu trả lời, nhìn rõ bằng chứng và biết phần nào cần luyện tiếp. Báo cáo của Nexora giúp biến một lần thử thành một bước chuẩn bị có cơ sở.</p>
          <Checklist items={['Phản hồi gắn với nội dung bạn đã trả lời.', 'Điểm mạnh và điều cần cải thiện được phân tách rõ.', 'Luyện lại theo cấu trúc STAR hoặc tình huống phù hợp.']} />
          {actionButton('Thử phỏng vấn AI', 'interview', INTERVIEW_START_PATH)}
        </div>
        <div className={styles.evidencePreview} data-reveal aria-label="Minh họa cấu trúc phản hồi, không phải báo cáo người dùng">
          <div className={styles.windowTop}><span><ChartNoAxesCombined size={18} /> Sau cuộc trò chuyện</span><SampleLabel label="Minh họa phản hồi" /></div>
          <div className={styles.evidenceQuote} data-story-panel><span>Từ câu trả lời của bạn</span><p>“Tôi kiểm tra truy vấn chậm, bổ sung index và đo lại thời gian phản hồi…”</p></div>
          <div className={styles.evidenceAxes} aria-hidden="true"><span>Bối cảnh</span><span>Hành động</span><span>Kết quả</span></div>
          <div className={styles.evidenceNote} data-story-panel><span><Check size={17} /> Hành động đã rõ</span><p>Nêu cụ thể cách tiếp cận và giải pháp.</p></div>
          <div className={styles.evidenceNext} data-story-panel><span><ArrowUpRight size={17} /> Bước luyện tiếp theo</span><p>Thêm bằng chứng về kết quả và đóng góp cá nhân.</p></div>
          <small>Ví dụ biên tập để minh họa cách đọc báo cáo. Không phải điểm số hay dữ liệu của người dùng.</small>
        </div>
      </section>

      {/* 3. CV Analysis Feature Section */}
      <section data-story-chapter id="cv-analysis" className={`${styles.section} ${styles.featureGrid}`}>
        <div className={styles.featureCopy} data-reveal>
          <p className={styles.eyebrow}>04 / Improve your CV</p>
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
            sizes="(max-width: 760px) 116px, (max-width: 1100px) 140px, 172px"
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
              <CvPreview />
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

      {/* 2. Preparation Loop Section */}
      <section data-story-chapter id="preparation-loop" className={journey.section}>
        <p className={styles.eyebrow}>Một vòng luyện, một bước tiến</p>
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
        <div className={journey.container}>
          <div className={journey.track} data-loop-track aria-hidden="true" />
          <ol className={journey.steps} aria-label="Năm bước luyện tập cùng Nexora">
            {loopSteps.map(({ title, text, icon: Icon, href, action }, i) => (
              <li className={journey.step} key={title} data-loop-node>
                <span className={journey.icon}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className={journey.number}>Bước 0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <button type="button" className={journey.action} onClick={() => start(href === INTERVIEW_START_PATH ? 'interview' : 'navigation', href)}>{action}<ArrowRight size={15} aria-hidden="true" /></button>
              </li>
            ))}
          </ol>
        </div>
        <p className={journey.return}>
          <RotateCcw size={15} />
          Quay lại mục tiêu. Tiếp tục hoàn thiện.
        </p>
      </section>

      {/* 5. Practice Hub Section */}
      <section data-story-chapter id="practice" className={styles.section}>
        <p className={styles.eyebrow}>05 / Build stronger skills</p>
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
              <ArrowRight size={19} />
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
              <ArrowRight size={19} />
            </button>
          </article>
        </div>
      </section>

      {/* 6. Capabilities Progression Section */}
      <section data-story-chapter id="capabilities" className={`${styles.section} ${styles.featureGrid}`}>
        <div className={styles.progressStage} data-reveal>
          <div className={styles.windowTop}>
            <span>
              <ChartNoAxesCombined size={17} />
              Hồ sơ năng lực
            </span>
            <SampleLabel />
          </div>
          <h3>Nhìn rõ điểm cần luyện tiếp.</h3>
          <div className={styles.skillMap} aria-label="Minh họa các phần trong hồ sơ năng lực">
            {['Cấu trúc câu trả lời', 'Chiều sâu chuyên môn', 'Bằng chứng kết quả'].map(label => <div key={label} data-story-panel><span>{label}</span><i /><i /><i /><i /></div>)}
          </div>
          <div className={styles.feedback}>
            <RotateCcw size={22} />
            <p>
              <b>Ưu tiên: làm rõ kết quả</b>
              <br />
              Luyện lại câu trả lời về tối ưu hiệu năng. So sánh lần thử để nhận ra điều đã thay đổi.
            </p>
          </div>
          <div className={styles.historyRow}>
            <span>Lần thử trước</span>
            <ArrowRight size={16} />
            <b>Lần luyện tiếp theo</b>
          </div>
        </div>
        <div className={styles.featureCopy} data-reveal>
          <p className={styles.eyebrow}>Lịch sử luyện tập / Hồ sơ năng lực</p>
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
      <section data-story-chapter id="pricing" className={`${styles.section} ${styles.pricingSection}`}>
        <p className={styles.eyebrow}>06 / Đi theo nhịp của bạn</p>
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
              {Array.from({ length: 4 }, (_, index) => (
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
              <div data-reveal className={`${styles.planWrap} pricing-choice`} key={plan.id}>
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
            INTERVIEW_START_PATH,
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
