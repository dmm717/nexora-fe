'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Resumes.module.css';
import { cvAnalysisApi } from '@/services/cvAnalysisApi';
import { useResumeAnalysisHistory } from '@/hooks/useResumeAnalysisHistory';

const REPORT_LANGUAGE_INSTRUCTION = '\n\n(Yêu cầu: Vui lòng trả về báo cáo phân tích hoàn toàn bằng Tiếng Việt)';

export default function ResumesPage() {
  const router = useRouter();
  
  const { history, pending, addHistoryItem, setPendingAnalysis } = useResumeAnalysisHistory();
  const hasResumed = useRef(false);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JD state
  const [jdTitle, setJdTitle] = useState('');
  const [jdContent, setJdContent] = useState('');
  
  // Submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const resumeAnalysis = React.useCallback(async (p: { resumeId: string, jobDescriptionId: string, jdTitle: string }) => {
    setLoading(true);
    setError(null);
    setProgress('Đang phục hồi tiến trình phân tích (Vui lòng không tải lại trang)...');
    
    try {
      let analysis = null;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        try {
          analysis = await cvAnalysisApi.analyze({
            resumeId: p.resumeId,
            jobDescriptionId: p.jobDescriptionId
          });
          break;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : '';
          if (errMsg.toLowerCase().includes('chưa sẵn sàng') || errMsg.toLowerCase().includes('not ready')) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error('Quá thời gian chờ xử lý CV. Vui lòng tải lại file mới.');
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw err;
          }
        }
      }

      if (analysis) {
        setPendingAnalysis(null);
        addHistoryItem({ id: analysis.id, jdTitle: p.jdTitle });
        setProgress('Hoàn tất! Đang chuyển hướng...');
        router.push(`/dashboard/resume-analyses/${analysis.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình phục hồi phân tích.');
      setLoading(false);
      setPendingAnalysis(null);
    }
  }, [addHistoryItem, router, setPendingAnalysis]);

  useEffect(() => {
    if (pending && !hasResumed.current) {
      hasResumed.current = true;
      resumeAnalysis(pending);
    }
  }, [pending, resumeAnalysis]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (f: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const isDocxExt = f.name.toLowerCase().endsWith('.docx');
    const isPdfExt = f.name.toLowerCase().endsWith('.pdf');
    
    if (!allowedTypes.includes(f.type) && !isDocxExt && !isPdfExt) {
      setError('Vui lòng tải lên file định dạng PDF hoặc DOCX.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Dung lượng file không được vượt quá 10MB.');
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Vui lòng tải lên CV của bạn.');
      return;
    }
    if (!jdTitle.trim() || !jdContent.trim()) {
      setError('Vui lòng nhập đầy đủ Tiêu đề và Mô tả công việc.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setProgress('Đang chuẩn bị tải lên...');
      const presign = await cvAnalysisApi.presignUpload({
        fileName: file.name,
        contentType: file.type,
        size: file.size
      });

      setProgress('Đang tải file lên máy chủ...');
      await cvAnalysisApi.uploadFile(presign.uploadUrl, file);

      setProgress('Đang lưu thông tin CV (chờ xử lý dữ liệu)...');
      const resume = await cvAnalysisApi.createResume(presign.token);

      setProgress('Đang phân tích Mô tả công việc...');
      const jd = await cvAnalysisApi.createJobDescription({
        title: jdTitle,
        content: jdContent + REPORT_LANGUAGE_INSTRUCTION
      });

      // Lưu trạng thái pending vào localStorage
      setPendingAnalysis({ resumeId: resume.id, jobDescriptionId: jd.id, jdTitle: jd.title });

      setProgress('AI đang phân tích độ phù hợp (Quá trình này có thể mất vài chục giây)...');
      
      let analysis = null;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        try {
          analysis = await cvAnalysisApi.analyze({
            resumeId: resume.id,
            jobDescriptionId: jd.id
          });
          break;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : '';
          if (errMsg.toLowerCase().includes('chưa sẵn sàng') || errMsg.toLowerCase().includes('not ready')) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error('Quá thời gian chờ xử lý CV. Vui lòng thử lại sau.');
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw err;
          }
        }
      }

      if (analysis) {
        setPendingAnalysis(null);
        addHistoryItem({ id: analysis.id, jdTitle: jd.title });
        setProgress('Hoàn tất! Đang chuyển hướng...');
        router.push(`/dashboard/resume-analyses/${analysis.id}`);
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình phân tích.');
      setLoading(false);
      setPendingAnalysis(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Phân tích CV chuyên sâu</h1>
        <p className={styles.subtitle}>Tải lên CV và Mô tả công việc để AI đánh giá mức độ phù hợp và đưa ra lời khuyên cải thiện.</p>
      </header>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formGrid}>
        {/* CV Upload Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            1. Hồ sơ ứng viên (CV)
          </h2>

          {!file ? (
            <div 
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className={styles.uploadIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" width="48" height="48" style={{margin: '0 auto 1rem auto'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className={styles.uploadText}>Kéo thả file vào đây hoặc <strong>nhấn để chọn</strong></p>
              <p className={styles.uploadHint}>Hỗ trợ file PDF, DOCX (Tối đa 10MB)</p>
              <input 
                type="file" 
                ref={fileInputRef}
                className={styles.fileInput}
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={onFileChange}
              />
            </div>
          ) : (
            <div className={styles.selectedFile}>
              <div className={styles.fileInfo}>
                <svg className={styles.fileIcon} fill="currentColor" viewBox="0 0 20 20" width="32" height="32">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className={styles.fileName} title={file.name}>{file.name}</div>
                  <div className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
              <button className={styles.removeButton} onClick={handleRemoveFile} title="Xóa file">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
          </div>

        {/* JD Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            2. Mô tả công việc (JD)
          </h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Chức danh (Title)</label>
            <input 
              type="text" 
              className={styles.input}
              placeholder="VD: Senior Frontend Developer (React)"
              value={jdTitle}
              onChange={e => setJdTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nội dung chi tiết</label>
            <textarea 
              className={styles.textarea}
              placeholder="Dán toàn bộ nội dung yêu cầu công việc, kỹ năng, kinh nghiệm vào đây..."
              value={jdContent}
              onChange={e => setJdContent(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>
        </div>
      </div>

      <div className={styles.actionArea}>
        <button 
          className={styles.analyzeButton} 
          onClick={handleAnalyze}
          disabled={loading || !file || !jdTitle.trim() || !jdContent.trim()}
        >
          {loading ? (
            <><div className={styles.spinner}></div> Phân tích...</>
          ) : 'Phân tích độ phù hợp'}
        </button>
        {loading && progress && (
          <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>{progress}</p>
        )}
      </div>

      {history.length > 0 && (
        <div className={styles.panel} style={{ marginTop: '2rem' }}>
          <h2 className={styles.panelTitle}>Lịch sử phân tích của bạn (Lưu trên thiết bị)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {history.map(item => (
              <div 
                key={item.id} 
                onClick={() => router.push(`/dashboard/resume-analyses/${item.id}`)}
                style={{ 
                  cursor: 'pointer', 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{item.jdTitle}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div style={{ color: '#2563eb', fontWeight: 500, fontSize: '0.875rem' }}>Xem kết quả &rarr;</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
