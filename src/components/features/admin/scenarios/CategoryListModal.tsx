import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { useAdminScenarioCategories } from '@/hooks/queries/useAdminScenarios';
import { AdminScenarioCategoryView } from '@/services/adminApi';
import { CategoryModal } from './CategoryModal';

interface CategoryListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryListModal({ isOpen, onClose }: CategoryListModalProps) {
  const { data: categories = [], isLoading, error } = useAdminScenarioCategories();
  
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminScenarioCategoryView | null>(null);

  if (!isOpen) return null;

  const handleCreate = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const handleEdit = (category: AdminScenarioCategoryView) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', 
        width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Quản lý Danh mục Kịch bản</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <Button onClick={handleCreate}>+ Thêm danh mục mới</Button>
        </div>
        
        {isLoading && <div>Đang tải danh sách danh mục...</div>}
        {error && <div style={{ color: 'red' }}>Lỗi khi tải danh sách danh mục.</div>}

        {!isLoading && !error && categories.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
            Chưa có danh mục nào.
          </div>
        )}

        {!isLoading && !error && categories.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #e5e7eb' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Mã (Slug)</th>
                <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Tên danh mục</th>
                <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Mô tả</th>
                <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151' }}>Trạng thái</th>
                <th style={{ padding: '0.75rem', fontWeight: '600', color: '#374151', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', color: '#4b5563', fontSize: '0.875rem' }}>{cat.slug}</td>
                  <td style={{ padding: '0.75rem', color: '#111827', fontWeight: '500' }}>{cat.name}</td>
                  <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>{cat.description || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      backgroundColor: cat.isActive ? '#dcfce7' : '#f3f4f6', 
                      color: cat.isActive ? '#166534' : '#4b5563', 
                      padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' 
                    }}>
                      {cat.isActive ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <Button onClick={() => handleEdit(cat)} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>
                      Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <CategoryModal 
          isOpen={isCategoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          editingCategory={editingCategory}
        />
      </div>
    </div>
  );
}
