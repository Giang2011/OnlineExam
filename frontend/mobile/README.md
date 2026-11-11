# frontend/mobile — placeholder

Thư mục này **chưa có mã nguồn**. Nó được tạo để giữ chỗ cho ứng dụng mobile sẽ làm sau.

## Tại sao để trống

- `frontend/web` và `frontend/mobile` là hai sản phẩm **độc lập**, dùng chung backend (`http://localhost:8080/api/v1`) nhưng **không** dùng chung công nghệ, không dùng chung mã nguồn.
- Quyết định stack cho mobile (React Native / Flutter / native…) chưa được chốt — sẽ cần một plan riêng.
- Không dựng sẵn toolchain để tránh có dependency chết trong repo.

## Hợp đồng API (áp dụng khi bắt đầu)

- Base URL: `http://localhost:8080/api/v1`.
- Xác thực bằng **cookie phiên `EXAMSESSION`** (HttpOnly) + **CSRF cookie `XSRF-TOKEN`** → header `X-XSRF-TOKEN` cho method ghi.
- Không dùng Bearer/JWT.
- Nguồn sự thật về thời gian là server: `serverTime`, `remainingSeconds`, `deadlineAt`.
- `401` = chưa xác thực → đăng nhập lại. `403` = không đủ quyền → thông báo, không đăng xuất.
- Đặc tả chi tiết: `API_SPEC.md` ở gốc repo.

## Trước khi bắt đầu

Cần một plan riêng (tương tự `frontend/web/PLAN.md`) trả lời:

1. Stack nào, có dùng chung `shared/` hay không?
2. Có cần OMR camera scan trên thiết bị không (quét phiếu giấy bằng camera)?
3. Offline/autosave thế nào khi mạng yếu?
4. Phạm vi MVP: làm bài, xem điểm, hay cả quản lý?

---

Xem `frontend/web/AGENTS.md` và `frontend/web/PLAN.md` cho phần web.
