import { apiClient } from './apiClient';

export interface SiteSettings {
  contactEmail: string;
  brandDescription: string;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  supportAvailabilityEnabled: boolean;
  supportLabel: string | null;
  madeInVietnamEnabled: boolean;
  updatedAt: string | null;
  concurrencyToken: string | null;
}

export interface AboutContent {
  heroTitle: string;
  heroSubtitle: string;
  heroAssetId: string | null;
  missionTitle: string;
  missionBody: string;
  missionAssetId: string | null;
  values: Array<{ title: string; description: string; iconKey: string | null }>;
  milestones: Array<{ label: string; title: string; description: string }>;
  teamSectionEnabled: boolean;
  teamHeading: string | null;
  teamMembers: Array<{ name: string; role: string; bio: string | null; assetId: string | null }>;
}

export type SitePageKey = 'about' | 'terms' | 'privacy';

export interface SitePage {
  key: SitePageKey;
  title: string;
  bodyMarkdown: string | null;
  about: AboutContent | null;
  effectiveAt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
  concurrencyToken: string | null;
}

export interface SiteAsset {
  id: string;
  contentType: string;
  size: number;
  createdAt: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
export const siteAssetUrl = (id: string, admin = false) =>
  `${baseUrl}/${admin ? 'admin' : 'public'}/site-assets/${encodeURIComponent(id)}`;

export const siteContentApi = {
  getSettings: async () => (await apiClient.get('/public/site-settings') as { data: SiteSettings }).data,
  getPublicPage: async (key: SitePageKey) => (await apiClient.get(`/public/pages/${key}`) as { data: SitePage }).data,
  getAdminSettings: async () => (await apiClient.get('/admin/site-settings') as { data: SiteSettings }).data,
  updateSettings: async (data: Omit<SiteSettings, 'updatedAt'>) =>
    (await apiClient.put('/admin/site-settings', data) as { data: SiteSettings }).data,
  getAdminPage: async (key: SitePageKey) => (await apiClient.get(`/admin/site-pages/${key}`) as { data: SitePage }).data,
  updatePage: async (key: SitePageKey, data: Pick<SitePage, 'title' | 'bodyMarkdown' | 'about' | 'effectiveAt' | 'concurrencyToken'>) =>
    (await apiClient.put(`/admin/site-pages/${key}`, data) as { data: SitePage }).data,
  publishPage: async (key: SitePageKey, concurrencyToken: string) =>
    (await apiClient.post(`/admin/site-pages/${key}/publish`, { concurrencyToken }) as { data: SitePage }).data,
  uploadAsset: async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return (await apiClient.postForm('/admin/site-assets', body) as { data: SiteAsset }).data;
  },
};
