import { ApiError, apiClient } from './apiClient';

export interface PresignRequest {
  fileName: string;
  contentType: string;
  size: number;
}

export interface PresignResponse {
  token: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface ResumeView {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  status: string;
  createdAt: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  uploadToken?: string;
  originalFileName?: string;
}

export interface CreateJdRequest {
  title: string;
  content: string;
}

export interface JdView {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export type ResumeAnalysisMode = 'job_targeted' | 'field_benchmark';

export interface CreateJobTargetedAnalysisRequest {
  resumeId: string;
  mode: 'job_targeted';
  jobDescriptionId: string;
  industry?: null;
  targetRole?: null;
  seniority?: null;
}

export interface CreateFieldBenchmarkAnalysisRequest {
  resumeId: string;
  mode: 'field_benchmark';
  jobDescriptionId?: null;
  industry: string;
  targetRole: string;
  seniority: string;
}

export type CreateAnalysisRequest =
  | CreateJobTargetedAnalysisRequest
  | CreateFieldBenchmarkAnalysisRequest;

export interface JobTargetedBreakdown {
  technicalSkillMatch: number;
  experienceRelevance: number;
  impactEvidence: number;
  clarity: number;
  structure: number;
}

export interface JobTargetedAnalysisResult {
  mode: 'job_targeted';
  matchScore: number;
  summary: string;
  matchedKeywordsOrSkills: string[];
  missingKeywordsOrSkills: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  sectionFeedback: string[];
  breakdown: JobTargetedBreakdown;
}

export interface FieldBenchmarkBreakdown {
  technicalFoundation: number;
  projectEvidence: number;
  experiencePresentation: number;
  impactAchievements: number;
  clarity: number;
  roleAlignment: number;
}

export interface FieldBenchmarkAnalysisResult {
  mode: 'field_benchmark';
  readinessScore: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  sectionFeedback: string[];
  breakdown: FieldBenchmarkBreakdown;
}

export type ResumeAnalysisResult =
  | JobTargetedAnalysisResult
  | FieldBenchmarkAnalysisResult;

export interface ResumeAnalysisContextView {
  mode: string;
  industry?: string | null;
  targetRole?: string | null;
  seniority?: string | null;
}

export interface AnalysisView {
  id: string;
  status: string;
  result?: ResumeAnalysisResult | Record<string, unknown> | null;
  createdAt: string;
  completedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  mode?: ResumeAnalysisMode | string | null;
  context?: ResumeAnalysisContextView | null;
  resumeVersion?: number;
  jobDescriptionVersion?: number | null;
  modelVersion?: string | null;
  promptVersion?: string | null;
  schemaVersion?: string | null;
  rubricVersion?: string | null;
  profileModelVersion?: string | null;
  profilePromptVersion?: string | null;
  profileSchemaVersion?: string | null;
  resumeId?: string;
  jobDescriptionId?: string;
  updatedAt?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type RequestOptions = Pick<RequestInit, 'signal'>;
type ApiEnvelope<T> = { data?: T; Data?: T };

function responseData<T>(response: unknown): T {
  if (response && typeof response === 'object') {
    const envelope = response as ApiEnvelope<T>;
    const value = envelope.data ?? envelope.Data;
    if (value !== undefined) return value;
  }
  throw new ApiError('Máy chủ trả về dữ liệu không hợp lệ.', 'API_RESPONSE_INVALID');
}

/** Resolve the MIME from the extension only when the browser omitted File.type. */
export function getUploadContentType(file: Pick<File, 'name' | 'type'>): string | null {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  const declaredType = file.type.trim().toLowerCase();
  const extensionType = extension === '.pdf' ? PDF_MIME : extension === '.docx' ? DOCX_MIME : null;
  if (!extensionType) return null;
  if (!declaredType) return extensionType;
  return declaredType === extensionType ? extensionType : null;
}

/** Resolve both absolute provider URLs and API-relative upload URLs safely. */
export function resolveUploadUrl(uploadUrl: string, baseUrl = API_BASE_URL): string {
  const value = uploadUrl.trim();
  if (!value) throw new ApiError('Địa chỉ upload không hợp lệ.', 'UPLOAD_URL_INVALID');

  try {
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
      const absolute = new URL(value);
      if (absolute.protocol !== 'http:' && absolute.protocol !== 'https:') {
        throw new Error('Upload URL scheme is not supported.');
      }
      return absolute.toString();
    }
    const base = new URL(baseUrl);
    if (base.protocol !== 'http:' && base.protocol !== 'https:') {
      throw new Error('API base URL scheme is not supported.');
    }
    if (value.startsWith('/')) return new URL(value, base.origin).toString();
    const apiPath = base.pathname.replace(/\/+$/, '');
    if (value === apiPath.replace(/^\//, '') || value.startsWith(`${apiPath.replace(/^\//, '')}/`)) {
      return new URL(`/${value}`, base.origin).toString();
    }
    return new URL(value, `${base.toString().replace(/\/?$/, '/')}`).toString();
  } catch {
    throw new ApiError('Địa chỉ upload không hợp lệ.', 'UPLOAD_URL_INVALID');
  }
}

function uploadErrorMessage(status: number): string {
  if (status === 404) return 'Upload intent không còn hợp lệ. Vui lòng chọn lại file.';
  if (status === 409) return 'File đã được upload hoặc upload intent đã được sử dụng.';
  if (status === 413) return 'Dung lượng file vượt quá giới hạn cho phép.';
  return 'Không thể tải file CV lên máy chủ.';
}

async function throwUploadError(response: Response): Promise<never> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const envelope = payload && typeof payload === 'object' ? payload as Record<string, unknown> : undefined;
  const nested = envelope?.error && typeof envelope.error === 'object'
    ? envelope.error as Record<string, unknown>
    : undefined;
  const code = typeof nested?.code === 'string'
    ? nested.code
    : typeof envelope?.code === 'string'
      ? envelope.code
      : `UPLOAD_HTTP_${response.status}`;
  const message = typeof nested?.message === 'string'
    ? nested.message
    : typeof envelope?.message === 'string'
      ? envelope.message
      : uploadErrorMessage(response.status);
  const requestId = typeof nested?.requestId === 'string'
    ? nested.requestId
    : typeof envelope?.requestId === 'string'
      ? envelope.requestId
      : undefined;
  throw new ApiError(message, code, requestId);
}

export const cvAnalysisApi = {
  presignUpload: async (data: PresignRequest, options?: RequestOptions): Promise<PresignResponse> => {
    const response = await apiClient.post('/uploads/presign', data, options);
    return responseData<PresignResponse>(response);
  },

  uploadFile: async (
    uploadUrl: string,
    file: File,
    options?: RequestOptions & { expectedSize?: number; contentType?: string },
  ): Promise<void> => {
    const contentType = options?.contentType?.trim().toLowerCase() || getUploadContentType(file);
    if (!contentType) {
      throw new ApiError('Chỉ chấp nhận file PDF hoặc DOCX với MIME tương ứng.', 'UPLOAD_TYPE_UNSUPPORTED');
    }
    const expectedSize = options?.expectedSize ?? file.size;
    if (file.size !== expectedSize) {
      throw new ApiError('Kích thước file không khớp với upload intent.', 'UPLOAD_SIZE_MISMATCH');
    }

    const url = resolveUploadUrl(uploadUrl);
    const headers: HeadersInit = {
      'Content-Type': contentType,
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: file,
      credentials: 'omit',
      signal: options?.signal,
    });

    if (!res.ok) await throwUploadError(res);
  },

  createResume: async (uploadToken: string, options?: RequestOptions): Promise<ResumeView> => {
    const response = await apiClient.post('/resumes', { uploadToken }, options);
    return responseData<ResumeView>(response);
  },

  getResume: async (id: string, options?: RequestOptions): Promise<ResumeView> => {
    const response = await apiClient.get(`/resumes/${id}`, options);
    return responseData<ResumeView>(response);
  },

  createJobDescription: async (data: CreateJdRequest, idempotencyKey?: string, options?: RequestOptions): Promise<JdView> => {
    const response = await apiClient.post('/job-descriptions', data, {
      ...options,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
    return responseData<JdView>(response);
  },

  analyze: async (data: CreateAnalysisRequest, idempotencyKey?: string, options?: RequestOptions): Promise<AnalysisView> => {
    const response = await apiClient.post('/resume-analyses', data, {
      ...options,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
    return responseData<AnalysisView>(response);
  },

  getAnalysis: async (id: string, options?: RequestOptions): Promise<AnalysisView> => {
    const response = await apiClient.get(`/resume-analyses/${id}`, options);
    return responseData<AnalysisView>(response);
  }
};
