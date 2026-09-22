'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useResumeAnalysis } from '@/hooks/queries/useResumes';
import { REALTIME_FALLBACK_POLL_MS } from '@/constants/realtime';
import { readStatus } from '@/utils/queryPolling';
import type { ResumeAnalysisMode } from '@/services/cvAnalysisContract';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RadialScore } from '@/components/ui/RadialScore';
import { ClientDate } from '@/components/ui/ClientDate';

function parseResult(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
}

export default function ResumeAnalysisDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading: queryLoading, error: queryError, refetch } = useResumeAnalysis(
    id,
    (query) => {
      if (query.state.status === 'error') {
        return false;
      }
      const status = readStatus(query.state.data);
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return REALTIME_FALLBACK_POLL_MS;
    }
  );

  const error = queryError ? queryError.message || 'Không thể tải kết quả phân tích.' : null;
  const loading = queryLoading;
  const currentStatus = readStatus(data);

  if (loading || (currentStatus === 'queued' || currentStatus === 'pending' || currentStatus === 'processing')) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center max-w-lg mx-auto space-y-6">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-card">
            <span className="material-symbols-outlined text-[32px] animate-pulse">document_scanner</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>Xử lý bất đồng bộ · Nexora AI Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            Đang phân tích hồ sơ chuyên sâu...
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
            Hệ thống đang trích xuất dữ liệu, đối chiếu các trục tiêu chuẩn và đánh giá bằng chứng.
          </p>
        </div>

        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden relative">
          <div className="h-full bg-primary rounded-full animate-indeterminate w-1/3 absolute" />
        </div>

        <div className="pt-2">
          <Link href="/resume-analyses" className="text-xs text-on-surface-variant hover:text-primary hover:underline">
            Bạn có thể rời trang này an toàn · Báo cáo sẽ được lưu giữ tại danh sách phân tích
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mx-auto">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-on-surface">Không tìm thấy dữ liệu phân tích</h2>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">{error || 'Hồ sơ yêu cầu không tồn tại hoặc đã bị xóa.'}</p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/resume-analyses')}>
            &larr; Quay lại danh sách
          </Button>
          <Button variant="primary" size="sm" onClick={() => void refetch()}>
            Thử tải lại
          </Button>
        </div>
      </div>
    );
  }

  if (currentStatus === 'failed') {
    const errorCode = data.errorCode;
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <Card variant="elevated" padding="lg" className="border-error/30 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mx-auto">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-on-surface">Phân tích CV không thành công</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Hệ thống không thể bóc tách nội dung hoặc dịch vụ AI gặp sự cố gián đoạn. {errorCode ? `(Mã lỗi: ${errorCode})` : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/resume-analyses')}
              icon={<span className="material-symbols-outlined text-[18px]">refresh</span>}
            >
              Thực hiện phân tích mới
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push('/resumes')}
            >
              Xem danh sách CV
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const rawResult = parseResult(data.result);
  const mode: ResumeAnalysisMode = data.mode === 'field_benchmark' || rawResult?.mode === 'field_benchmark'
    ? 'field_benchmark'
    : 'job_targeted';
  const isBenchmark = mode === 'field_benchmark';

  const score = isBenchmark
    ? (typeof rawResult?.readinessScore === 'number' ? rawResult.readinessScore : null)
    : (typeof rawResult?.matchScore === 'number' ? rawResult.matchScore : null);

  const summary = typeof rawResult?.summary === 'string' ? rawResult.summary : '';
  const strengths = Array.isArray(rawResult?.strengths) ? (rawResult.strengths as string[]) : [];
  const gaps = Array.isArray(rawResult?.gaps) ? (rawResult.gaps as string[]) : [];
  const recommendations = Array.isArray(rawResult?.recommendations) ? (rawResult.recommendations as string[]) : [];
  const sectionFeedback = Array.isArray(rawResult?.sectionFeedback) ? (rawResult.sectionFeedback as string[]) : [];

  const matchedSkills = Array.isArray(rawResult?.matchedKeywordsOrSkills) ? (rawResult.matchedKeywordsOrSkills as string[]) : [];
  const missingSkills = Array.isArray(rawResult?.missingKeywordsOrSkills) ? (rawResult.missingKeywordsOrSkills as string[]) : [];

  const rawBreakdown = (rawResult?.breakdown && typeof rawResult.breakdown === 'object'
    ? rawResult.breakdown
    : {}) as Record<string, unknown>;

  const breakdownEntries = isBenchmark
    ? [
        { key: 'technicalFoundation', name: 'Nền tảng kỹ thuật chuyên môn', score: typeof rawBreakdown.technicalFoundation === 'number' ? rawBreakdown.technicalFoundation : null, desc: 'Kiến trúc phần mềm, cơ sở dữ liệu và clean code' },
        { key: 'projectEvidence', name: 'Bằng chứng dự án thực chiến', score: typeof rawBreakdown.projectEvidence === 'number' ? rawBreakdown.projectEvidence : null, desc: 'Minh chứng qua các bài toán và quy mô dự án thực tế' },
        { key: 'experiencePresentation', name: 'Cách thể hiện kinh nghiệm', score: typeof rawBreakdown.experiencePresentation === 'number' ? rawBreakdown.experiencePresentation : null, desc: 'Mạch lạc, làm nổi bật vai trò đóng góp cá nhân' },
        { key: 'impactAchievements', name: 'Thành tựu & Số liệu tác động', score: typeof rawBreakdown.impactAchievements === 'number' ? rawBreakdown.impactAchievements : null, desc: 'Chỉ số định lượng về hiệu năng hoặc quy mô' },
        { key: 'clarity', name: 'Độ rõ ràng & Mạch lạc', score: typeof rawBreakdown.clarity === 'number' ? rawBreakdown.clarity : null, desc: 'Trình bày chuyên nghiệp, thuật ngữ chuẩn xác' },
        { key: 'roleAlignment', name: 'Định hướng vai trò & Cấp bậc', score: typeof rawBreakdown.roleAlignment === 'number' ? rawBreakdown.roleAlignment : null, desc: 'Phù hợp với kỳ vọng năng lực của cấp bậc mục tiêu' },
      ]
    : [
        { key: 'technicalSkillMatch', name: 'Độ khớp kỹ năng kỹ thuật', score: typeof rawBreakdown.technicalSkillMatch === 'number' ? rawBreakdown.technicalSkillMatch : null, desc: 'Mức độ đáp ứng các công nghệ yêu cầu trong JD' },
        { key: 'experienceRelevance', name: 'Mức độ liên quan kinh nghiệm', score: typeof rawBreakdown.experienceRelevance === 'number' ? rawBreakdown.experienceRelevance : null, desc: 'Kinh nghiệm trong ngành và bài toán tương đồng' },
        { key: 'impactEvidence', name: 'Bằng chứng hiệu quả & tác động', score: typeof rawBreakdown.impactEvidence === 'number' ? rawBreakdown.impactEvidence : null, desc: 'Chỉ số tải, tối ưu hóa quy trình hoặc doanh thu' },
        { key: 'clarity', name: 'Độ rõ ràng & mạch lạc', score: typeof rawBreakdown.clarity === 'number' ? rawBreakdown.clarity : null, desc: 'Từ ngữ súc tích, chuyên nghiệp, chuẩn kỹ thuật' },
        { key: 'structure', name: 'Bố cục & cấu trúc hồ sơ', score: typeof rawBreakdown.structure === 'number' ? rawBreakdown.structure : null, desc: 'Chuẩn ATS, bố cục dễ quét' },
      ];

  const hasBreakdown = breakdownEntries.some(e => e.score !== null);

  const contextData = data.context;
  const industry = contextData?.industry ?? (typeof rawResult?.industry === 'string' ? rawResult.industry : null);
  const targetRole = contextData?.targetRole ?? (typeof rawResult?.targetRole === 'string' ? rawResult.targetRole : null);
  const seniority = contextData?.seniority ?? (typeof rawResult?.seniority === 'string' ? rawResult.seniority : null);

  const scoreLabel = score === null
    ? 'Chưa đủ dữ liệu'
    : score >= 80
    ? 'Rất tốt'
    : score >= 60
    ? 'Khá tốt'
    : 'Cần cải thiện';

  const scoreSublabel = score === null
    ? 'Chưa đủ dữ liệu nội dung để tính điểm số'
    : isBenchmark
    ? 'Độ sẵn sàng đối chiếu theo tiêu chuẩn thị trường'
    : 'Mức độ tương thích đối chiếu trực tiếp với JD';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Báo cáo phân tích chuyên sâu · Bản lưu trữ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            {isBenchmark
              ? 'Đánh giá hồ sơ theo Chuẩn năng lực vị trí'
              : 'Đánh giá hồ sơ theo Mô tả công việc (JD)'}
          </h1>

          {/* Preserved Snapshot Context */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-on-surface-variant">
            {targetRole && (
              <span>
                Vị trí: <strong>{targetRole} {seniority ? `(${seniority})` : ''}</strong>
              </span>
            )}
            {industry && (
              <>
                <span>•</span>
                <span>
                  Ngành: <strong>{industry}</strong>
                </span>
              </>
            )}
            <span>•</span>
            <span>
              Hình thức: <strong>{isBenchmark ? 'Chuẩn thị trường' : 'Theo JD cụ thể'}</strong>
            </span>
            {data.createdAt && (
              <>
                <span>•</span>
                <span>
                  Thời điểm: <strong><ClientDate date={data.createdAt} format="date" /></strong>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/resume-analyses')}
            icon={<span className="material-symbols-outlined text-[16px]">arrow_back</span>}
          >
            Danh sách
          </Button>
          <Link href="/interviews/new">
            <Button
              variant="primary"
              size="md"
              icon={<span className="material-symbols-outlined text-[18px]">play_arrow</span>}
              iconPosition="right"
            >
              Luyện phỏng vấn
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Overview: Radial Score + Dimension Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Score Card (5 cols) */}
        <div className="lg:col-span-5">
          <Card variant="elevated" padding="lg" className="h-full flex flex-col justify-between space-y-5">
            <div>
              <h3 className="font-bold text-base text-on-surface mb-4">
                {isBenchmark ? 'Chỉ số sẵn sàng theo chuẩn vị trí' : 'Chỉ số tương thích tổng thể'}
              </h3>

              <div className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-center">
                <RadialScore
                  score={score}
                  size="lg"
                  label={scoreLabel}
                  sublabel={scoreSublabel}
                />
              </div>

              {summary && (
                <div className="text-xs sm:text-sm text-on-surface leading-relaxed p-4 bg-surface rounded-xl border border-outline-variant/40 mt-4 space-y-1">
                  <span className="font-bold text-primary block">Tóm lược từ Nexora AI:</span>
                  <p>{summary}</p>
                </div>
              )}
            </div>

            {data.rubricVersion && (
              <div className="pt-3 border-t border-outline-variant/30 flex justify-between text-[11px] text-on-surface-variant font-mono">
                <span>Rubric: {data.rubricVersion}</span>
                {data.modelVersion && <span>Model: {data.modelVersion}</span>}
              </div>
            )}
          </Card>
        </div>

        {/* Dimension Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          <Card variant="elevated" padding="lg" className="h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-on-surface">
                  {isBenchmark
                    ? 'Đánh giá 6 trục chuẩn năng lực thị trường'
                    : 'Đánh giá 5 trục tiêu chuẩn năng lực'}
                </h3>
                <span className="text-xs text-on-surface-variant font-mono">Thang điểm 0 - 100</span>
              </div>

              {hasBreakdown ? (
                <div className="space-y-4">
                  {breakdownEntries.map((item) => (
                    <div key={item.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-on-surface">{item.name}</span>
                        <span className={`font-bold ${item.score !== null && item.score < 60 ? 'text-amber-700' : 'text-primary'}`}>
                          {item.score !== null ? `${item.score}/100` : 'Chưa đủ dữ liệu'}
                        </span>
                      </div>
                      <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.score !== null && item.score < 60 ? 'bg-amber-600' : 'bg-primary'
                          }`}
                          style={{ width: item.score !== null ? `${Math.max(0, Math.min(100, item.score))}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[11px] text-on-surface-variant">{item.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl">
                  Chưa có chi tiết phân tích từng trục tiêu chuẩn từ phản hồi máy chủ.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Matched vs Missing Keywords (Only if job targeted or server returns them) */}
      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="elevated" padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </span>
              <h4 className="font-bold text-sm text-on-surface">Kỹ năng & Từ khóa đã khớp ({matchedSkills.length})</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    ✓ {kw}
                  </span>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant">Chưa có dữ liệu từ khóa khớp.</p>
              )}
            </div>
          </Card>

          <Card variant="elevated" padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">pending</span>
              </span>
              <h4 className="font-bold text-sm text-on-surface">Kỹ năng cần bổ sung thêm ({missingSkills.length})</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingSkills.length > 0 ? (
                missingSkills.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                  >
                    + {kw}
                  </span>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant">Chưa có dữ liệu kỹ năng thiếu sót.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="elevated" padding="lg" className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">thumb_up</span>
            <span>Thế mạnh nổi trội của hồ sơ ({strengths.length})</span>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-on-surface leading-relaxed list-disc list-inside">
              {strengths.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-on-surface-variant">Chưa ghi nhận thế mạnh có bằng chứng từ hồ sơ.</p>
          )}
        </Card>

        <Card variant="elevated" padding="lg" className="space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span>Khoảng trống & Điểm cần bổ sung ({gaps.length})</span>
          </div>
          {gaps.length > 0 ? (
            <ul className="space-y-2 text-xs sm:text-sm text-on-surface leading-relaxed list-disc list-inside">
              {gaps.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-on-surface-variant">Chưa ghi nhận khoảng trống đáng kể từ dữ liệu CV.</p>
          )}
        </Card>
      </div>

      {/* Recommendations & Section Feedback */}
      {(recommendations.length > 0 || sectionFeedback.length > 0) && (
        <Card variant="elevated" padding="lg" className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            </span>
            <div>
              <h3 className="font-bold text-sm text-on-surface">Khuyến nghị hoàn thiện & Góp ý chi tiết</h3>
              <p className="text-[11px] text-on-surface-variant">Các hành động trọng tâm từ Nexora AI để tối ưu hóa hồ sơ của bạn.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {recommendations.length > 0 && (
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 border border-outline-variant/30">
                <h4 className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  <span>Hành động khuyến nghị</span>
                </h4>
                <ul className="space-y-2 text-xs text-on-surface leading-relaxed list-disc list-inside">
                  {recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {sectionFeedback.length > 0 && (
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2 border border-outline-variant/30">
                <h4 className="font-bold text-xs text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">feedback</span>
                  <span>Góp ý từng phần hồ sơ</span>
                </h4>
                <ul className="space-y-2 text-xs text-on-surface leading-relaxed list-disc list-inside">
                  {sectionFeedback.map((fb, i) => (
                    <li key={i}>{fb}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Action CTA Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-primary text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-card">
        <div className="space-y-2 text-center sm:text-left">
          <Badge variant="primary" size="sm" className="bg-white/20 text-white border-0">
            Hành động tiếp theo được khuyến nghị
          </Badge>
          <h3 className="text-xl sm:text-2xl font-bold">
            Luyện tiếp với phỏng vấn AI
          </h3>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Chuyển sang phần chuẩn bị phỏng vấn để chọn bối cảnh và bắt đầu phiên luyện.
          </p>
        </div>

        <Link href="/interviews/new">
          <Button
            variant="secondary"
            size="lg"
            className="bg-white text-primary hover:bg-white/95 flex-shrink-0 shadow-lg"
            icon={<span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            iconPosition="right"
          >
            Chuyển sang phòng phỏng vấn
          </Button>
        </Link>
      </div>
    </div>
  );
}
