# AGENTS.md — frontend/mobile (Flutter)

Hướng dẫn cho AI agent khi sửa code trong `frontend/mobile`.

## Bối cảnh

Ứng dụng Flutter (Android) cho hệ thống quản lý thi trắc nghiệm. Dùng chung
backend Spring Boot với `frontend/web` (React). Đặc tả API: `../../API_SPEC.md`.

## Phạm vi ứng dụng — CHỈ PAPER EXAM

App mobile **chỉ phục vụ luồng đề giấy & OMR** cho **TEACHER / ADMIN**:

- Tạo đề giấy (chọn môn → cấu hình chương → sinh đề + phiếu OMR).
- Xem đáp án của đề giấy.
- Tải PDF đề giấy và PDF phiếu trả lời OMR.
- Quét phiếu OMR bằng camera hoặc chọn ảnh từ thư viện.
- Xem lịch sử quét và chi tiết kết quả chấm từng câu.

**Không** có trong app: thi online, làm bài, ngân hàng câu hỏi, quản lý kỳ
thi, quản lý môn học/chương, quản lý tài khoản, kết quả online. Những phần
đó thuộc `frontend/web`.

Học sinh (`STUDENT`) **không được dùng app** — bị chặn ngay khi đăng nhập
(`AuthViewModel`) với thông báo "Ứng dụng này dành cho giáo viên và quản trị
viên.". Backend cũng đã chặn `STUDENT` khỏi toàn bộ `/paper-exams/**`.

## Toolchain

- Flutter SDK: `C:\dev\flutter` (3.50.0, stable). Android SDK: `C:\dev\android-sdk`.
- Java 21: `C:\Program Files\Java\jdk-21` (biến `JAVA_HOME`).
- Android licenses đã được accept → `flutter doctor` báo **No issues found!**.
  Nếu lại báo "licenses not accepted", chạy:
  `sdkmanager.bat --licenses` rồi nhập `y` liên tục.

## Lệnh thường dùng

```bash
flutter pub get
flutter analyze           # phải không có error
flutter test
flutter build apk --debug
```

## Kiến trúc — 3 tầng, không được lấy cắt

```
ui/        ← View (Widget) + ViewModel (ChangeNotifier). KHÔNG gọi API trực tiếp.
domain/    ← Model + UseCase. Không phụ thuộc Flutter, không phụ thuộc HTTP.
data/      ← Repository (gọi API, map DTO→model) + Service (hạ tầng).
```

Luồng chuẩn:

```
Widget → ViewModel → Repository → ApiClient → Dio
                     ↓
                 UseCase (logic thuần)
```

### Quy tắc bắt buộc

1. **View không gọi Dio/Repository trực tiếp.** Widget chỉ đọc state từ
   ViewModel và gọi method của nó.
2. **ViewModel là `ChangeNotifier`**, cấp phát trong `initState` của
   `StatefulWidget` và `dispose()` trong `dispose()`.
3. **Repository là lớp duy nhất biết endpoint.** Đổi API → sửa repository,
   không đụng UI.
4. **Domain không import Flutter** (trừ `meta` cho `@immutable`).
5. **UseCase là hàm thuần** — dễ test, không cần mock.

## Hai điều phải nhớ (sai là hỏng tính năng)

### 1. Cookie + CSRF, không Bearer

- Cookie `EXAMSESSION` (HttpOnly) + cookie `XSRF-TOKEN` (đọc được).
- `ApiClient` tự gắn header `X-XSRF-TOKEN` cho method ghi — **không** tự thêm
  header này ở nơi khác.
- `401` → `onUnauthorized` → `AuthViewModel.handleUnauthorized()`.
  `403` → chỉ hiện message, **không** logout.
- Cookie jar phải **persist** (`PersistCookieJar`) — nếu dùng `CookieJar()` in
  memory thì kill app là mất phiên.

### 2. Ảnh phiếu OMR — mỗi ảnh là một trang

`POST /paper-exams/{id}/scan` nhận nhiều file cùng tên part `images`
(số nhiều, không phải `image`). Gửi sai tên part sẽ bị `400` vì thiếu param
bắt buộc. Backend tự ghép các trang bằng `questionIndex` toàn cục nên thứ tự
ảnh không quan trọng.

## Đặc tả response cần nhớ

| Endpoint | Bắt buộc |
|---|---|
| `GET /subjects` | Trả **mảng phẳng** |
| `GET /subjects/{id}` | Kèm `chapters[].questionCount` — dùng để chặn vượt sức chứa |
| `POST /auth/login` | Trả `{ user: {...} }`, không phải user trực tiếp |
| `POST /paper-exams` | Trả `200` (không phải `201`) |
| `GET /paper-exams/{id}/answers` | `questions[].orderIndex` là **1-based**; `answers[].orderIndex` là **1-based** (1 = A) |
| `GET /paper-exams/{id}/answers` | Dùng **`answerId`** làm định danh ổn định (không phải `id` snapshot) |

## Ngôn ngữ

- **UI copy, thông báo lỗi, label, nút**: tiếng Việt, có dấu, viết hoa chữ cái
  đầu câu, không dùng ngôn ngữ thật lộ.
- **Tên biến, hàm, comment**: tiếng Anh.
- Comment giải thích *tại sao*, không chú thích *cái gì*.
- Message lỗi từ backend hiển thị **nguyên văn** khi có thể.

## Flutter 3.50 — Material đã tách package

Import Material bằng `package:material_ui/material_ui.dart`, **không** phải
`package:flutter/material.dart` (đã deprecated).

Hệ quả: `TextTheme` của `material_ui` **khác kiểu** với `TextTheme` của
`flutter/material.dart`. Không dùng `.copyWith()` trên cả `TextTheme` trả về từ
`google_fonts` — hãy dựng `TextTheme` từng field như `AppTypography.textTheme`
đang làm.

## Design system

- Token màu: `lib/app/theme/app_colors.dart` (giữ nguyên palette web).
- Khoảng cách: `lib/app/theme/app_spacing.dart` — dùng hằng số có tên, không
  magic number.
- Touch target tối thiểu 48dp → `AppSpacing.minTouchTarget`.
- Bo góc cố ý **không đồng nhất** (`AppRadius.sm/md/lg/card`) để tránh cảm
  giác "card kit".

## Responsive

Dùng `LayoutBuilder` + `MediaQuery.sizeOf` — quyết định theo **không gian sẵn
có**, không theo loại thiết bị. Breakpoint: `AppBreakpoints.railMinWidth = 600`.

Nội dung dùng `ConstrainedBox(maxWidth: AppSpacing.contentMaxWidth)` để chữ
không giãn quá dài trên tablet.

## Test

- Unit test cho UseCase (logic thuần) — `test/`.
- Widget test khi cần kiểm tra layout/behavior.
- Không test network thật; mock `ApiClient` hoặc test tầng domain.

## Gotcha đã gặp

| Vấn đề | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Could not close incremental caches` | Kotlin incremental cache hỏng trên Windows | Đã tắt `kotlin.incremental=false` trong `gradle.properties`; nếu vẫn lỗi thì xoá `frontend/mobile/build/<module>/kotlin` rồi build lại |
| `persist_cookie_jar` không tồn tại | Package không có trên pub.dev | Dùng `PersistCookieJar` của `cookie_jar` |
| `Cookie(name, value, path)` lỗi | `path` là positional của `Cookie` constructor, không phải named | `Cookie(name, value)` |
| `CookieManager(jar, cookieJar: jar)` lỗi | `cookieJar` không phải named param | `CookieManager(jar)` |
| `loadForRequest` bất đồng bộ | Trả `Future<List<Cookie>>` | Cache token qua `refreshCsrfToken()` |
| `TextTheme` type mismatch | `material_ui` vs `flutter/material.dart` | Dựng `TextTheme` từng field |
| `prefer_initializing_formals` báo sai | Dart không cho phép named param bắt đầu bằng `_` | Đã tắt lint trong `analysis_options.yaml` |
| Mọi request fail với `CookieManagerLoadException: FileSystemException: Creation failed, path = 'Directory: ''` | `FileStorage` của `cookie_jar` nhận **thư mục**, không phải đường dẫn file; truyền `'$dir/cookies.json'` khiến package cố tạo thư mục con bên trong "file" | `FileStorage(dir.path)` với `dir` là `Directory` từ `getApplicationSupportDirectory()` |
| CSRF token không được gửi header | Cookie được lưu theo host nên `loadForRequest` với host giả không tìm thấy `XSRF-TOKEN` | Đọc cookie theo origin thật của API (`SessionCookieManager.create(baseUrl: ...)`) |
| `ProviderNotFoundException: Provider<PaperExamRepository>` | Repository đăng ký trong `get_it` nhưng View đọc bằng `context.read<T>()` | Expose từng repository/use case qua `Provider<T>.value` trong `main.dart` |
| App báo lỗi chung chung "Đã có lỗi xảy ra" | `DioException` không rõ loại | `ApiClient` đã log `error.type` và map timeout / connectionError / badCertificate sang message riêng |
