'use client';
import React from 'react';
import Link from 'next/link';

export default function PublicPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1f2937' }}>
        Xin chào! Bạn đang sử dụng Gói Miễn Phí.
      </h2>
      <p style={{ color: '#6b7280', lineHeight: '1.6', maxWidth: '800px' }}>
        Trải nghiệm một số tính năng cơ bản của Nexora để hiểu rõ hơn cách chúng tôi có thể giúp bạn chinh phục buổi phỏng vấn. Để mở khóa toàn bộ tính năng phân tích và mô phỏng AI chuyên sâu, hãy nâng cấp lên gói Premium.
      </p>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#10b981', marginBottom: '10px' }}>Phân tích CV cơ bản</h3>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '15px' }}>
            Kiểm tra mức độ phù hợp của CV với một bản mô tả công việc (JD) bất kỳ.
          </p>
          <Link href="/public/resumes" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold' }}>Thử ngay &rarr;</Link>
        </div>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #eab308', borderRadius: '10px', background: '#fff' }}>
          <h3 style={{ color: '#eab308', marginBottom: '10px' }}>Nâng cấp Premium</h3>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '15px' }}>
            Mở khóa mô phỏng phỏng vấn 1-1 với AI, nhận báo cáo chi tiết và gợi ý cải thiện.
          </p>
          <Link href="/plans" style={{ color: '#eab308', textDecoration: 'none', fontWeight: 'bold' }}>Khám phá Gói cước &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
