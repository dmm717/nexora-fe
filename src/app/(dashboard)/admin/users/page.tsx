'use client';

import { useRef, useState } from 'react';
import { AdminUserView } from '@/services/adminApi';
import { useAdminUsers } from '@/hooks/queries/useAdminUsers';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminPageShell } from '@/components/features/admin/AdminPageShell';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminTableShell } from '@/components/features/admin/AdminTableShell';
import { AdminTableSkeleton } from '@/components/features/admin/AdminTableSkeleton';
import { UserRolesModal } from '@/components/features/admin/users/UserRolesModal';
import { UserStatusModal } from '@/components/features/admin/users/UserStatusModal';
import { UserDetailModal } from '@/components/features/admin/users/UserDetailModal';
import { getQueryPresentation } from '@/utils/queryPresentation';

const USER_TABLE_HEADERS = ['Email', 'Tên', 'Quyền', 'Gói cước', 'Trạng thái', 'Thao tác'];

export default function AdminUsersPage() {
  // Keep the cursor stack as the source of truth for back navigation.
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const cursorActionLock = useRef(false);
  const currentCursor = cursorStack.at(-1);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useAdminUsers(currentCursor);
  const hasCurrentPageData = data !== undefined && !isPlaceholderData;
  const presentation = getQueryPresentation({
    hasData: hasCurrentPageData,
    isLoading,
    isError,
    isFetching,
  });
  const users = data?.users ?? [];
  const hasNextPage = hasCurrentPageData && Boolean(data?.lastId);
  const pageNumber = cursorStack.length + 1;

  const [selectedUserForRoles, setSelectedUserForRoles] = useState<AdminUserView | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUserView | null>(null);
  const [selectedUserIdForDetails, setSelectedUserIdForDetails] = useState<string | null>(null);

  const handleNext = () => {
    if (cursorActionLock.current || isFetching || isPlaceholderData || !data?.lastId) return;
    cursorActionLock.current = true;
    window.setTimeout(() => { cursorActionLock.current = false; }, 0);
    setCursorStack((stack) => [...stack, data.lastId!]);
  };

  const handlePrevious = () => {
    if (cursorActionLock.current || isFetching || cursorStack.length === 0) return;
    cursorActionLock.current = true;
    window.setTimeout(() => { cursorActionLock.current = false; }, 0);
    setCursorStack((stack) => stack.slice(0, -1));
  };

  const retry = () => {
    void refetch();
  };

  return (
    <AdminPageShell
      active="users"
      actions={(
        <Button type="button" variant="outline" onClick={retry} disabled={isFetching} loading={isFetching}>
          Làm mới danh sách
        </Button>
      )}
    >
      {presentation.showBackgroundError && (
        <AdminAsyncNotice kind="error" onRetry={retry} className="mb-4" />
      )}
      {presentation.showRefreshing && !presentation.showBackgroundError && !isPlaceholderData && (
        <AdminAsyncNotice kind="refreshing" className="mb-2" />
      )}

      {presentation.showBlockingError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error/30 bg-error-container/30 p-5 text-sm text-on-surface sm:flex-row sm:items-center sm:justify-between">
          <p className="text-on-surface-variant">Không thể tải danh sách người dùng. Vui lòng thử lại.</p>
          <Button type="button" variant="outline" onClick={retry} loading={isFetching}>
            Thử lại
          </Button>
        </div>
      )}

      {presentation.showInitialLoading && !isPlaceholderData && (
        <AdminTableSkeleton
          headers={USER_TABLE_HEADERS}
          rows={6}
          minWidthClass="min-w-[900px]"
          statusLabel="Đang tải danh sách người dùng"
        />
      )}

      {isPlaceholderData && (
        <p role="status" aria-live="polite" className="mb-2 text-xs font-medium text-on-surface-variant">
          Đang chuyển sang trang {pageNumber}. Kết quả đang hiển thị tạm thời thuộc trang trước
          {users.length > 0 ? '; thao tác trên hàng đang tạm khóa.' : '.'}
        </p>
      )}

      {(hasCurrentPageData && users.length === 0) && (
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low px-5 py-10 text-center">
          <p className="font-semibold text-on-surface">Chưa có người dùng</p>
          <p className="mt-1 text-sm text-on-surface-variant">Danh sách hiện chưa có người dùng ở trang này.</p>
        </div>
      )}

      {(hasCurrentPageData || isPlaceholderData) && users.length > 0 && (
        <div aria-busy={isFetching || isPlaceholderData}>
          <AdminTableShell minWidthClass="min-w-[900px]">
              <caption className="sr-only">Danh sách người dùng quản trị</caption>
              <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                <tr>
                  {USER_TABLE_HEADERS.map((header) => (
                    <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant/50 last:border-b-0 hover:bg-surface-container-low/70">
                    <td className="px-4 py-4 font-medium text-on-surface">{user.email}</td>
                    <td className="px-4 py-4 text-on-surface-variant">{user.displayName || '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(user.roles || []).length > 0
                          ? user.roles.map((role) => <Badge key={role} variant="primary" size="sm">{role}</Badge>)
                          : <span className="text-on-surface-variant">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-primary">
                      {user.currentPlanCode ? user.currentPlanCode.toUpperCase() : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={user.active ? 'success' : 'error'} size="sm">
                        {user.active ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPlaceholderData}
                          onClick={() => setSelectedUserForRoles(user)}
                        >
                          Sửa quyền
                        </Button>
                        <Button
                          type="button"
                          variant={user.active ? 'danger' : 'outline'}
                          size="sm"
                          disabled={isPlaceholderData}
                          onClick={() => setSelectedUserForStatus(user)}
                        >
                          {user.active ? 'Khóa' : 'Mở khóa'}
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={isPlaceholderData}
                          onClick={() => setSelectedUserIdForDetails(user.id)}
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </AdminTableShell>
        </div>
      )}

      {(hasCurrentPageData || isPlaceholderData || cursorStack.length > 0) && (
        <nav aria-label="Phân trang người dùng" className="mt-4 flex flex-col gap-3 rounded-xl border border-outline-variant/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-on-surface-variant">
              Trang {pageNumber}
              {isPlaceholderData && <span className="ml-2 text-xs">(đang chuyển trang)</span>}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={cursorStack.length === 0 || isFetching}
              >
                ← Trang trước
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleNext}
                disabled={!hasNextPage || isFetching || isPlaceholderData}
              >
                Trang sau →
              </Button>
            </div>
        </nav>
      )}

      <UserRolesModal
        isOpen={!!selectedUserForRoles}
        onClose={() => setSelectedUserForRoles(null)}
        user={selectedUserForRoles}
      />
      <UserStatusModal
        isOpen={!!selectedUserForStatus}
        onClose={() => setSelectedUserForStatus(null)}
        user={selectedUserForStatus}
      />
      <UserDetailModal
        isOpen={!!selectedUserIdForDetails}
        onClose={() => setSelectedUserIdForDetails(null)}
        userId={selectedUserIdForDetails}
      />
    </AdminPageShell>
  );
}
