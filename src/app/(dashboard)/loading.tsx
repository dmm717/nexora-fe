export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
    >
      <div className="flex flex-col items-center justify-center min-h-[40vh] py-16 text-center">
        <div
          aria-hidden="true"
          className="functional-spinner w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full flex-shrink-0 mb-3"
        />
        <p className="text-xs font-medium text-on-surface-variant tracking-wide">
          Đang tải dữ liệu bảng điều khiển...
        </p>
      </div>
      <span className="sr-only">Đang tải nội dung...</span>
    </div>
  );
}
