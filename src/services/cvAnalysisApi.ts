import { apiClient } from './apiClient';
import { getAccessToken } from '../store/authStore';

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
  uploadToken: string;
  originalFileName: string;
  status: string;
  createdAt: string;
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

export interface CreateAnalysisRequest {
  resumeId: string;
  jobDescriptionId: string;
}

export interface AnalysisView {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  status: string;
  result?: {
    strengths?: string[];
    gaps?: string[];
    recommendations?: string[];
    matchScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const cvAnalysisApi = {
  presignUpload: async (data: PresignRequest): Promise<PresignResponse> => {
    const response = await apiClient.post('/uploads/presign', data) as { data: PresignResponse };
    return response.data;
  },

  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    // Determine if the URL is relative (starts with /api) or absolute.
    const url = uploadUrl.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1'}${uploadUrl.replace('/api/v1', '')}`
      : uploadUrl;

    const token = getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': file.type,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: file,
      credentials: 'omit' // Do not send cookies for S3 upload, but we send if it's our own BE. Our BE might need auth.
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${res.statusText} - ${errText}`);
    }
  },

  createResume: async (uploadToken: string): Promise<ResumeView> => {
    const response = await apiClient.post('/resumes', { uploadToken }) as { data: ResumeView };
    return response.data;
  },

  getResume: async (id: string): Promise<ResumeView> => {
    const response = await apiClient.get(`/resumes/${id}`) as { data: ResumeView };
    return response.data;
  },

  createJobDescription: async (data: CreateJdRequest): Promise<JdView> => {
    const response = await apiClient.post('/job-descriptions', data) as { data: JdView };
    return response.data;
  },

  analyze: async (data: CreateAnalysisRequest): Promise<AnalysisView> => {
    const response = await apiClient.post('/resume-analyses', data) as { data: AnalysisView };
    return response.data;
  },

  getAnalysis: async (id: string): Promise<AnalysisView> => {
    const response = await apiClient.get(`/resume-analyses/${id}`) as { data: AnalysisView };
    return response.data;
  }
};
