'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RadialScore } from '@/components/ui/RadialScore';
import { AnimatedProgressBar } from '@/components/motion/AnimatedProgressBar';
import {
  MotionPage,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion';
import { useProgressDashboard } from '@/hooks/queries/useProgressDashboard';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { useAnalytics } from '@/hooks/queries/useDashboard';
import { useSkillProfile } from '@/hooks/queries/useSkillProfile';

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: progress, isLoading: loadingProgress } = useProgressDashboard();
  const { data: careerProfile, isLoading: loadingProfile } = useCareerProfile();
  const { data: analytics, isLoading: loadingAnalytics } = useAnalytics();
  const { data: skillProfile } = useSkillProfile();

  const loading = loadingProgress || loadingProfile || loadingAnalytics;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-on-surface-variant">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Đang tải dữ liệu tiến độ...</span>
        </div>
      </div>
    );
  }

  const activeGoal = careerProfile?.activeCareerGoal;
  const readiness = progress?.readiness;
  const hasScore = readiness?.score !== null && readiness?.score !== undefined;
  const evidenceCount = readiness?.evidenceCount ?? 0;

  // Weakest competencies from progress dashboard or skill profile summary
  const weakestCompetencies = progress?.weakestCompetencies || [];
  const recentImprovements = progress?.recentImprovements || [];

  // Competencies list from skill profile or careerProfile summary
  const competencies = skillProfile?.competencies || careerProfile?.skillProfileSummary?.topCompetencies || [];

  return (
    <MotionPage className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Báo cáo hồ sơ năng lực thực chiến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Chỉ số sẵn sàng & Năng lực cạnh tranh
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Mục tiêu hiện tại: {activeGoal ? `${activeGoal.targetRole} · ${activeGoal.seniority}` : 'Chưa thiết lập'}{' '}
            {activeGoal?.industry ? `(${activeGoal.industry})` : activeGoal ? '(Chưa xác định lĩnh vực)' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/learning-path')}
            icon={<span className="material-symbols-outlined text-[18px]">route</span>}
          >
            Xem lộ trình chi tiết
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/practice')}
            icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
          >
            Luyện tập ngay
          </Button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Readiness Metric */}
        <Card variant="elevated" padding="lg" className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6">
          {hasScore ? (
            <RadialScore score={readiness.score!} size={120} strokeWidth={10} />
          ) : (
            <div className="w-28 h-28 rounded-full border-4 border-dashed border-outline-variant flex items-center justify-center text-center p-3">
              <span className="text-xs font-bold text-on-surface-variant">Chưa đủ dữ liệu</span>
            </div>
          )}

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Mức độ sẵn sàng tuyển dụng
            </div>
            <div className="text-xl font-bold text-on-surface">
              {hasScore
                ? readiness.score! >= 75
                  ? `Khả quan${activeGoal?.seniority ? ` · ${activeGoal.seniority}` : ''}`
                  : 'Cần bồi đắp'
                : 'Chưa đủ dữ liệu đánh giá'}
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {hasScore
                ? `Tính toán dựa trên ${evidenceCount} bằng chứng từ CV và các phiên phỏng vấn đã hoàn thành.`
                : 'Thực hiện bài phỏng vấn đầu tiên hoặc tải lên CV để kích hoạt chỉ số sẵn sàng.'}
            </p>
          </div>
        </Card>

        {/* Assessed Competencies */}
        <Card variant="elevated" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Năng lực đã kiểm chứng</span>
            <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-on-surface">
              {readiness?.assessedCompetencies ?? competencies.filter((item) => item.evidenceCount > 0).length}
            </div>
            <span className="text-[11px] text-on-surface-variant">Năng lực đã có bằng chứng</span>
          </div>
        </Card>

        {/* Completed Activities */}
        <Card variant="elevated" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Hoạt động tuần này</span>
            <span className="material-symbols-outlined text-emerald-700 text-[20px]">task_alt</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-on-surface">
              {progress?.weeklyCompletedActivities?.total ??
                (analytics ? analytics.completedInterviews + analytics.completedScenarios + analytics.completedStarAttempts : 0)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">
              Bao gồm {progress?.weeklyCompletedActivities?.interviews ?? analytics?.completedInterviews ?? 0} phiên phỏng vấn
            </span>
          </div>
        </Card>
      </div>

      {/* Next Recommended Practice Banner */}
      {progress?.nextRecommendedPractice && (
        <Card variant="elevated" padding="lg" className="border-primary/30 bg-primary-fixed/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">Đề xuất ưu tiên hàng đầu</Badge>
                <span className="text-xs text-on-surface-variant">
                  Ước tính: {progress.nextRecommendedPractice.estimatedMinutes} phút
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-on-surface">
                {progress.nextRecommendedPractice.reason}
              </h3>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/interviews/new')}
              icon={<span className="material-symbols-outlined text-[18px]">replay</span>}
              iconPosition="right"
              className="shrink-0 shadow-md"
            >
              Luyện ngay theo đề xuất
            </Button>
          </div>
        </Card>
      )}

      {/* Main Grid: Competency Evidence List & Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Competency Evidence List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Chi tiết các năng lực đã được định lượng
            </h3>
            <span className="text-xs text-on-surface-variant">
              {activeGoal ? `Theo mục tiêu ${activeGoal.targetRole}` : 'Chưa thiết lập vị trí mục tiêu'}
            </span>
          </div>

          <StaggerContainer className="space-y-3">
            {competencies.length > 0 ? (
              competencies.map((comp, idx) => {
                const score = comp.score != null ? Math.round(comp.score) : null;
                const evidenceNum = 'evidenceCount' in comp ? comp.evidenceCount : 0;
                return (
                  <StaggerItem key={idx}>
                    <Card variant="elevated" padding="md" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-on-surface">{comp.name || comp.code}</div>
                          <div className="text-[11px] text-on-surface-variant">
                            {comp.category || 'Chuyên môn'} {evidenceNum ? `· ${evidenceNum} dẫn chứng` : ''}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-primary">
                          {score === null ? 'Chưa chấm' : `${score}%`}
                        </div>
                      </div>

                      {score !== null && <AnimatedProgressBar
                        label=""
                        value={score}
                        heightClass="h-2"
                        colorClass={
                          score >= 80 ? 'bg-emerald-700' : score >= 70 ? 'bg-primary' : 'bg-amber-700'
                        }
                        delay={idx * 0.08}
                      />}
                    </Card>
                  </StaggerItem>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl border border-outline-variant/30">
                Chưa có năng lực nào được đánh giá. Hãy hoàn thành phiên phỏng vấn đầu tiên.
              </div>
            )}
          </StaggerContainer>
        </div>

        {/* Right 5 cols: Weaknesses & Improvements */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weakness Signals */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>Tín hiệu yếu điểm cần lưu ý</span>
            </div>

            <div className="space-y-3">
              {weakestCompetencies.length > 0 ? (
                weakestCompetencies.map((w, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                      <span>{w.name}</span>
                      <span className="text-amber-700">{w.score}%</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Tín hiệu này được máy chủ tổng hợp từ bằng chứng hiện có. Hãy mở hồ sơ kỹ năng để xem nguồn và chọn bài luyện phù hợp.
                    </p>
                    <button
                      onClick={() => router.push('/interviews/new')}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Luyện tập khắc phục</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  Chưa phát hiện tín hiệu yếu điểm đáng lo ngại.
                </p>
              )}
            </div>
          </Card>

          {/* Recent Improvements */}
          <Card variant="elevated" padding="lg" className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">auto_graph</span>
              <span>Tiến bộ gần đây</span>
            </div>

            <div className="space-y-3">
              {recentImprovements.length > 0 ? (
                recentImprovements.map((imp, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (imp.kind === 'interview') {
                        router.push('/interviews');
                      } else {
                        router.push('/resume-analyses');
                      }
                    }}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-bold text-on-surface flex items-center gap-1">
                        <span>{imp.kind === 'interview' ? 'Phiên phỏng vấn kỹ thuật' : 'Phân tích CV đối chiếu JD'}</span>
                        <span className="material-symbols-outlined text-[13px] text-primary">open_in_new</span>
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        Điểm tăng từ {imp.previousScore}% lên {imp.currentScore}%
                      </div>
                    </div>
                    <Badge variant="success" size="sm">+{imp.delta}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant italic">
                  Chưa ghi nhận bước tiến bộ mới trong tuần qua.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MotionPage>
  );
}
