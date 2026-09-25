'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { siteAssetUrl, siteContentApi, type AboutContent } from '@/services/siteContentApi';
import { RECOMMENDED_ABOUT_CONTENT } from '@/services/siteContentDrafts';
import { ApiError } from '@/services/apiClient';
import { AuthRefreshError } from '@/services/authSession';

const field = 'mt-1 block min-h-10 w-full rounded-xl border border-[#cbd6ef] bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary';
const label = 'block text-sm font-semibold text-[#334166]';

import { formatFileSize, validateImageFile } from '@/services/siteAssetValidation';
export { validateImageFile };

interface AssetPickerProps {
  title: string;
  assetId: string | null;
  onSelected: (id: string | null) => void;
  showDefaultAction?: boolean;
}

export function AssetPicker({
  title,
  assetId,
  onSelected,
  showDefaultAction = true,
}: AssetPickerProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleSelectFile = (candidate: File | null) => {
    if (!candidate) return;
    const result = validateImageFile(candidate);
    if (!result.valid) {
      toast.error(result.error || 'Tệp không hợp lệ.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  };

  const handleClearFile = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    try {
      const asset = await siteContentApi.uploadAsset(file);
      onSelected(asset.id);
      handleClearFile();
      toast.success('Ảnh đã tải lên và được chọn. Hãy lưu bản nháp để áp dụng.');
    } catch (error) {
      if (
        error instanceof AuthRefreshError ||
        (error instanceof ApiError && error.status === 401) ||
        (typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 401)
      ) {
        // Centralized auth expiry flow owns this, no misleading storage error
        return;
      }
      if (error instanceof ApiError) {
        if (error.status === 403) {
          toast.error('Bạn không có quyền tải ảnh quản trị.');
          return;
        }
        if (error.status === 413) {
          toast.error('Ảnh vượt quá dung lượng cho phép.');
          return;
        }
        if (error.status === 400) {
          toast.error(error.message || 'Dữ liệu ảnh không hợp lệ.');
          return;
        }
      }
      toast.error('Không thể tải ảnh lúc này. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[#dbe3fa] bg-[#f8faff] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#172554]">{title}</p>
        {showDefaultAction && (
          assetId ? (
            <button
              type="button"
              onClick={() => {
                onSelected(null);
                toast.info('Đã chọn dùng ảnh mặc định Nexora cho mục này.');
              }}
              className="rounded-lg border border-[#cbd6ef] bg-white px-2.5 py-1 text-xs font-semibold text-[#52617e] hover:border-primary hover:text-primary transition-colors"
            >
              Dùng ảnh mặc định Nexora
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 size={13} aria-hidden="true" />
              Đang dùng ảnh mặc định Nexora
            </span>
          )
        )}
      </div>

      {assetId && !file && (
        <div className="flex items-center gap-3 rounded-xl border border-[#dbe3fa] bg-white p-3">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteAssetUrl(assetId, true)}
              alt="Ảnh hiện tại"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-semibold text-[#172554]">Ảnh đã gắn vào bản nháp</p>
            <p className="truncate text-[#64748b]">ID: {assetId}</p>
          </div>
        </div>
      )}

      {/* Hidden native input with stable unique id */}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={`Tải ảnh cho ${title}`}
        className="sr-only"
        onChange={(e) => {
          const next = e.target.files?.[0] || null;
          handleSelectFile(next);
        }}
      />

      {/* State 1: No local file chosen -> Dropzone accessible label */}
      {!file ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0] || null;
            handleSelectFile(dropped);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-[#cbd6ef] bg-white hover:border-primary hover:bg-[#f3f7ff]'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <UploadCloud size={24} aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-[#172554]">Kéo thả ảnh vào đây</p>
          <p className="mt-1 text-xs text-[#64748b]">hoặc</p>
          <span
            aria-hidden="true"
            className="mt-2.5 inline-block rounded-xl border border-primary bg-white px-4 py-2 text-xs font-bold text-primary shadow-sm hover:bg-primary hover:text-white transition-colors"
          >
            Chọn ảnh
          </span>
          <p className="mt-3 text-[11px] text-[#64748b]">
            JPEG, PNG, WebP · tối đa 5 MB
          </p>
        </label>
      ) : (
        /* State 2: Valid local file selected -> Preview + Details + Active Upload Action */
        <div className="rounded-2xl border border-[#cbd6ef] bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {preview && (
              <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-[#cbd6ef] bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`Xem trước ảnh vừa chọn cho ${title}`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-[#172554] truncate">{file.name}</p>
              <p className="text-xs font-medium text-[#64748b]">{formatFileSize(file.size)}</p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#cbd6ef] bg-white px-3 py-1 text-xs font-semibold text-[#172554] hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} aria-hidden="true" />
                  Thay ảnh
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleClearFile}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={12} aria-hidden="true" />
                  Bỏ chọn
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#edf2fd] pt-3">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => void handleUpload()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-hover disabled:opacity-60 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Đang tải ảnh...
                </>
              ) : (
                'Tải ảnh và chọn'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AboutEditor({ value, onChange }: { value: AboutContent; onChange: (next: AboutContent) => void }) {
  const set = <K extends keyof AboutContent>(key: K, next: AboutContent[K]) => onChange({ ...value, [key]: next });
  const updateValue = (index: number, key: 'title' | 'description' | 'iconKey', next: string) =>
    set(
      'values',
      value.values.map((item, at) => (at === index ? { ...item, [key]: next } : item))
    );
  const updateMember = (index: number, key: 'name' | 'role' | 'bio' | 'assetId', next: string | null) =>
    set(
      'teamMembers',
      value.teamMembers.map((item, at) => (at === index ? { ...item, [key]: next } : item))
    );

  const handleApplyRecommended = () => {
    if (
      !window.confirm(
        'Áp dụng nội dung giới thiệu do Nexora đề xuất vào bản nháp hiện tại? Thao tác này chỉ cập nhật dữ liệu chỉnh sửa cục bộ và chưa lưu hoặc công bố.'
      )
    ) {
      return;
    }
    onChange({
      ...value,
      heroTitle: RECOMMENDED_ABOUT_CONTENT.heroTitle,
      heroSubtitle: RECOMMENDED_ABOUT_CONTENT.heroSubtitle,
      missionTitle: RECOMMENDED_ABOUT_CONTENT.missionTitle,
      missionBody: RECOMMENDED_ABOUT_CONTENT.missionBody,
      values: RECOMMENDED_ABOUT_CONTENT.values,
      milestones: [],
    });
    toast.info('Đã áp dụng nội dung Nexora đề xuất vào bản nháp. Hãy kiểm tra trước khi lưu và công bố.');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div>
          <p className="text-sm font-bold text-[#172554]">Nội dung mẫu biên tập chuẩn Nexora</p>
          <p className="text-xs text-[#52617e]">
            Điền nhanh tiêu đề, sứ mệnh và 3 giá trị cốt lõi theo nhận diện biên tập mới. Giữ nguyên ảnh và thiết lập đội ngũ.
          </p>
        </div>
        <button
          type="button"
          onClick={handleApplyRecommended}
          className="rounded-xl border border-primary bg-white px-4 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
        >
          Dùng nội dung Nexora đề xuất
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <h3 className="text-lg font-bold text-[#172554] md:col-span-2">Hero</h3>
        <label className={label}>
          Tiêu đề
          <input
            value={value.heroTitle}
            maxLength={160}
            onChange={(e) => set('heroTitle', e.target.value)}
            className={field}
          />
        </label>
        <label className={label}>
          Mô tả
          <textarea
            value={value.heroSubtitle}
            maxLength={500}
            rows={3}
            onChange={(e) => set('heroSubtitle', e.target.value)}
            className={field}
          />
        </label>
        <div className="md:col-span-2">
          <AssetPicker
            title="Ảnh hero"
            assetId={value.heroAssetId}
            onSelected={(id) => set('heroAssetId', id)}
            showDefaultAction={true}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <h3 className="text-lg font-bold text-[#172554] md:col-span-2">Sứ mệnh</h3>
        <label className={label}>
          Tiêu đề
          <input
            value={value.missionTitle}
            maxLength={160}
            onChange={(e) => set('missionTitle', e.target.value)}
            className={field}
          />
        </label>
        <label className={label}>
          Nội dung
          <textarea
            value={value.missionBody}
            maxLength={3000}
            rows={5}
            onChange={(e) => set('missionBody', e.target.value)}
            className={field}
          />
        </label>
        <div className="md:col-span-2">
          <AssetPicker
            title="Ảnh sứ mệnh"
            assetId={value.missionAssetId}
            onSelected={(id) => set('missionAssetId', id)}
            showDefaultAction={true}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#172554]">Giá trị cốt lõi</h3>
          <button
            type="button"
            disabled={value.values.length >= 6}
            className="text-sm font-bold text-primary disabled:opacity-40"
            onClick={() => set('values', [...value.values, { title: '', description: '', iconKey: null }])}
          >
            + Thêm giá trị
          </button>
        </div>
        {value.values.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-[#dbe3fa] p-4 md:grid-cols-2">
            <label className={label}>
              Tiêu đề
              <input
                value={item.title}
                maxLength={100}
                onChange={(e) => updateValue(index, 'title', e.target.value)}
                className={field}
              />
            </label>
            <label className={label}>
              Icon key (tùy chọn)
              <input
                value={item.iconKey || ''}
                maxLength={40}
                onChange={(e) => updateValue(index, 'iconKey', e.target.value)}
                className={field}
              />
            </label>
            <label className={`${label} md:col-span-2`}>
              Mô tả
              <textarea
                value={item.description}
                maxLength={500}
                rows={2}
                onChange={(e) => updateValue(index, 'description', e.target.value)}
                className={field}
              />
            </label>
            <button
              type="button"
              onClick={() => set('values', value.values.filter((_, at) => at !== index))}
              className="justify-self-start text-xs text-red-700 underline"
            >
              Xóa mục này
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-[#172554]">Đội ngũ</h3>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={value.teamSectionEnabled}
            onChange={(e) => set('teamSectionEnabled', e.target.checked)}
          />{' '}
          Hiện đội ngũ khi có dữ liệu thật
        </label>
        {value.teamSectionEnabled && (
          <>
            <label className={label}>
              Tiêu đề đội ngũ
              <input
                value={value.teamHeading || ''}
                maxLength={160}
                onChange={(e) => set('teamHeading', e.target.value || null)}
                className={field}
              />
            </label>
            <button
              type="button"
              disabled={value.teamMembers.length >= 20}
              onClick={() =>
                set('teamMembers', [
                  ...value.teamMembers,
                  { name: '', role: '', bio: null, assetId: null },
                ])
              }
              className="text-sm font-bold text-primary disabled:opacity-40"
            >
              + Thêm thành viên thật
            </button>
            {value.teamMembers.map((member, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-[#dbe3fa] p-4 md:grid-cols-2">
                <label className={label}>
                  Tên
                  <input
                    value={member.name}
                    maxLength={120}
                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                    className={field}
                  />
                </label>
                <label className={label}>
                  Vai trò
                  <input
                    value={member.role}
                    maxLength={120}
                    onChange={(e) => updateMember(index, 'role', e.target.value)}
                    className={field}
                  />
                </label>
                <label className={`${label} md:col-span-2`}>
                  Giới thiệu
                  <textarea
                    value={member.bio || ''}
                    maxLength={500}
                    rows={2}
                    onChange={(e) => updateMember(index, 'bio', e.target.value || null)}
                    className={field}
                  />
                </label>
                <div className="md:col-span-2">
                  <AssetPicker
                    title={`Ảnh của ${member.name || 'thành viên'}`}
                    assetId={member.assetId}
                    onSelected={(id) => updateMember(index, 'assetId', id)}
                    showDefaultAction={false}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set('teamMembers', value.teamMembers.filter((_, at) => at !== index))}
                  className="justify-self-start text-xs text-red-700 underline"
                >
                  Xóa thành viên
                </button>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
