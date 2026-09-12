import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AdminScenarioView } from '@/services/adminApi';
import { useCreateScenario, useUpdateScenario, useAdminScenarioCategories } from '@/hooks/queries/useAdminScenarios';

const scenarioSchema = z.object({
  slug: z.string().min(1, 'Vui lòng nhập slug (mã kịch bản)'),
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  summary: z.string().min(1, 'Vui lòng nhập tóm tắt'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  difficulty: z.string().min(1, 'Vui lòng chọn độ khó'),
  competency: z.string().min(1, 'Vui lòng nhập năng lực (Competency)'),
  estimatedMinutes: z.coerce.number().min(1, 'Thời gian ước tính phải lớn hơn 0'),
  content: z.string().min(1, 'Vui lòng nhập nội dung chi tiết'),
});

type ScenarioFormValues = z.infer<typeof scenarioSchema>;

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingScenario?: AdminScenarioView | null;
}

export function ScenarioModal({ isOpen, onClose, editingScenario }: ScenarioModalProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      slug: '', title: '', summary: '', categoryId: '', difficulty: 'Beginner', competency: '', estimatedMinutes: 15, content: ''
    }
  });

  const { data: categories = [] } = useAdminScenarioCategories();
  const createMutation = useCreateScenario();
  const updateMutation = useUpdateScenario();

  useEffect(() => {
    if (isOpen) {
      if (editingScenario) {
        setValue('slug', editingScenario.slug);
        setValue('title', editingScenario.title);
        setValue('summary', editingScenario.summary);
        setValue('categoryId', editingScenario.categoryId);
        setValue('difficulty', editingScenario.difficulty);
        setValue('competency', editingScenario.competency);
        setValue('estimatedMinutes', editingScenario.estimatedMinutes);
        setValue('content', editingScenario.content);
      } else {
        reset();
      }
    }
  }, [isOpen, editingScenario, setValue, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: ScenarioFormValues) => { // Use any to bypass TS coerce issues internally
    if (editingScenario) {
      updateMutation.mutate({
        id: editingScenario.id,
        data: {
          title: data.title,
          summary: data.summary,
          categoryId: data.categoryId,
          difficulty: data.difficulty,
          competency: data.competency,
          estimatedMinutes: data.estimatedMinutes,
          content: data.content
        }
      }, {
        onSuccess: () => onClose()
      });
    } else {
      createMutation.mutate({
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        categoryId: data.categoryId,
        difficulty: data.difficulty,
        competency: data.competency,
        estimatedMinutes: data.estimatedMinutes,
        content: data.content
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
      justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', 
        width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {editingScenario ? 'Sửa Kịch bản' : 'Thêm Kịch bản mới'}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Mã (Slug)" 
              {...register('slug')} 
              error={errors.slug?.message} 
              disabled={!!editingScenario} 
              placeholder="VD: react-basic"
            />
            <Input 
              label="Tiêu đề" 
              {...register('title')} 
              error={errors.title?.message} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Danh mục</label>
            <select 
              {...register('categoryId')} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.categoryId.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Độ khó</label>
              <select 
                {...register('difficulty')} 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            
            <Input 
              label="Năng lực (Competency)" 
              {...register('competency')} 
              error={errors.competency?.message} 
              placeholder="VD: Technical"
            />
            
            <Input 
              label="Thời lượng (Phút)" 
              type="number"
              {...register('estimatedMinutes')} 
              error={errors.estimatedMinutes?.message} 
            />
          </div>

          <Input 
            label="Tóm tắt (Summary)" 
            {...register('summary')} 
            error={errors.summary?.message} 
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Nội dung chi tiết (Content)</label>
            <textarea 
              {...register('content')} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', minHeight: '150px', resize: 'vertical' }}
              placeholder="Nhập nội dung kịch bản tại đây..."
            />
            {errors.content && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.content.message}</span>}
          </div>

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
