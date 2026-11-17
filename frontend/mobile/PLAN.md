# PLAN — frontend/mobile (Flutter, Android)

Lộ trình triển khai ứng dụng mobile Flutter cho hệ thống quản lý thi trắc nghiệm.

Trạng thái: **Phase 0 – 9 đã hoàn tất** (2026-11-14), **Phase 10 — thu hẹp về
Paper Exam only** (2026-11-17).

> **Phạm vi app mobile (sau Phase 10):** chỉ phục vụ luồng đề giấy & OMR cho
> TEACHER / ADMIN. Các phần thi online, ngân hàng câu hỏi, kỳ thi, môn học,
> tài khoản và kết quả online đã **gỡ khỏi mobile** (thuộc `frontend/web`).
> Xem mục Phase 10 ở cuối file.

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

## Phase 10 — Thu hẹp về Paper Exam only ✅

(2026-11-17) — App mobile **chỉ còn** phục vụ paper exam cho TEACHER / ADMIN.

### Gỡ khỏi mobile

- Xoá hẳn các feature UI: `questions`, `exams`, `exam_taking`, `results`, `users`,
  `subjects`; widget `OmrGrid`; hàm `showNameDialog`.
- Xoá model / repository / use case / service của thi online:
  `exam.dart`, `exam_session.dart`, `exam_result.dart`, `question.dart`,
  `chapter_config_validator.dart`, `server_countdown.dart`,
  `sync_answers_use_case.dart`, `local_draft_store.dart`, `exam_repository.dart`,
  `session_repository.dart`, `user_repository.dart`, `question_repository.dart`.
- Tách `Subject` / `Chapter` ra `domain/models/subject.dart` +
  `data/repositories/subject_repository.dart` (chỉ đọc, phục vụ form đề giấy).
- Bỏ dependency không dùng: `sqflite`, `path`, `fl_chart`, `flutter_svg`,
  `share_plus`, `intl`.
- Router chỉ còn: `/login`, `/paper-exams`, `/paper-exams/new`,
  `/paper-exams/:id`, `/paper-exams/:id/scan`, `/paper-exams/scan-results/:id`,
  `/profile`. Nav chỉ còn 2 mục: **Đề giấy** + **Hồ sơ**.

### Bổ sung cho paper exam

- `PaperExamConfigValidator` — validate tổng câu, sức chứa chương, chương lặp.
- Form tạo đề giấy: thêm/bỏ chương, số câu mặc định **0**, chặn vượt sức chứa
  chương, thanh trạng thái "Tổng câu đã cấu hình: X / Y".
- Chi tiết đề giấy: tải **phiếu OMR (PDF)** kèm mã sinh viên tuỳ chọn; sửa
  off-by-one `orderIndex` (**1-based**); hiển thị chữ cái A/B/C theo
  `answer.orderIndex`; ảnh câu/đáp án; lịch sử scan bấm được.
- Màn quét OMR: thêm chọn ảnh từ thư viện (`image_picker`), cảnh báo mất mạng.
- Màn **chi tiết kết quả chấm** (`/paper-exams/scan-results/:id`) — tổng hợp điểm,
  lỗi, kết quả từng câu (đáp án tô / đáp án đúng / trạng thái / độ tin cậy).

### Phân quyền

- `AuthViewModel` chặn `STUDENT` ngay khi đăng nhập **và** khi khôi phục phiên:
  logout server + xoá cookie, hiện thông báo "Ứng dụng này dành cho giáo viên
  và quản trị viên.".

---

## Hạng mục còn lại (không chặn release)

| Hạng mục | Mức độ | Ghi chú |
|---|---|---|
| `fl_chart` cho biểu đồ điểm | Thấp | Không còn dùng — biểu đồ điểm thuộc `frontend/web` |
| Đăng nhập sinh trắc (sinh trắc học) | Thấp | Không có trong API spec hiện tại |
| Push notification (nhắc giờ thi) | Trung bình | Cần FCM, chưa có hạ tầng |
| Widget OMR điều khiển bằng chạm có thao tác kéo | Thấp | Phiếu OMR giấy không cần |
| Tích hợp `integration_test` | Trung bình | Cần emulator để chạy |
