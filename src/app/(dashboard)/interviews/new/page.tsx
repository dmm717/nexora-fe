'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { interviewApi, type StartInterviewCommand } from '@/services/interviewApi';
import {
  getOrCreateStartIntent,
  generateIdempotencyKey,
  buildInterviewPreflightPayload,
  isReadyResumeSelection,
  resolveCvTargetedResumeId,
  type StartIntent,
} from '@/services/interviewContract';
import { ApiError } from '@/services/apiClient';
import { useCareerGoals } from '@/hooks/queries/useCareerGoals';
import { useCareerProfile, useResumes } from '@/hooks/queries/useCareerProfile';
import { useJobDescriptions } from '@/hooks/queries/useJobDescriptions';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);

  // Mode: select from career goal or manual role configuration
  const [mode, setMode] = useState<'career_goal' | 'manual'>('career_goal');

  // Queries
  const { data: careerGoals, isLoading: loadingGoals } = useCareerGoals();
  const { data: careerProfile } = useCareerProfile();
  const { data: resumes = [], isLoading: loadingResumes } = useResumes();
  const { data: jobDescriptions = [], isLoading: loadingJds } = useJobDescriptions();

  const activeGoals = useMemo(() => careerGoals?.filter((g) => g.active) || [], [careerGoals]);
  const defaultGoal = activeGoals[0] || null;
  const readyResumes = useMemo(() => resumes.filter((r) => r.status === 'ready'), [resumes]);
  const readyResumeIds = useMemo(() => readyResumes.map((resume) => resume.id), [readyResumes]);

  // Session-scoped form state
  const [sessionRole, setSessionRole] = useState<string>('');
  const [sessionSeniority, setSessionSeniority] = useState<string>('Junior');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // JD selection & creation state
  const [jdSource, setJdSource] = useState<'existing' | 'new'>('existing');
  const [selectedJdId, setSelectedJdId] = useState<string>('');
  const [newJdTitle, setNewJdTitle] = useState<string>('');
  const [newJdContent, setNewJdContent] = useState<string>('');
  const createdJdIdRef = useRef<string | null>(null);
  const jdIdempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  const [interviewType, setInterviewType] = useState<string>('technical');
  const [difficulty, setDifficulty] = useState<string>('Medium');

  // Derived effective IDs
  const effectiveGoalId = selectedGoalId || defaultGoal?.id || '';
  const effectiveResumeId = resolveCvTargetedResumeId({
    selectedResumeId,
    primaryResumeId: careerProfile?.primaryResume?.id,
    readyResumeIds,
  });
  const effectiveRole = sessionRole || defaultGoal?.targetRole || '';
  const effectiveJdId = selectedJdId || jobDescriptions[0]?.id || '';

  // Mic check state (user-initiated only, never on mount)
  const [isMicTesting, setIsMicTesting] = useState<boolean>(false);
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSignalConfirmedGood, setIsSignalConfirmedGood] = useState<boolean>(false);
  const [textOnlyMode, setTextOnlyMode] = useState<boolean>(false);

  // Stable intent tracking
  const pendingStartIntentRef = useRef<StartIntent | null>(null);

  // Test microphone (user-initiated with Web Audio AnalyserNode)
  const handleTestMic = async () => {
    setIsMicTesting(true);
    setMicError(null);
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animId: number | null = null;
    let peakMeasured = 0;

    const cleanup = () => {
      setIsMicTesting(false);
      setMicLevel(0);
      if (peakMeasured >= 15) {
        setIsSignalConfirmedGood(true);
      }
      if (animId) cancelAnimationFrame(animId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
        audioContext = null;
      }
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMic(true);
      setTextOnlyMode(false);

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const startTime = Date.now();

        const tick = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          if (normalized > peakMeasured) {
            peakMeasured = normalized;
          }
          setMicLevel(normalized);

          if (Date.now() - startTime < 3000) {
            animId = requestAnimationFrame(tick);
          } else {
            cleanup();
          }
        };

        animId = requestAnimationFrame(tick);
      } else {
        setTimeout(cleanup, 2000);
      }
    } catch (err: unknown) {
      cleanup();
      setHasMic(false);
      setTextOnlyMode(true);
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setMicError('Quyền truy cập Microphone bị từ chối.');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setMicError('Thiết bị không có microphone.');
      } else {
        setMicError('Không thể kết nối microphone. Chuyển sang chế độ gõ văn bản.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation rules
    if (mode === 'manual' && !effectiveRole.trim()) {
      setError({ message: 'Vui lòng nhập vị trí ứng tuyển mong muốn.' });
      return;
    }

    if (interviewType === 'cv_targeted') {
      if (!isReadyResumeSelection(effectiveResumeId, readyResumeIds)) {
        setError({
          message: 'CV đã chọn không còn ở trạng thái sẵn sàng. Vui lòng chọn lại một CV Ready hoặc tải lên CV mới.',
        });
        return;
      }
    }

    let finalJdId: string | undefined = undefined;
    if (interviewType === 'jd_targeted') {
      if (jdSource === 'existing') {
        if (jobDescriptions.length === 0 || !effectiveJdId) {
          setError({
            message: 'Vui lòng chọn một Job Description (JD) có sẵn hoặc chuyển sang tạo JD mới.',
          });
          return;
        }
        finalJdId = effectiveJdId;
      } else {
        if (!newJdTitle.trim() || !newJdContent.trim()) {
          setError({
            message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung của Job Description (JD).',
          });
          return;
        }
      }
    }

    setLoading(true);

    // If creating a new JD for jd_targeted, do it now idempotently
    if (interviewType === 'jd_targeted' && jdSource === 'new') {
      try {
        if (!createdJdIdRef.current) {
          const created = await cvAnalysisApi.createJobDescription(
            {
              title: newJdTitle.trim(),
              content: newJdContent.trim(),
            },
            jdIdempotencyKeyRef.current
          );
          createdJdIdRef.current = created.id;
        }
        finalJdId = createdJdIdRef.current;
      } catch (err: unknown) {
        setError({
          message: err instanceof ApiError ? err.message : 'Không thể tạo Job Description mới. Vui lòng thử lại.',
          requestId: err instanceof ApiError ? err.requestId : undefined,
        });
        setLoading(false);
        return;
      }
    }

    // Build only explicit frontend context; backend owns Career Goal/Profile fallbacks.
    const candidatePayload: StartInterviewCommand = buildInterviewPreflightPayload({
      mode,
      careerGoalId: effectiveGoalId || undefined,
      manualRole: effectiveRole,
      manualSeniority: sessionSeniority,
      interviewType,
      difficulty,
      cvTargetedResumeId: interviewType === 'cv_targeted' ? effectiveResumeId : undefined,
      jobDescriptionId: finalJdId,
    });

    // Idempotency intent
    const intent = getOrCreateStartIntent(pendingStartIntentRef.current, candidatePayload);
    pendingStartIntentRef.current = intent;

    // Store text-only preference if chosen
    if (textOnlyMode) {
      sessionStorage.setItem('nexora_text_only_mode', '1');
    } else {
      sessionStorage.removeItem('nexora_text_only_mode');
    }

    try {
      const res = await interviewApi.start(
        intent.payload as StartInterviewCommand,
        intent.key
      );
      pendingStartIntentRef.current = null;
      createdJdIdRef.current = null;
      router.push(`/interviews/${res.id}`);
    } catch (err: unknown) {
      setError({
        message: err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi bắt đầu phỏng vấn.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/interviews" className="hover:text-indigo-600 transition-colors">
              Phỏng vấn thử
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Thiết lập trước phiên (Preflight)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Thiết lập Buổi phỏng vấn AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Cấu hình hồ sơ, mục tiêu nghề nghiệp và kiểm tra thiết bị trước khi vào phòng phỏng vấn.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => router.back()}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          Hủy bỏ
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3">
          <span className="material-symbols-outlined text-red-600 text-xl flex-shrink-0 mt-0.5">
            error
          </span>
          <div>
            <div className="font-semibold">{error.message}</div>
            {error.requestId && (
              <div className="text-xs text-red-600 mt-1">
                Mã yêu cầu (Request ID): {error.requestId}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Mode Selection */}
        <Card variant="elevated" padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">1. Mục tiêu nghề nghiệp (Context)</h2>
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode('career_goal')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  mode === 'career_goal'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Từ Mục tiêu có sẵn
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  mode === 'manual'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Nhập thủ công
              </button>
            </div>
          </div>

          {mode === 'career_goal' && (
            <div className="space-y-3">
              <label htmlFor="careerGoalSelect" className="block text-xs font-semibold text-slate-700">
                Chọn mục tiêu đã lưu
              </label>
              {loadingGoals ? (
                <div className="text-xs text-slate-500 py-2">Đang tải danh sách mục tiêu...</div>
              ) : activeGoals.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  Bạn chưa có Mục tiêu nghề nghiệp nào. Vui lòng chuyển sang &quot;Nhập thủ công&quot; hoặc tạo mục tiêu mới trong hồ sơ.
                </div>
              ) : (
                <select
                  id="careerGoalSelect"
                  value={effectiveGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={loading}
                >
                  {activeGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.targetRole} {goal.seniority ? `(${goal.seniority})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="roleInput" className="block text-xs font-semibold text-slate-700">
                  Vị trí ứng tuyển (Role) <span className="text-red-500">*</span>
                </label>
                <input
                  id="roleInput"
                  type="text"
                  placeholder="Vd: Frontend Engineer, Product Manager, Data Scientist..."
                  value={effectiveRole}
                  onChange={(e) => setSessionRole(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="senioritySelect" className="block text-xs font-semibold text-slate-700">
                  Cấp bậc kinh nghiệm (Seniority)
                </label>
                <select
                  id="senioritySelect"
                  value={sessionSeniority}
                  onChange={(e) => setSessionSeniority(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={loading}
                >
                  <option value="Intern">Intern / Thực tập sinh</option>
                  <option value="Fresher">Fresher / Mới tốt nghiệp</option>
                  <option value="Junior">Junior / 1 - 2 năm kinh nghiệm</option>
                  <option value="Mid-level">Mid-level / 2 - 4 năm kinh nghiệm</option>
                  <option value="Senior">Senior / 4+ năm kinh nghiệm</option>
                  <option value="Lead">Lead / Trưởng nhóm</option>
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Section 2: Interview Type & Difficulty */}
        <Card variant="elevated" padding="md" className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">2. Định dạng phỏng vấn &amp; Độ khó</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="interviewTypeSelect" className="block text-xs font-semibold text-slate-700">
                Loại phỏng vấn (Interview Type)
              </label>
              <select
                id="interviewTypeSelect"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                disabled={loading}
              >
                <option value="technical">Technical (Kỹ thuật &amp; Chuyên môn)</option>
                <option value="behavioral">Behavioral (Hành vi &amp; Phản xạ STAR)</option>
                <option value="scenario">Scenario (Xử lý tình huống thực tế)</option>
                <option value="cv_targeted">CV Targeted (Bám sát CV đã tải lên)</option>
                <option value="jd_targeted">JD Targeted (Bám sát Job Description)</option>
                <option value="motivation_role_fit">Motivation &amp; Role Fit (Động lực &amp; Khớp văn hóa)</option>
                <option value="self_introduction">Self Introduction (Giới thiệu bản thân)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="difficultySelect" className="block text-xs font-semibold text-slate-700">
                Độ khó (Difficulty)
              </label>
              <select
                id="difficultySelect"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                disabled={loading}
              >
                <option value="Easy">Dễ (Easy) — Kiến thức cơ bản, tình huống mở</option>
                <option value="Medium">Trung bình (Medium) — Tiêu chuẩn phỏng vấn thực tế</option>
                <option value="Hard">Khó (Hard) — Đào sâu kiến trúc, tình huống phức tạp</option>
              </select>
            </div>
          </div>

          {/* Conditional: CV Selector for cv_targeted */}
          {interviewType === 'cv_targeted' && (
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <label htmlFor="resumeSelect" className="block text-xs font-semibold text-slate-700">
                Chọn CV để AI tạo câu hỏi <span className="text-red-500">*</span>
              </label>
              {loadingResumes ? (
                <div className="text-xs text-slate-500 py-1">Đang tải danh sách CV...</div>
              ) : readyResumes.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  Bạn chưa có CV nào sẵn sàng. Vui lòng{' '}
                  <Link href="/resumes" className="text-indigo-600 underline font-semibold">
                    tải lên CV
                  </Link>{' '}
                  hoặc chọn loại phỏng vấn khác.
                </div>
              ) : (
                <select
                  id="resumeSelect"
                  value={effectiveResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={loading}
                >
                  {readyResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fileName || `CV #${r.id.substring(0, 8)}`} (Sẵn sàng)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Conditional: JD Selector/Creator for jd_targeted */}
          {interviewType === 'jd_targeted' && (
            <div className="pt-2 space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Job Description (JD) cho buổi phỏng vấn <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setJdSource('existing')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      jdSource === 'existing'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    JD có sẵn ({jobDescriptions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdSource('new')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      jdSource === 'new'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Nhập JD mới
                  </button>
                </div>
              </div>

              {jdSource === 'existing' ? (
                <div>
                  {loadingJds ? (
                    <div className="text-xs text-slate-500 py-2">Đang tải danh sách JD...</div>
                  ) : jobDescriptions.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                      <p>Bạn chưa lưu Job Description (JD) nào.</p>
                      <button
                        type="button"
                        onClick={() => setJdSource('new')}
                        className="text-indigo-600 font-semibold underline"
                      >
                        Nhấn vào đây để nhập JD mới &rarr;
                      </button>
                    </div>
                  ) : (
                    <select
                      id="jdSelect"
                      value={effectiveJdId}
                      onChange={(e) => setSelectedJdId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      disabled={loading}
                    >
                      {jobDescriptions.map((jd) => (
                        <option key={jd.id} value={jd.id}>
                          {jd.title} ({new Date(jd.createdAt).toLocaleDateString('vi-VN')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="space-y-1">
                    <label htmlFor="newJdTitle" className="block text-xs font-semibold text-slate-700">
                      Tiêu đề vị trí công việc <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="newJdTitle"
                      type="text"
                      placeholder="Vd: Senior Backend Go Engineer - TechCorp"
                      value={newJdTitle}
                      onChange={(e) => {
                        setNewJdTitle(e.target.value);
                        createdJdIdRef.current = null;
                        jdIdempotencyKeyRef.current = generateIdempotencyKey();
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="newJdContent" className="block text-xs font-semibold text-slate-700">
                      Nội dung chi tiết Job Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="newJdContent"
                      rows={4}
                      value={newJdContent}
                      onChange={(e) => {
                        setNewJdContent(e.target.value);
                        createdJdIdRef.current = null;
                        jdIdempotencyKeyRef.current = generateIdempotencyKey();
                      }}
                      placeholder="Dán toàn bộ mô tả công việc, yêu cầu kỹ năng, trách nhiệm vào đây..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Section 3: Microphone & Device Check */}
        <Card variant="elevated" padding="md" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">3. Kiểm tra thiết bị &amp; Âm thanh</h2>
              <p className="text-xs text-slate-500">
                Phỏng vấn diễn ra qua giọng nói (tiếng Việt) hoặc gõ bàn phím. Không yêu cầu camera.
              </p>
            </div>
            {hasMic && isSignalConfirmedGood && (
              <Badge variant="success" size="sm">Microphone Tốt</Badge>
            )}
            {textOnlyMode && (
              <Badge variant="neutral" size="sm">Chế độ Văn bản</Badge>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
                <span className="material-symbols-outlined text-lg text-indigo-600">
                  {hasMic ? 'mic' : 'mic_none'}
                </span>
                <span>Kiểm tra độ nhạy Microphone</span>
              </div>
              <p className="text-xs text-slate-500">
                Nhấn nút bên dưới để trình duyệt kiểm tra mic trong 3 giây.
              </p>

              {isMicTesting && (
                <div className="w-48 bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-100"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestMic}
                disabled={isMicTesting || loading}
              >
                {isMicTesting ? 'Đang đo âm lượng...' : 'Kiểm tra Microphone'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTextOnlyMode(!textOnlyMode)}
              >
                {textOnlyMode ? 'Dùng giọng nói' : 'Chỉ dùng bàn phím'}
              </Button>
            </div>
          </div>

          {micError && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              {micError}
            </p>
          )}
        </Card>

        {/* Submit action */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-slate-500">
            Phiên 3 câu hỏi đầu tiên hoàn toàn miễn phí, bao gồm nhận xét tức thì và báo cáo hoàn chỉnh.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || (mode === 'career_goal' && activeGoals.length === 0)}
            className="shadow-sm font-semibold"
          >
            {loading ? 'Đang khởi tạo phòng phỏng vấn...' : 'Vào phòng phỏng vấn ngay'}
          </Button>
        </div>
      </form>
    </div>
  );
}
