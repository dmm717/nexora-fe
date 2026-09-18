'use client';

import { useState } from 'react';
import { useMutationState } from '@tanstack/react-query';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button/Button';
import { Modal } from '@/components/ui/Modal';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminPageShell } from '@/components/features/admin/AdminPageShell';
import { AdminTableShell } from '@/components/features/admin/AdminTableShell';
import { AdminTableSkeleton } from '@/components/features/admin/AdminTableSkeleton';
import {
  adminScenarioMutationKeys,
  useAdminScenarios,
  useArchiveScenario,
  usePublishScenario,
} from '@/hooks/queries/useAdminScenarios';
import { getQueryPresentation } from '@/utils/queryPresentation';
import type { AdminScenarioView } from '@/services/adminApi';
import { ScenarioModal } from '@/components/features/admin/scenarios/ScenarioModal';
import { CategoryListModal } from '@/components/features/admin/scenarios/CategoryListModal';

const scenarioHeaders = ['Kịch bản', 'Độ khó', 'Trạng thái', 'Thao tác'];

function statusPresentation(status: string) {
  if (status === 'published') {
    return { label: 'Đã đăng', className: 'bg-secondary-container/60 text-on-secondary-container' };
  }
  if (status === 'archived') {
    return { label: 'Đã lưu trữ', className: 'bg-error-container/70 text-on-error-container' };
  }
  if (status === 'draft') {
    return { label: 'Bản nháp', className: 'bg-tertiary-container/70 text-on-tertiary-container' };
  }
  return { label: status || 'Không rõ trạng thái', className: 'bg-surface-container-high text-on-surface-variant' };
}

export default function AdminScenariosPage() {
  const scenariosQuery = useAdminScenarios();
  const publishMutation = usePublishScenario();
  const archiveMutation = useArchiveScenario();
  const scenarios = scenariosQuery.data;
  const presentation = getQueryPresentation({
    hasData: scenarios !== undefined,
    isLoading: scenariosQuery.isLoading,
    isError: scenariosQuery.isError,
    isFetching: scenariosQuery.isFetching,
  });

  const pendingPublishIds = useMutationState({
    filters: { mutationKey: adminScenarioMutationKeys.publish, status: 'pending' },
    select: (mutation) => mutation.state.variables as string | undefined,
  });
  const pendingArchiveIds = useMutationState({
    filters: { mutationKey: adminScenarioMutationKeys.archive, status: 'pending' },
    select: (mutation) => mutation.state.variables as string | undefined,
  });

  const [isScenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<AdminScenarioView | null>(null);
  const [isCategoryListModalOpen, setCategoryListModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<AdminScenarioView | null>(null);

  const openCreateScenario = () => {
    setEditingScenario(null);
    setScenarioModalOpen(true);
  };

  const openEditScenario = (scenario: AdminScenarioView) => {
    setEditingScenario(scenario);
    setScenarioModalOpen(true);
  };

  const retryScenarios = () => void scenariosQuery.refetch();
  const archivePending = Boolean(
    archiveTarget && pendingArchiveIds.some((id) => id === archiveTarget.id),
  );

  return (
    <AdminPageShell
      active="scenarios"
      actions={
        <>
          <Button variant="outline" onClick={() => setCategoryListModalOpen(true)}>
            Quản lý danh mục
          </Button>
          <Button onClick={openCreateScenario}>+ Tạo kịch bản</Button>
        </>
      }
    >
      <section aria-label="Danh sách kịch bản" className="space-y-4">
        {presentation.showInitialLoading && (
          <AdminTableSkeleton
            headers={scenarioHeaders}
            rows={5}
            minWidthClass="min-w-[780px]"
            statusLabel="Đang tải danh sách kịch bản"
          />
        )}

        {presentation.showBlockingError && (
          <Alert
            variant="error"
            title="Không thể tải danh sách kịch bản"
            action={
              <Button variant="outline" size="sm" onClick={retryScenarios}>
                Thử lại
              </Button>
            }
          >
            Hãy kiểm tra kết nối hoặc quyền truy cập rồi thử lại. Chưa có dữ liệu danh sách để hiển thị.
          </Alert>
        )}

        {presentation.showRefreshing && <AdminAsyncNotice kind="refreshing" />}
        {presentation.showBackgroundError && (
          <AdminAsyncNotice kind="error" onRetry={retryScenarios} />
        )}

        {scenarios !== undefined && scenarios.length === 0 && (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-5 py-10 text-center">
            <h2 className="font-semibold text-on-surface">Chưa có kịch bản nào</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Tạo kịch bản đầu tiên để bắt đầu xây dựng thư viện luyện tập.
            </p>
            <Button className="mt-4" onClick={openCreateScenario}>
              Tạo kịch bản
            </Button>
          </div>
        )}

        {scenarios !== undefined && scenarios.length > 0 && (
          <AdminTableShell minWidthClass="min-w-[780px]">
            <caption className="sr-only">Các kịch bản hiện có trong Nexora</caption>
            <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
              <tr>
                {scenarioHeaders.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${header === 'Thao tác' ? 'text-right' : 'text-left'}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => {
                const isPublishing = pendingPublishIds.some((id) => id === scenario.id);
                const isArchiving = pendingArchiveIds.some((id) => id === scenario.id);
                const rowLocked = isPublishing || isArchiving || archiveTarget?.id === scenario.id;
                const status = statusPresentation(scenario.status);

                return (
                  <tr
                    key={scenario.id}
                    className="border-b border-outline-variant/50 last:border-b-0 hover:bg-surface-container-low/50"
                  >
                    <th scope="row" className="max-w-sm px-4 py-4 text-left align-top font-normal">
                      <span className="block font-semibold text-on-surface">{scenario.title}</span>
                      <span className="mt-1 block break-all text-xs text-on-surface-variant">
                        {scenario.slug}
                      </span>
                    </th>
                    <td className="px-4 py-4 align-top text-on-surface-variant">
                      <span className="inline-flex rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                        {scenario.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={rowLocked}
                          onClick={() => openEditScenario(scenario)}
                        >
                          Sửa
                        </Button>
                        {scenario.status === 'draft' && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={rowLocked}
                            loading={isPublishing}
                            onClick={() => publishMutation.mutate(scenario.id)}
                            aria-label={`Đăng kịch bản ${scenario.title}`}
                          >
                            Đăng
                          </Button>
                        )}
                        {scenario.status !== 'archived' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={rowLocked}
                            loading={isArchiving}
                            onClick={() => {
                              archiveMutation.reset();
                              setArchiveTarget(scenario);
                            }}
                            aria-label={`Lưu trữ kịch bản ${scenario.title}`}
                          >
                            Lưu trữ
                          </Button>
                        )}
                        {(isPublishing || isArchiving) && (
                          <span role="status" className="sr-only">
                            {isPublishing ? 'Đang đăng kịch bản' : 'Đang lưu trữ kịch bản'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableShell>
        )}
      </section>

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setScenarioModalOpen(false)}
        editingScenario={editingScenario}
      />
      <CategoryListModal
        isOpen={isCategoryListModalOpen}
        onClose={() => setCategoryListModalOpen(false)}
      />
      <Modal
        isOpen={archiveTarget !== null}
        onClose={() => {
          if (!archivePending) setArchiveTarget(null);
        }}
        title={archiveTarget ? `Lưu trữ “${archiveTarget.title}”?` : 'Lưu trữ kịch bản'}
        description="Kịch bản sẽ không còn hiển thị trong danh sách đang hoạt động."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Thao tác này không thể hoàn tác. Chỉ tiếp tục nếu bạn muốn lưu trữ kịch bản này.
          </p>
          {archiveMutation.isError && archiveMutation.variables === archiveTarget?.id && (
            <p role="alert" className="rounded-lg border border-error/25 bg-error-container/40 p-3 text-sm text-on-error-container">
              Không thể lưu trữ kịch bản. Thông tin vẫn được giữ lại để bạn có thể thử lại.
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 border-t border-outline-variant/50 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveTarget(null)}
              disabled={archivePending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={archivePending}
              disabled={!archiveTarget || archivePending}
              onClick={() => {
                if (!archiveTarget || archivePending) return;
                archiveMutation.mutate(archiveTarget.id, {
                  onSuccess: () => setArchiveTarget(null),
                });
              }}
            >
              Lưu trữ kịch bản
            </Button>
          </div>
        </div>
      </Modal>
    </AdminPageShell>
  );
}
