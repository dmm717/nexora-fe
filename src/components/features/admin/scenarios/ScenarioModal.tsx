import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminTextField } from './AdminTextField';
import { AdminScenarioView } from '@/services/adminApi';
import {
  useAdminScenarioCategories,
  useCreateScenario,
  useUpdateScenario,
} from '@/hooks/queries/useAdminScenarios';
import { getQueryPresentation } from '@/utils/queryPresentation';

const scenarioSchema = z.object({
  slug: z.string().min(1, 'Nhập mã kịch bản.'),
  title: z.string().min(1, 'Nhập tiêu đề kịch bản.'),
  summary: z.string().min(1, 'Nhập phần tóm tắt.'),
  categoryId: z.string().min(1, 'Chọn một danh mục.'),
  difficulty: z.string().min(1, 'Chọn độ khó.'),
  competency: z.string().min(1, 'Nhập năng lực (competency).'),
  estimatedMinutes: z.coerce.number().min(1, 'Thời lượng phải lớn hơn 0.'),
  content: z.string().min(1, 'Nhập nội dung chi tiết.'),
});

type ScenarioFormInput = z.input<typeof scenarioSchema>;
type ScenarioFormValues = z.output<typeof scenarioSchema>;

const emptyScenario: ScenarioFormValues = {
  slug: '',
  title: '',
  summary: '',
  categoryId: '',
  difficulty: 'Beginner',
  competency: '',
  estimatedMinutes: 15,
  content: '',
};

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingScenario?: AdminScenarioView | null;
}

export function ScenarioModal({ isOpen, onClose, editingScenario }: ScenarioModalProps) {
  const categoryId = useId();
  const categoryErrorId = `${categoryId}-error`;
  const categoryQuery = useAdminScenarioCategories();
  const categories = categoryQuery.data;
  const categoryPresentation = getQueryPresentation({
    hasData: categories !== undefined,
    isLoading: categoryQuery.isLoading,
    isError: categoryQuery.isError,
    isFetching: categoryQuery.isFetching,
  });
  const createMutation = useCreateScenario();
  const updateMutation = useUpdateScenario();
  const resetCreateMutation = createMutation.reset;
  const resetUpdateMutation = updateMutation.reset;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScenarioFormInput, unknown, ScenarioFormValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: emptyScenario,
  });

  useEffect(() => {
    if (!isOpen) return;
    resetCreateMutation();
    resetUpdateMutation();
    reset(
      editingScenario
        ? {
            slug: editingScenario.slug,
            title: editingScenario.title,
            summary: editingScenario.summary,
            categoryId: editingScenario.categoryId,
            difficulty: editingScenario.difficulty,
            competency: editingScenario.competency,
            estimatedMinutes: editingScenario.estimatedMinutes,
            content: editingScenario.content,
          }
        : emptyScenario,
    );
  }, [isOpen, editingScenario, reset, resetCreateMutation, resetUpdateMutation]);

  const closeIfIdle = () => {
    if (!isPending) onClose();
  };

  const onSubmit = (data: ScenarioFormValues) => {
    if (isPending || categories === undefined || categories.length === 0) return;

    const scenarioData = {
      title: data.title,
      summary: data.summary,
      categoryId: data.categoryId,
      difficulty: data.difficulty,
      competency: data.competency,
      estimatedMinutes: data.estimatedMinutes,
      content: data.content,
    };

    if (editingScenario) {
      updateMutation.mutate(
        { id: editingScenario.id, data: scenarioData },
        { onSuccess: onClose },
      );
      return;
    }

    createMutation.mutate(
      { slug: data.slug, ...scenarioData },
      { onSuccess: onClose },
    );
  };

  const mutationFailed = editingScenario ? updateMutation.isError : createMutation.isError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeIfIdle}
      title={editingScenario ? 'Chỉnh sửa kịch bản' : 'Tạo kịch bản mới'}
      description="Thông tin được lưu theo hợp đồng quản trị kịch bản hiện tại."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {mutationFailed && (
          <Alert variant="error" title="Chưa lưu được kịch bản">
            Dữ liệu bạn đã nhập vẫn được giữ lại. Hãy kiểm tra lại và thử lưu lần nữa.
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminTextField
            label="Mã kịch bản (slug)"
            placeholder="Ví dụ: react-basic"
            disabled={isPending || Boolean(editingScenario)}
            error={errors.slug?.message}
            {...register('slug')}
          />
          <AdminTextField
            label="Tiêu đề"
            disabled={isPending}
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={categoryId} className="block text-sm font-medium text-on-surface">
            Danh mục
          </label>
          <select
            id={categoryId}
            {...register('categoryId')}
            disabled={isPending || categories === undefined || categories.length === 0}
            aria-invalid={errors.categoryId ? 'true' : undefined}
            aria-describedby={errors.categoryId ? categoryErrorId : undefined}
            className="min-h-11 w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-sm text-on-surface shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-container-low"
          >
            <option value="">Chọn danh mục</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p id={categoryErrorId} className="text-xs text-error">
              {errors.categoryId.message}
            </p>
          )}
          {categoryPresentation.showInitialLoading && (
            <div role="status" className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant">
              <Skeleton className="h-3 w-24" />
              Đang tải danh mục…
            </div>
          )}
          {categoryPresentation.showBlockingError && (
            <Alert
              variant="error"
              title="Không thể tải danh mục"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void categoryQuery.refetch()}
                >
                  Thử lại
                </Button>
              }
            >
              Chưa thể chọn danh mục nên bạn chưa thể lưu kịch bản.
            </Alert>
          )}
          {categoryPresentation.showBackgroundError && (
            <AdminAsyncNotice kind="error" onRetry={() => void categoryQuery.refetch()} />
          )}
          {categoryPresentation.showRefreshing && !categoryPresentation.showBackgroundError && (
            <AdminAsyncNotice kind="refreshing" />
          )}
          {categories !== undefined && categories.length === 0 && (
            <p role="status" className="text-xs text-on-surface-variant">
              Chưa có danh mục. Hãy tạo danh mục trước khi lưu kịch bản.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor={`${categoryId}-difficulty`} className="block text-sm font-medium text-on-surface">
              Độ khó
            </label>
            <select
              id={`${categoryId}-difficulty`}
              {...register('difficulty')}
              disabled={isPending}
              className="min-h-11 w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-sm text-on-surface shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-container-low"
            >
              <option value="Beginner">Cơ bản</option>
              <option value="Intermediate">Trung cấp</option>
              <option value="Advanced">Nâng cao</option>
            </select>
          </div>
          <AdminTextField
            label="Năng lực (competency)"
            placeholder="Ví dụ: Technical"
            disabled={isPending}
            error={errors.competency?.message}
            {...register('competency')}
          />
          <AdminTextField
            label="Thời lượng (phút)"
            type="number"
            min={1}
            disabled={isPending}
            error={errors.estimatedMinutes?.message}
            {...register('estimatedMinutes')}
          />
        </div>

        <AdminTextField
          label="Tóm tắt"
          disabled={isPending}
          error={errors.summary?.message}
          {...register('summary')}
        />

        <div className="space-y-1.5">
          <label htmlFor={`${categoryId}-content`} className="block text-sm font-medium text-on-surface">
            Nội dung chi tiết
          </label>
          <textarea
            id={`${categoryId}-content`}
            {...register('content')}
            disabled={isPending}
            aria-invalid={errors.content ? 'true' : undefined}
            aria-describedby={errors.content ? `${categoryErrorId}-content` : undefined}
            rows={6}
            placeholder="Nhập nội dung kịch bản…"
            className="w-full resize-y rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-sm text-on-surface shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-container-low"
          />
          {errors.content && (
            <p id={`${categoryErrorId}-content`} className="text-xs text-error">
              {errors.content.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant/50 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeIfIdle} disabled={isPending}>
            Hủy
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={isPending || categories === undefined || categories.length === 0}
          >
            Lưu kịch bản
          </Button>
        </div>
      </form>
    </Modal>
  );
}
