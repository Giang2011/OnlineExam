# Frontend Overview

Tài liệu này mô tả tổng quan frontend của dự án Hệ thống Quản lý & Tổ chức Thi Trắc nghiệm Toàn diện.

Frontend là lớp giao diện phục vụ 3 nhóm người dùng chính: `ADMIN`, `TEACHER` và `STUDENT`. Ứng dụng hỗ trợ đăng nhập, quản trị nội dung thi, làm bài thi trực tuyến, xem kết quả và các chức năng điều phối liên quan.

---

## 1. Mục tiêu của frontend

- cung cấp giao diện dễ dùng, nhất quán và phản hồi nhanh
- hỗ trợ đầy đủ các luồng nghiệp vụ cho quản trị viên, giáo viên và sinh viên
- tách rõ giao diện theo từng nhóm chức năng để dễ bảo trì
- tái sử dụng tốt các component, layout và helper dùng chung
- đảm bảo trải nghiệm làm bài thi ổn định, rõ ràng và an toàn

---

## 2. Tech stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS
- React Router DOM
- Axios
- React Hot Toast
- SweetAlert2
- Lucide React

---

## 3. Các nhóm chức năng chính

### 3.1 Xác thực và phân quyền
- đăng nhập bằng `username/password`
- lưu phiên đăng nhập và trạng thái người dùng
- phân quyền theo role `ADMIN / TEACHER / STUDENT`
- bảo vệ các route theo quyền truy cập

### 3.2 Khu vực quản trị
Khu vực dành cho `ADMIN` và `TEACHER` để:
- quản lý môn học
- quản lý chương
- quản lý câu hỏi
- quản lý kỳ thi
- quản lý thí sinh / người tham gia
- xem báo cáo, thống kê và kết quả thi
- quản lý người dùng và hồ sơ cá nhân

### 3.3 Khu vực sinh viên
Khu vực dành cho `STUDENT` để:
- xem danh sách kỳ thi
- xem chi tiết kỳ thi
- làm bài thi trực tuyến
- theo dõi thời gian làm bài
- xem kết quả và chi tiết bài làm

### 3.4 Trải nghiệm làm bài thi
Frontend hỗ trợ các yêu cầu đặc thù của bài thi online như:
- hiển thị timer
- autosave / lưu nháp theo nghiệp vụ
- cảnh báo khi mất kết nối
- hiển thị ảnh câu hỏi và đáp án từ `/uploads/**`
- thông báo trạng thái bằng toast, modal và loading state

---

## 4. Kiến trúc tổng thể

Frontend được tổ chức theo mô hình **feature-based** kết hợp **shared/common**.

### 4.1 `src/app`
Chứa phần khởi tạo và ghép nối toàn bộ ứng dụng:
- router
- providers
- route guards
- cấu hình ứng dụng ở cấp global

### 4.2 `src/features`
Chứa toàn bộ code theo từng nhóm chức năng nghiệp vụ.

- `auth`: đăng nhập, xác thực, logout, điều hướng theo role
- `admin`: các màn hình và logic quản trị
- `student`: các màn hình phục vụ sinh viên và làm bài thi

### 4.3 `src/shared`
Chứa các phần dùng lại ở nhiều nơi:
- component dùng chung
- helper và thư viện dùng chung
- các primitive UI như button, input, modal, table, pagination, skeleton, spinner

---

## 5. Cấu trúc thư mục tổng quan

```text
frontend/
├─ src/
│  ├─ app/
│  │  ├─ providers/
│  │  └─ routes/
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ admin/
│  │  └─ student/
│  └─ shared/
│     ├─ components/
│     └─ lib/
└─ ...
```

---

## 6. Dữ liệu và giao tiếp API

Frontend giao tiếp với backend thông qua Axios và các API được tổ chức theo domain:
- `auth`
- `admin`
- `student`

Mục tiêu là:
- giữ request logic tách khỏi UI
- tái sử dụng client cấu hình chung
- quản lý lỗi, token và response theo cách thống nhất

---

## 7. Component dùng chung

Một số component dùng chung được sử dụng xuyên suốt ứng dụng:
- `Button`
- `Input`
- `Select`
- `Textarea`
- `Modal`
- `ConfirmDialog`
- `Pagination`
- `Table`
- `Toast`
- `Spinner`
- `Skeleton`
- `EmptyState`

Các component này giúp giao diện đồng nhất và giảm lặp code.

---

## 8. Quy ước chung

### 8.1 Page
Page là nơi:
- lấy dữ liệu
- quản lý state của màn hình
- điều phối các component con
- gọi hook hoặc API cần thiết

### 8.2 Component
Component chỉ nên:
- render UI
- nhận props
- phát sinh event

### 8.3 Hook
Hook dùng để:
- tách logic tái sử dụng
- xử lý side effects
- giảm độ phức tạp của page/component

### 8.4 API layer
API layer dùng để:
- định nghĩa request
- trả về response
- không chứa logic giao diện

---

## 9. Tổ chức theo vai trò người dùng

### ADMIN / TEACHER
Người dùng nhóm này tập trung vào nghiệp vụ quản trị và vận hành hệ thống.

### STUDENT
Người dùng nhóm này tập trung vào việc xem kỳ thi, làm bài thi và xem kết quả.

### AUTH
Nhóm này xử lý toàn bộ luồng xác thực và chuyển hướng sau đăng nhập.

---

## 10. Ghi chú tổng quan

Frontend được xây dựng để phục vụ một hệ thống thi trắc nghiệm hoàn chỉnh, nơi mỗi nhóm người dùng có không gian làm việc riêng nhưng vẫn dùng chung các thành phần hạ tầng cần thiết.

Điểm nhấn của frontend là:
- phân chia rõ theo domain
- giao diện có khả năng mở rộng tốt
- hỗ trợ đầy đủ luồng quản trị và làm bài thi
- ưu tiên trải nghiệm người dùng và tính ổn định

---

## 11. Kết luận

Đây là tài liệu tổng quan frontend của sản phẩm. Nó mô tả vai trò, phạm vi chức năng, kiến trúc tổ chức và các thành phần chính của giao diện người dùng.

Nếu cần, các phần chi tiết hơn như từng feature, luồng nghiệp vụ hoặc hướng dẫn chạy dự án có thể được tách ra thành tài liệu riêng.

