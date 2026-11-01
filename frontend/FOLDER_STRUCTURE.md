# Frontend Folder Structure

Tài liệu này mô tả cấu trúc thư mục mục tiêu của `frontend` sau refactor theo mô hình `feature-based + shared/common`.

---

## 1. Mục tiêu của cấu trúc

- tách rõ ràng theo nghiệp vụ
- giảm phụ thuộc chéo giữa các màn hình
- dễ mở rộng thêm module mới
- dễ tái sử dụng component và helper chung
- phù hợp cho cả developer lẫn agent đọc và tiếp tục phát triển

---

## 2. Cấu trúc thư mục hiện tại đã chuẩn bị

```text
frontend/
├─ src/
│  ├─ app/
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ admin/
│  │  └─ student/
│  ├─ shared/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ layouts/
│  │  ├─ lib/
│  │  ├─ styles/
│  │  ├─ types/
│  │  └─ utils/
│  ├─ pages/          # legacy, sẽ dọn dần
│  ├─ layouts/        # legacy, sẽ dọn dần
│  └─ components/     # legacy, sẽ dọn dần
```

---

## 3. Vai trò của từng folder

### `src/app`
Chứa phần kết nối toàn bộ ứng dụng.

Nên có:
- cấu hình router
- route guards
- providers
- app bootstrap
- global config

### `src/features/auth`
Chứa toàn bộ logic liên quan đến xác thực.

Ví dụ:
- login page
- auth api
- auth hooks
- auth types
- logout/session handling

### `src/features/admin`
Chứa các chức năng dành cho ADMIN và TEACHER.

Ví dụ:
- user management
- subject/chapter management
- question management
- exam management
- participant management
- reports
- profile

### `src/features/student`
Chứa các chức năng dành cho STUDENT.

Ví dụ:
- exam list
- exam detail
- exam interface
- my results
- result detail
- student profile

### `src/shared`
Chứa phần dùng chung cho nhiều feature.

#### `shared/components`
Component tái sử dụng như:
- button
- modal
- select
- table
- input
- loader
- toast wrappers

#### `shared/hooks`
Hook dùng chung như:
- `useDebounce`
- `useLocalStorage`
- `useOnlineStatus`

#### `shared/layouts`
Layout dùng chung như:
- auth layout
- admin shell
- student shell
- main layout

#### `shared/lib`
Các helper hạ tầng như:
- axios client
- rbac helper
- storage helper
- formatter helper

#### `shared/types`
Type chung toàn app:
- `Role`
- `ApiResponse`
- `Pagination`
- `AuthUser`

#### `shared/utils`
Hàm tiện ích thuần như:
- format date
- build url
- map label/value
- validation helper

---

## 4. Quy ước đặt file

- `Page` component nằm trong `pages/`
- component tái sử dụng nằm trong `components/`
- logic side-effect nằm trong `hooks/`
- API request nằm trong `api/`
- domain type nằm trong `types/`
- helper thuần nằm trong `utils/`

---

## 5. Quy tắc phân chia

### Khi nào đặt vào `shared`?
Đặt vào `shared` nếu:
- được dùng bởi nhiều feature
- không chứa business logic đặc thù
- có thể tái dùng mà không phụ thuộc domain

### Khi nào đặt vào `feature`?
Đặt vào feature nếu:
- chỉ phục vụ một domain duy nhất
- chứa nghiệp vụ riêng
- có state/logic gắn với một workflow cụ thể

---

## 6. Legacy folders

Hiện các folder legacy đã được dọn gần hết. Các thư mục sau vẫn có thể được giữ lại như lớp tương thích tạm thời nếu cần:
- `src/pages`
- `src/layouts`
- `src/components`
- `src/api`

Kế hoạch hiện tại là chỉ giữ lại những file thật sự còn được import, còn lại sẽ xoá dần để tránh trùng lặp và nhầm lẫn khi phát triển tiếp.

---

## 7. Mapping gợi ý cho code hiện tại

- `src/pages/auth/Login.tsx` -> `src/features/auth/pages/Login.tsx`
- `src/pages/admin/*` -> `src/features/admin/pages/*`
- `src/pages/student/*` -> `src/features/student/pages/*`
- `src/layouts/*` -> `src/shared/layouts/*`
- `src/components/*` -> `src/shared/components/*` hoặc feature-specific components
- `src/api/*` -> `src/features/*/api/*` hoặc `src/shared/lib/*`

---

## 8. Trạng thái thực thi

Cấu trúc folder đã được tạo sẵn để bắt đầu chuyển code theo từng feature.

Bước tiếp theo nên làm theo thứ tự:
1. tách shared utilities
2. chuyển auth
3. chuyển admin
4. chuyển student
5. cập nhật route imports
6. xoá legacy folder sau khi hoàn tất
