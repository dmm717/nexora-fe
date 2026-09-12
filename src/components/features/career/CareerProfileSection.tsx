import React from 'react';
import Link from 'next/link';
import { useCareerProfile } from '@/hooks/queries/useCareerProfile';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export const CareerProfileSection = () => {
  const { data: profileData, isLoading } = useCareerProfile();

  if (isLoading) {
    return <div style={{ padding: '1rem', color: '#6b7280' }}>Đang tải Hồ sơ sự nghiệp...</div>;
  }

  if (!profileData) return null;

  const { onboarding, skillProfileSummary, learningPath, primaryResume, activeCareerGoal } = profileData;

  const radarData = skillProfileSummary.topCompetencies.map(comp => ({
    subject: comp.name,
    A: comp.score,
    fullMark: 100,
  }));

  const totalPathCount = learningPath ? learningPath.completedActivityCount + learningPath.pendingActivityCount : 0;
  const pathProgress = totalPathCount > 0 ? (learningPath!.completedActivityCount / totalPathCount) * 100 : 0;

  return (
    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Onboarding Banner */}
      {!onboarding.isComplete && (
        <div style={{
          backgroundColor: '#eff6ff', 
          borderLeft: '4px solid #3b82f6', 
          padding: '1rem',
          borderRadius: '0.375rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '1.125rem' }}>Hoàn thiện Hồ sơ Sự nghiệp</h3>
            <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.875rem' }}>
              {!onboarding.hasPrimaryResume && !onboarding.hasActiveCareerGoal
                ? 'Bạn cần thiết lập Mục tiêu nghề nghiệp và chọn CV chính để chúng tôi gợi ý lộ trình tốt nhất.'
                : !onboarding.hasPrimaryResume
                ? 'Vui lòng chọn 1 CV làm CV chính.'
                : 'Vui lòng thiết lập Mục tiêu nghề nghiệp.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!onboarding.hasActiveCareerGoal && (
              <Link href="/career-goals" style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.375rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                Thiết lập Mục tiêu
              </Link>
            )}
            {!onboarding.hasPrimaryResume && (
              <Link href="/resumes" style={{ padding: '0.5rem 1rem', backgroundColor: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '0.375rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
                Chọn CV chính
              </Link>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Radar Chart */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', color: '#111827' }}>Phân tích Kỹ năng hàng đầu</h3>
          {radarData.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Điểm năng lực" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Chưa có đủ dữ liệu kỹ năng để hiển thị biểu đồ.</p>
          )}
        </div>

        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Primary Resume Info */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#111827' }}>CV Chính (Primary Resume)</h3>
            {primaryResume ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20" style={{ color: '#9ca3af' }}>
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span style={{ fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={primaryResume.fileName}>
                    {primaryResume.fileName}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Trạng thái: <span style={{ color: primaryResume.status === 'ready' ? '#10b981' : '#f59e0b', fontWeight: 500 }}>{primaryResume.status}</span>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Chưa thiết lập CV chính.</p>
            )}
          </div>

          {/* Learning Path Info */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#111827' }}>Lộ trình học tập</h3>
            {learningPath ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Tiến độ ({learningPath.status})</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                    {learningPath.completedActivityCount} / {totalPathCount}
                  </span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.5rem' }}>
                  <div 
                    style={{ 
                      backgroundColor: '#3b82f6', 
                      height: '0.5rem', 
                      borderRadius: '9999px', 
                      width: `${pathProgress}%` 
                    }} 
                  />
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                {!activeCareerGoal ? 'Vui lòng thiết lập Mục tiêu nghề nghiệp để tạo lộ trình.' : 'Chưa có lộ trình học tập.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
