'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  Lightbulb,
  MessageSquareText,
  RefreshCw,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { RadialScore } from '@/components/ui/RadialScore';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { useStarAttempt, useStarAttempts } from '@/hooks/queries/useStarAttempts';
import { useCurrentUser } from '@/hooks/queries/useUser';
import {
  getOrCreateStarAttemptIntent,
  starBuilderApi,
  type StarAttemptIntent,
} from '@/services/starBuilderApi';
import { ApiError } from '@/services/apiClient';
import {
  listStarComponents,
  STAR_COMPONENT_LABELS,
  type NormalizedStarEvaluation,
} from '@/services/interviewContract';
import { readStatus } from '@/utils/queryPolling';

const componentHints = [
  ['S', 'Situation', 'Bối cảnh thực tế của câu chuyện.'],
  ['T', 'Task', 'Trách nhiệm hoặc mục tiêu của riêng bạn.'],
  ['A', 'Action', 'Hành động và quyết định bạn trực tiếp thực hiện.'],
  ['R', 'Result', 'Kết quả, tác động hoặc bài học có căn cứ.'],
] as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const isAccessError = (error: unknown) => {
  if (!(error instanceof ApiError)) return false;
  return [
    'FEATURE_DISABLED',
    'FEATURE_NOT_AVAILABLE',
    'FEATURE_QUOTA_EXCEEDED',
    'QUOTA_EXCEEDED',
  ].includes(error.code || '') || error.status === 403;
};

export default function StarPractice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedAttemptId = searchParams.get('attempt') || '';
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const attemptId = selectedAttemptId ?? requestedAttemptId;
  const [error, setError] = useState<unknown>(null);
  const intentRef = useRef<StarAttemptIntent | null>(null);

  const currentUser = useCurrentUser();
  const history = useStarAttempts();
  const feature = currentUser.data?.billing?.entitlement?.features?.find(
    (item) => item.code === 'star_builder'
  );
  const isKnownLocked = Boolean(
    feature && (!feature.enabled || (!feature.unlimited && feature.available !== null && feature.available <= 0))
  );

  const attempt = useStarAttempt(attemptId, false, (query) => {
    const status = readStatus(query.state.data);
    return status === 'completed' || status === 'failed' ? false : REALTIME_FALLBACK_POLL_MS;
  });

  const submit = useMutation({
    mutationFn: async () => {
      const intent = getOrCreateStarAttemptIntent(intentRef.current, { question, answer });
      intentRef.current = intent;
      return starBuilderApi.submitAttempt(intent.payload, intent.key);
    },
    onSuccess: (created) => {
      intentRef.current = null;
      setError(null);
      setSelectedAttemptId(created.id);
      void queryClient.invalidateQueries({ queryKey: ['starAttempt', created.id] });
      void queryClient.invalidateQueries({ queryKey: ['starAttempts'] });
      void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.replace(`/practice/star?attempt=${encodeURIComponent(created.id)}`);
    },
    onError: (caught) => setError(caught),
  });

  const active = attempt.data && 'question' in attempt.data ? attempt.data : undefined;
  const isProcessing = active?.status === 'queued' || active?.status === 'processing';
  const displayError = error || attempt.error;

  const handleSubmit = () => {
    if (!question.trim() || !answer.trim() || submit.isPending || isKnownLocked) return;
    setError(null);
    submit.mutate();
  };

  const handlePracticeAgain = () => {
    setQuestion(active?.question || question);
    setAnswer('');
    setSelectedAttemptId('');
    setError(null);
    intentRef.current = null;
    router.replace('/practice/star');
  };

  const selectHistoryAttempt = (id: string) => {
    setSelectedAttemptId(id);
    setError(null);
    router.replace(`/practice/star?attempt=${encodeURIComponent(id)}`);
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-outline-variant/50 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => router.push('/practice')}>
            Trung tâm luyện tập
          </Button>
          <h1 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-on-surface sm:text-3xl">
            Luyện phản xạ STAR
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant sm:text-base">
            Viết một câu trả lời tự nhiên như trong buổi phỏng vấn. AI sẽ kiểm tra cấu trúc và trích dẫn bằng chứng từ chính câu trả lời của bạn.
          </p>
        </div>
        {feature && (
          <Badge variant={isKnownLocked ? 'warning' : 'success'} size="md">
            {feature.unlimited
              ? 'Không giới hạn lượt'
              : isKnownLocked
                ? 'Chưa có lượt khả dụng'
                : feature.available === null
                  ? 'Quyền truy cập đang hoạt động'
                  : `Còn ${feature.available} lượt`}
          </Badge>
        )}
      </header>

      {isKnownLocked && (
        <Alert
          variant="warning"
          title="STAR chưa khả dụng với quyền hiện tại"
          action={<Button size="sm" onClick={() => router.push('/billing?returnTo=%2Fpractice%2Fstar')}>Xem gói</Button>}
        >
          Quyền truy cập và hạn mức được xác nhận bởi máy chủ. Nâng cấp bằng luồng thanh toán hiện có để tiếp tục.
        </Alert>
      )}

      {displayError && (
        <Alert
          variant="error"
          title={isAccessError(displayError) ? 'Không còn quyền gửi đánh giá' : 'Chưa thể hoàn tất yêu cầu'}
          action={isAccessError(displayError) ? <Button size="sm" onClick={() => router.push('/billing?returnTo=%2Fpractice%2Fstar')}>Xem gói</Button> : undefined}
        >
          {displayError instanceof Error ? displayError.message : 'Vui lòng thử lại với cùng nội dung. Hệ thống giữ nguyên idempotency key cho lần thử vận chuyển này.'}
        </Alert>
      )}

      <section aria-labelledby="star-guide-title" className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-tertiary" aria-hidden="true" />
          <h2 id="star-guide-title" className="text-sm font-bold text-on-surface">Mẹo STAR chung</h2>
          <Badge variant="neutral" size="sm">Hướng dẫn, không phải đánh giá</Badge>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {componentHints.map(([letter, name, hint]) => (
            <div key={letter} className="flex gap-3 rounded-xl bg-surface-container-low p-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">{letter}</span>
              <div>
                <h3 className="text-xs font-bold text-on-surface">{name}</h3>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <Card variant="elevated" padding="lg" className="space-y-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface">
              <MessageSquareText size={20} aria-hidden="true" /> Câu trả lời của bạn
            </h2>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">Không cần chia thành bốn ô. Hãy kể liền mạch và dùng chi tiết có thật.</p>
          </div>
          <div>
            <label htmlFor="star-question" className="mb-2 block text-sm font-semibold text-on-surface">Câu hỏi hoặc tình huống muốn luyện</label>
            <textarea
              id="star-question"
              rows={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={submit.isPending || isProcessing || isKnownLocked}
              placeholder="Ví dụ: Hãy kể về một lần bạn xử lý sự cố nghiêm trọng trong dự án."
              className="w-full resize-y rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm leading-6 text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary-fixed disabled:bg-surface-container-low"
            />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="star-answer" className="text-sm font-semibold text-on-surface">Câu trả lời tự nhiên</label>
              <span className="text-xs tabular-nums text-on-surface-variant">{answer.length} / 12.000 ký tự</span>
            </div>
            <textarea
              id="star-answer"
              rows={9}
              maxLength={12000}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={submit.isPending || isProcessing || isKnownLocked}
              aria-describedby="star-answer-help"
              placeholder="Kể lại trải nghiệm của bạn như khi đang trả lời nhà tuyển dụng..."
              className="min-h-56 w-full resize-y rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm leading-6 text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary-fixed disabled:bg-surface-container-low sm:min-h-64"
            />
            <p id="star-answer-help" className="mt-2 text-xs leading-5 text-on-surface-variant">Kết quả, điểm và bằng chứng chỉ xuất hiện sau khi máy chủ xử lý câu trả lời này.</p>
          </div>
          <Button
            fullWidth
            size="lg"
            icon={<Send size={17} />}
            iconPosition="right"
            loading={submit.isPending}
            disabled={!question.trim() || !answer.trim() || isProcessing || isKnownLocked}
            onClick={handleSubmit}
          >
            Gửi để đánh giá STAR
          </Button>
        </Card>

        <section aria-labelledby="star-result-title" className="min-w-0">
          <h2 id="star-result-title" className="sr-only">Kết quả đánh giá STAR</h2>
          {!attemptId ? (
            <EmptyState icon={<Sparkles size={34} />} title="Kết quả sẽ xuất hiện ở đây" description="Trước khi gửi, hệ thống không hiển thị điểm mẫu hay dự đoán thành phần STAR." />
          ) : attempt.isLoading ? (
            <Card variant="subtle" padding="lg" className="space-y-4" role="status" aria-live="polite">
              <div className="h-6 w-40 animate-pulse rounded bg-surface-container-high" />
              <div className="h-28 animate-pulse rounded-xl bg-surface-container" />
              <span className="sr-only">Đang tải lượt đánh giá STAR</span>
            </Card>
          ) : isProcessing ? (
            <Card variant="subtle" padding="lg" className="space-y-4" role="status" aria-live="polite">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                <h3 className="font-bold text-on-surface">{active?.status === 'queued' ? 'Đang chờ đánh giá' : 'AI đang phân tích câu trả lời'}</h3>
              </div>
              <p className="text-sm leading-6 text-on-surface-variant">Kết quả sẽ được tải lại từ REST khi SignalR thông báo hoặc lần polling dự phòng tiếp theo chạy.</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high" aria-hidden="true"><span className="animate-indeterminate relative block h-full rounded-full bg-primary" /></div>
            </Card>
          ) : active?.status === 'failed' ? (
            <Card variant="flat" padding="lg" className="space-y-4 border-error/30 bg-error-container/35" role="alert">
              <div className="flex items-start gap-3">
                <XCircle size={22} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
                <div>
                  <h3 className="font-bold text-on-surface">Đánh giá chưa thành công</h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">Lượt này đã kết thúc với mã {active.errorCode || 'UNKNOWN_ERROR'}. Lượt mới không thay đổi kết quả cũ.</p>
                </div>
              </div>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={handlePracticeAgain}>Bắt đầu lượt mới</Button>
            </Card>
          ) : active?.status === 'completed' ? (
            <StarResult evaluation={active.evaluation} question={active.question} answer={active.answer} onRetry={handlePracticeAgain} />
          ) : (
            <EmptyState icon={<Clock3 size={32} />} title="Trạng thái chưa xác định" description="Máy chủ chưa trả về trạng thái có thể hiển thị cho lượt STAR này." action={<Button variant="outline" onClick={() => void attempt.refetch()}>Tải lại</Button>} />
          )}
        </section>
      </div>

      <section aria-labelledby="star-history-title" className="space-y-4 border-t border-outline-variant/50 pt-6">
        <div>
          <h2 id="star-history-title" className="flex items-center gap-2 text-lg font-bold text-on-surface"><History size={19} aria-hidden="true" /> Lịch sử STAR</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Các lượt đã được lưu trên máy chủ, mới nhất trước.</p>
        </div>
        {history.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-surface-container" role="status" aria-label="Đang tải lịch sử STAR" />
        ) : history.isError ? (
          <Alert variant="warning" title="Chưa thể tải lịch sử">Bạn vẫn có thể bắt đầu một lượt STAR mới.</Alert>
        ) : !history.data?.length ? (
          <EmptyState icon={<History size={30} />} title="Chưa có lượt STAR" description="Lượt đầu tiên sẽ xuất hiện ở đây sau khi được máy chủ tiếp nhận." />
        ) : (
          <div className="grid gap-2">
            {history.data.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => selectHistoryAttempt(item.id)}
                aria-current={item.id === attemptId ? 'true' : undefined}
                className={`flex w-full flex-col gap-2 rounded-xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:items-center sm:justify-between ${item.id === attemptId ? 'border-primary shadow-subtle' : 'border-outline-variant/60 hover:border-primary/40'}`}
              >
                <span className="min-w-0">
                  <span className="line-clamp-1 text-sm font-semibold text-on-surface">{item.question}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{formatDate(item.createdAt)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'error' : 'info'} size="sm">
                    {item.status === 'completed' ? 'Đã đánh giá' : item.status === 'failed' ? 'Thất bại' : 'Đang xử lý'}
                  </Badge>
                  {item.evaluation?.overallScore !== null && item.evaluation?.overallScore !== undefined && <span className="text-sm font-bold tabular-nums text-primary">{item.evaluation.overallScore}/100</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StarResult({ evaluation, question, answer, onRetry }: { evaluation: NormalizedStarEvaluation | null; question: string; answer: string; onRetry: () => void }) {
  const components = useMemo(() => evaluation ? listStarComponents(evaluation) : [], [evaluation]);

  return (
    <Card variant="elevated" padding="lg" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge variant="success" icon={<CheckCircle2 size={13} />}>Đã đánh giá</Badge>
          <h3 className="mt-2 text-lg font-bold text-on-surface">Kết quả bóc tách STAR</h3>
        </div>
        <RadialScore score={evaluation?.overallScore ?? null} size="sm" />
      </div>
      {!evaluation ? (
        <Alert variant="warning" title="Chưa đủ dữ liệu đánh giá">Lượt làm đã hoàn thành nhưng máy chủ không trả về evaluation. Điểm số không được thay bằng 0.</Alert>
      ) : !evaluation.applicable ? (
        <Alert variant="info" title="Chưa thể áp dụng khung STAR">Máy chủ xác định câu trả lời này chưa phù hợp để bóc tách STAR. Hãy xem câu trả lời gốc và thử lượt mới.</Alert>
      ) : (
        <>
          {components.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {components.map(({ key, component }) => (
                <div key={key} className={`rounded-xl border p-4 ${component.detected ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-on-surface">{STAR_COMPONENT_LABELS[key]}</h4>
                    <Badge variant={component.detected ? 'success' : 'warning'} size="sm">{component.detected ? 'Đã phát hiện' : 'Chưa phát hiện'}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-bold tabular-nums text-on-surface">{component.score}/100</p>
                  {component.detected && component.evidence && <blockquote className="mt-3 break-words rounded-lg bg-white p-3 text-xs italic leading-5 text-on-surface-variant">“{component.evidence}”</blockquote>}
                  {component.feedback && <p className="mt-3 text-xs leading-5 text-on-surface-variant">{component.feedback}</p>}
                </div>
              ))}
            </div>
          ) : <Alert variant="info">Máy chủ không trả về component STAR nào cho lượt này.</Alert>}
          {evaluation.missingElements.length > 0 && <Alert variant="warning" title="Thành phần còn thiếu">{evaluation.missingElements.join(', ')}</Alert>}
          {(evaluation.strengths.length > 0 || evaluation.coachingTips.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {evaluation.strengths.length > 0 && <CoachingList title="Điểm mạnh" items={evaluation.strengths} />}
              {evaluation.coachingTips.length > 0 && <CoachingList title="Coaching từ đánh giá" items={evaluation.coachingTips} />}
            </div>
          )}
        </>
      )}
      <div className="space-y-3 border-t border-outline-variant/40 pt-4">
        <div><h4 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Câu hỏi</h4><p className="mt-1 text-sm leading-6 text-on-surface">{question}</p></div>
        <div><h4 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Câu trả lời của bạn</h4><p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-surface-container-low p-3 text-sm leading-6 text-on-surface">{answer}</p></div>
      </div>
      <Button fullWidth variant="outline" icon={<RefreshCw size={16} />} onClick={onRetry}>Luyện lại câu này bằng lượt mới</Button>
    </Card>
  );
}

function CoachingList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <h4 className="text-sm font-bold text-on-surface">{title}</h4>
      <ul className="mt-2 space-y-2 text-xs leading-5 text-on-surface-variant">{items.map((item) => <li key={item}>• {item}</li>)}</ul>
    </div>
  );
}
