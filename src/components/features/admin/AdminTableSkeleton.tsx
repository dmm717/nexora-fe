import { Skeleton } from '@/components/ui/Skeleton';
import { AdminTableShell } from './AdminTableShell';

interface AdminTableSkeletonProps {
  headers: string[];
  rows?: number;
  minWidthClass?: string;
  statusLabel?: string;
}

export function AdminTableSkeleton({
  headers,
  rows = 5,
  minWidthClass,
  statusLabel = 'Đang tải dữ liệu',
}: AdminTableSkeletonProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={statusLabel}>
      <AdminTableShell minWidthClass={minWidthClass}>
        <thead className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} className="border-b border-outline-variant/50 last:border-b-0">
              {headers.map((header, column) => (
                <td key={header} className="px-4 py-4">
                  <Skeleton className={`h-4 ${column === 0 ? 'w-3/4' : 'w-2/3'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </AdminTableShell>
    </div>
  );
}
