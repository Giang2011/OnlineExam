/** Lỗi API chuẩn hoá từ response của backend. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** Lỗi do phía người dùng nhập sai (dữ liệu, quyền) — hiển thị message backend nguyên văn. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}
