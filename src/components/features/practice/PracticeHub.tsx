'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Clock3,
  History,
  MessageSquareText,
  Mic2,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useInterviewsHistory } from '@/hooks/queries/useInterviews';
import { useScenarioAttempts } from '@/hooks/queries/useScenarios';
import { useStarAttempts } from '@/hooks/queries/useStarAttempts';
import { useCurrentUser } from '@/hooks/queries/useUser';

type PracticeFeatureState = 'enabled' | 'locked' | 'unknown';

function getFeatureState(
  features: Array<{
    code: string;
    enabled: boolean;
    available: number | null;
    unlimited: boolean;
  }> | undefined,
  code: string
): PracticeFeatureState {
  if (!Array.isArray(features)) return 'unknown';
  const feature = features.find((item) => item.code === code);
  if (!feature) return 'unknown';
  if (!feature.enabled) return 'locked';
  if (!feature.unlimited && feature.available !== null && feature.available <= 0) return 'locked';
  return 'enabled';
}

const statusLabels: Record<string, string> = {
  draft: 'Bản nháp',
  queued: 'Đang chờ',
  processing: 'Đang đánh giá',
  completed: 'Đã hoàn thành',
  failed: 'Đánh giá thất bại',
  active: 'Đang thực hiện',
  completing: 'Đang tạo báo cáo',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export default function PracticeHub() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const interviews = useInterviewsHistory(8);
  const scenarios = useScenarioAttempts();
  const stars = useStarAttempts();

  const features = currentUser.data?.billing?.entitlement?.features;
  const scenarioState = getFeatureState(features, 'scenario');
  const starState = getFeatureState(features, 'star_builder');

  const activity = useMemo(() => {
    const interviewItems = (interviews.data?.pages.flatMap((page) => page.items) || []).map((item) => ({
      id: `interview-${item.id}`,
      mode: 'Phỏng vấn AI',
      title: `${item.role || 'Phỏng vấn'} · ${item.interviewType}`,
      status: item.status,
      createdAt: item.createdAt,
      href: item.reportAvailable ? `/interviews/${item.id}/report` : `/interviews/${item.id}`,
      score: null as number | null,
    }));
    const scenarioItems = (scenarios.data || []).map((item) => ({
      id: `scenario-${item.id}`,
      mode: 'Tình huống',
      title: item.scenarioTitle,
      status: item.status,
      createdAt: item.createdAt,
      href: '/practice/scenarios',
      score: item.evaluation?.overallScore ?? null,
    }));
    const starItems = (stars.data || []).map((item) => ({
      id: `star-${item.id}`,
      mode: 'STAR',
      title: item.question,
      status: item.status,
      createdAt: item.createdAt,
      href: `/practice/star?attempt=${encodeURIComponent(item.id)}`,
      score: item.evaluation?.overallScore ?? null,
    }));

    return [...interviewItems, ...scenarioItems, ...starItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [interviews.data, scenarios.data, stars.data]);

  const historyLoading = interviews.isLoading || scenarios.isLoading || stars.isLoading;
  const historyError = interviews.isError || scenarios.isError || stars.isError;

  const goToFeature = (state: PracticeFeatureState, destination: string) => {
    if (state === 'locked') {
      router.push(`/billing?returnTo=${encodeURIComponent(destination)}`);
      return;
    }
    router.push(destination);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <section className="relative overflow-hidden rounded-2xl bg-[#111b3b] px-5 py-8 text-white shadow-floating sm:px-8 sm:py-10 lg:px-12">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#6cf8bb]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#bcc3ff]/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <h1 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
            Luyện đúng kỹ năng, tiến bộ bằng bằng chứng thật
          </h1>
          <p className="mt-3 max-w-[68ch] text-sm leading-6 text-[#dfe5ff] sm:text-base">
            Chọn một chế độ luyện tập phù hợp với mục tiêu hiện tại. Mỗi kết quả chỉ được hiển thị
            khi hệ thống đã ghi nhận và đánh giá lượt làm thật của bạn.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => router.push('/interviews/new')}
              icon={<Mic2 size={18} />}
              className="bg-[#6cf8bb] text-[#003824] hover:bg-[#8dffca] focus:ring-[#6cf8bb]"
            >
              Bắt đầu phỏng vấn
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/practice/scenarios')}
              className="border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
            >
              Khám phá tình huống
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="practice-modes-title" className="space-y-4">
        <div>
          <h2 id="practice-modes-title" className="text-xl font-bold text-on-surface sm:text-2xl">
            Chọn cách bạn muốn luyện
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Ba chế độ độc lập cho ba mục tiêu khác nhau trong hành trình chuẩn bị phỏng vấn.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PracticeModeCard
            icon={<Mic2 size={24} />}
            title="Phỏng vấn AI"
            description="Thực hành một phiên phỏng vấn đầy đủ, trả lời bằng giọng nói hoặc văn bản và nhận báo cáo theo rubric."
            points={['Luồng phỏng vấn production hiện tại', 'Câu hỏi theo mục tiêu và bối cảnh', 'Báo cáo sau phiên']}
            action="Vào phòng phỏng vấn"
            onAction={() => router.push('/interviews/new')}
            badge="Phiên luyện đầy đủ"
            tone="primary"
          />
          <PracticeModeCard
            icon={<BriefcaseBusiness size={24} />}
            title="Kho tình huống"
            description="Rèn cách phân tích và xử lý các bài toán nghề nghiệp theo độ khó, lĩnh vực và năng lực."
            points={['Đề bài từ hệ thống', 'Một câu trả lời tự nhiên', 'Đánh giá và lịch sử từng lượt']}
            action={scenarioState === 'locked' ? 'Xem gói để mở khóa' : 'Khám phá tình huống'}
            onAction={() => goToFeature(scenarioState, '/practice/scenarios')}
            badge={scenarioState === 'locked' ? 'Cần quyền truy cập' : 'Thực hành tập trung'}
            tone="secondary"
          />
          <PracticeModeCard
            icon={<MessageSquareText size={24} />}
            title="Luyện phản xạ STAR"
            description="Kể một trải nghiệm như khi phỏng vấn. AI bóc tách Situation, Task, Action và Result từ câu trả lời thật."
            points={['Một ô trả lời tự nhiên', 'Bằng chứng theo từng thành phần', 'Coaching từ đánh giá backend']}
            action={starState === 'locked' ? 'Xem gói để mở khóa' : 'Luyện STAR'}
            onAction={() => goToFeature(starState, '/practice/star')}
            badge={starState === 'locked' ? 'Cần quyền truy cập' : 'Cấu trúc & bằng chứng'}
            tone="tertiary"
          />
        </div>
      </section>

      <section aria-labelledby="practice-history-title" className="space-y-4 border-t border-outline-variant/50 pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="practice-history-title" className="flex items-center gap-2 text-lg font-bold text-on-surface sm:text-xl">
              <History size={20} aria-hidden="true" />
              Hoạt động gần đây
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Chỉ gồm các lượt luyện đã được lưu trên máy chủ.
            </p>
          </div>
          {activity.length > 0 && <Badge variant="outline">{activity.length} hoạt động gần nhất</Badge>}
        </div>

        {historyLoading ? (
          <div className="grid gap-3" role="status" aria-live="polite" aria-label="Đang tải hoạt động luyện tập">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : historyError ? (
          <Alert
            variant="warning"
            title="Chưa thể tải đầy đủ hoạt động"
            action={
              <Button
                size="sm"
                variant="outline"
                icon={<RefreshCw size={15} />}
                onClick={() => {
                  void interviews.refetch();
                  void scenarios.refetch();
                  void stars.refetch();
                }}
              >
                Thử lại
              </Button>
            }
          >
            Một hoặc nhiều nguồn lịch sử đang tạm thời không khả dụng.
          </Alert>
        ) : activity.length === 0 ? (
          <EmptyState
            icon={<Target size={34} />}
            title="Chưa có hoạt động luyện tập"
            description="Bắt đầu bằng một phiên phỏng vấn, tình huống hoặc câu trả lời STAR. Lượt làm thật sẽ xuất hiện tại đây."
            action={<Button onClick={() => router.push('/interviews/new')}>Bắt đầu lần đầu</Button>}
          />
        ) : (
          <div className="grid gap-3">
            {activity.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(item.href)}
                className="group flex w-full flex-col gap-3 rounded-xl border border-outline-variant/60 bg-white p-4 text-left shadow-subtle transition hover:border-primary/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                    <Sparkles size={19} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral" size="sm">{item.mode}</Badge>
                      <span className="text-xs font-medium text-on-surface-variant">
                        {statusLabels[item.status] || item.status}
                      </span>
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm font-semibold text-on-surface">
                      {item.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                      <Clock3 size={13} aria-hidden="true" /> {formatDate(item.createdAt)}
                    </span>
                  </span>
                </div>
                <span className="flex items-center justify-between gap-4 sm:justify-end">
                  {item.score !== null && (
                    <span className="text-sm font-bold tabular-nums text-primary">{item.score}/100</span>
                  )}
                  <ArrowRight size={18} className="text-outline transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PracticeModeCard({
  icon,
  title,
  description,
  points,
  action,
  onAction,
  badge,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  points: string[];
  action: string;
  onAction: () => void;
  badge: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}) {
  const toneClasses = {
    primary: 'bg-primary-fixed text-primary',
    secondary: 'bg-secondary-container text-on-secondary-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
  };

  return (
    <Card variant="elevated" padding="lg" className="flex min-h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </span>
        <Badge variant={tone} size="sm">{badge}</Badge>
      </div>
      <h3 className="mt-5 text-lg font-bold text-on-surface">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
      <ul className="mt-5 flex-1 space-y-2 border-t border-outline-variant/40 pt-4">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs leading-5 text-on-surface-variant">
            <Check size={15} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <Button fullWidth className="mt-6" variant={tone === 'primary' ? 'primary' : 'outline'} onClick={onAction}>
        {action}
      </Button>
    </Card>
  );
}
