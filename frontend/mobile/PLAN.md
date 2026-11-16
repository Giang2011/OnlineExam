# PLAN — frontend/mobile (Flutter, Android)

Lộ trình triển khai ứng dụng mobile Flutter cho hệ thống quản lý thi trắc nghiệm.

Trạng thái: **Phase 0 – 9 đã hoàn tất** (2026-11-14).

---

## Phase 0 — Toolchain ✅

- Cài Flutter SDK 3.50.0 (`C:\dev\flutter`), Android SDK (`C:\dev\android-sdk`),
  Java 21.
- `flutter create --org vn.exams --project-name exam_mobile --platforms android,ios`.
- `pubspec.yaml` với đầy đủ dependency; `AndroidManifest.xml` khai báo
  `INTERNET`, camera, cleartext cho `10.0.2.2`; `minSdk = 24`.
- `gradle.properties`: tắt Kotlin incremental (lỗi cache trên Windows).

**Nhận biết:** Flutter 3.50 đã tách Material ra package `material_ui`
(`package:material_ui/material_ui.dart`). `TextTheme` của `material_ui` **khác
kiểu** với `TextTheme` của `flutter/material.dart` → `AppTypography.textTheme`
chuyển từng style thủ công thay vì dùng `.copyWith` trên cả theme.

## Phase 1 — Nền tảng ✅

- Design system "Phòng thi": `app_colors.dart`, `app_typography.dart`,
  `app_spacing.dart`, `app_theme.dart`.
- `ApiClient` (dio + `CookieManager` + header `X-XSRF-TOKEN` tự động).
- `SessionCookieManager` — `PersistCookieJar` lưu cookie xuống đĩa.
- `LocalDraftStore` (sqflite) — 2 bảng `draft_answers` + `pending_push`.
- `ConnectivityService` — theo dõi mạng.
- `go_router` + `AppShell` responsive (`NavigationBar` ↔ `NavigationRail` theo
  `LayoutBuilder`).
- DI bằng `get_it` (`lib/app/di.dart`).

## Phase 2 — Xác thực ✅

- `POST /auth/login` → trả `{ user: {...} }`.
- `GET /auth/me` → khôi phục phiên; 401 ở đây là **bình thường**, không báo lỗi.
- `POST /auth/logout` → xoá cookie cả server lẫn cục bộ.
- `PUT /users/me` → tự cập nhật hồ sơ (chỉ ADMIN / TEACHER).
- Route guard theo role (`lib/app/guards.dart`) — học sinh không vào được route
  giáo viên và ngược lại.

## Phase 3 — Tài khoản & Môn học ✅

- `GET/POST/PUT/DELETE /users`, `/users/students`, `/users/teachers`.
- Hiển thị username/password **một lần duy nhất** sau khi tạo học sinh.
- `GET/POST/PUT/DELETE /subjects` + `/subjects/{id}/chapters`.

## Phase 4 — Ngân hàng câu hỏi ✅

- `GET /questions` — đọc `data.content` (Spring Page), **không** phải `data`.
- Bộ lọc theo môn / chương / keyword + phân trang.
- `POST/PUT` dạng multipart: part `data` là **chuỗi JSON**, file ảnh đi kèm.
- Cờ `imageRemoved` / `questionImageRemoved` để xoá ảnh cũ.

## Phase 5 — Kỳ thi ✅

- `GET/POST/PUT/DELETE /exams`, `/exams/{id}/participants`.
- `ChapterConfigValidator` — validate tổng câu, sức chứa chương, chương lặp,
  khoảng thời gian **trước khi submit**.
- Gán thí sinh: `POST` / `DELETE /exams/{id}/participants/{userId}`.

## Phase 6 — Làm bài ✅

- `POST /sessions/start/{examId}`, `GET /sessions/active`.
- `GET /sessions/{id}/questions` — **không** có `isCorrect`.
- Đồng hồ bám server (`ServerCountdown`).
- Autosave: ghi SQLite trước → đẩy server → tự đồng bộ khi có mạng.
- Lưới OMR điều hướng nhanh giữa các câu.
- Tự nộp bài khi hết giờ.

## Phase 7 — Kết quả ✅

- `GET /results/me` — lịch sử + trung bình + điểm cao nhất.
- `GET /results/exam/{examId}` — trả **object** `{ statistics, results[] }`.
- Biểu đồ phân bố điểm (5 khoảng) dựng bằng `LinearProgressIndicator` (nhẹ hơn
  `fl_chart` cho mobile, tránh thêm dependency nặng).

## Phase 8 — Đề giấy & OMR ✅

- `GET/POST/DELETE /paper-exams`, `/paper-exams/{id}/pdf`, `/omr-sheet`.
- Quét phiếu bằng camera (`camera` plugin) → `POST /paper-exams/{id}/scan`
  multipart với nhiều file `images`.
- Kết quả quét chi tiết từng câu + tổng hợp.

## Phase 9 — Hoàn thiện ✅

- Dark mode (`ThemeMode.system`).
- Accessibility: touch target 48dp, tooltip, contrast AA, safe area.
- Unit test: `ChapterConfigValidator`, `ServerCountdown` (8 test pass).
- `flutter analyze` không còn lỗi.
- `flutter build apk --debug` thành công.
- Tài liệu: `README.md`, `AGENTS.md`, rule `mobile-flutter.mdc`.

---

## Hạng mục còn lại (không chặn release)

| Hạng mục | Mức độ | Ghi chú |
|---|---|---|
| `fl_chart` cho biểu đồ điểm | Thấp | Hiện dùng `LinearProgressIndicator` — đủ dùng, nhẹ hơn nhiều |
| Đăng nhập sinh trắc (sinh trắc học) | Thấp | Không có trong API spec hiện tại |
| Push notification (nhắc giờ thi) | Trung bình | Cần FCM, chưa có hạ tầng |
| Widget OMR điều khiển bằng chạm có thao tác kéo | Thấp | Phiếu OMR giấy không cần |
| Tích hợp `integration_test` | Trung bình | Cần emulator để chạy |
