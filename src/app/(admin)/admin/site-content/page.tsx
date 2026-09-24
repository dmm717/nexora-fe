'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/services/apiClient';
import { siteContentApi, type SitePage, type SitePageKey, type SiteSettings } from '@/services/siteContentApi';
import { INITIAL_ABOUT_DRAFT, INITIAL_PRIVACY_DRAFT, INITIAL_TERMS_DRAFT } from '@/services/siteContentDrafts';
import { AboutEditor } from '@/components/features/site/AboutEditor';

const tabs = [
  { key: 'settings', label: 'Footer & liên hệ' },
  { key: 'about', label: 'Giới thiệu' },
  { key: 'terms', label: 'Điều khoản dịch vụ' },
  { key: 'privacy', label: 'Chính sách bảo mật' },
  { key: 'images', label: 'Hình ảnh website' },
] as const;
type TabKey = typeof tabs[number]['key'];

const fieldClass = 'mt-1 block min-h-10 w-full rounded-xl border border-[#cbd6ef] bg-white px-3 py-2 text-sm text-[#172554] focus-visible:outline-2 focus-visible:outline-primary';
const labelClass = 'block text-sm font-semibold text-[#334166]';

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof SiteSettings>(key: K, data: SiteSettings[K]) => setValue((prev) => ({ ...prev, [key]: data }));
  const save = async () => {
    setSaving(true);
    try {
      await siteContentApi.updateSettings(value);
      await queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['public-site-settings'] });
      toast.success('Đã cập nhật footer và liên hệ.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể lưu cài đặt.'); }
    finally { setSaving(false); }
  };
  return <div className="grid gap-5 md:grid-cols-2">
    <label className={labelClass}>Email liên hệ<input type="email" required value={value.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} className={fieldClass} /></label>
    <label className={labelClass}>Mô tả thương hiệu<textarea value={value.brandDescription} onChange={(e) => update('brandDescription', e.target.value)} rows={3} maxLength={500} className={fieldClass} /></label>
    <label className={labelClass}>Facebook URL<input type="url" value={value.facebookUrl || ''} onChange={(e) => update('facebookUrl', e.target.value || null)} className={fieldClass} placeholder="https://..." /></label>
    <label className={labelClass}>TikTok URL<input type="url" value={value.tiktokUrl || ''} onChange={(e) => update('tiktokUrl', e.target.value || null)} className={fieldClass} placeholder="https://..." /></label>
    <div className="space-y-3 md:col-span-2"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={value.supportAvailabilityEnabled} onChange={(e) => update('supportAvailabilityEnabled', e.target.checked)} /> Hiện thông tin hỗ trợ</label><label className={labelClass}>Nhãn hỗ trợ<input value={value.supportLabel || ''} disabled={!value.supportAvailabilityEnabled} onChange={(e) => update('supportLabel', e.target.value || null)} className={fieldClass} placeholder="Chỉ nhập cam kết đã được xác nhận" /></label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={value.madeInVietnamEnabled} onChange={(e) => update('madeInVietnamEnabled', e.target.checked)} /> Hiện “Made with ♥ in Vietnam”</label></div>
    <div className="md:col-span-2"><button type="button" disabled={saving} onClick={() => void save()} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</button></div>
  </div>;
}

function SettingsPanel() {
  const settings = useQuery({ queryKey: ['admin-site-settings'], queryFn: siteContentApi.getAdminSettings });
  if (settings.isLoading) return <p role="status">Đang tải cài đặt...</p>;
  if (!settings.data) return <div role="alert">Không thể tải cài đặt. <button type="button" onClick={() => void settings.refetch()} className="underline">Thử lại</button></div>;
  return <SettingsForm key={settings.data.concurrencyToken || 'new'} initial={settings.data} />;
}

function PageForm({ initial, pageKey }: { initial: SitePage; pageKey: SitePageKey }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(false);
  const update = <K extends keyof SitePage>(key: K, data: SitePage[K]) => setValue((prev) => ({ ...prev, [key]: data }));
  const save = async () => {
    setSaving(true);
    try {
      const saved = await siteContentApi.updatePage(pageKey, value);
      setValue(saved);
      await queryClient.invalidateQueries({ queryKey: ['admin-site-page', pageKey] });
      toast.success('Đã lưu bản nháp. Nội dung công khai chưa thay đổi.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể lưu bản nháp.'); }
    finally { setSaving(false); }
  };
  const publish = async () => {
    if (!window.confirm('Công bố bản nháp hiện đã lưu? Nội dung sẽ hiển thị công khai.')) return;
    setPublishing(true);
    try {
      const published = await siteContentApi.publishPage(pageKey);
      setValue(published);
      await queryClient.invalidateQueries({ queryKey: ['admin-site-page', pageKey] });
      await queryClient.invalidateQueries({ queryKey: ['public-site-page', pageKey] });
      toast.success('Đã công bố nội dung.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể công bố. Hãy lưu bản nháp trước.'); }
    finally { setPublishing(false); }
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#52617e]"><span className={`rounded-full px-3 py-1 font-bold ${value.isPublished ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{value.isPublished ? 'Đã công bố' : 'Bản nháp'}</span>{value.updatedAt && <span>Cập nhật: {new Date(value.updatedAt).toLocaleString('vi-VN')}</span>}{value.publishedAt && <span>Công bố: {new Date(value.publishedAt).toLocaleString('vi-VN')}</span>}</div>
    <label className={labelClass}>Tiêu đề<input value={value.title} onChange={(e) => update('title', e.target.value)} maxLength={160} className={fieldClass} /></label>
    {pageKey === 'about' ? <AboutEditor value={value.about || INITIAL_ABOUT_DRAFT} onChange={(about) => update('about', about)} /> : <>
      <label className={labelClass}>Nội dung văn bản (Markdown đơn giản, không HTML)<textarea value={value.bodyMarkdown || ''} onChange={(e) => update('bodyMarkdown', e.target.value)} rows={18} maxLength={30000} className={`${fieldClass} font-mono leading-6`} /></label>
      <label className={labelClass}>Ngày hiệu lực<input type="date" value={value.effectiveAt?.slice(0, 10) || ''} onChange={(e) => update('effectiveAt', e.target.value ? new Date(`${e.target.value}T00:00:00Z`).toISOString() : null)} className={fieldClass} /></label>
    </>}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={saving} onClick={() => void save()} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</button><button type="button" onClick={() => setPreview(!preview)} className="min-h-11 rounded-xl border border-primary px-5 text-sm font-bold text-primary">{preview ? 'Ẩn xem trước' : 'Xem trước'}</button><button type="button" disabled={publishing || !value.concurrencyToken} onClick={() => void publish()} className="min-h-11 rounded-xl border border-emerald-700 px-5 text-sm font-bold text-emerald-800 disabled:opacity-50">{publishing ? 'Đang công bố...' : 'Công bố bản đã lưu'}</button></div>
    {preview && <section className="rounded-2xl border border-[#dbe3fa] bg-[#f6f8ff] p-6" aria-label="Xem trước bản nháp"><h3 className="mb-4 text-xl font-bold">{value.title}</h3>{pageKey === 'about' ? <div className="space-y-3 text-sm"><p>{value.about?.heroTitle}</p><p>{value.about?.heroSubtitle}</p><p>{value.about?.missionTitle}</p><p>{value.about?.missionBody}</p><p>{value.about?.values.map((item) => item.title).join(' · ')}</p></div> : <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">{value.bodyMarkdown}</pre>}</section>}
  </div>;
}

function PagePanel({ pageKey }: { pageKey: SitePageKey }) {
  const page = useQuery({ queryKey: ['admin-site-page', pageKey], queryFn: () => siteContentApi.getAdminPage(pageKey), retry: false });
  if (page.isLoading) return <p role="status">Đang tải nội dung...</p>;
  if (page.isError && (!(page.error instanceof ApiError) || page.error.status !== 404)) return <div role="alert">Không thể tải nội dung. <button type="button" onClick={() => void page.refetch()} className="underline">Thử lại</button></div>;
  const initial: SitePage = page.data || { key: pageKey, title: pageKey === 'about' ? 'Giới thiệu Nexora' : pageKey === 'terms' ? 'Điều khoản dịch vụ' : 'Chính sách bảo mật', bodyMarkdown: pageKey === 'terms' ? INITIAL_TERMS_DRAFT : pageKey === 'privacy' ? INITIAL_PRIVACY_DRAFT : null, about: pageKey === 'about' ? INITIAL_ABOUT_DRAFT : null, effectiveAt: null, isPublished: false, publishedAt: null, updatedAt: null, concurrencyToken: null };
  return <PageForm key={`${pageKey}:${initial.concurrencyToken || 'new'}`} initial={initial} pageKey={pageKey} />;
}

function ImagesPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [assetId, setAssetId] = useState<string | null>(null);
  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try { const asset = await siteContentApi.uploadAsset(file); setAssetId(asset.id); toast.success('Ảnh đã tải lên kho riêng tư. Gắn vào bản nháp Giới thiệu rồi công bố để hiển thị công khai.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-4 text-sm"><p>Ảnh JPEG, PNG hoặc WebP, tối đa 5 MiB. Ảnh chỉ công khai khi được gắn vào trang Giới thiệu đã công bố.</p><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /><button type="button" disabled={!file || busy} onClick={() => void upload()} className="block min-h-11 rounded-xl bg-primary px-5 font-bold text-white disabled:opacity-50">{busy ? 'Đang tải...' : 'Tải ảnh lên'}</button>{assetId && <p>Asset ID: <code className="break-all">{assetId}</code>. Bạn có thể chọn ảnh trực tiếp trong tab Giới thiệu.</p>}</div>;
}

export default function SiteContentAdminPage() {
  const [tab, setTab] = useState<TabKey>('settings');
  return <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8"><header><p className="text-xs font-bold uppercase tracking-widest text-primary">Quản trị website</p><h1 className="mt-2 text-3xl font-extrabold text-[#172554]">Nội dung website</h1><p className="mt-2 text-sm text-[#52617e]">Chỉnh sửa footer và các trang công khai. Nội dung pháp lý chỉ hiển thị sau khi lưu và công bố.</p></header><nav aria-label="Mục nội dung website" className="flex flex-wrap gap-2">{tabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} aria-current={tab === item.key ? 'page' : undefined} className={`min-h-10 rounded-full px-4 text-sm font-semibold ${tab === item.key ? 'bg-primary text-white' : 'border border-[#cbd6ef] bg-white text-[#334166] hover:bg-primary-fixed'}`}>{item.label}</button>)}</nav><section className="rounded-3xl border border-[#dbe3fa] bg-white p-6 shadow-subtle sm:p-8">{tab === 'settings' ? <SettingsPanel /> : tab === 'images' ? <ImagesPanel /> : <PagePanel pageKey={tab} />}</section></main>;
}
