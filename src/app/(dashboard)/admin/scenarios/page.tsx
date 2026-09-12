'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminScenarios, usePublishScenario, useArchiveScenario } from '@/hooks/queries/useAdminScenarios';
import { AdminScenarioView } from '@/services/adminApi';
import { Button } from '@/components/ui/Button/Button';
import { ScenarioModal } from '@/components/features/admin/scenarios/ScenarioModal';
import { CategoryListModal } from '@/components/features/admin/scenarios/CategoryListModal';

export default function AdminScenariosPage() {
  const { data: scenarios = [], isLoading, error } = useAdminScenarios();
  const publishMutation = usePublishScenario();
  const archiveMutation = useArchiveScenario();

  // Modal States
  const [isScenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<AdminScenarioView | null>(null);

  const [isCategoryListModalOpen, setCategoryListModalOpen] = useState(false);

  const handleCreateScenario = () => {
    setEditingScenario(null);
    setScenarioModalOpen(true);
  };

  const handleEditScenario = (scenario: AdminScenarioView) => {
    setEditingScenario(scenario);
    setScenarioModalOpen(true);
  };

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const handleArchive = (id: string) => {
    if (window.confirm('Bạn có chắc muốn lưu trữ kịch bản này? Hành động này không thể hoàn tác.')) {
      archiveMutation.mutate(id);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Quản trị hệ thống</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={() => setCategoryListModalOpen(true)} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>
            Quản lý Danh mục
          </Button>
          <Button onClick={handleCreateScenario}>+ Tạo Kịch bản</Button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <Link href="/admin/users" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Người dùng</Link>
        <Link href="/admin/scenarios" style={{ fontWeight: '600', color: '#0ea5e9', borderBottom: '2px solid #0ea5e9', paddingBottom: '0.5rem' }}>Kịch bản</Link>
        <Link href="/admin/plans" style={{ color: '#4b5563', paddingBottom: '0.5rem' }}>Gói cước</Link>
      </div>

      {isLoading && <div>Đang tải danh sách kịch bản...</div>}
      {error && <div style={{ color: 'red' }}>Không thể tải danh sách kịch bản. Vui lòng kiểm tra quyền truy cập.</div>}
      
      {!isLoading && !error && scenarios.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          Chưa có dữ liệu kịch bản.
        </div>
      )}

      {!isLoading && !error && scenarios.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Kịch bản</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Độ khó</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: '#374151', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(scenario => (
                <tr key={scenario.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ color: '#111827', fontWeight: '600' }}>{scenario.title}</div>
                    <div style={{ color: '#4b5563', fontSize: '0.875rem', marginTop: '0.25rem' }}>Mã: {scenario.slug}</div>
                  </td>
                  <td style={{ padding: '1rem', color: '#4b5563' }}>
                    <span style={{ 
                      backgroundColor: '#f3f4f6', 
                      color: '#4b5563', 
                      padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' 
                    }}>
                      {scenario.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      backgroundColor: scenario.status === 'published' ? '#dcfce7' : scenario.status === 'archived' ? '#fee2e2' : '#fef3c7', 
                      color: scenario.status === 'published' ? '#166534' : scenario.status === 'archived' ? '#991b1b' : '#92400e', 
                      padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', textTransform: 'capitalize'
                    }}>
                      {scenario.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Button 
                        onClick={() => handleEditScenario(scenario)} 
                        style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Sửa
                      </Button>
                      
                      {scenario.status === 'draft' && (
                        <Button 
                          onClick={() => handlePublish(scenario.id)}
                          disabled={publishMutation.isPending}
                          style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Đăng
                        </Button>
                      )}

                      {scenario.status !== 'archived' && (
                        <Button 
                          onClick={() => handleArchive(scenario.id)}
                          disabled={archiveMutation.isPending}
                          style={{ backgroundColor: 'white', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                        >
                          Lưu trữ
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ScenarioModal 
        isOpen={isScenarioModalOpen} 
        onClose={() => setScenarioModalOpen(false)} 
        editingScenario={editingScenario} 
      />
      <CategoryListModal 
        isOpen={isCategoryListModalOpen} 
        onClose={() => setCategoryListModalOpen(false)} 
      />
    </div>
  );
}
