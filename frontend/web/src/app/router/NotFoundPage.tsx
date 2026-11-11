import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-serif text-4xl font-semibold text-ink">404</p>
      <p className="max-w-[46ch] text-sm text-slate">
        Trang bạn tìm không tồn tại hoặc đã được chuyển đi nơi khác.
      </p>
      <Link
        to="/"
        className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-chalk-deep"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
