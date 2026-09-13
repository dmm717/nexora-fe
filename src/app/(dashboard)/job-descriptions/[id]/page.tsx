'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import type { JdView } from '@/services/cvAnalysisApi';
import { ClientDate } from '@/components/ui/ClientDate';

export default function JobDescriptionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [jd, setJd] = useState<JdView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJd = async () => {
      try {
        const data = await cvAnalysisApi.getJobDescriptionDetails(params.id);
        setJd(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết JD');
      } finally {
        setLoading(false);
      }
    };

    fetchJd();
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error || !jd) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => router.back()} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>← Quay lại</button>
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem' }}>
          {error || 'Không tìm thấy JD'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => router.back()} 
        style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', padding: 0, fontWeight: 500 }}
      >
        ← Quay lại
      </button>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>
          {jd.title || 'Job Description không tên'}
        </h1>
        
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          Đã tạo: <ClientDate date={jd.createdAt} />
        </div>

        <div style={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.6 }}>
          {jd.content}
        </div>
      </div>
    </div>
  );
}
