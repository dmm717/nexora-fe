'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ClientDate } from '@/components/ui/ClientDate';
import type { CareerProfileResponse } from '@/services/profileApi';

export interface SkillProfileSectionProps {
  skillProfileSummary: CareerProfileResponse['skillProfileSummary'];
}

export const SkillProfileSection: React.FC<SkillProfileSectionProps> = ({
  skillProfileSummary,
}) => {
  const { topCompetencies = [], topWeaknessSignals = [] } = skillProfileSummary || {};

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </span>
            <h3 className="font-bold text-base text-on-surface">
              Hồ sơ năng lực thực chứng (Skill Profile)
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Tổng hợp 100% từ dữ kiện đánh giá qua phỏng vấn và CV.{' '}
            <em>(Chỉ đọc, không chỉnh sửa thủ công)</em>
          </p>
        </div>

        <Badge
          variant="outline"
          size="sm"
          icon={<span className="material-symbols-outlined text-[14px] text-primary">verified</span>}
        >
          Bằng chứng tự động
        </Badge>
      </div>

      {/* Competencies Table / Grid */}
      {topCompetencies.length === 0 ? (
        <div className="p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/60 space-y-2">
          <div className="text-sm font-semibold text-on-surface">Chưa có đủ bằng chứng năng lực</div>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Hồ sơ năng lực sẽ tự động hình thành sau khi bạn thực hiện các bài phỏng vấn thử hoặc quét phân tích CV.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topCompetencies.map((c) => {
            const hasScore = typeof c.score === 'number' && !Number.isNaN(c.score);
            const scorePercent = hasScore ? Math.min(Math.max(c.score, 0), 100) : 0;

            return (
              <div
                key={c.code}
                className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-on-surface-variant font-medium">
                      {c.category}
                    </div>
                    <div className="font-bold text-sm text-on-surface">{c.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-base text-primary">
                      {hasScore ? `${c.score}/100` : '--/100'}
                    </div>
                    <div className="text-[10px] text-on-surface-variant">
                      {c.evidenceCount} bằng chứng
                    </div>
                  </div>
                </div>

                <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>

                <div className="text-[11px] text-on-surface-variant flex items-center justify-between pt-1 border-t border-outline-variant/20">
                  <span>Nguồn: Phỏng vấn giả lập & CV Analysis</span>
                  <span>
                    {c.latestEvidenceAt ? (
                      <>
                        Cập nhật: <ClientDate date={c.latestEvidenceAt} />
                      </>
                    ) : (
                      'Chưa có mốc cập nhật'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weakness Signals List */}
      {topWeaknessSignals.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-tertiary-container/20 border border-tertiary/30">
          <div className="flex items-center gap-2 text-xs font-bold text-on-tertiary-container mb-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary">warning</span>
            <span>Tín hiệu khuyết thiếu năng lực đã được ghi nhận:</span>
          </div>
          <ul className="space-y-1 text-xs text-on-surface leading-relaxed list-disc list-inside">
            {topWeaknessSignals.map((w, idx) => (
              <li key={idx}>
                <span className="font-medium">{w.label}</span>{' '}
                <span className="text-on-surface-variant">({w.sourceType})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
