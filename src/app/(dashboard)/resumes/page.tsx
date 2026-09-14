'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientDate } from '@/components/ui/ClientDate';
import styles from './Resumes.module.css';
import { useResumes, useSetPrimaryResume, useCareerProfile } from '@/hooks/queries/useCareerProfile';

export default function ResumesManagementPage() {
  const router = useRouter();
  
  const { data: resumes, isLoading, isError } = useResumes();
  const { data: careerProfile } = useCareerProfile();
  const { mutate: setPrimaryResume, isPending: isSettingPrimary } = useSetPrimaryResume();
  const primaryResumeId = careerProfile?.primaryResume?.id;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Hồ sơ CV</h1>
        <p className={styles.subtitle}>Quản lý các CV của bạn và thiết lập CV chính cho các bài phỏng vấn.</p>
      </div>

      <div className={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.panelTitle} style={{ margin: 0 }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Danh sách CV đã tải lên
          </h2>
          <button 
            onClick={() => router.push('/resume-analyses')}
            style={{ 
              background: '#1f2937', color: 'white', border: 'none', padding: '0.75rem 1.5rem', 
              borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            + Tải CV mới lên & Phân tích
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Đang tải danh sách CV...</div>
        ) : isError ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Đã xảy ra lỗi khi tải danh sách CV.</div>
        ) : !resumes || resumes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '3rem 2rem', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
            <p style={{ marginBottom: '1rem' }}>Bạn chưa tải lên CV nào.</p>
            <button 
              onClick={() => router.push('/resume-analyses')}
              style={{ 
                background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', 
                borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer'
              }}
            >
              Tải lên ngay
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {resumes.map(resume => {
              const isPrimary = resume.id === primaryResumeId;
              
              return (
                <div
                  key={resume.id}
                  style={{
                    padding: '1.25rem',
                    border: isPrimary ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isPrimary ? '#fffbeb' : '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '1.1rem' }}>
                        {resume.fileName || 'CV Không tên'}
                      </div>
                      {isPrimary && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                          <svg fill="currentColor" viewBox="0 0 20 20" width="12" height="12" style={{ marginRight: '4px' }}>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          CV Chính
                        </span>
                      )}
                      {resume.status === 'ready' ? (
                        <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 500, padding: '2px 6px', backgroundColor: '#d1fae5', borderRadius: '4px' }}>Đã sẵn sàng</span>
                      ) : resume.status === 'failed' ? (
                        <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 500, padding: '2px 6px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>Lỗi xử lý</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 500, padding: '2px 6px', backgroundColor: '#fef3c7', borderRadius: '4px' }}>Đang xử lý</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <span>{(resume.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span style={{ color: '#d1d5db' }}>|</span>
                      <ClientDate date={resume.createdAt} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isPrimary ? (
                      <button
                        type="button"
                        disabled={isSettingPrimary}
                        onClick={() => setPrimaryResume(null as any)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          backgroundColor: '#fff',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          cursor: isSettingPrimary ? 'not-allowed' : 'pointer',
                          opacity: isSettingPrimary ? 0.7 : 1,
                          color: '#ef4444'
                        }}
                      >
                        Bỏ chọn CV chính
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSettingPrimary || resume.status !== 'ready'}
                        onClick={() => setPrimaryResume(resume.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          backgroundColor: resume.status === 'ready' ? '#EFF6FF' : '#F3F4F6',
                          border: '1px solid',
                          borderColor: resume.status === 'ready' ? '#BFDBFE' : '#E5E7EB',
                          borderRadius: '0.375rem',
                          cursor: (isSettingPrimary || resume.status !== 'ready') ? 'not-allowed' : 'pointer',
                          opacity: (isSettingPrimary || resume.status !== 'ready') ? 0.7 : 1,
                          color: resume.status === 'ready' ? '#2563EB' : '#9CA3AF'
                        }}
                      >
                        Đặt làm CV chính
                      </button>
                    )}
                    <Link 
                      href="/resume-analyses"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        backgroundColor: 'white',
                        border: '1px solid #3b82f6',
                        color: '#3b82f6',
                        borderRadius: '0.375rem',
                        textDecoration: 'none'
                      }}
                    >
                      Phân tích lại
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
