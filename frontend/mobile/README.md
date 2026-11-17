# Phòng Thi — Flutter (Android)

Ứng dụng mobile cho **Hệ thống Quản lý Thi Trắc nghiệm**, viết bằng Flutter, nhắm
Android. Đây là sản phẩm anh em với `frontend/web` (React) — dùng chung backend
Spring Boot tại `/api/v1` và chung design system "Phòng thi".

## Phạm vi: chỉ Paper Exam

App mobile **chỉ phục vụ luồng đề giấy & OMR** cho **giáo viên và quản trị
viên**:

- Tạo đề giấy (chọn môn → cấu hình chương → sinh đề kèm phiếu trả lời OMR).
- Xem đáp án của đề giấy.
- Tải PDF đề giấy và PDF phiếu trả lời OMR.
- Quét phiếu OMR bằng camera hoặc chọn ảnh từ thư viện.
- Xem lịch sử quét và chi tiết kết quả chấm từng câu.

Học sinh không dùng được app — bị chặn ngay khi đăng nhập. Các chức năng thi
online, ngân hàng câu hỏi, quản lý kỳ thi, môn học, tài khoản và xem kết quả
online nằm ở `frontend/web`.

## Bắt đầu nhanh

```bash
# 1. Cài dependencies
flutter pub get

# 2. Chạy trên emulator (backend ở localhost của máy host)
flutter run

# 3. Chạy trên máy thật trong cùng mạng LAN
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8080/api/v1

# 4. Build APK
flutter build apk --release
```

> **Lưu ý về base URL**
> - Android emulator: `http://10.0.2.2:8080/api/v1` (mặc định trong `AppConfig`).
>   `10.0.2.2` là alias của host loopback trong emulator.
> - Máy thật: dùng IP LAN của máy đang chạy backend.
> - Backend phải whitelist origin — `frontend/web` dùng `localhost:5173`, mobile
>   không dùng CORS preflight giống web nên chỉ cần backend chấp nhận origin.

## Cấu trúc thư mục

```
lib/
├── app/                    # Tầng app: theme, router, DI, config
│   ├── app_config.dart     # Base URL
│   ├── di.dart             # get_it — Service → Repository → Use Case
│   ├── guards.dart         # Route guard (chỉ staff)
│   ├── router.dart         # go_router + ShellRoute
│   ├── navigation_destinations.dart
│   ├── shell/app_shell.dart  # Responsive: NavigationBar ↔ NavigationRail
│   └── theme/              # Design system "Phòng thi"
├── data/                   # Tầng data
│   ├── repositories/       # Gọi API, map DTO → domain model
│   └── services/           # ApiClient, cookie jar, connectivity
├── domain/                 # Tầng domain — không phụ thuộc Flutter
│   ├── models/             # AppUser, PaperExam, Subject
│   └── use_cases/          # PaperExamConfigValidator
└── ui/                     # Tầng UI
    ├── core/               # Widget dùng chung (AppCard, dialogs, state views…)
    └── features/<feature>/
        ├── view_models/    # ChangeNotifier (MVVM)
        └── views/          # Widget
```

Feature hiện có: `auth` (đăng nhập, hồ sơ) và `paper_exams` (đề giấy + OMR).

## Hai điều phải nhớ

### 1. Xác thực bằng cookie + CSRF, không phải Bearer

Backend dùng cookie phiên `EXAMSESSION` (HttpOnly) và cookie `XSRF-TOKEN` (đọc
được). `ApiClient` tự động:

- Gắn cookie qua `CookieManager` interceptor (`dio_cookie_manager`).
- Gắn header `X-XSRF-TOKEN` cho `POST` / `PUT` / `DELETE` / `PATCH`.
- Cookie được **persist** xuống đĩa (`PersistCookieJar`) → kill app rồi mở lại
  vẫn còn phiên.

`401` → gọi `AuthViewModel.handleUnauthorized()` → về màn đăng nhập.
`403` → **không** logout, chỉ hiện message.

Học sinh đăng nhập sẽ bị `AuthViewModel` logout ngay và hiện thông báo
"Ứng dụng này dành cho giáo viên và quản trị viên.".

### 2. Ảnh phiếu OMR — mỗi ảnh là một trang

`POST /paper-exams/{id}/scan` nhận nhiều file cùng tên part `images` (số nhiều).
Gửi sai tên part sẽ bị `400` vì thiếu param bắt buộc. Backend tự ghép các
trang bằng `questionIndex` toàn cục nên thứ tự ảnh không quan trọng.

## Design system "Phòng thi"

Giữ nguyên bảng màu của web để hai sản phẩm cùng một ngôn ngữ thị giác:

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `paper` | `#F4F6F9` | `#10151D` | Nền |
| `ink` | `#131C2B` | `#E8ECF2` | Chữ chính |
| `slate` | `#5A6478` | `#9AA5B8` | Chữ phụ |
| `chalk` | `#2B5F8A` | `#6BA3D2` | Hành động chính |
| `pen` | `#B4232A` | `#E2686E` | Cảnh báo / sai |
| `jade` | `#1F7A5C` | `#46B48C` | Đúng / hoàn thành |

Font: **Be Vietnam Pro** cho UI, **Noto Serif** cho nội dung câu hỏi (cảm giác
đề giấy). Số liệu dùng `FontFeature.tabularFigures()`.

Đọc `lib/app/theme/`.

## Accessibility (theo `ui-ux-pro-max`)

- Touch target tối thiểu **48dp** — dùng hằng số `AppSpacing.minTouchTarget`.
- Đối tượng tương tác có `tooltip` khi chỉ có icon.
- Contrast đạt WCAG AA cho cả light và dark.
- Tôn trọng `MediaQuery.disableAnimations` của hệ điều hành.
- `SafeArea` bao quanh mọi màn hình; `LayoutBuilder` để adapt theo **không gian
  sẵn có** chứ không phải loại thiết bị.

## Testing

```bash
flutter test              # unit test
flutter analyze           # static analysis
```

Test hiện có phủ logic validate cấu hình chương của đề giấy
(`PaperExamConfigValidator`).

## Tài liệu liên quan

- `PLAN.md` — lộ trình triển khai theo phase.
- `AGENTS.md` — hướng dẫn cho AI agent khi sửa code trong thư mục này.
- `../../API_SPEC.md` — đặc tả API backend.
- `../../PROJECT_SPECIFICATION.md` — nghiệp vụ.
