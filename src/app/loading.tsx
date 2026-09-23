export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[calc(100vh-10rem)] w-full px-4 py-12"
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        <div
          aria-hidden="true"
          className="functional-spinner w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full flex-shrink-0"
        />
        <p className="text-xs font-medium text-on-surface-variant tracking-wide">
          Đang tải dữ liệu...
        </p>
      </div>
      <span className="sr-only">Đang tải trang...</span>
    </div>
  );
}


