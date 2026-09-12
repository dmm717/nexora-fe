import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminScenarioCategoryView } from '@/services/adminApi';
import { useCreateScenarioCategory, useUpdateScenarioCategory } from '@/hooks/queries/useAdminScenarios';

const categorySchema = z.object({
  slug: z.string().min(1, 'Vui lòng nhập slug (mã danh mục)'),
  name: z.string().min(1, 'Vui lòng nhập tên danh mục'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: AdminScenarioCategoryView | null;
}

export function CategoryModal({ isOpen, onClose, editingCategory }: CategoryModalProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { slug: '', name: '', description: '', isActive: true }
  });

  const createMutation = useCreateScenarioCategory();
  const updateMutation = useUpdateScenarioCategory();

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setValue('slug', editingCategory.slug);
        setValue('name', editingCategory.name);
        setValue('description', editingCategory.description || '');
        setValue('isActive', editingCategory.isActive);
      } else {
        reset();
      }
    }
  }, [isOpen, editingCategory, setValue, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: {
          name: data.name,
          description: data.description,
          isActive: data.isActive
        }
      }, {
        onSuccess: () => onClose()
      });
    } else {
      createMutation.mutate({
        slug: data.slug,
        name: data.name,
        description: data.description
      }, {
        onSuccess: () => onClose()
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1100
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', 
        width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {editingCategory ? 'Sửa Danh mục' : 'Thêm Danh mục mới'}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <Input 
            label="Mã danh mục (Slug)" 
            {...register('slug')} 
            error={errors.slug?.message} 
            disabled={!!editingCategory} 
            placeholder="VD: frontend-interview"
          />
          <Input 
            label="Tên danh mục" 
            {...register('name')} 
            error={errors.name?.message} 
          />
          <Input 
            label="Mô tả" 
            {...register('description')} 
            error={errors.description?.message} 
          />

          {editingCategory && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
              <input type="checkbox" {...register('isActive')} />
              Đang hoạt động (Kích hoạt)
            </label>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={onClose} disabled={isPending} style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' }}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang xử lý...' : 'Lưu lại'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
