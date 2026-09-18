import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Modal } from '@/components/ui/Modal';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminTableShell } from '@/components/features/admin/AdminTableShell';
import { AdminTableSkeleton } from '@/components/features/admin/AdminTableSkeleton';
import { useAdminScenarioCategories } from '@/hooks/queries/useAdminScenarios';
import { AdminScenarioCategoryView } from '@/services/adminApi';
import { getQueryPresentation } from '@/utils/queryPresentation';
import { CategoryModal } from './CategoryModal';

interface CategoryListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryHeaders = ['Mã danh mục', 'Tên', 'Mô tả', 'Trạng thái', 'Thao tác'];

export function CategoryListModal({ isOpen, onClose }: CategoryListModalProps) {
  const categoriesQuery = useAdminScenarioCategories();
  const categories = categoriesQuery.data;
  const presentation = getQueryPresentation({
    hasData: categories !== undefined,
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    isFetching: categoriesQuery.isFetching,
  });
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminScenarioCategoryView | null>(null);

  const openCreate = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const openEdit = (category: AdminScenarioCategoryView) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isCategoryModalOpen}
        onClose={onClose}
        title="Danh mục kịch bản"
        description="Danh mục giúp nhóm các kịch bản luyện tập."
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate}>+ Tạo danh mục</Button>
          </div>

          {presentation.showInitialLoading && (
            <div aria-label="Đang tải danh mục" aria-busy="true">
              <AdminTableSkeleton headers={categoryHeaders} rows={4} minWidthClass="min-w-[760px]" />
            </div>
          )}

          {presentation.showBlockingError && (
            <Alert
              variant="error"
              title="Không thể tải danh mục"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void categoriesQuery.refetch()}
                >
                  Thử lại
                </Button>
              }
            >
              Chưa có dữ liệu danh mục để hiển thị. Bạn vẫn có thể thử tạo danh mục mới.
            </Alert>
          )}

          {presentation.showRefreshing && !presentation.showBackgroundError && (
            <AdminAsyncNotice kind="refreshing" />
          )}
          {presentation.showBackgroundError && (
            <AdminAsyncNotice kind="error" onRetry={() => void categoriesQuery.refetch()} />
          )}

          {categories !== undefined && categories.length === 0 && (
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-5 py-8 text-center">
              <h3 className="font-semibold text-on-surface">Chưa có danh mục</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tạo danh mục trước khi thêm kịch bản mới.
              </p>
              <Button className="mt-4" onClick={openCreate}>
                Tạo danh mục
              </Button>
            </div>
          )}

          {categories !== undefined && categories.length > 0 && (
            <AdminTableShell minWidthClass="min-w-[760px]">
              <caption className="sr-only">Các danh mục kịch bản đã thiết lập</caption>
              <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                <tr>
                  {categoryHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide ${header === 'Thao tác' ? 'text-right' : ''}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-outline-variant/50 last:border-b-0 hover:bg-surface-container-low/50"
                  >
                    <th scope="row" className="px-3 py-3 text-left text-xs font-medium text-on-surface-variant">
                      <span className="break-all">{category.slug}</span>
                    </th>
                    <td className="px-3 py-3 text-sm font-semibold text-on-surface">{category.name}</td>
                    <td className="max-w-xs px-3 py-3 text-sm text-on-surface-variant">
                      {category.description || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          category.isActive
                            ? 'bg-secondary-container/60 text-on-secondary-container'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {category.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(category)}>
                        Sửa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableShell>
          )}
        </div>
      </Modal>

      <CategoryModal
        isOpen={isOpen && isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        editingCategory={editingCategory}
      />
    </>
  );
}
