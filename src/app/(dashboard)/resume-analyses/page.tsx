'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientDate } from '@/components/ui/ClientDate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductPageHero } from '@/components/product-visual';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/services/apiClient';
import { cvAnalysisApi, getUploadContentType, type ResumeView, type ResumeAnalysisHistoryItem } from '@/services/cvAnalysisApi';
import {
  createResumeAnalysisOperation,
  ResumeAnalysisOperation,
  JobTargetedAnalysisOperation,
  FieldBenchmarkAnalysisOperation,
  runResumeAnalysisOperation,
} from '@/services/resumeAnalysisCoordinator';
import {
  ResumeAnalysisMode,
  formatQuotaError,
} from '@/services/cvAnalysisContract';
import { useResumeAnalysisHistory } from '@/hooks/useResumeAnalysisHistory';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { useCurrentUser } from '@/hooks/queries/useUser';
import { useCareerProfile, useSetPrimaryResume, useResumes } from '@/hooks/queries/useCareerProfile';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus } from '@/utils/queryPolling';

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.requestId ? `${error.message} (Mã yêu cầu: ${error.requestId})` : error.message;
  }
  return fallback;
}

const ResumeHistoryList = ({ 
  history, 
  primaryResumeId, 
  onSetPrimary, 
  isSettingPrimary,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore
}: { 
  history: ResumeAnalysisHistoryItem[], 
  primaryResumeId?: string, 
  onSetPrimary: (resumeId: string) => void, 
  isSettingPrimary: boolean,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  onLoadMore: () => void
}) => {
  const router = useRouter();
  
  if (history.length === 0) return null;

  return (
    <section className="space-y-4 pt-4 border-t border-outline-variant/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[22px] text-primary">history</span>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">Lịch sử phân tích CV</h2>
        </div>
        <Badge variant="neutral" size="sm">
          {history.length} bản ghi
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((item) => {
          const isPrimary = item.resumeId === primaryResumeId;
          const isTargeted = item.mode === 'job_targeted';
          const title = isTargeted
            ? 'Phân tích CV theo JD'
            : (item.context?.targetRole || 'Định hướng chuẩn ngành');

          return (
            <Card
              key={item.id}
              variant="elevated"
              padding="md"
              className="flex flex-col justify-between space-y-4 border border-outline-variant/60 shadow-subtle hover:border-primary/50 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={isTargeted ? 'primary' : 'secondary'} size="sm">
                      {isTargeted ? 'Theo JD mục tiêu' : 'Chuẩn thị trường'}
                    </Badge>
                    {isPrimary && (
                      <Badge variant="warning" size="sm" icon={<span className="material-symbols-outlined text-[14px]">star</span>}>
                        CV chính
                      </Badge>
                    )}
                  </div>
                  {item.status === 'completed' ? (
                    <Badge variant="success" size="sm">Hoàn thành</Badge>
                  ) : item.status === 'failed' ? (
                    <Badge variant="error" size="sm">Lỗi</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Đang xử lý</Badge>
                  )}
                </div>

                {/* Preserved snapshot context */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
                    <span className="font-medium">Bối cảnh đối chiếu:</span>
                    <ClientDate date={item.createdAt} />
                  </div>
                  <div className="font-bold text-on-surface">
                    {title}
                    {item.context?.seniority ? ` (${item.context.seniority})` : ''}
                  </div>
                  {item.context?.industry && (
                    <div className="text-[11px] text-on-surface-variant">
                      Ngành: <span className="font-medium text-on-surface">{item.context.industry}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                {!isPrimary && item.resumeId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={isSettingPrimary}
                    disabled={isSettingPrimary}
                    onClick={() => onSetPrimary(item.resumeId)}
                  >
                    Đặt làm CV chính
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/resume-analyses/${item.id}`)}
                  icon={<span className="material-symbols-outlined text-[16px]">visibility</span>}
                  iconPosition="right"
                >
                  Xem kết quả
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {hasNextPage && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            loading={isFetchingNextPage}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm lịch sử'}
          </Button>
        </div>
      )}
    </section>
  );
};

interface ResumeUploadPanelProps {
  file: File | null;
  isDragging: boolean;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  onRetry?: () => void;
  retryDisabled: boolean;
  existingResumes?: ResumeView[];
  selectedResumeId?: string | null;
  onSelectExistingResume?: (resume: ResumeView) => void;
}

const ResumeUploadPanel = ({
  file,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  onFileChange,
  handleRemoveFile,
  onRetry,
  retryDisabled,
  existingResumes,
  selectedResumeId,
  onSelectExistingResume,
}: ResumeUploadPanelProps) => (
  <Card variant="elevated" padding="lg" className="space-y-4 bg-white border border-outline-variant/60 shadow-card">
    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
      <div className="flex items-center gap-2 text-primary font-bold text-sm">
        <span className="material-symbols-outlined text-[20px]">upload_file</span>
        <span>1. Hồ sơ ứng viên (CV)</span>
      </div>
      <Badge variant="neutral" size="sm">PDF / DOCX ≤ 10MB</Badge>
    </div>

    {!file ? (
      <div className="space-y-4">
        <label
          className={`cursor-pointer flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border-2 border-dashed transition-all text-center ${
            isDragging
              ? 'border-primary bg-primary-fixed/20'
              : 'border-outline-variant/80 bg-surface-container-low/50 hover:bg-surface-container-low'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          htmlFor="cvFile"
        >
          <span className="material-symbols-outlined text-[40px] text-primary mb-2">cloud_upload</span>
          <p className="text-xs sm:text-sm font-semibold text-on-surface mb-1">
            Kéo thả file vào đây hoặc <span className="text-primary underline font-bold">nhấn để chọn</span>
          </p>
          <p className="text-[11px] text-on-surface-variant">Hỗ trợ file PDF, DOCX (Tối đa 10MB)</p>
          <input
            id="cvFile"
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={onFileChange}
          />
        </label>

        {existingResumes && existingResumes.length > 0 && onSelectExistingResume && (
          <div className="pt-2 border-t border-outline-variant/30 space-y-2">
            <div className="text-[11px] font-semibold text-on-surface-variant">Hoặc chọn từ CV đã lưu:</div>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {existingResumes.map((r) => {
                const isSelected = selectedResumeId === r.id;
                const isReady = r.status === 'ready';
                const isProcessing = r.status === 'processing' || r.status === 'pending' || r.status === 'queued';
                const isFailed = r.status === 'failed';

                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={!isReady}
                    onClick={() => onSelectExistingResume(r)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between gap-2 ${
                      !isReady
                        ? 'opacity-60 bg-surface-container-low/50 border-outline-variant/40 cursor-not-allowed text-on-surface-variant'
                        : isSelected
                        ? 'border-primary bg-primary-fixed/20 text-primary font-bold'
                        : 'border-outline-variant/50 hover:border-primary text-on-surface bg-white'
                    }`}
                  >
                    <span className="truncate font-medium">{r.fileName}</span>
                    <span className="text-[11px] flex-shrink-0 font-bold">
                      {isSelected ? (
                        <span className="text-primary">Đã chọn</span>
                      ) : isReady ? (
                        <span className="text-primary">Chọn CV này</span>
                      ) : isProcessing ? (
                        <span className="text-amber-700">Đang xử lý</span>
                      ) : isFailed ? (
                        <span className="text-error">Lỗi xử lý</span>
                      ) : (
                        <span className="text-on-surface-variant">Chưa sẵn sàng</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-on-surface truncate" title={file.name}>
              {file.name}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && !retryDisabled && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Thử tải lại
            </Button>
          )}
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
            title="Xóa file"
            aria-label="Xóa file"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
    )}
  </Card>
);

interface JobDescriptionPanelProps {
  jdTitle: string;
  setJdTitle: React.Dispatch<React.SetStateAction<string>>;
  jdContent: string;
  setJdContent: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
}

const JobDescriptionPanel = ({ jdTitle, setJdTitle, jdContent, setJdContent, loading }: JobDescriptionPanelProps) => (
  <Card variant="elevated" padding="lg" className="space-y-4 bg-white border border-outline-variant/60 shadow-card">
    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
      <div className="flex items-center gap-2 text-primary font-bold text-sm">
        <span className="material-symbols-outlined text-[20px]">work</span>
        <span>2. Mô tả công việc (JD)</span>
      </div>
      <Badge variant="primary" size="sm">Bắt buộc tiêu đề & nội dung</Badge>
    </div>

    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="jdTitle">
          Chức danh tuyển dụng (Title) <span className="text-red-500">*</span>
        </label>
        <input
          id="jdTitle"
          type="text"
          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none text-xs sm:text-sm"
          placeholder="VD: Senior Frontend Developer (React)"
          value={jdTitle}
          onChange={e => setJdTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-on-surface" htmlFor="jdContent">
            Nội dung JD chi tiết <span className="text-red-500">*</span>
          </label>
          <span className="text-[11px] text-on-surface-variant">Dán nội dung tuyển dụng thực tế</span>
        </div>
        <textarea
          id="jdContent"
          rows={5}
          className="w-full p-3.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none text-xs sm:text-sm leading-relaxed"
          placeholder="Dán toàn bộ hoặc các yêu cầu chính trong JD (kỹ năng, trách nhiệm, kinh nghiệm) vào đây để Nexora đối chiếu chi tiết..."
          value={jdContent}
          onChange={e => setJdContent(e.target.value)}
          disabled={loading}
        />
      </div>
    </div>
  </Card>
);

interface FieldBenchmarkPanelProps {
  industry: string;
  setIndustry: React.Dispatch<React.SetStateAction<string>>;
  targetRole: string;
  setTargetRole: React.Dispatch<React.SetStateAction<string>>;
  seniority: string;
  setSeniority: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
}

const FieldBenchmarkPanel = ({
  industry,
  setIndustry,
  targetRole,
  setTargetRole,
  seniority,
  setSeniority,
  loading,
}: FieldBenchmarkPanelProps) => (
  <Card variant="elevated" padding="lg" className="space-y-4 bg-white border border-outline-variant/60 shadow-card">
    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
      <div className="flex items-center gap-2 text-primary font-bold text-sm">
        <span className="material-symbols-outlined text-[20px]">insights</span>
        <span>2. Định hướng chuẩn ngành</span>
      </div>
      <Badge variant="secondary" size="sm">6 trục tiêu chuẩn</Badge>
    </div>

    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="industry">
          Ngành nghề / Lĩnh vực <span className="text-red-500">*</span>
        </label>
        <input
          id="industry"
          type="text"
          maxLength={160}
          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none text-xs sm:text-sm"
          placeholder="VD: Công nghệ thông tin / Thương mại điện tử / Fintech"
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="targetRole">
          Vị trí mục tiêu <span className="text-red-500">*</span>
        </label>
        <input
          id="targetRole"
          type="text"
          maxLength={160}
          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none text-xs sm:text-sm"
          placeholder="VD: Senior Frontend Developer / Data Analyst"
          value={targetRole}
          onChange={e => setTargetRole(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="seniority">
          Cấp bậc kinh nghiệm <span className="text-red-500">*</span>
        </label>
        <input
          id="seniority"
          type="text"
          maxLength={80}
          className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none text-xs sm:text-sm"
          placeholder="VD: Fresher / Junior / Mid-level / Senior / Lead"
          value={seniority}
          onChange={e => setSeniority(e.target.value)}
          disabled={loading}
        />
      </div>
    </div>
  </Card>
);

export default function ResumesPage() {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAuth();
  const { data: currentUser } = useCurrentUser();
  
  const { data: careerProfile } = useCareerProfile();
  const { data: userResumes } = useResumes();
  const { mutate: setPrimaryResume, isPending: isSettingPrimary } = useSetPrimaryResume();

  const { history, historyQuery, pending, addHistoryItem, setPendingAnalysis } = useResumeAnalysisHistory(currentUser?.id);
  const hasResumed = useRef(false);
  const isMounted = useRef(true);
  const uploadGeneration = useRef(0);
  const uploadAbortController = useRef<AbortController | null>(null);
  const analysisAbortController = useRef<AbortController | null>(null);
  const activeAnalysisKey = useRef<string | null>(null);
  const completedUpload = useRef<{ file: File; token: string; contentType: string; size: number } | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      uploadGeneration.current += 1;
      uploadAbortController.current?.abort();
      analysisAbortController.current?.abort();
    };
  }, []);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [selectedResumeView, setSelectedResumeView] = useState<ResumeView | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume status polling
  const { data: resumeData } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: ({ signal }) => cvAnalysisApi.getResume(resumeId!, { signal }),
    enabled: authReady && isAuthenticated && !!resumeId,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      const status = readStatus(query.state.data);
      return (status === 'ready' || status === 'failed') ? false : REALTIME_FALLBACK_POLL_MS;
    }
  });

  const resumeStatus = readStatus(resumeData);
  const isResumeReady = resumeStatus === 'ready';

  // Mode selection state
  const [mode, setMode] = useState<ResumeAnalysisMode>('job_targeted');
  const [useCurrentGoal, setUseCurrentGoal] = useState(true);

  // JD state (job_targeted)
  const [jdTitle, setJdTitle] = useState('');
  const [jdContent, setJdContent] = useState('');

  // Field benchmark state (field_benchmark)
  const [industry, setIndustry] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [seniority, setSeniority] = useState('');

  // Active running operation state to truthfully reflect active operation mode in UI and stage messages
  const [activeOperation, setActiveOperation] = useState<ResumeAnalysisOperation | null>(null);

  // Submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceededError, setQuotaExceededError] = useState<{ title: string; message: string; requestId?: string } | null>(null);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'analyzing'>('idle');

  const finishAnalysis = React.useCallback((operation: ResumeAnalysisOperation, analysis: { id: string }) => {
    if (!isMounted.current) return;
    setPendingAnalysis(null);
    if (operation.mode === 'job_targeted') {
      addHistoryItem();
    } else {
      addHistoryItem();
    }
    setStage('ready');
    router.push(`/resume-analyses/${analysis.id}`);
  }, [addHistoryItem, router, setPendingAnalysis]);

  const startAnalysis = React.useCallback((operation: ResumeAnalysisOperation) => {
    if (activeAnalysisKey.current && activeAnalysisKey.current !== operation.idempotencyKey) return;
    activeAnalysisKey.current = operation.idempotencyKey;
    setActiveOperation(operation);

    // Synchronize visible form state to that exact persisted user intent BEFORE/while resuming it
    if (operation.mode === 'job_targeted') {
      setMode('job_targeted');
      setJdTitle(operation.jdTitle ?? '');
      setJdContent(operation.jdContent ?? '');
      setUseCurrentGoal(!operation.jdTitle && !operation.jobDescriptionId);
    } else if (operation.mode === 'field_benchmark') {
      setMode('field_benchmark');
      setIndustry(operation.industry ?? '');
      setTargetRole(operation.targetRole ?? '');
      setSeniority(operation.seniority ?? '');
      setUseCurrentGoal(!operation.industry && !operation.targetRole);
    }

    setLoading(true);
    setError(null);
    setQuotaExceededError(null);
    setStage('analyzing');
    const controller = new AbortController();
    analysisAbortController.current = controller;
    void runResumeAnalysisOperation(operation, {
      signal: controller.signal,
      save: setPendingAnalysis,
      onStage: () => setStage('analyzing'),
    }).then(analysis => {
      activeAnalysisKey.current = null;
      setActiveOperation(null);
      finishAnalysis(operation, analysis);
    }).catch((err: unknown) => {
      activeAnalysisKey.current = null;
      setActiveOperation(null);
      if (!isMounted.current || isAbortError(err)) return;
      if (err instanceof ApiError && (err.code === 'FEATURE_QUOTA_EXCEEDED' || err.code === 'FEATURE_NOT_AVAILABLE')) {
        const { title, message } = formatQuotaError(err.code);
        setQuotaExceededError({
          title,
          message,
          requestId: err.requestId,
        });
        setPendingAnalysis(null);
        setError(null);
        return;
      }
      if (err instanceof ApiError && err.code === 'RESUME_ANALYSIS_CONTEXT_INVALID') {
        setQuotaExceededError(null);
        setPendingAnalysis(null);
        setError('Mục tiêu nghề nghiệp hiện tại của bạn chưa có đủ thông tin cho phương thức này. Vui lòng thiết lập lại mục tiêu hoặc chọn Phân tích theo mục tiêu khác.');
        return;
      }
      setQuotaExceededError(null);
      setError(safeErrorMessage(err, 'Có lỗi xảy ra trong quá trình phân tích.'));
    }).finally(() => {
      if (isMounted.current) setLoading(false);
    });
  }, [finishAnalysis, setPendingAnalysis]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !currentUser?.id || !pending || pending.userId !== currentUser.id || hasResumed.current) return;
    hasResumed.current = true;
    startAnalysis(pending);
  }, [authReady, currentUser?.id, isAuthenticated, pending, startAnalysis]);

  useEffect(() => {
    if (!pending) hasResumed.current = false;
  }, [pending]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (fileSnapshot: File) => {
    const contentType = getUploadContentType(fileSnapshot);
    if (!contentType) {
      setError('Vui lòng tải lên file PDF hoặc DOCX với MIME tương ứng.');
      return;
    }
    if (fileSnapshot.size === 0) {
      setError('File CV không được để trống.');
      return;
    }
    if (fileSnapshot.size > 10 * 1024 * 1024) {
      setError('Dung lượng file không được vượt quá 10MB.');
      return;
    }

    const reusableUpload = completedUpload.current?.file === fileSnapshot
      && completedUpload.current.size === fileSnapshot.size
      && completedUpload.current.contentType === contentType
      ? completedUpload.current
      : null;
    if (!reusableUpload) completedUpload.current = null;

    uploadAbortController.current?.abort();
    uploadGeneration.current += 1;
    const generation = uploadGeneration.current;
    const controller = new AbortController();
    uploadAbortController.current = controller;
    analysisAbortController.current?.abort();
    analysisAbortController.current = null;
    activeAnalysisKey.current = null;
    hasResumed.current = false;
    setPendingAnalysis(null);
    setError(null);
    setFile(fileSnapshot);
    setResumeId(null);
    setSelectedResumeView(null);
    setStage(reusableUpload ? 'processing' : 'uploading');
    setIsUploading(true);

    const isCurrent = () => isMounted.current && generation === uploadGeneration.current;
    try {
      let uploadToken = reusableUpload?.token;
      if (!uploadToken) {
        const presign = await cvAnalysisApi.presignUpload({
          fileName: fileSnapshot.name,
          contentType,
          size: fileSnapshot.size,
        }, { signal: controller.signal });
        if (!isCurrent()) return;

        await cvAnalysisApi.uploadFile(presign.uploadUrl, fileSnapshot, {
          signal: controller.signal,
          expectedSize: fileSnapshot.size,
          contentType,
        });
        if (!isCurrent()) return;

        // Preserve the completed PUT capability while POST /resumes is in flight.
        // A lost POST response must replay completion with this token, not presign/PUT again.
        completedUpload.current = {
          file: fileSnapshot,
          token: presign.token,
          contentType,
          size: fileSnapshot.size,
        };
        uploadToken = presign.token;
      }

      setStage('processing');
      const resume = await cvAnalysisApi.createResume(uploadToken, { signal: controller.signal });
      if (!isCurrent()) return;
      completedUpload.current = null;
      setResumeId(resume.id);
    } catch (err: unknown) {
      if (!isCurrent() || isAbortError(err)) return;
      setError(safeErrorMessage(err, 'Tải file thất bại.'));
      // A completed PUT can be finalized safely with the same token. If the
      // in-memory intent was lost or expired, discard it so the next retry
      // obtains a fresh presign instead of replaying a known-invalid token.
      if (err instanceof ApiError && (err.code === 'UPLOAD_NOT_FOUND' || err.code === 'UPLOAD_INTENT_INVALID')) {
        completedUpload.current = null;
      }
      // Keep the exact File snapshot so a retry can reuse the same bytes.
      setResumeId(null);
      setStage('idle');
    } finally {
      if (isCurrent()) setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    uploadGeneration.current += 1;
    uploadAbortController.current?.abort();
    uploadAbortController.current = null;
    analysisAbortController.current?.abort();
    analysisAbortController.current = null;
    activeAnalysisKey.current = null;
    hasResumed.current = false;
    setPendingAnalysis(null);
    completedUpload.current = null;
    setFile(null);
    setResumeId(null);
    setSelectedResumeView(null);
    setIsUploading(false);
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectExistingResume = (selected: ResumeView) => {
    if (selected.status !== 'ready') {
      setError('Chỉ có thể chọn CV đã hoàn tất xử lý (sẵn sàng).');
      return;
    }
    setResumeId(selected.id);
    setSelectedResumeView(selected);
    setFile(null);
    setError(null);
  };

  const handleAnalyze = () => {
    if (activeAnalysisKey.current) return;
    if (!currentUser?.id) {
      setError('Phiên đăng nhập chưa sẵn sàng. Vui lòng thử lại sau giây lát.');
      return;
    }

    setQuotaExceededError(null);
    setError(null);

    if (useCurrentGoal) {
      if (mode === 'job_targeted') {
        const trimmedTitle = jdTitle.trim();
        const trimmedContent = jdContent.trim();
        if (!trimmedTitle || !trimmedContent) {
          setError('Vui lòng nhập đầy đủ Tiêu đề và Nội dung chi tiết của Mô tả công việc (JD).');
          return;
        }
      }

      let isMatchingPending = false;
      if (pending && pending.userId === currentUser.id && pending.mode === mode && !pending.resumeId) {
        if (mode === 'job_targeted') {
          const p = pending as JobTargetedAnalysisOperation;
          isMatchingPending = !p.jobDescriptionId && p.jdTitle === jdTitle.trim() && p.jdContent === jdContent.trim();
        } else {
          const p = pending as FieldBenchmarkAnalysisOperation;
          isMatchingPending = !p.industry;
        }
      }
      const existingOperation = isMatchingPending ? pending : null;

      const baseOp = {
        userId: currentUser.id,
        mode,
        careerGoalId: careerProfile?.activeCareerGoal?.id,
        analysisId: null,
        ...(mode === 'job_targeted' ? { jdContent: jdContent.trim(), jdTitle: jdTitle.trim() } : {}),
        ...(mode === 'field_benchmark' ? {
          industry: industry.trim() || careerProfile?.activeCareerGoal?.industry || undefined,
          targetRole: careerProfile?.activeCareerGoal?.targetRole || undefined,
          seniority: careerProfile?.activeCareerGoal?.seniority || undefined,
        } : {}),
      };

      const operation = existingOperation ?? createResumeAnalysisOperation(
        mode === 'job_targeted'
          ? (baseOp as unknown as JobTargetedAnalysisOperation)
          : (baseOp as unknown as FieldBenchmarkAnalysisOperation)
      );

      hasResumed.current = true;
      setPendingAnalysis(operation);
      startAnalysis(operation);
      return;
    }

    const effectiveResumeId = resumeId;
    const selectedResume = selectedResumeView || (userResumes?.find(r => r.id === effectiveResumeId) ?? null);
    const effectiveResumeReady = file ? isResumeReady : (selectedResume ? selectedResume.status === 'ready' : isResumeReady);

    if (!effectiveResumeId || !effectiveResumeReady) {
      setError('Vui lòng tải lên CV hoặc chọn một CV đã sẵn sàng.');
      return;
    }

    if (!file && selectedResume && selectedResume.status !== 'ready') {
      setError('Chỉ có thể chọn CV đã hoàn tất xử lý (sẵn sàng).');
      return;
    }

    if (mode === 'job_targeted') {
      const trimmedTitle = jdTitle.trim();
      const trimmedContent = jdContent.trim();
      if (!trimmedTitle || !trimmedContent) {
        setError('Vui lòng nhập đầy đủ Tiêu đề và Nội dung chi tiết của Mô tả công việc (JD).');
        return;
      }

      const existingOperation = pending
        && pending.userId === currentUser.id
        && pending.resumeId === effectiveResumeId
        && pending.mode === 'job_targeted'
        && pending.jdTitle === trimmedTitle
        && pending.jdContent === trimmedContent
        ? pending
        : null;

      const operation = existingOperation ?? createResumeAnalysisOperation({
        userId: currentUser.id,
        resumeId: effectiveResumeId!,
        mode: 'job_targeted',
        jobDescriptionId: null,
        analysisId: null,
        jdTitle: trimmedTitle,
        jdContent: trimmedContent,
      });

      hasResumed.current = true;
      setPendingAnalysis(operation);
      startAnalysis(operation);
    } else {
      const trimmedIndustry = industry.trim();
      const trimmedTargetRole = targetRole.trim();
      const trimmedSeniority = seniority.trim();
      if (!trimmedIndustry || !trimmedTargetRole || !trimmedSeniority) {
        setError('Vui lòng nhập đầy đủ Ngành nghề, Vị trí mục tiêu và Cấp bậc kinh nghiệm.');
        return;
      }

      const existingOperation = pending
        && pending.userId === currentUser.id
        && pending.resumeId === effectiveResumeId
        && pending.mode === 'field_benchmark'
        && pending.industry === trimmedIndustry
        && pending.targetRole === trimmedTargetRole
        && pending.seniority === trimmedSeniority
        ? pending
        : null;

      const operation = existingOperation ?? createResumeAnalysisOperation({
        userId: currentUser.id,
        resumeId: effectiveResumeId!,
        mode: 'field_benchmark',
        analysisId: null,
        industry: trimmedIndustry,
        targetRole: trimmedTargetRole,
        seniority: trimmedSeniority,
      });

      hasResumed.current = true;
      setPendingAnalysis(operation);
      startAnalysis(operation);
    }
  };

  const activeMode = activeOperation?.mode ?? mode;
  const hasPrimaryResume = !!careerProfile?.primaryResume;
  const hasGoal = !!careerProfile?.activeCareerGoal && !!careerProfile.activeCareerGoal.targetRole && !!careerProfile.activeCareerGoal.seniority;
  const isBenchmarkIndustryMissing = useCurrentGoal && activeMode === 'field_benchmark' && !careerProfile?.activeCareerGoal?.industry && !industry.trim();
  const isJobTargetedIncomplete = activeMode === 'job_targeted' && (!jdTitle.trim() || !jdContent.trim());
  const isFieldBenchmarkIncomplete = !useCurrentGoal && activeMode === 'field_benchmark' && (!industry.trim() || !targetRole.trim() || !seniority.trim());
  const isCurrentGoalIncomplete = useCurrentGoal && (!hasPrimaryResume || !hasGoal || isBenchmarkIndustryMissing);
  const selectedResume = selectedResumeView || (userResumes?.find(r => r.id === resumeId) ?? null);
  const effectiveResumeReady = file ? isResumeReady : (selectedResume ? selectedResume.status === 'ready' : isResumeReady);
  const isCustomResumeIncomplete = !useCurrentGoal && (!resumeId || !effectiveResumeReady || isUploading);
  const isSubmitDisabled = loading || isUploading || isJobTargetedIncomplete || isFieldBenchmarkIncomplete || isCurrentGoalIncomplete || isCustomResumeIncomplete;

  const visibleStage = stage === 'processing' && resumeStatus === 'ready' ? 'ready' : stage;
  const stageMessage = visibleStage === 'uploading'
    ? 'Đang tải file CV lên...'
    : visibleStage === 'processing'
      ? 'Đang xử lý cấu trúc CV...'
      : visibleStage === 'ready'
        ? 'CV đã sẵn sàng.'
        : visibleStage === 'analyzing'
          ? (activeMode === 'job_targeted' ? 'AI đang đối chiếu với yêu cầu công việc...' : 'AI đang đánh giá theo chuẩn năng lực ngành...')
          : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <ProductPageHero
        feature="cv"
        title="Phân tích hồ sơ CV & Độ tương thích mục tiêu"
        description="Bổ sung CV, mục tiêu và ngữ cảnh ngay trên trang. Chỉ khi đủ bối cảnh, Nexora mới bắt đầu phân tích và lưu một snapshot bất biến."
      />

      {/* Latest Completed Analysis Banner (Quick access) */}
      {(() => {
        const latestItem = history.find((item) => item.status === 'completed');
        if (!latestItem) return null;
        const title = latestItem.mode === 'job_targeted'
          ? 'Phân tích CV theo JD'
          : (latestItem.context?.targetRole || 'Định hướng chuẩn ngành');

        return (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-surface border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    Bản phân tích gần nhất sẵn có
                  </span>
                  <Badge variant="success" size="sm">Đã hoàn thành</Badge>
                </div>
                <div className="text-sm font-bold text-on-surface mt-0.5">
                  {title}
                  {latestItem.context?.seniority ? ` (${latestItem.context.seniority})` : ''}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Xem lại chi tiết điểm số, kỹ năng và các đề xuất tối ưu hóa CV cụ thể.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(`/resume-analyses/${latestItem.id}`)}
              icon={<span className="material-symbols-outlined text-[18px]">visibility</span>}
              iconPosition="right"
              className="flex-shrink-0 shadow-sm"
            >
              Xem ngay kết quả
            </Button>
          </div>
        );
      })()}

      {/* Data Source / Intent Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl bg-surface-container-low border border-outline-variant/40">
        <div className="flex items-center gap-2 px-2 text-xs font-bold text-on-surface">
          <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
          <span>Nguồn dữ liệu phân tích:</span>
        </div>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Nguồn dữ liệu">
          <button
            type="button"
            role="tab"
            aria-selected={useCurrentGoal}
            onClick={() => { setUseCurrentGoal(true); setError(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              useCurrentGoal
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Mục tiêu hiện tại (Tự động)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!useCurrentGoal}
            onClick={() => { setUseCurrentGoal(false); setError(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !useCurrentGoal
                ? 'bg-white text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Mục tiêu khác (Tuỳ chỉnh)
          </button>
        </div>
      </div>

      {/* Current Goal Context Banner vs Custom Setup */}
      {useCurrentGoal ? (
        <div className="space-y-4">
          {hasPrimaryResume && hasGoal ? (
            <Card variant="elevated" padding="md" className="bg-surface-container-low/40 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  <span className="font-bold text-xs text-on-surface">Bối cảnh phân tích đã sẵn sàng:</span>
                </div>
                <Link
                  href="/career-profile"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Xem trong Hồ sơ &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-outline-variant/30 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                  <div className="min-w-0">
                    <div className="text-[11px] text-on-surface-variant">CV chính:</div>
                    <div className="font-bold text-on-surface truncate">
                      {careerProfile?.primaryResume?.fileName}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-outline-variant/30 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">flag</span>
                  <div className="min-w-0">
                    <div className="text-[11px] text-on-surface-variant">Mục tiêu nghề nghiệp:</div>
                    <div className="font-bold text-on-surface truncate">
                      {careerProfile?.activeCareerGoal?.targetRole} · {careerProfile?.activeCareerGoal?.seniority}
                      {careerProfile?.activeCareerGoal?.industry ? ` · ${careerProfile.activeCareerGoal.industry}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Missing industry notice if field benchmark */}
              {mode === 'field_benchmark' && !careerProfile?.activeCareerGoal?.industry && (
                <div className="mt-3 pt-3 border-t border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">help_outline</span>
                      Bổ sung ngành nghề cho lần phân tích này:
                    </span>
                    <Badge variant="warning" size="sm">Cần ngành</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Công nghệ thông tin', 'Thương mại điện tử (E-Commerce)', 'Fintech / Ngân hàng số', 'SaaS / B2B Products', 'Logistics'].map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setIndustry(ind)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                          industry === ind
                            ? 'bg-primary text-white font-semibold'
                            : 'bg-white border border-outline-variant/60 text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Hoặc nhập ngành khác..."
                    className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/60 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </Card>
          ) : !hasPrimaryResume ? (
            <Card variant="elevated" padding="lg" className="border-2 border-primary/40 bg-white space-y-4 shadow-card">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                <span>Bước 1: Bổ sung CV chính để bắt đầu phân tích</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Bạn chưa thiết lập CV chính trong hệ thống. Hãy tải lên CV mới hoặc chọn từ danh sách đã có:
              </p>
              <ResumeUploadPanel
                file={file}
                isDragging={isDragging}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                fileInputRef={fileInputRef}
                onFileChange={onFileChange}
                handleRemoveFile={handleRemoveFile}
                onRetry={file && !resumeId ? () => void handleFile(file) : undefined}
                retryDisabled={isUploading || !!resumeId}
                existingResumes={userResumes}
                selectedResumeId={resumeId}
                onSelectExistingResume={handleSelectExistingResume}
              />
            </Card>
          ) : (
            <Card variant="elevated" padding="lg" className="border-2 border-primary/40 bg-white space-y-4 shadow-card">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">flag</span>
                <span>Bước 2: Thiết lập mục tiêu nghề nghiệp</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Bạn chưa có mục tiêu nghề nghiệp chính thức để hệ thống đối chiếu chuẩn năng lực. Vui lòng thiết lập tại Hồ sơ nghề nghiệp hoặc chuyển sang chế độ &quot;Mục tiêu khác (Tuỳ chỉnh)&quot;.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link href="/career-profile">
                  <Button variant="primary" size="sm">
                    Thiết lập mục tiêu trong Hồ sơ
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setUseCurrentGoal(false)}>
                  Nhập mục tiêu ngay tại đây
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResumeUploadPanel
            file={file}
            isDragging={isDragging}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
            handleRemoveFile={handleRemoveFile}
            onRetry={file && !resumeId ? () => void handleFile(file) : undefined}
            retryDisabled={isUploading || !!resumeId}
            existingResumes={userResumes}
            selectedResumeId={resumeId}
            onSelectExistingResume={handleSelectExistingResume}
          />

          {mode === 'job_targeted' ? (
            <JobDescriptionPanel
              jdTitle={jdTitle}
              setJdTitle={setJdTitle}
              jdContent={jdContent}
              setJdContent={setJdContent}
              loading={loading}
            />
          ) : (
            <FieldBenchmarkPanel
              industry={industry}
              setIndustry={setIndustry}
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              seniority={seniority}
              setSeniority={setSeniority}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Analysis Mode Selector & JD Textarea */}
      <Card variant="elevated" padding="lg" className="space-y-6 bg-white border border-outline-variant/60 shadow-card">
        <div>
          <label className="block text-xs font-bold text-on-surface mb-2">
            Chọn hình thức phân tích đối chiếu:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1: Field Benchmark */}
            <button
              type="button"
              onClick={() => { setMode('field_benchmark'); setError(null); }}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'field_benchmark'
                  ? 'bg-primary-fixed/30 border-primary shadow-sm'
                  : 'bg-white border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-on-surface">Theo vị trí mục tiêu</span>
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    mode === 'field_benchmark' ? 'text-primary' : 'text-outline-variant'
                  }`}
                >
                  {mode === 'field_benchmark' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Đánh giá độ sẵn sàng 6 trục đối chiếu với chuẩn thị trường của {careerProfile?.activeCareerGoal?.targetRole || targetRole || 'vị trí mục tiêu'}.
              </p>
            </button>

            {/* Mode 2: Job Targeted */}
            <button
              type="button"
              onClick={() => { setMode('job_targeted'); setError(null); }}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'job_targeted'
                  ? 'bg-primary-fixed/30 border-primary shadow-sm'
                  : 'bg-white border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-on-surface">Theo JD cụ thể</span>
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    mode === 'job_targeted' ? 'text-primary' : 'text-outline-variant'
                  }`}
                >
                  {mode === 'job_targeted' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Đo lường 5 trục tiêu chuẩn đối chiếu trực tiếp với một văn bản mô tả công việc (JD) bạn dán vào.
              </p>
            </button>
          </div>
        </div>

        {/* JD Inputs for job_targeted when using current goal */}
        {mode === 'job_targeted' && useCurrentGoal && (
          <div className="space-y-3 pt-2 border-t border-outline-variant/30">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="currentGoalJdTitle">
                Chức danh tuyển dụng (Title): <span className="text-red-500">*</span>
              </label>
              <input
                id="currentGoalJdTitle"
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none text-xs sm:text-sm"
                placeholder="VD: Senior Frontend Developer (React)"
                value={jdTitle}
                onChange={e => setJdTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-on-surface" htmlFor="currentGoalJdContent">
                  Nội dung JD mục tiêu: <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-on-surface-variant">Dán nội dung tuyển dụng thực tế</span>
              </div>
              <textarea
                id="currentGoalJdContent"
                value={jdContent}
                onChange={(e) => setJdContent(e.target.value)}
                rows={5}
                disabled={loading}
                className="w-full p-3.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:outline-none text-xs sm:text-sm leading-relaxed"
                placeholder="Dán toàn bộ hoặc các yêu cầu chính trong JD (kỹ năng, trách nhiệm, kinh nghiệm) vào đây để Nexora đối chiếu chi tiết..."
              />
            </div>
          </div>
        )}
      </Card>

      {/* In-flight Scanning / Processing View */}
      {(loading || isUploading || (file && !isResumeReady)) && (
        <Card variant="elevated" padding="lg" className="border border-primary/40 bg-white space-y-4 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px] animate-spin">sync</span>
              <span className="text-xs font-bold text-on-surface">Đang xử lý phân tích</span>
            </div>
            <Badge variant="primary" size="sm">AI Processing</Badge>
          </div>
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-on-surface">Nexora AI Document Intelligence</div>
                <div className="text-xs text-primary font-semibold">{stageMessage || 'Hệ thống đang đối chiếu dữ liệu...'}</div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden relative">
              <div className="h-full bg-primary rounded-full animate-indeterminate w-1/3 absolute" />
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Quá trình đang được xử lý bất đồng bộ. Kết quả sẽ xuất hiện khi hoàn tất. Bạn có thể rời trang và quay lại xem kết quả sau.
            </p>
          </div>
        </Card>
      )}

      {/* Quota Exceeded Error Card */}
      {quotaExceededError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="alert">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">lock</span>
            </div>
            <div>
              <div className="text-sm font-bold text-amber-950">{quotaExceededError.title}</div>
              <div className="text-xs text-amber-900 mt-0.5">{quotaExceededError.message}</div>
              {quotaExceededError.requestId && (
                <div className="text-[10px] text-amber-800 font-mono mt-1">Mã yêu cầu: {quotaExceededError.requestId}</div>
              )}
            </div>
          </div>
          <Link href="/billing" className="flex-shrink-0">
            <Button variant="primary" size="sm">
              Nâng cấp gói ngay
            </Button>
          </Link>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/40 text-error text-xs font-medium flex items-center gap-2" role="alert">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Action Trigger Block */}
      <div className="pt-2 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-on-surface-variant">
          {useCurrentGoal && !hasPrimaryResume && '• Vui lòng bổ sung CV chính trước khi phân tích'}
          {useCurrentGoal && hasPrimaryResume && !hasGoal && '• Vui lòng thiết lập mục tiêu nghề nghiệp'}
          {useCurrentGoal && hasPrimaryResume && hasGoal && mode === 'field_benchmark' && isBenchmarkIndustryMissing && '• Vui lòng bổ sung ngành nghề đối chiếu'}
          {!useCurrentGoal && !effectiveResumeReady && '• Vui lòng chọn hoặc tải lên CV đã sẵn sàng'}
          {mode === 'job_targeted' && (!jdTitle.trim() || !jdContent.trim()) && '• Vui lòng nhập tiêu đề và nội dung JD'}
          {mode === 'field_benchmark' && !useCurrentGoal && (!industry.trim() || !targetRole.trim() || !seniority.trim()) && '• Vui lòng điền đủ ngành nghề, vị trí và cấp bậc'}
          {!isSubmitDisabled && '• Sẵn sàng phân tích với dữ liệu hiện tại'}
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleAnalyze}
          disabled={isSubmitDisabled}
          loading={loading || isUploading}
          icon={<span className="material-symbols-outlined text-[20px]">rocket_launch</span>}
          iconPosition="right"
          className="w-full sm:w-auto shadow-md"
        >
          {loading ? 'Đang phân tích...' : isUploading ? 'Đang tải lên...' : activeMode === 'job_targeted' ? 'Phân tích độ phù hợp' : 'Đánh giá mức độ sẵn sàng'}
        </Button>
      </div>

      {/* History Section or Empty State */}
      {history.length > 0 ? (
        <ResumeHistoryList 
          history={history} 
          primaryResumeId={careerProfile?.primaryResume?.id}
          onSetPrimary={setPrimaryResume}
          isSettingPrimary={isSettingPrimary}
          hasNextPage={!!historyQuery.hasNextPage}
          isFetchingNextPage={historyQuery.isFetchingNextPage}
          onLoadMore={() => historyQuery.fetchNextPage()}
        />
      ) : (
        <Card variant="flat" padding="md" className="text-center py-8 border-dashed">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-[24px]">manage_search</span>
          </div>
          <div className="text-sm font-bold text-on-surface">Chưa có lịch sử phân tích CV</div>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1">
            Sau khi bạn khởi chạy phân tích, kết quả chi tiết và báo cáo đối chiếu sẽ được lưu giữ tại đây.
          </p>
        </Card>
      )}
    </div>
  );
}
