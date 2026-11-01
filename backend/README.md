# 📝 Exam Management System — Backend

> **Hệ thống Quản lý & Tổ chức Thi Trắc nghiệm Toàn diện**
> Spring Boot REST API phục vụ quy trình khảo thí từ A-Z: ngân hàng câu hỏi → tổ chức thi → trộn đề → chấm điểm tự động.

---

## 📑 Mục lục

1. [Tổng quan](#-tổng-quan)
2. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
3. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
4. [Cấu trúc dự án](#-cấu-trúc-dự-án)
5. [Mô hình CSDL](#-mô-hình-cơ-sở-dữ-liệu)
6. [Phân quyền](#-phân-quyền-3-cấp)
7. [Tính năng chi tiết](#-tính-năng-chi-tiết)
8. [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
9. [Cấu hình](#%EF%B8%8F-cấu-hình)
10. [API Endpoints](#-api-endpoints)
11. [Thuật toán trộn đề](#-thuật-toán-trộn-đề)
12. [Chấm điểm tự động](#-chấm-điểm-tự-động-auto-grading)
13. [Roadmap](#-roadmap)
14. [Mở rộng tương lai](#-mở-rộng-tương-lai)

---

## 🌟 Tổng quan

Hệ thống cung cấp giải pháp thi trắc nghiệm trên máy tính với môi trường **khép kín** bao gồm:

- **Quản lý ngân hàng câu hỏi** — Lưu trữ, phân loại theo môn học & chương, hỗ trợ upload ảnh minh họa qua `multipart/form-data`.
- **Tổ chức kỳ thi** — Tạo kỳ thi, cấu hình số câu/chương, phân công thí sinh, kiểm soát thời gian.
- **Trộn đề thông minh (Pre-generated)** — Khi tạo kỳ thi, hệ thống tự động random đề gốc theo cấu hình chương, sau đó tráo sẵn N đề từ đề gốc. Khi thí sinh bắt đầu thi, chỉ việc gán 1 đề đã tráo sẵn.
- **Chấm điểm tự động** — Tự động đối chiếu đáp án & trả kết quả ngay lập tức.
- **3 cấp phân quyền** — ADMIN > TEACHER > STUDENT với quyền hạn rõ ràng.
- **Tài khoản bảo mật** — Student được tạo bởi Admin/Teacher với credentials random; không có route đăng ký công khai.
- **Xóa mềm (Soft Delete)** — Tất cả thao tác xóa đều là soft delete (`deleted = true`).
- **Kết xuất PDF** — Xuất đề thi + đáp án ra PDF chuẩn chỉnh, sẵn sàng in ấn.
- **Đề giấy riêng biệt (`paperexam`)** — Cho phép Admin/Teacher tạo đề giấy từ kho câu hỏi theo môn/chương, snapshot câu hỏi/đáp án tại thời điểm tạo, sau đó preview / xuất PDF / xem đáp án / xóa mềm.
- **Quét phiếu trả lời (Vision)** — Tích hợp luồng chấm bài giấy bằng ảnh scan, hỗ trợ form 75, single choice và multiple choice, lưu kết quả scan chi tiết theo từng câu.

---

## 🛠 Công nghệ sử dụng

| Layer | Công nghệ | Phiên bản |
|---|---|---|
| **Runtime** | Java | 21 (LTS) |
| **Framework** | Spring Boot | 3.5.12 |
| **Security** | Spring Security + Spring Session JDBC (cookie) | — |
| **Persistence** | Spring Data JPA + Hibernate | — |
| **Database** | MySQL | 8.x+ |
| **Validation** | Spring Validation (Jakarta) | — |
| **Caching** | Spring Cache | — |
| **Build tool** | Maven | — |
| **Utility** | Lombok | — |
| **API Docs** | Swagger / SpringDoc OpenAPI | — |
| **Vision (external)** | Python Service (OCR/Object Detection) | Planned |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web / Mobile)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST (JSON + multipart/form-data)
┌──────────────────────────────▼──────────────────────────────────┐
│                     API GATEWAY / CONTROLLER                    │
│           (Authentication + Authorization 3-Role)               │
├─────────┬──────────┬──────────┬───────────┬─────────────────────┤
│  User   │ Question │   Exam   │  Session  │      Grading        │
│ Module  │  Module  │  Module  │  Module   │      Module         │
├─────────┴──────────┴──────────┴───────────┴─────────────────────┤
│                       CORE LAYER                                │
│   (Security, Config, Exception, Utils, DataInitializer)         │
├─────────────────────────────────────────────────────────────────┤
│              SPRING DATA JPA / HIBERNATE (Soft Delete)          │
├─────────────────────────────────────────────────────────────────┤
│                       MySQL Database                            │
└─────────────────────────────────────────────────────────────────┘
              │                              │
              │ HTTP (Internal)              │ Static Files
┌─────────────▼──────────────┐   ┌───────────▼────────────┐
│  EXTERNAL: Python Vision   │   │   /uploads/ (images)   │
│   Service (OCR/Detection)  │   │   Public file serving  │
└────────────────────────────┘   └────────────────────────┘
```

---

## 📂 Cấu trúc dự án

Dự án được tổ chức theo mô hình **Package by Feature**, giúp mỗi module có tính độc lập cao, dễ mở rộng và bảo trì.

```text
src/main/java/com/gr1/exam/
├── ExamApplication.java
├── core/
├── module/
│   ├── user/
│   ├── question/
│   ├── exam/
│   ├── session/
│   ├── grading/
│   ├── paperexam/   # module đề giấy riêng biệt
│   └── external/    # tích hợp dịch vụ bên ngoài (vision, ...)
├── uploads/
└── external/
```

---

## 🗄 Mô hình Cơ sở dữ liệu

### Entity Relationship Diagram (ERD)

```text
users ─┬─< exam_participants
       ├─< exam_sessions
       └─< ...

subjects ─┬─< chapters ─┬─< questions ─┬─< answers
          └─< exams     └─< exam_chapter_configs

exams ─┬─< exam_variants ─┬─< exam_variant_questions ─┬─< exam_variant_answers
       └─< exam_participants

exam_sessions ─┬─< user_answers ─┬─< user_answer_selections
               └─< results
```

### Danh sách bảng

| # | Bảng | Mô tả |
|---|---|---|
| 1 | `users` | Tài khoản hệ thống (ADMIN / TEACHER / STUDENT). Login bằng `username`. |
| 2 | `subjects` | Danh mục môn học |
| 3 | `chapters` | Chương trong môn học |
| 4 | `questions` | Ngân hàng câu hỏi, liên kết với môn & chương, hỗ trợ ảnh |
| 5 | `answers` | Đáp án của mỗi câu hỏi, đánh dấu `is_correct`, hỗ trợ ảnh |
| 6 | `exams` | Kỳ thi (tiêu đề, thời lượng, số câu, số đề tráo, khung giờ) |
| 7 | `exam_chapter_configs` | Cấu hình số câu lấy từ mỗi chương cho kỳ thi |
| 8 | `exam_variants` | Danh sách đề thi (gốc + tráo) đã được tạo sẵn |
| 9 | `exam_variant_questions` | Câu hỏi đã xáo trộn trong từng đề variant |
| 10 | `exam_variant_answers` | Đáp án đã xáo trộn cho từng câu trong variant |
| 11 | `exam_participants` | Danh sách thí sinh được phân công vào kỳ thi |
| 12 | `exam_sessions` | Phiên thi cụ thể, gán 1 variant cho thí sinh |
| 13 | `user_answers` | Bản ghi câu trả lời của thí sinh trong phiên thi |
| 14 | `user_answer_selections` | Đáp án cụ thể thí sinh chọn (hỗ trợ multi-select) |
| 15 | `results` | Kết quả chấm điểm (score, total_correct) |
| 16 | `paper_exams` | Metadata đề giấy: tiêu đề, môn học, thời lượng, trạng thái, người tạo |
| 17 | `paper_exam_chapter_configs` | Cấu hình số câu lấy theo từng chương cho đề giấy |
| 18 | `paper_exam_questions` | Snapshot câu hỏi đã được chọn và thứ tự hiển thị trong đề giấy |
| 19 | `paper_exam_answers` | Snapshot đáp án của từng câu trong đề giấy |

> Ghi chú: module `paperexam` lưu snapshot câu hỏi/đáp án để đề giấy có thể preview, xuất PDF và xem đáp án mà không phụ thuộc vào thay đổi của dữ liệu gốc sau này.
> 
> Ghi chú thêm: luồng quét bài giấy được tách riêng qua `external/vision` để backend chỉ làm nghiệp vụ chấm điểm, còn việc đọc ảnh/nhận diện đáp án được đóng gói thành một service riêng.

---

## 🔐 Phân quyền 3 cấp

Hệ thống sử dụng 3 role: **ADMIN** > **TEACHER** > **STUDENT**

| Hành động | ADMIN | TEACHER | STUDENT |
|---|---|---|---|
| Đăng nhập | ✅ | ✅ | ✅ |
| Tạo tài khoản TEACHER | ✅ | ❌ | ❌ |
| Tạo tài khoản STUDENT | ✅ | ✅ | ❌ |
| Sửa/Xóa tài khoản bất kỳ | ✅ | ❌ | ❌ |
| Xem chi tiết tài khoản | ✅ (tất cả) | ✅ (chỉ STUDENT) | ❌ |
| Tự sửa thông tin bản thân | ✅ | ✅ | ❌ |
| CRUD Môn học & Chương | ✅ | ✅ | ❌ |
| CRUD Câu hỏi (kèm upload ảnh) | ✅ | ✅ | ❌ |
| CRUD Kỳ thi | ✅ | ✅ | ❌ |
| Thêm/Xóa thí sinh kỳ thi | ✅ | ✅ | ❌ |
| Xem danh sách kỳ thi | ❌ | ❌ | ✅ (chỉ kỳ thi được tham gia) |
| Bắt đầu thi | ❌ | ❌ | ✅ |
| Nộp bài | ❌ | ❌ | ✅ |
| Xem kết quả kỳ thi (bảng điểm) | ✅ | ✅ | ❌ |
| Xem kết quả cá nhân | ❌ | ❌ | ✅ |
| Tạo đề giấy riêng | ✅ | ✅ | ❌ |
| Xem đáp án đề giấy | ✅ | ✅ | ❌ |
| Xuất PDF đề giấy | ✅ | ✅ | ❌ |

---

## ⚡ Tính năng chi tiết

### 1. Quản lý Tài khoản (`module/user`)
- **Đăng nhập** với cookie phiên (Spring Session JDBC) — login bằng `username`; server set cookie `EXAMSESSION` (HttpOnly) + CSRF cookie `XSRF-TOKEN`.
- **Không có đăng ký công khai** — tất cả tài khoản được tạo bởi Admin/Teacher.
- **Tạo Student**: Admin/Teacher nhập MSSV + tên → server random `username` + `password`, trả về credentials.
- **Tạo Teacher**: Chỉ Admin, nhập `username` + `password` + `name`.
- **Phân quyền 3 cấp**: ADMIN > TEACHER > STUDENT.
- **Tự cập nhật**: Teacher có thể đổi `username`, `password`, `name` của mình. Student không được.
- **Quản lý tài khoản**: Chỉ Admin có quyền sửa/xóa tài khoản bất kỳ.
- **Xem danh sách**: Admin xem tất cả; Teacher chỉ xem chi tiết STUDENT.
- **Soft delete**: Xóa tài khoản chỉ đánh dấu `deleted = true`.

### 2. Ngân hàng Câu hỏi (`module/question`)
- CRUD môn học (`subjects`).
- CRUD chương (`chapters`) thuộc môn học.
- CRUD câu hỏi + đáp án — phân loại theo **môn học + chương**.
- **Hỗ trợ upload ảnh qua multipart/form-data**.
- Tìm kiếm, filter theo môn/chương, phân trang.
- **Soft delete**: Xóa câu hỏi/đáp án chỉ đánh dấu `deleted = true`.

### 3. Quản lý Kỳ thi (`module/exam`)
- Tạo kỳ thi: chọn môn học, thiết lập thời lượng, số câu hỏi, khung giờ thi.
- **Cấu hình số câu/chương**: Khi tạo kỳ thi, chỉ định số câu muốn lấy từ mỗi chương.
- **Khung giờ thi bắt buộc**: `startTime` và `endTime` là bắt buộc khi tạo/sửa kỳ thi.
- **Số đề tráo (`total_variants`)**: Khi tạo kỳ thi, chỉ định tổng số đề (1 gốc + N-1 tráo).
- **Sinh đề tự động**: Khi tạo kỳ thi, server random chọn câu hỏi theo config chương → tạo đề gốc → tráo sẵn N-1 đề.
- Phân công thí sinh vào kỳ thi.
- **Xóa thí sinh khỏi kỳ thi**.
- Danh sách kỳ thi: ADMIN/TEACHER xem tất cả; STUDENT chỉ xem kỳ thi mình được phân công.
- **Soft delete**: Tất cả thao tác xóa đều là soft delete.

### 4. Phiên thi (`module/session`) — ★ Core Logic ★
- **Bắt đầu thi**: Student ấn "Bắt đầu" → server gán random 1 variant (đề đã tráo sẵn) → tạo `exam_session` với `variant_id`.
- **Lấy đề thi**: Trả về câu hỏi + đáp án từ variant đã gán.
- **Nộp bài one-shot**: Client gửi toàn bộ đáp án đã chọn trong một request submit.
- **Concurrency-safe submit**: Chặn submit trùng khi user click 2 lần hoặc network retry.

### 5. Chấm điểm Tự động (`module/grading`)
- Chấm theo **exact-set-match** trên từng câu hỏi.
- Tính điểm theo thang điểm cấu hình.
- Lưu kết quả vào `results`.
- Thống kê: điểm trung bình, phân bố điểm, xếp hạng.

### 6. Đề giấy riêng biệt (`module/paperexam`)
- Chỉ `ADMIN` và `TEACHER` được tạo, xem, preview, xuất PDF và xóa mềm.
- Tạo đề từ kho câu hỏi của môn học theo cấu hình số câu từng chương.
- Khi tạo đề, hệ thống validate môn/chương, kiểm tra số câu khả dụng và snapshot toàn bộ câu hỏi + đáp án vào các bảng riêng.
- Hỗ trợ xem đáp án để chấm bài giấy.
- Có luồng scan bài giấy riêng: upload ảnh, gọi vision service, chấm theo exact-set-match và lưu chi tiết từng câu.
- Dữ liệu scan được tách thành scan result tổng và scan question result chi tiết, kèm các bảng phụ để lưu danh sách đáp án đã tô / đáp án đúng.
- PDF export dùng `OpenHTMLToPDF`, template HTML nằm trong `resources/templates/paperexam`.

### 7. Tích hợp Vision (`external/vision`)
- Gọi HTTP tới Python microservice để xử lý ảnh phiếu trả lời.
- Tách riêng lớp `VisionClient`, DTO request/response, cấu hình timeout/retry và exception riêng cho luồng scan.
- Nhận diện đáp án tô trên form 75, hỗ trợ single choice, multiple choice và câu bỏ trống.
- Backend map kết quả nhận diện sang `paperexam` để chấm điểm và lưu lịch sử scan.
- Lưu raw vision output và chi tiết từng câu để phục vụ debug/review lại kết quả.
- *(Roadmap)* OCR trích xuất câu hỏi từ PDF/ảnh scan.

### 8. Soft Delete — Toàn hệ thống
- **Tất cả** thao tác xóa trên mọi bảng đều là **soft delete** — chỉ set `deleted = true`.
- JPA Entity sử dụng `@SQLDelete` + `@Where(clause = "deleted = false")` để tự động filter.
- Giảm tải cho phần cứng, bảo toàn dữ liệu lịch sử.

---

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu

- **Java** 21+
- **Maven** 3.9+
- **MySQL** 8.x+

### Các bước

```bash
# 1. Clone repository
git clone <repo-url>
cd backend

# 2. Tạo database và import schema
mysql -u root -p < sql_init/init.sql

# 3. Tạo thư mục uploads (nếu chưa có)
mkdir -p uploads

# 4. Cấu hình database + admin account (xem mục Cấu hình bên dưới)
# Sửa file src/main/resources/application.properties

# 5. Build project
./mvnw clean install

# 6. Chạy ứng dụng
./mvnw spring-boot:run
```

Ứng dụng sẽ khởi chạy tại: `http://localhost:8080`

> **Lưu ý**: Khi khởi động lần đầu, hệ thống sẽ tự động tạo tài khoản Admin mặc định từ cấu hình trong `application.properties`. Không cần INSERT thủ công vào database.

---

## ⚙️ Cấu hình

Chỉnh sửa file `src/main/resources/application.properties`:

```properties
# ── Database ──
spring.datasource.url=jdbc:mysql://localhost:3306/online_exam_db
spring.datasource.username=root
spring.datasource.password=your_password

# ── JPA / Hibernate ──
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# ── Xác thực cookie phiên (Spring Session JDBC) ──
spring.session.store-type=jdbc
spring.session.jdbc.initialize-schema=always
server.servlet.session.timeout=8h
server.servlet.session.cookie.name=EXAMSESSION
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.same-site=lax

# ── Server ──
server.port=8080
server.servlet.context-path=/api/v1

# ── Default Admin Account (seed khi khởi động) ──
app.admin.username=admin
app.admin.password=12345678

# ── File Upload ──
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=15MB

# ── Upload Directory ──
app.upload.dir=uploads
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập bằng `username` + `password`, set cookie `EXAMSESSION` + `XSRF-TOKEN` | Public |
| `POST` | `/api/auth/logout` | Đăng xuất, invalidate phiên | Public |
| `GET` | `/api/auth/me` | Thông tin user hiện tại | Authenticated |

> ⚠️ **Không có route đăng ký.** Tất cả tài khoản được tạo bởi Admin/Teacher.
> 🔒 Các request `POST`/`PUT`/`DELETE` cần header `X-XSRF-TOKEN` lấy từ cookie `XSRF-TOKEN`.

### Users — Quản lý Tài khoản
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/users` | Danh sách users (Admin: tất cả; Teacher: chỉ students) | ADMIN, TEACHER |
| `GET` | `/api/users/{id}` | Chi tiết user (Teacher chỉ xem STUDENT) | ADMIN, TEACHER |
| `POST` | `/api/users/students` | Tạo tài khoản Student | ADMIN, TEACHER |
| `POST` | `/api/users/teachers` | Tạo tài khoản Teacher | ADMIN |
| `PUT` | `/api/users/{id}` | Cập nhật tài khoản TEACHER | ADMIN |
| `PUT` | `/api/users/me` | Teacher tự cập nhật thông tin | TEACHER |
| `DELETE` | `/api/users/{id}` | Xoá user (soft delete) | ADMIN |

### Subjects — Môn học
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/subjects` | Danh sách môn học | ADMIN, TEACHER |
| `GET` | `/api/subjects/{id}` | Chi tiết môn (kèm danh sách chương) | ADMIN, TEACHER |
| `POST` | `/api/subjects` | Tạo môn học | ADMIN, TEACHER |
| `PUT` | `/api/subjects/{id}` | Cập nhật | ADMIN, TEACHER |
| `DELETE` | `/api/subjects/{id}` | Xoá (soft delete) | ADMIN, TEACHER |

### Chapters — Chương trong Môn học
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/subjects/{subjectId}/chapters` | Danh sách chương của môn | ADMIN, TEACHER |
| `POST` | `/api/subjects/{subjectId}/chapters` | Thêm chương (chỉ `name`) | ADMIN, TEACHER |
| `PUT` | `/api/subjects/{subjectId}/chapters/{id}` | Sửa chương (chỉ `name`) | ADMIN, TEACHER |
| `DELETE` | `/api/subjects/{subjectId}/chapters/{id}` | Xoá chương (soft delete) | ADMIN, TEACHER |

### Questions — Câu hỏi (`multipart/form-data`)
| Method | Endpoint | Content-Type | Mô tả | Quyền |
|---|---|---|---|---|
| `GET` | `/api/questions` | — | Danh sách câu hỏi (filter by subject, chapter) | ADMIN, TEACHER |
| `GET` | `/api/questions/{id}` | — | Chi tiết (kèm answers + imageUrl) | ADMIN, TEACHER |
| `POST` | `/api/questions` | `multipart/form-data` | Tạo câu hỏi + đáp án (tùy chọn upload ảnh) | ADMIN, TEACHER |
| `PUT` | `/api/questions/{id}` | `multipart/form-data` | Cập nhật (tùy chọn upload ảnh mới) | ADMIN, TEACHER |
| `DELETE` | `/api/questions/{id}` | — | Xoá (soft delete) | ADMIN, TEACHER |

### Uploads — File ảnh (Public)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/uploads/**` | Truy cập ảnh đã upload | Public |

### Exams — Kỳ thi
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/exams` | DS kỳ thi | ALL |
| `GET` | `/api/exams/{id}` | Chi tiết kỳ thi | ALL |
| `POST` | `/api/exams` | Tạo kỳ thi | ADMIN, TEACHER |
| `PUT` | `/api/exams/{id}` | Cập nhật | ADMIN, TEACHER |
| `DELETE` | `/api/exams/{id}` | Xoá (soft delete) | ADMIN, TEACHER |
| `POST` | `/api/exams/{id}/participants` | Thêm thí sinh | ADMIN, TEACHER |
| `GET` | `/api/exams/{id}/participants` | D.S thí sinh | ADMIN, TEACHER |
| `DELETE` | `/api/exams/{id}/participants/{userId}` | Xóa thí sinh khỏi kỳ thi | ADMIN, TEACHER |

### Exam Sessions — Phiên thi
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/sessions/start/{examId}` | Bắt đầu phiên thi | STUDENT |
| `GET` | `/api/sessions/{id}/questions` | Lấy đề thi | STUDENT |
| `POST` | `/api/sessions/{id}/submit` | Nộp bài one-shot | STUDENT |

### Results — Kết quả
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/api/results/session/{sessionId}` | Kết quả phiên thi | ALL |
| `GET` | `/api/results/exam/{examId}` | Bảng điểm kỳ thi | ADMIN, TEACHER |
| `GET` | `/api/results/me` | Lịch sử thi của tôi | STUDENT |

### Paper Exams — Đề giấy riêng biệt (`module/paperexam`)
| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `POST` | `/api/paper-exams` | Tạo đề giấy từ kho câu hỏi của một môn học | ADMIN, TEACHER |
| `GET` | `/api/paper-exams` | Danh sách đề giấy đã lưu | ADMIN, TEACHER |
| `GET` | `/api/paper-exams/{id}` | Chi tiết metadata đề giấy | ADMIN, TEACHER |
| `GET` | `/api/paper-exams/{id}/answers` | Xem đáp án để chấm bài giấy | ADMIN, TEACHER |
| `GET` | `/api/paper-exams/{id}/pdf` | Xuất/download PDF đề giấy | ADMIN, TEACHER |
| `GET` | `/api/paper-exams/{id}/pdf/preview` | Preview PDF đề giấy trên trình duyệt | ADMIN, TEACHER |
| `DELETE` | `/api/paper-exams/{id}` | Xóa mềm đề giấy | ADMIN, TEACHER |

---

## 🔀 Thuật toán Trộn đề

### Nguyên lý hoạt động (Pre-generated Variants)

Khác với phiên bản cũ (tạo đề realtime khi student bắt đầu thi), phiên bản mới **tạo sẵn tất cả đề tráo khi Admin/Teacher tạo kỳ thi**.

```
Admin/Teacher tạo kỳ thi
    │
    ├─ Input: title, subjectId, duration, totalQuestions, totalVariants
    │         + List<{chapterId, questionCount}>
    │
    ├─ Validate:
    │   ├─ Σ questionCount (tất cả chương) == totalQuestions
    │   ├─ questionCount mỗi chương ≤ số câu thực tế trong chương đó
    │   └─ totalVariants ≥ 1
    │
    ▼
 ① Random chọn câu hỏi theo config chương → "Đề gốc"
    │
    ▼
 ② Lưu đề gốc vào exam_variants (variant_order=0, is_original=true)
    + exam_variant_questions + exam_variant_answers
    │
    ▼
 ③ Tráo đề gốc → (totalVariants - 1) đề tráo:
      ├─ Fisher-Yates Shuffle thứ tự câu hỏi
      ├─ Fisher-Yates Shuffle thứ tự đáp án mỗi câu
      └─ Lưu vào exam_variants (variant_order=1..N-1)
    │
    ▼
 ④ Khi Student bắt đầu thi:
    ├─ Random chọn 1 trong N variant (bao gồm cả đề gốc)
    ├─ Gán variant_id vào exam_sessions
    └─ Trả đề thi cho student
```

---

## ✅ Chấm điểm Tự động (Auto-Grading)

### Luồng chấm điểm Online

```
Thí sinh nộp bài
       │
       ▼
Lấy variant đã gán cho session
       │
       ▼
Lấy toàn bộ variant_questions + đáp án đúng (từ question gốc)
       │
       ▼
Với mỗi câu hỏi:
  ├─ Lấy tập đáp án user đã chọn từ user_answer_selections
  ├─ Map selected_answer_id → answer gốc
  ├─ So sánh với tập đáp án đúng (is_correct = true)
  └─ Khớp chính xác (exact-set-match) thì tính đúng
       │
       ▼
score = (total_correct / total_questions) * 10
       │
       ▼
Lưu vào bảng results
```

---

## 🗺 Roadmap

- [x] **v2.0** — Restructure: 3-role, chapters, pre-generated variants, image support (multipart/form-data), soft delete
- [ ] **v2.1** — Kết xuất đề thi & đáp án ra PDF
- [x] **v2.2** — Đề giấy riêng biệt: tạo/preview/PDF/xem đáp án/soft delete, snapshot dữ liệu tại thời điểm tạo
- [ ] **v3.0** — Tích hợp Vision Service (quét phiếu trả lời)
- [ ] **v4.0** — OCR/Object Detection: trích xuất câu hỏi từ PDF/ảnh scan
- [ ] **Future** — Realtime exam monitoring (WebSocket), Analytics dashboard

---

## 📌 Mở rộng tương lai

- Nếu sau này cần phát hành nhiều bản đề giấy khác nhau cho cùng một paper exam, có thể thêm khái niệm `PaperExamVariant`.
- Nếu cần chấm bài thủ công trong hệ thống, có thể bổ sung thêm entity lưu bài làm giấy của sinh viên ở giai đoạn sau.
- Khi `paperexam` thay đổi, cần cập nhật lại `API_SPEC.md` để frontend tích hợp chính xác.

---

## 📜 License

Private — Internal use only.
