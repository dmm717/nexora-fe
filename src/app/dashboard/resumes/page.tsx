'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientDate } from '@/components/ui/ClientDate';
import styles from './Resumes.module.css';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/services/apiClient';
import { cvAnalysisApi, getUploadContentType } from '@/services/cvAnalysisApi';
import {
  createResumeAnalysisOperation,
  ResumeAnalysisOperation,
  runResumeAnalysisOperation,
} from '@/services/resumeAnalysisCoordinator';
import {
  ResumeAnalysisMode,
  formatQuotaError,
} from '@/services/cvAnalysisContract';
import { AnalysisHistoryItem, useResumeAnalysisHistory } from '@/hooks/useResumeAnalysisHistory';
import { useAuth } from '@/components/providers/AuthBootstrapProvider';
import { useCurrentUser } from '@/hooks/queries/useUser';
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

const ResumeHistoryList = ({ history }: { history: AnalysisHistoryItem[] }) => {
  const router = useRouter();
  return (
    <div className={styles.panel} style={{ marginTop: '2rem' }}>
      <h2 className={styles.panelTitle}>Lịch sử phân tích của bạn (Lưu trên thiết bị)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        {history.map(item => {
          const isBenchmark = item.mode === 'field_benchmark' || (!item.jdTitle && !!item.targetRole);
          const title = isBenchmark
            ? `${item.targetRole ?? 'Vị trí mục tiêu'}${item.seniority ? ` · ${item.seniority}` : ''}`
            : (item.jdTitle || 'Phân tích CV');
          const subtitle = isBenchmark && item.industry ? item.industry : null;
          return (
            <div
              key={item.id}
              onClick={() => router.push(`/dashboard/resume-analyses/${item.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/dashboard/resume-analyses/${item.id}`); } }}
              style={{
                cursor: 'pointer',
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9fafb'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#111827' }}>{title}</div>
                {subtitle && <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.15rem' }}>{subtitle}</div>}
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  <ClientDate date={item.createdAt} />
                </div>
              </div>
              <div style={{ color: '#2563eb', fontWeight: 500, fontSize: '0.875rem' }}>Xem kết quả &rarr;</div>
            </div>
          );
        })}
      </div>
    </div>
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
}: ResumeUploadPanelProps) => (
  <div className={styles.panel}>
    <h2 className={styles.panelTitle}>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      1. Hồ sơ ứng viên (CV)
    </h2>

    {!file ? (
      <label
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        htmlFor="cvFile"
      >
        <svg className={styles.uploadIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48" style={{margin: '0 auto 1rem auto'}}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p className={styles.uploadText}>Kéo thả file vào đây hoặc <strong>nhấn để chọn</strong></p>
        <p className={styles.uploadHint}>Hỗ trợ file PDF, DOCX (Tối đa 10MB)</p>
        <input
          id="cvFile"
          type="file"
          ref={fileInputRef}
          className={styles.fileInput}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onFileChange}
        />
      </label>
    ) : (
      <div className={styles.selectedFile}>
        <div className={styles.fileInfo}>
          <svg className={styles.fileIcon} fill="currentColor" viewBox="0 0 20 20" width="32" height="32">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
          <div>
            <div className={styles.fileName} title={file.name}>{file.name}</div>
            <div className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
        </div>
        {onRetry && !retryDisabled && (
          <button type="button" onClick={onRetry}>Thử tải lại</button>
        )}
        <button className={styles.removeButton} onClick={handleRemoveFile} title="Xóa file">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )}
  </div>
);

interface JobDescriptionPanelProps {
  jdTitle: string;
  setJdTitle: React.Dispatch<React.SetStateAction<string>>;
  jdContent: string;
  setJdContent: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
}

const JobDescriptionPanel = ({ jdTitle, setJdTitle, jdContent, setJdContent, loading }: JobDescriptionPanelProps) => (
  <div className={styles.panel}>
    <h2 className={styles.panelTitle}>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      2. Mô tả công việc (JD)
    </h2>

    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor="jdTitle">Chức danh (Title)</label>
      <input
        id="jdTitle"
        type="text"
        className={styles.input}
        placeholder="VD: Senior Frontend Developer (React)"
        value={jdTitle}
        onChange={e => setJdTitle(e.target.value)}
        disabled={loading}
      />
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor="jdContent">Nội dung chi tiết</label>
      <textarea
        id="jdContent"
        className={styles.textarea}
        placeholder="Dán toàn bộ nội dung yêu cầu công việc, kỹ năng, kinh nghiệm vào đây..."
        value={jdContent}
        onChange={e => setJdContent(e.target.value)}
        disabled={loading}
      ></textarea>
    </div>
  </div>
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
  <div className={styles.panel}>
    <h2 className={styles.panelTitle}>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      2. Định hướng chuẩn ngành
    </h2>

    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor="industry">Ngành nghề / Lĩnh vực</label>
      <input
        id="industry"
        type="text"
        maxLength={160}
        className={styles.input}
        placeholder="VD: Công nghệ thông tin / Thương mại điện tử"
        value={industry}
        onChange={e => setIndustry(e.target.value)}
        disabled={loading}
      />
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor="targetRole">Vị trí mục tiêu</label>
      <input
        id="targetRole"
        type="text"
        maxLength={160}
        className={styles.input}
        placeholder="VD: Senior Frontend Developer / Data Analyst"
        value={targetRole}
        onChange={e => setTargetRole(e.target.value)}
        disabled={loading}
      />
    </div>

    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor="seniority">Cấp bậc kinh nghiệm</label>
      <input
        id="seniority"
        type="text"
        maxLength={80}
        className={styles.input}
        placeholder="VD: Fresher / Junior / Mid-level / Senior / Lead"
        value={seniority}
        onChange={e => setSeniority(e.target.value)}
        disabled={loading}
      />
    </div>
  </div>
);

export default function ResumesPage() {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAuth();
  const { data: currentUser } = useCurrentUser();

  const { history, pending, addHistoryItem, setPendingAnalysis } = useResumeAnalysisHistory(currentUser?.id);
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
      addHistoryItem({ id: analysis.id, mode: 'job_targeted', jdTitle: operation.jdTitle });
    } else {
      addHistoryItem({
        id: analysis.id,
        mode: 'field_benchmark',
        targetRole: operation.targetRole,
        seniority: operation.seniority,
        industry: operation.industry,
      });
    }
    setStage('ready');
    router.push(`/dashboard/resume-analyses/${analysis.id}`);
  }, [addHistoryItem, router, setPendingAnalysis]);

  const startAnalysis = React.useCallback((operation: ResumeAnalysisOperation) => {
    if (activeAnalysisKey.current && activeAnalysisKey.current !== operation.idempotencyKey) return;
    activeAnalysisKey.current = operation.idempotencyKey;
    setActiveOperation(operation);

    // Synchronize visible form state to that exact persisted user intent BEFORE/while resuming it
    if (operation.mode === 'job_targeted') {
      setMode('job_targeted');
      setJdTitle(operation.jdTitle);
      setJdContent(operation.jdContent);
    } else if (operation.mode === 'field_benchmark') {
      setMode('field_benchmark');
      setIndustry(operation.industry);
      setTargetRole(operation.targetRole);
      setSeniority(operation.seniority);
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
    setIsUploading(false);
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = () => {
    if (activeAnalysisKey.current) return;
    if (!currentUser?.id) {
      setError('Phiên đăng nhập chưa sẵn sàng. Vui lòng thử lại sau giây lát.');
      return;
    }
    if (!file || !isResumeReady || !resumeId) {
      setError('Vui lòng tải lên CV và chờ xử lý xong.');
      return;
    }

    setQuotaExceededError(null);
    setError(null);

    if (mode === 'job_targeted') {
      const trimmedTitle = jdTitle.trim();
      const trimmedContent = jdContent.trim();
      if (!trimmedTitle || !trimmedContent) {
        setError('Vui lòng nhập đầy đủ Tiêu đề và Mô tả công việc.');
        return;
      }

      const existingOperation = pending
        && pending.userId === currentUser.id
        && pending.resumeId === resumeId
        && pending.mode === 'job_targeted'
        && pending.jdTitle === trimmedTitle
        && pending.jdContent === trimmedContent
        ? pending
        : null;

      const operation = existingOperation ?? createResumeAnalysisOperation({
        userId: currentUser.id,
        resumeId,
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
        && pending.resumeId === resumeId
        && pending.mode === 'field_benchmark'
        && pending.industry === trimmedIndustry
        && pending.targetRole === trimmedTargetRole
        && pending.seniority === trimmedSeniority
        ? pending
        : null;

      const operation = existingOperation ?? createResumeAnalysisOperation({
        userId: currentUser.id,
        resumeId,
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
  const isJobTargetedIncomplete = activeMode === 'job_targeted' && (!jdTitle.trim() || !jdContent.trim());
  const isFieldBenchmarkIncomplete = activeMode === 'field_benchmark' && (!industry.trim() || !targetRole.trim() || !seniority.trim());
  const isSubmitDisabled = loading || isUploading || !file || !isResumeReady || isJobTargetedIncomplete || isFieldBenchmarkIncomplete;

  const visibleStage = stage === 'processing' && resumeStatus === 'ready' ? 'ready' : stage;
  const stageMessage = visibleStage === 'uploading'
    ? 'Đang tải file CV lên...'
    : visibleStage === 'processing'
      ? 'Đang xử lý CV...'
      : visibleStage === 'ready'
        ? 'CV đã sẵn sàng.'
        : visibleStage === 'analyzing'
          ? (activeMode === 'job_targeted' ? 'AI đang phân tích độ phù hợp...' : 'AI đang đánh giá theo chuẩn ngành...')
          : '';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Phân tích CV chuyên sâu</h1>
        <p className={styles.subtitle}>Tải lên CV và chọn phương thức phân tích để AI đánh giá chi tiết và đưa ra lộ trình tối ưu.</p>
      </header>

      {/* Mode Selector */}
      <div className={styles.modeSelectorContainer}>
        <div className={styles.modeSelectorLabel}>Phương thức phân tích</div>
        <div className={styles.modeToggleGroup} role="tablist" aria-label="Phương thức phân tích">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'job_targeted'}
            className={`${styles.modeToggleButton} ${mode === 'job_targeted' ? styles.modeToggleButtonActive : ''}`}
            onClick={() => {
              setMode('job_targeted');
              setError(null);
            }}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Phân tích theo công việc cụ thể
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'field_benchmark'}
            className={`${styles.modeToggleButton} ${mode === 'field_benchmark' ? styles.modeToggleButtonActive : ''}`}
            onClick={() => {
              setMode('field_benchmark');
              setError(null);
            }}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Đánh giá theo vị trí/ngành mục tiêu
          </button>
        </div>
      </div>

      {quotaExceededError && (
        <div className={styles.quotaBanner} role="alert">
          <div className={styles.quotaContent}>
            <svg className={styles.quotaIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className={styles.quotaTitle}>{quotaExceededError.title}</div>
              <div className={styles.quotaText}>{quotaExceededError.message}</div>
              {quotaExceededError.requestId && (
                <div className={styles.quotaRequestId}>Mã yêu cầu: {quotaExceededError.requestId}</div>
              )}
            </div>
          </div>
          <Link href="/dashboard/billing" className={styles.upgradeButton}>
            Nâng cấp gói ngay
          </Link>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formGrid}>
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

      <div className={styles.actionArea}>
        <button
          className={styles.analyzeButton}
          onClick={handleAnalyze}
          disabled={isSubmitDisabled}
        >
          {loading ? (
            <><div className={styles.spinner}></div> Phân tích...</>
          ) : isUploading ? (
            <><div className={styles.spinner}></div> Đang tải lên...</>
          ) : (file && !isResumeReady) ? (
            resumeStatus === 'failed' ? 'Lỗi xử lý CV' : <><div className={styles.spinner}></div> Đang xử lý CV...</>
          ) : (
            activeMode === 'job_targeted' ? 'Phân tích độ phù hợp' : 'Đánh giá mức độ sẵn sàng'
          )}
        </button>
        {stageMessage && (
          <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }} aria-live="polite">{stageMessage}</p>
        )}
      </div>

      {history.length > 0 && <ResumeHistoryList history={history} />}
    </div>
  );
}
