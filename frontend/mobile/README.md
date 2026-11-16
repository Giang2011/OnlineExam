# Phòng Thi — Flutter (Android)

Ứng dụng mobile cho **Hệ thống Quản lý Thi Trắc nghiệm**, viết bằng Flutter, nhắm
Android. Đây là sản phẩm anh em với `frontend/web` (React) — dùng chung backend
Spring Boot tại `/api/v1` và chung design system "Phòng thi".

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
│   ├── app_config.dart     # Base URL, hằng số runtime
│   ├── di.dart             # get_it — Service → Repository → Use Case
│   ├── guards.dart         # Route guard theo role
│   ├── router.dart         # go_router + ShellRoute
│   ├── navigation_destinations.dart
│   ├── shell/app_shell.dart  # Responsive: NavigationBar ↔ NavigationRail
│   └── theme/              # Design system "Phòng thi"
├── data/                   # Tầng data
│   ├── models/             # (không dùng — model nằm ở domain)
│   ├── repositories/       # Gọi API, map DTO → domain model
│   └── services/           # ApiClient, cookie jar, SQLite, connectivity
├── domain/                 # Tầng domain — không phụ thuộc Flutter
│   ├── models/             # AppUser, Exam, ExamSession, Question…
│   └── use_cases/          # ChapterConfigValidator, ServerCountdown, SyncAnswers
└── ui/                     # Tầng UI
    ├── core/               # Widget dùng chung (AppCard, OmrGrid, dialogs…)
    └── features/<feature>/
        ├── view_models/    # ChangeNotifier (MVVM)
        └── views/          # Widget
```

## Ba điều phải nhớ

### 1. Xác thực bằng cookie + CSRF, không phải Bearer

Backend dùng cookie phiên `EXAMSESSION` (HttpOnly) và cookie `XSRF-TOKEN` (đọc được).
`ApiClient` tự động:

- Gắn cookie qua `CookieManager` interceptor (`dio_cookie_manager`).
- Gắn header `X-XSRF-TOKEN` cho `POST` / `PUT` / `DELETE` / `PATCH`.
- Cookie được **persist** xuống đĩa (`PersistCookieJar`) → kill app rồi mở lại
  vẫn còn phiên.

`401` → gọi `AuthViewModel.handleUnauthorized()` → về màn đăng nhập.
`403` → **không** logout, chỉ hiện message.

### 2. Đồng hồ làm bài bám theo server

Không bao giờ dùng `DateTime.now()` làm nguồn sự thật cho thời gian thi.
Server trả `serverTime`, `remainingSeconds`, `deadlineAt` trong **cùng một
response** → `(deadlineAt - serverTime)` là số giây còn lại tại thời điểm server
gửi response. `ServerCountdown` neo đồng hồ vào giá trị đó rồi trừ dần.

Xem `lib/domain/use_cases/server_countdown.dart`.

### 3. Mất mạng không được làm mất bài

Luồng ghi đáp án:

```
Chạm đáp án
  → ghi SQLite (LocalDraftStore)      ← tức thì, không phụ thuộc mạng
  → đánh dấu pending
  → nếu có mạng: PUT /sessions/{id}/answers
  → khi có mạng trở lại: tự đẩy pending
```

Xem `lib/domain/use_cases/sync_answers_use_case.dart` và
`lib/ui/features/exam_taking/view_models/exam_taking_view_model.dart`.

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
  sẵn có** chứ không theo loại thiết bị.

## Testing

```bash
flutter test              # unit test
flutter analyze           # static analysis
```

Test hiện có phủ 2 phần logic quan trọng nhất:
`ChapterConfigValidator` (validate cấu hình chương) và `ServerCountdown`
(đồng hồ bám server).

## Tài liệu liên quan

- `PLAN.md` — lộ trình triển khai theo phase.
- `AGENTS.md` — hướng dẫn cho AI agent khi sửa code trong thư mục này.
- `../../API_SPEC.md` — đặc tả API backend.
- `../../PROJECT_SPECIFICATION.md` — nghiệp vụ.
