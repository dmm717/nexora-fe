'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewApi, type StartInterviewCommand } from '@/services/interviewApi';
import {
  getOrCreateStartIntent,
  generateIdempotencyKey,
  buildInterviewPreflightPayload,
  resolveCvTargetedResumeId,
  isReadyResumeSelection,
  type StartIntent,
  type InterviewType,
} from '@/services/interviewContract';
import { ApiError } from '@/services/apiClient';
import { useCareerGoals } from '@/hooks/queries/useCareerGoals';
import { useCareerProfile, useResumes } from '@/hooks/queries/useCareerProfile';
import { useJobDescriptions } from '@/hooks/queries/useJobDescriptions';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductPageHero } from '@/components/product-visual';

type InterviewDifficultyVisual = 'Standard' | 'Challenging' | 'Expert';
type SeniorityLevel = 'Intern' | 'Fresher' | 'Junior' | 'Middle' | 'Senior' | 'Lead' | 'Principal';

const DIFFICULTY_LABELS: Record<InterviewDifficultyVisual, { labelVi: string; machineValue: string }> = {
  Standard: { labelVi: 'Dễ', machineValue: 'easy' },
  Challenging: { labelVi: 'Trung bình', machineValue: 'medium' },
  Expert: { labelVi: 'Khó', machineValue: 'hard' },
};

const INTERVIEW_TYPES: Array<{ type: InterviewType; title: string; desc: string }> = [
  { type: 'technical', title: 'Kỹ thuật', desc: 'Đào sâu kiến thức và cách giải quyết vấn đề chuyên môn.' },
  { type: 'behavioral', title: 'Hành vi', desc: 'Khai thác trải nghiệm, hợp tác và phản xạ theo cấu trúc STAR.' },
  { type: 'scenario', title: 'Tình huống', desc: 'Xử lý một bối cảnh thực tế phù hợp với vai trò mục tiêu.' },
  { type: 'cv_targeted', title: 'Theo CV', desc: 'Tạo câu hỏi từ một CV thật đang ở trạng thái sẵn sàng.' },
  { type: 'jd_targeted', title: 'Theo Job Description', desc: 'Tạo câu hỏi từ một Job Description đã lưu hoặc vừa tạo.' },
  { type: 'motivation_role_fit', title: 'Động lực & phù hợp vai trò', desc: 'Làm rõ động lực, định hướng và mức độ phù hợp với vai trò.' },
  { type: 'self_introduction', title: 'Giới thiệu bản thân', desc: 'Luyện phần mở đầu và cách trình bày hồ sơ ngắn gọn.' },
];

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);

  // Queries
  const { data: careerGoals } = useCareerGoals();
  const { data: careerProfile } = useCareerProfile();
  const { data: resumes = [], isLoading: loadingResumes } = useResumes();
  const { data: jobDescriptions = [], isLoading: loadingJds } = useJobDescriptions();

  const activeGoals = useMemo(() => careerGoals?.filter((g) => g.active) || [], [careerGoals]);
  const defaultGoal = activeGoals[0] || null;
  const readyResumes = useMemo(() => resumes.filter((r) => r.status === 'ready'), [resumes]);
  const readyResumeIds = useMemo(() => readyResumes.map((resume) => resume.id), [readyResumes]);

  // Session-specific editable overrides (null = follows loaded canonical default)
  const [sessionRole, setSessionRole] = useState<string | null>(null);
  const [sessionSeniority, setSessionSeniority] = useState<SeniorityLevel | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [jdSource, setJdSource] = useState<'existing' | 'new'>('existing');
  const [selectedJdId, setSelectedJdId] = useState<string>('');
  const [newJdTitle, setNewJdTitle] = useState<string>('');
  const [newJdContent, setNewJdContent] = useState<string>('');
  const [isEditingContext, setIsEditingContext] = useState<boolean>(false);

  // Interview setup
  const [interviewType, setInterviewType] = useState<InterviewType>('technical');
  const [difficulty, setDifficulty] = useState<InterviewDifficultyVisual>('Challenging');

  // Mic detection & testing state (user-initiated only, no mount detection)
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isMicTesting, setIsMicTesting] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isSignalConfirmedGood, setIsSignalConfirmedGood] = useState<boolean>(false);
  const [textOnlyMode, setTextOnlyMode] = useState<boolean>(false);

  // Stable intent tracking
  const pendingStartIntentRef = useRef<StartIntent | null>(null);
  const createdJdIdRef = useRef<string | null>(null);
  const jdIdempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  const effectiveSelectedGoalId = selectedGoalId || defaultGoal?.id || '';
  const selectedGoal = activeGoals.find((goal) => goal.id === effectiveSelectedGoalId) || null;

  // Defaults derived from profile/goals
  const resolvedDefaultRole = selectedGoal?.targetRole || defaultGoal?.targetRole || careerProfile?.activeCareerGoal?.targetRole || '';
  const resolvedDefaultSeniority = (selectedGoal?.seniority || defaultGoal?.seniority || careerProfile?.activeCareerGoal?.seniority || 'Middle') as SeniorityLevel;

  const effectiveSessionRole = sessionRole ?? resolvedDefaultRole;
  const effectiveSessionSeniority = sessionSeniority ?? resolvedDefaultSeniority;
  const effectiveSelectedResumeId = resolveCvTargetedResumeId({
    selectedResumeId,
    primaryResumeId: careerProfile?.primaryResume?.id,
    readyResumeIds,
  });
  const activeResumeObj = readyResumes.find((r) => r.id === effectiveSelectedResumeId) || null;
  const effectiveJdId = selectedJdId || jobDescriptions[0]?.id || '';

  // Toggle text-only vs voice mode
  const handleToggleMode = () => {
    setTextOnlyMode((prev) => !prev);
  };

  // User explicitly clicks "Kiểm tra Microphone" -> request permission & run real transient meter
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
        setMicError('Quyền truy cập Microphone bị từ chối bởi trình duyệt.');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setMicError('Thiết bị không tìm thấy microphone.');
      } else {
        setMicError('Không thể kết nối microphone.');
      }
    }
  };

  const handleStart = async () => {
    setError(null);

    // If CV-targeted, ensure ready resume
    const effectiveResumeId = resolveCvTargetedResumeId({
      selectedResumeId: effectiveSelectedResumeId,
      primaryResumeId: careerProfile?.primaryResume?.id,
      readyResumeIds,
    });

    if (
      interviewType === 'cv_targeted' &&
      !isReadyResumeSelection(effectiveResumeId, readyResumeIds)
    ) {
      setError({
        message: 'Chủ đề phỏng vấn theo CV yêu cầu bạn phải chọn một bản CV ở trạng thái Sẵn sàng (Ready).',
      });
      return;
    }

    if (!effectiveSessionRole.trim()) {
      setError({ message: 'Vui lòng nhập vai trò mục tiêu cho phiên phỏng vấn.' });
      return;
    }

    setLoading(true);

    let finalJdId: string | undefined = undefined;
    if (interviewType === 'jd_targeted' && jdSource === 'existing') {
      if (!effectiveJdId || !jobDescriptions.some((jd) => jd.id === effectiveJdId)) {
        setError({ message: 'Vui lòng chọn một Job Description đã lưu hoặc tạo JD mới.' });
        setLoading(false);
        return;
      }
      finalJdId = effectiveJdId;
    }

    if (interviewType === 'jd_targeted' && jdSource === 'new') {
      if (!newJdTitle.trim() || !newJdContent.trim()) {
        setError({ message: 'JD mới cần có tiêu đề và nội dung đầy đủ trước khi bắt đầu.' });
        setLoading(false);
        return;
      }
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
          message: err instanceof ApiError ? err.message : 'Không thể lưu bản mô tả JD. Vui lòng thử lại.',
          requestId: err instanceof ApiError ? err.requestId : undefined,
        });
        setLoading(false);
        return;
      }
    }

    // Determine mode
    const isMatchingActiveGoal =
      selectedGoal &&
      effectiveSessionRole.trim().toLowerCase() === (selectedGoal.targetRole || '').trim().toLowerCase() &&
      effectiveSessionSeniority === selectedGoal.seniority;

    const mode = isMatchingActiveGoal ? 'career_goal' : 'manual';
    const effectiveDifficulty = DIFFICULTY_LABELS[difficulty]?.machineValue || 'Medium';

    const candidatePayload: StartInterviewCommand = buildInterviewPreflightPayload({
      mode,
      careerGoalId: mode === 'career_goal' ? effectiveSelectedGoalId : undefined,
      manualRole: effectiveSessionRole.trim(),
      manualSeniority: effectiveSessionSeniority,
      interviewType,
      difficulty: effectiveDifficulty,
      cvTargetedResumeId: interviewType === 'cv_targeted' ? effectiveResumeId : undefined,
      jobDescriptionId: finalJdId,
    });

    // Idempotency intent
    const intent = getOrCreateStartIntent(pendingStartIntentRef.current, candidatePayload);
    pendingStartIntentRef.current = intent;

    // Persist text-only preference
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
        message: err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi bắt đầu phòng phỏng vấn.',
        requestId: err instanceof ApiError ? err.requestId : undefined,
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <ProductPageHero
        feature="interview"
        title="Chuẩn bị vào phòng phỏng vấn Nexora AI"
        description="Chọn bối cảnh cho phiên này, cấu hình độ khó và kiểm tra microphone trước khi bắt đầu. Các thay đổi chỉ áp dụng cho phiên hiện tại."
      />

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-on-surface text-sm flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-xl flex-shrink-0 mt-0.5">
            error
          </span>
          <div>
            <div className="font-semibold text-error">{error.message}</div>
            {error.requestId && (
              <div className="text-xs text-on-surface-variant mt-1">
                Mã yêu cầu (Request ID): {error.requestId}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Context & Type Configuration (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          {/* Candidate Context Card (Calm compact default with animated editor) */}
          <Card variant="elevated" padding="md" className="transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                <span>Bối cảnh phiên này</span>
              </h3>

              <button
                type="button"
                onClick={() => setIsEditingContext(!isEditingContext)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isEditingContext ? 'close' : 'edit'}
                </span>
                <span>{isEditingContext ? 'Đóng' : 'Thay đổi'}</span>
              </button>
            </div>

            {/* Compact View */}
            {!isEditingContext ? (
              <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 text-xs">
                {interviewType === 'cv_targeted' && <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-[11px]">CV:</span>
                  <span className="font-semibold text-on-surface truncate max-w-[240px]" title={activeResumeObj?.fileName || 'Chưa gắn CV'}>
                    {activeResumeObj?.fileName || (loadingResumes ? 'Đang tải danh sách CV...' : 'Chưa chọn CV')}
                  </span>
                </div>}

                <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/20">
                  <span className="text-on-surface-variant text-[11px]">Vị trí:</span>
                  <span className="font-bold text-on-surface">{effectiveSessionRole || 'Chưa chọn vị trí'}</span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/20">
                  <span className="text-on-surface-variant text-[11px]">Cấp bậc:</span>
                  <span className="font-bold text-primary">{effectiveSessionSeniority}</span>
                </div>

                {interviewType === 'jd_targeted' && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant text-[11px]">Bản mô tả JD:</span>
                    <span className="text-on-surface font-medium truncate max-w-[220px]">
                      {jdSource === 'existing'
                        ? jobDescriptions.find((jd) => jd.id === effectiveJdId)?.title || 'Chưa chọn JD'
                        : newJdTitle || 'Chưa nhập JD mới'}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Animated Expandable Editor */}
            <AnimatePresence>
              {isEditingContext && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="space-y-3.5 pt-1 overflow-hidden"
                >
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Tùy chỉnh bối cảnh chỉ áp dụng cho <strong>phiên phỏng vấn này</strong>. Hồ sơ nghề nghiệp chính của bạn sẽ không bị ảnh hưởng trừ khi bạn chọn lưu làm mặc định.
                  </p>

                  {/* Active Goals Quick Picker */}
                  {activeGoals.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Hoặc chọn nhanh từ mục tiêu đã lưu
                      </label>
                      <select
                        value={effectiveSelectedGoalId}
                        onChange={(e) => {
                          const gid = e.target.value;
                          setSelectedGoalId(gid);
                          setSessionRole(null);
                          setSessionSeniority(null);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:border-primary font-medium"
                      >
                        {activeGoals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.targetRole} · {g.seniority}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* CV Selector */}
                  {interviewType === 'cv_targeted' && <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      CV sử dụng
                    </label>
                    <select
                      value={effectiveSelectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:border-primary font-medium"
                    >
                      {readyResumes.length > 0 ? (
                        readyResumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.fileName} {r.id === careerProfile?.primaryResume?.id ? '· (Chính)' : ''}
                          </option>
                        ))
                      ) : (
                        <option value="">{loadingResumes ? 'Đang tải danh sách CV...' : 'Chưa có CV trong kho lưu trữ'}</option>
                      )}
                    </select>
                  </div>}

                  {/* Target Role & Seniority Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Vị trí mục tiêu
                      </label>
                      <input
                        type="text"
                        value={effectiveSessionRole}
                        onChange={(e) => setSessionRole(e.target.value)}
                        placeholder="VD: Backend Engineer"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Cấp bậc
                      </label>
                      <select
                        value={effectiveSessionSeniority}
                        onChange={(e) => setSessionSeniority(e.target.value as SeniorityLevel)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:border-primary font-medium"
                      >
                        {(['Intern', 'Fresher', 'Junior', 'Middle', 'Senior', 'Lead', 'Principal'] as SeniorityLevel[]).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {interviewType === 'jd_targeted' && (
                    <div className="space-y-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3">
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Nguồn Job Description">
                        <Button type="button" size="sm" variant={jdSource === 'existing' ? 'primary' : 'outline'} onClick={() => setJdSource('existing')}>
                          JD đã lưu
                        </Button>
                        <Button type="button" size="sm" variant={jdSource === 'new' ? 'primary' : 'outline'} onClick={() => setJdSource('new')}>
                          Tạo JD mới
                        </Button>
                      </div>

                      {jdSource === 'existing' ? (
                        <div>
                          <label htmlFor="jobDescriptionSelect" className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                            Job Description sử dụng
                          </label>
                          <select
                            id="jobDescriptionSelect"
                            value={effectiveJdId}
                            onChange={(event) => setSelectedJdId(event.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:border-primary font-medium"
                          >
                            {jobDescriptions.length > 0 ? jobDescriptions.map((jd) => (
                              <option key={jd.id} value={jd.id}>{jd.title}</option>
                            )) : (
                              <option value="">{loadingJds ? 'Đang tải danh sách JD...' : 'Chưa có JD đã lưu'}</option>
                            )}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="newJdTitle" className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                              Tiêu đề JD
                            </label>
                            <input
                              id="newJdTitle"
                              value={newJdTitle}
                              onChange={(event) => {
                                setNewJdTitle(event.target.value);
                                createdJdIdRef.current = null;
                                jdIdempotencyKeyRef.current = generateIdempotencyKey();
                              }}
                              placeholder="VD: Senior Backend Engineer"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label htmlFor="newJdContent" className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                              Nội dung JD
                            </label>
                            <textarea
                              id="newJdContent"
                              value={newJdContent}
                              onChange={(event) => {
                                setNewJdContent(event.target.value);
                                createdJdIdRef.current = null;
                                jdIdempotencyKeyRef.current = generateIdempotencyKey();
                              }}
                              rows={4}
                              placeholder="Dán nội dung Job Description đầy đủ..."
                              className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/50 bg-white text-on-surface focus:outline-none focus:border-primary placeholder:text-outline-variant"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Apply action */}
                  <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingContext(false)}
                    >
                      Áp dụng cho phiên này
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Interview Type Selector */}
          <Card variant="elevated" padding="md">
            <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">category</span>
              <span>Chủ đề phỏng vấn trọng tâm</span>
            </h3>

            <div className="space-y-2">
              {INTERVIEW_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setInterviewType(item.type)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    interviewType === item.type
                      ? 'bg-primary-fixed/30 border-primary text-on-surface shadow-sm'
                      : 'border-outline-variant/40 hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm">{item.title}</span>
                    <span className={`material-symbols-outlined text-[18px] ${interviewType === item.type ? 'text-primary' : 'text-outline-variant'}`}>
                      {interviewType === item.type ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-normal">{item.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Localized Difficulty Selector */}
          <Card variant="elevated" padding="md">
            <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">speed</span>
              <span>Độ khó của phiên</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['Standard', 'Challenging', 'Expert'] as InterviewDifficultyVisual[]).map((d) => {
                const localized = DIFFICULTY_LABELS[d];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      difficulty === d
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'border-outline-variant/40 hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    {localized.labelVi}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Audio & Device Preflight Checklist (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <Card variant="elevated" padding="md" className="space-y-4">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">mic</span>
              <span>Kiểm tra thiết bị âm thanh</span>
            </h3>

            {/* Mic Meter & Testing Area */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface">
                  {isMicTesting ? '🎤 Đang đo tín hiệu âm thanh...' : 'Tín hiệu Microphone:'}
                </span>
                {hasMic === true && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đã nhận diện Micro
                  </span>
                )}
                {hasMic === false && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[13px]">mic_off</span>
                    Bị chặn / Không có
                  </span>
                )}
                {hasMic === null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                    Chưa kiểm tra Microphone
                  </span>
                )}
              </div>

              {/* Sound level meter bar */}
              <div className="w-full bg-outline-variant/30 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    hasMic === false
                      ? 'bg-red-600'
                      : isMicTesting
                      ? 'bg-secondary animate-pulse'
                      : 'bg-outline-variant'
                  }`}
                  style={{ width: `${isMicTesting ? micLevel : 0}%` }}
                />
              </div>

              {/* Has Mic Notification */}
              {hasMic === true && (
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">check_circle</span>
                    <span>
                      {isSignalConfirmedGood
                        ? 'Tín hiệu Microphone hoạt động tốt! ✓'
                        : 'Microphone đã được cấp quyền / sẵn sàng để thử ✓'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Giọng nói sẽ được chuyển thành văn bản trong phiên. Bạn có thể chỉnh sửa trước khi nộp.
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 underline font-medium block pt-0.5"
                  >
                    {textOnlyMode ? '← Quay lại dùng Microphone' : 'Thay vào đó, tôi muốn gõ văn bản'}
                  </button>
                </div>
              )}

              {/* Mic blocked / not found Notification */}
              {hasMic === false && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-left space-y-2">
                  <div className="flex items-start gap-2 text-red-800 text-xs">
                    <span className="material-symbols-outlined text-[18px] text-red-600 flex-shrink-0 mt-0.5">mic_off</span>
                    <div>
                      <span className="font-bold block mb-0.5">
                        {micError || 'Quyền truy cập Microphone bị chặn bởi trình duyệt!'}
                      </span>
                      <p className="text-[11px] text-red-700 leading-relaxed">
                        Bạn có thể bấm vào biểu tượng ổ khóa trên thanh địa chỉ của trình duyệt để cấp quyền micro.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/80 border border-red-200 text-[11px] text-red-900 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-primary">keyboard</span>
                    <span>Đã tự động chuyển sang chế độ gõ văn bản (Chat Box)</span>
                    <span className="material-symbols-outlined text-emerald-700 text-[16px] ml-auto">check_circle</span>
                  </div>
                </div>
              )}

              {/* Action: Test Mic Button */}
              <div className="text-center pt-1">
                <Button
                  variant={isMicTesting ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={handleTestMic}
                  disabled={isMicTesting}
                  icon={<span className="material-symbols-outlined text-[16px]">{isMicTesting ? 'hearing' : 'mic'}</span>}
                >
                  {isMicTesting
                    ? 'Đang đo tín hiệu âm thanh...'
                    : hasMic === false
                    ? 'Thử kiểm tra lại Microphone'
                    : hasMic === true
                    ? 'Kiểm tra lại Microphone'
                    : 'Kiểm tra Microphone'}
                </Button>
              </div>
            </div>

            {/* Invariant reminders */}
            <div className="space-y-2 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/30">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">check_circle</span>
                <span>Âm thanh chỉ dùng để chuyển thành văn bản (STT). Bạn luôn được đọc và sửa trước khi nộp.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">check_circle</span>
                <span>Hệ thống <strong>không chấm điểm ngữ điệu, WPM, phát âm</strong> hay ghi hình camera.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">check_circle</span>
                <span>Bạn có thể gõ văn bản trực tiếp nếu không tiện nói.</span>
              </div>
            </div>
          </Card>

          {/* Start CTA Card */}
          <div className="p-6 rounded-2xl bg-white border border-primary/40 shadow-card space-y-4">
            <div>
              <Badge variant="primary" size="sm" className="mb-2">Q1–Q3 thuộc phạm vi miễn phí</Badge>
              <h4 className="font-bold text-base text-on-surface">Sẵn sàng bước vào phòng?</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Máy chủ quyết định khả năng kết thúc hoặc tiếp tục cùng phiên sau ranh giới miễn phí, dựa trên quyền hiện tại của bạn.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              disabled={loading}
              className="w-full shadow-md"
              icon={<span className="material-symbols-outlined text-[20px]">{loading ? 'hourglass_top' : 'door_front'}</span>}
              iconPosition="right"
            >
              {loading ? 'Đang khởi tạo phòng phỏng vấn...' : 'Vào phòng phỏng vấn ngay'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
