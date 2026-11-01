# 🎓 Hệ Thống Quản Lý & Tổ Chức Thi Trắc Nghiệm Toàn Diện (Online & Paper Exam System)

> **Môi trường khảo thí khép kín từ A-Z:** Quản lý ngân hàng câu hỏi → Tổ chức kỳ thi → Sinh đề tráo sẵn → Làm bài trực tuyến → Chấm điểm tự động → Tạo đề thi giấy & Xuất PDF → Quét bài thi giấy bằng Vision/OCR AI.

---

## 📑 Mục Lục

1. [🌟 Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
2. [⚡ Các Tính Năng Nổi Bật](#-các-tính-năng-nổi-bật)
3. [🛠 Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
4. [🏗 Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục](#-kiến-trúc-hệ-thống--cấu-trúc-thư-mục)
5. [🗄 Mô Hình Cơ Sở Dữ Liệu (ERD & Database Schema)](#-mô-hình-cơ-sở-dữ-liệu-erd--database-schema)
6. [🔐 Phân Quyền 3 Cấp (Role-Based Access Control)](#-phân-quyền-3-cấp-role-based-access-control)
7. [⚙️ Luồng Nghiệp Vụ & Thuật Toán Core](#%EF%B8%8F-luồng-nghiệp-vụ--thuật-toán-core)
8. [🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
9. [📡 Danh Sách API Endpoints (RESTful API)](#-danh-sách-api-endpoints-restful-api)
10. [🛡 Quy Ước Vận Hành & Bảo Mật](#-quy-ước-vận-hành--bảo-mật)
11. [🔮 Định Hướng Phát Triển Tương Lai](#-định-hướng-phát-triển-tương-lai)

---

## 🌟 Giới Thiệu Tổng Quan

**Hệ thống Quản lý & Tổ chức Thi Trắc nghiệm Toàn diện** là giải pháp phần mềm chuyên biệt phục vụ các trường học, trung tâm đào tạo và tổ chức giáo dục trong việc hiện đại hóa công tác khảo thí. 

Sản phẩm hỗ trợ **song song 2 hình thức thi**:
1. **Thi Trực Tuyến (Online Exam):** Học sinh đăng nhập, làm bài trên giao diện web có đếm ngược thời gian, tự động lưu bài nháp và trả kết quả/bảng điểm ngay khi nộp bài.
2. **Thi Giấy Trầm Tích & Quét Ảnh (Paper Exam & Vision Integration):** Giáo viên tạo đề thi từ ngân hàng câu hỏi, xuất ra file PDF chuẩn in ấn kèm đáp án. Sau khi học sinh tô phiếu trả lời (Form 75), giáo viên sử dụng công cụ quét ảnh (tích hợp Python Vision Service / OCR) để chấm điểm tự động.

---

## ⚡ Các Tính Năng Nổi Bật

### 1. Quản lý Ngân hàng Câu hỏi & Môn học
- **Cấu trúc phân cấp:** Môn học (Subject) ➔ Chương (Chapter) ➔ Câu hỏi (Question) ➔ Đáp án (Answer).
- **Đa dạng dạng câu hỏi:** Hỗ trợ cả **Single Choice** (1 đáp án đúng) và **Multiple Choice** (nhiều đáp án đúng).
- **Hỗ trợ hình ảnh minh họa:** Cho phép tải ảnh trực tiếp qua `multipart/form-data` cho cả nội dung câu hỏi lẫn từng lựa chọn đáp án.
- **Xóa mềm (Soft Delete):** Đảm bảo an toàn dữ liệu, không làm hỏng lịch sử các kỳ thi đã diễn ra.

### 2. Kỳ thi Online & Thuật toán Trộn đề (Pre-generated Variants)
- **Cấu hình kỳ thi linh hoạt:** Thiết lập thời lượng, khung giờ mở/đóng thi, cấu hình phân bổ số lượng câu hỏi theo từng chương.
- **Sinh đề tự động:** 
  - Hệ thống rút ngẫu nhiên câu hỏi gốc từ kho dữ liệu theo cấu hình chương.
  - Tự động xáo trộn thứ tự câu hỏi và xáo trộn thứ tự đáp án của từng câu để tạo ra $N$ mã đề (Variant) tráo sẵn.
- **Gán đề thông minh:** Khi sinh viên bắt đầu thi, hệ thống ngẫu nhiên gán 1 Variant đã sinh sẵn, giúp tiết kiệm tài nguyên máy chủ và chống gian lận hiệu quả.

### 3. Trải nghiệm Làm bài Thi & Chấm điểm Tự động
- **Giao diện làm bài trực quan:** Đếm ngược thời gian làm bài, cảnh báo sắp hết giờ, đánh dấu câu chưa làm, hiển thị ảnh chất lượng cao.
- **Chấm điểm theo exact-set-match:** 
  - Đánh giá chính xác tập đáp án thí sinh chọn so với đáp án đúng.
  - Tính điểm theo tỷ lệ phần trăm câu đúng trên tổng số câu hỏi.
- **Nộp bài 1 lần & chống trùng (Idempotence):** Ngăn chặn thí sinh nộp bài nhiều lần hoặc submit lặp gây sai lệch kết quả.

### 4. Tạo Đề Thi Giấy & Xuất PDF (Paper Exam)
- **Snapshot dữ liệu độc lập:** Khi tạo đề thi giấy, hệ thống chụp lại (Snapshot) toàn bộ câu hỏi và đáp án tại thời điểm đó. Nếu ngân hàng câu hỏi sau này bị chỉnh sửa, đề thi giấy đã tạo vẫn giữ nguyên.
- **Xuất PDF chuẩn in ấn:** Tích hợp `OpenHTMLtoPDF` rendering template HTML/CSS sang file PDF đẹp mắt, hỗ trợ hiển thị ảnh và font tiếng ViệtUnicode.
- **Quản lý đáp án & Mã đề giấy:** Hỗ trợ xem preview, quản lý đáp án chi tiết và in phiếu soi đáp án cho giáo viên.

### 5. Tích hợp Quét Phiếu Trả Lời Giấy (Vision Service Integration)
- **Kiến trúc Microservice bóc tách:** Backend Java quản lý nghiệp vụ ➔ Gọi REST API sang **Python Vision Service** (bọc engine `open-mcr`) ➔ Nhận dữ liệu đáp án tô trên ảnh phiếu scan (Form 75).
- **Xử lý linh hoạt:** Chuẩn hóa dữ liệu nhận diện (`SUCCESS`, `NEEDS_REVIEW`, `FAILED_TO_READ`), lưu vết chi tiết từng ô đáp án được tô, độ tin cậy (confidence) để giáo viên rà soát bài tô mờ.

### 6. Quản lý Người dùng & Bảo mật Phân quyền
- **Phân quyền 3 cấp:** `ADMIN` ➔ `TEACHER` ➔ `STUDENT`.
- **Môi trường tài khoản khép kín:** Sinh viên và Giáo viên được tạo tài khoản bởi Admin/Teacher (sinh ngẫu nhiên credentials), không mở đăng ký tự do công khai.
- **Xác thực cookie phiên (Spring Session JDBC):** Cookie `EXAMSESSION` (HttpOnly) lưu trong bảng `SPRING_SESSION`; kèm CSRF cookie `XSRF-TOKEN`. Đóng trình duyệt rồi quay lại vẫn giữ phiên.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

### 🔹 Backend Ecosystem
| Thành phần | Công nghệ | Chi tiết |
|---|---|---|
| **Language** | Java 21 | Sử dụng Java LTS mới nhất với Virtual Threads & Pattern Matching |
| **Framework** | Spring Boot 3.5.12 | REST APIs, Spring MVC, Spring Validation (Jakarta) |
| **Security** | Spring Security 6 + Spring Session JDBC | Stateful Authentication bằng cookie `EXAMSESSION` (HttpOnly) + CSRF cookie |
| **Persistence** | Spring Data JPA / Hibernate | ORM Mapping, Soft Delete Auditing |
| **Database** | MySQL 8.x | Hệ quản trị cơ sở dữ liệu quan hệ chính |
| **Caching** | Spring Cache | In-memory caching cho danh mục môn học, chương |
| **PDF Engine** | OpenHTMLtoPDF (PdfBox) | Render HTML template + CSS sang PDF in ấn |
| **API Document** | SpringDoc / OpenAPI 3 | Swagger UI tương tác trực tiếp (`/swagger-ui.html`) |

### 🔹 Frontend Ecosystem
| Thành phần | Công nghệ | Chi tiết |
|---|---|---|
| **Core Framework** | React 19 + TypeScript | Xây dựng Single Page Application (SPA) chuẩn tuýp |
| **Build Tool** | Vite 8 | Tốc độ HMR cực nhanh, tối ưu hóa bundle size |
| **Styling** | Tailwind CSS v3 | Design System hiện đại, responsive layout |
| **Routing** | React Router DOM v7 | Quản lý điều hướng client-side & Route Guards |
| **HTTP Client** | Axios | `withCredentials` + tự gắn header `X-XSRF-TOKEN` & xử lý lỗi tập trung |
| **UI Components** | Lucide React, Tremor, SweetAlert2, React Hot Toast | Thư viện icons, biểu đồ báo cáo & thông báo toast đẹp mắt |

### 🔹 Vision Service (Tích hợp Bài thi Giấy)
| Thành phần | Công nghệ | Chi tiết |
|---|---|---|
| **Vision Engine** | Python 3.10+ / `open-mcr` | Nhận diện Marker, bóc tách vùng tô phiếu trả lời trắc nghiệm (Form 75) |

---

## 🏗 Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục

### 📐 Sơ Đồ Kiến Trúc Hệ Thống

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web Browser)                             │
│                  React 19 + TypeScript + Vite                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST API (JSON & Multipart)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    BACKEND: SPRING BOOT REST API                        │
│          (Authentication, Authorization & Security Layer)               │
├─────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│    User     │   Question   │  Online Exam │ Exam Session │  Grading     │
│   Module    │    Module    │    Module    │    Module    │   Module     │
├─────────────┴──────────────┴──────────────┴──────────────┴──────────────┤
│                      Paper Exam & PDF Module                            │
│                 + External Vision Gateway Module                        │
├─────────────────────────────────────────────────────────────────────────┤
│                   SPRING DATA JPA (Soft Delete)                         │
└──────────────┬──────────────────────────────────────────┬───────────────┘
               │                                          │
               ▼ Database                                 ▼ Static Files & API
┌──────────────────────────────┐          ┌──────────────────────────────┐
│        MySQL Database        │          │    External Vision Service   │
│   (Tables, Indexes, Foreign) │          │  (Python / open-mcr Engine)  │
└──────────────────────────────┘          └──────────────────────────────┘
```

### 📂 Cấu Trúc Thư Mục Dự Án

```text
Giang2011/Online_Exam/
├── API_SPEC.md                       # Tài liệu đặc tả RESTful API chi tiết
├── PROJECT_SPECIFICATION.md          # Tài liệu đặc tả yêu cầu sản phẩm
├── README.md                         # Tài liệu hướng dẫn dự án (File này)
│
├── backend/                          # Spring Boot Backend Project
│   ├── sql_init/
│   │   └── init.sql                  # Script tạo Database & dữ liệu mẫu
│   ├── src/main/java/com/gr1/exam/
│   │   ├── ExamApplication.java      # Main Application Entry Point
│   │   ├── core/                     # Configuration, Security, Exception, Utilities
│   │   │   ├── config/               # Security, WebMVC, Cache configs
│   │   │   ├── exception/            # Global Exception Handler
│   │   │   ├── security/             # Session filter, UserDetailsService
│   │   │   └── util/                 # Helper functions
│   │   ├── external/                 # Tích hợp dịch vụ bên ngoài
│   │   │   └── vision/               # External Vision integration client
│   │   └── module/                   # Modules nghiệp vụ (Package by Feature)
│   │       ├── user/                 # Quản lý tài khoản & xác thực
│   │       ├── question/             # Môn học, chương, câu hỏi & đáp án
│   │       ├── exam/                 # Quản lý kỳ thi & thuật toán tráo đề
│   │       ├── session/              # Phân công & phiên làm bài thi online
│   │       ├── grading/              # Chấm điểm & báo cáo kết quả
│   │       └── paperexam/            # Quản lý đề giấy & xuất PDF
│   ├── uploads/                      # Thư mục chứa hình ảnh upload
│   └── pom.xml                       # Maven Dependencies File
│
└── frontend/                         # React TypeScript Frontend Project
    ├── public/                       # Assets tĩnh công khai
    ├── src/
    │   ├── main.tsx                  # Client Entry Point
    │   ├── App.tsx                   # Main React App Wrapper
    │   ├── app/                      # Routing & State Providers
    │   │   ├── routes/               # AppRoutes & Route Guards (Role-based)
    │   │   └── providers/            # Auth & Theme Providers
    │   ├── features/                 # Các màn hình nghiệp vụ
    │   │   ├── auth/                 # Trang Đăng nhập & quản lý Token
    │   │   ├── admin/                # Quản trị viên & Giáo viên (CRUD, Báo cáo, Đề giấy)
    │   │   └── student/              # Sinh viên (Danh sách thi, Giao diện làm bài, Kết quả)
    │   └── shared/                   # Components & Utilities dùng chung
    │       ├── components/           # Button, Modal, Table, Pagination, Toast, Skeleton...
    │       └── lib/                  # Axios Client, Auth Storage helpers
    ├── package.json                  # Frontend Dependencies & Scripts
    ├── tailwind.config.js            # Cấu hình Tailwind CSS
    └── vite.config.ts                # Cấu hình Vite Build Tool
```

---

## 🗄 Mô Hình Cơ Sở Dữ Liệu (ERD & Database Schema)

### 📊 Sơ Đồ Liên Kết Thực Thể (ERD Overview)

```text
[users] ────< [exam_participants] >──── [exams] ────< [exam_chapter_configs]
   │                                       │
   ├───────< [exam_sessions] >─────────────┤ ────< [exam_variants]
   │              │                        │            │
   │              ├────< [user_answers]    │            ├────< [exam_variant_questions]
   │              │           │            │            │             │
   │              │           ▼            │            │             ▼
   │              │  [user_answer_selections]           │    [exam_variant_answers]
   │              ▼                        │            │
   └───────< [results]                     │            │
                                           │            │
[subjects] ───< [chapters] ───< [questions] ───< [answers]
    │               │
    └───────────────┴─────────< [paper_exams] ───< [paper_exam_questions] ───< [paper_exam_answers]
```

### 📋 Danh Sách 19 Bảng Dữ Liệu Chính

| # | Tên Bảng | Vai Trò & Mô Tả |
|---|---|---|
| 1 | `users` | Lưu thông tin tài khoản người dùng (`ADMIN`, `TEACHER`, `STUDENT`), mật khẩu mã hóa BCrypt. |
| 2 | `subjects` | Danh mục các môn học trong trường/trung tâm (Mã môn, Tên môn). |
| 3 | `chapters` | Danh sách các chương/chủ đề thuộc từng môn học. |
| 4 | `questions` | Ngân hàng câu hỏi (Nội dung, môn học, chương, ảnh minh họa, xóa mềm). |
| 5 | `answers` | Danh sách các đáp án của từng câu hỏi (Nội dung, ảnh, cờ `is_correct`). |
| 6 | `exams` | Thông tin kỳ thi trực tuyến (Tiêu đề, thời lượng, khung giờ bắt đầu/kết thúc, số biến thể đề). |
| 7 | `exam_chapter_configs` | Cấu hình số lượng câu hỏi lấy từ mỗi chương cho một kỳ thi. |
| 8 | `exam_variants` | Danh sách các đề thi biến thể (Variant) đã được sinh và tráo sẵn. |
| 9 | `exam_variant_questions` | Danh sách câu hỏi và thứ tự đã tráo trong từng mã đề Variant. |
| 10 | `exam_variant_answers` | Danh sách đáp án và thứ tự đã tráo cho từng câu trong Variant. |
| 11 | `exam_participants` | Phân công danh sách thí sinh (Student) được phép tham gia kỳ thi. |
| 12 | `exam_sessions` | Phiên làm bài của thí sinh (Thời gian bắt đầu/nộp, trạng thái `IN_PROGRESS`, `COMPLETED`). |
| 13 | `user_answers` | Ghi nhận các câu trả lời của thí sinh trong phiên thi. |
| 14 | `user_answer_selections` | Ghi nhận chi tiết đáp án thí sinh chọn (hỗ trợ chọn nhiều câu đúng). |
| 15 | `results` | Kết quả chấm điểm bài thi (Tổng điểm, số câu đúng, tỷ lệ phần trăm, ngày chấm). |
| 16 | `paper_exams` | Đề thi giấy độc lập (Tiêu đề, môn học, thời lượng, trạng thái, người tạo). |
| 17 | `paper_exam_chapter_configs` | Cấu hình câu hỏi theo chương cho đề thi giấy. |
| 18 | `paper_exam_questions` | Snapshot danh sách câu hỏi được đóng gói vào đề thi giấy. |
| 19 | `paper_exam_answers` | Snapshot đáp án tương ứng của từng câu hỏi trong đề thi giấy. |

---

## 🔐 Phân Quyền 3 Cấp (Role-Based Access Control)

Hệ thống phân chia quyền hạn chặt chẽ theo 3 cấp độ:

| Tính Năng / Action | ADMIN | TEACHER | STUDENT |
|---|:---:|:---:|:---:|
| **Đăng nhập hệ thống** | ✅ | ✅ | ✅ |
| **Tạo tài khoản Giáo viên (TEACHER)** | ✅ | ❌ | ❌ |
| **Tạo tài khoản Sinh viên (STUDENT)** | ✅ | ✅ | ❌ |
| **Quản lý / Xóa tài khoản người dùng** | ✅ | ❌ | ❌ |
| **Cập nhật thông tin cá nhân** | ✅ | ✅ (Bản thân) | ❌ |
| **CRUD Môn học & Chương** | ✅ | ✅ | ❌ |
| **CRUD Ngân hàng Câu hỏi & Upload ảnh** | ✅ | ✅ | ❌ |
| **Tạo & Cấu hình Kỳ thi Online** | ✅ | ✅ | ❌ |
| **Phân công thí sinh vào kỳ thi** | ✅ | ✅ | ❌ |
| **Xem danh sách kỳ thi được phân công** | ❌ | ❌ | ✅ |
| **Vào thi & Nộp bài thi trực tuyến** | ❌ | ❌ | ✅ |
| **Xem bảng điểm & Báo cáo kỳ thi** | ✅ | ✅ | ❌ |
| **Xem kết quả & chi tiết bài làm cá nhân** | ❌ | ❌ | ✅ |
| **Tạo đề thi giấy & Xuất file PDF** | ✅ | ✅ | ❌ |
| **Quét phiếu trả lời & Chấm bài thi giấy (Vision)** | ✅ | ✅ | ❌ |

---

## ⚙️ Luồng Nghiệp Vụ & Thuật Toán Core

### 1. Thuật Toán Trộn Đề Tráo Sẵn (Pre-generated Exam Variants)
Khi Giáo viên nhấn **"Tạo kỳ thi"**:
1. **Lấy câu hỏi:** Hệ thống duyệt qua từng `exam_chapter_configs`, chọn ngẫu nhiên $K_i$ câu hỏi từ Chương $i$. Tập hợp các câu hỏi này tạo thành **Đề Gốc (Root Exam)**.
2. **Sinh $N$ mã đề Variant:** Loop $N$ lần:
   - Shuffle (xáo trộn ngẫu nhiên) danh sách câu hỏi của Đề Gốc.
   - Với mỗi câu hỏi, Shuffle danh sách đáp án tương ứng.
   - Lưu mã đề `Variant 1..N` kèm thứ tự câu/đáp án tráo sẵn vào DB.
3. **Ưu điểm:** Khi thí sinh vào thi, hệ thống chỉ cần chọn ngẫu nhiên 1 Variant ID đã có trong DB, không mất thời gian chạy thuật toán tráo đề tại thời điểm hàng trăm thí sinh đồng thời truy cập.

### 2. Thuật Toán Chấm Điểm Tự Động (Auto Grading)
Khi thí sinh **Nộp bài**:
1. Hệ thống thu thập tập hợp các đáp án thí sinh chọn `S_user` cho từng câu hỏi.
2. Lấy tập hợp đáp án đúng `S_correct` của câu hỏi đó trong Variant được gán.
3. **Quy tắc Exact-Set-Match:** 
   $$\text{IsCorrect} = \begin{cases} \text{true} & \text{nếu } S_{\text{user}} \equiv S_{\text{correct}} \\ \text{false} & \text{ngược lại} \end{cases}$$
4. Điểm số bài thi:
   $$\text{Score} = \left( \frac{\text{Số câu trả lời đúng}}{\text{Tổng số câu hỏi}} \right) \times 10.0$$

### 3. Quy Trình Thi Giấy & Tích Hợp Vision/OCR
```text
[Tạo Đề Giấy] ➔ [Snapshot Câu Hỏi] ➔ [Xuất File PDF Đề Thi] ➔ [Phát Đề & Phiếu Form 75]
                                                                         │
[Xem Bảng Điểm] ◄── [Backend Chấm Điểm] ◄── [Nhận Kết Quả Scan] ◄── [Quét Ảnh Scan/Camera]
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 📋 1. Yêu Cầu Môi Trường (Prerequisites)
- **Java Development Kit (JDK):** Version 21 trở lên.
- **Node.js:** Version 18.x hoặc 20.x trở lên (đi kèm `npm`).
- **Database:** MySQL 8.0 trở lên.
- **Maven:** 3.8+ (hoặc dùng wrapper `mvnw` đi kèm backend).

---

### 🗄 2. Cấu Hình Cơ Sở Dữ Liệu (MySQL)

1. Mở MySQL Client (hoặc MySQL Workbench, DBeaver, phpMyAdmin) và tạo database trống:
   ```sql
   CREATE DATABASE online_exam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Nạp dữ liệu khởi tạo (Database Schema & Sample Data):
   Chạy file SQL tại đường dẫn `backend/sql_init/init.sql`:
   ```bash
   mysql -u root -p online_exam_db < backend/sql_init/init.sql
   ```

---

### ☕ 3. Cấu Hình & Chạy Backend (Spring Boot)

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd backend
   ```

2. **Kiểm tra thông tin cấu hình DB:**
   Mở file `src/main/resources/application.properties` và điều chỉnh thông số kết nối MySQL nếu cần:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/online_exam_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=your_password
   ```

3. **Biên dịch và chạy ứng dụng:**
   - Trên **Windows (PowerShell/CMD):**
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
   - Trên **Linux/macOS:**
     ```bash
     ./mvnw spring-boot:run
     ```

4. **Xác nhận Backend hoạt động:**
   - Backend sẽ chạy tại port: `http://localhost:8080`
   - Context Path API: `http://localhost:8080/api/v1`
   - Truy cập Tài liệu Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`

---

### ⚛️ 4. Cấu Hình & Chạy Frontend (React Vite)

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình Biến môi trường (`.env`):**
   Đảm bảo file `.env` chứa thông tin kết nối Backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   VITE_API_ORIGIN=http://localhost:8080
   VITE_BACKEND_ORIGIN=http://localhost:8080
   ```

4. **Khởi chạy máy chủ phát triển (Dev Server):**
   ```bash
   npm run dev
   ```

5. **Truy cập ứng dụng Web:**
   Vite sẽ khởi tạo ứng dụng tại địa chỉ: `http://localhost:5173` (hoặc port được cấp tự động).

---

### 🔑 5. Tài Khoản Đăng Nhập Mặc Định

Khi ứng dụng khởi động lần đầu, hệ thống tự động khởi tạo (seed) tài khoản Quản trị viên mặc định:

| Vai Trò (Role) | Username | Password | Quyền Hạn |
|---|---|---|---|
| **ADMIN** | `admin` | `12345678` | Quyền Quản trị viên cao nhất hệ thống |

> 💡 **Lưu ý:** Sau khi đăng nhập bằng tài khoản `admin`, bạn có thể tạo thêm tài khoản `TEACHER` (Giáo viên) và `STUDENT` (Sinh viên) từ giao diện Quản lý người dùng.

---

## 📡 Danh Sách API Endpoints (RESTful API)

Tất cả các API ngoại trừ `/auth/login` đều yêu cầu cookie phiên `EXAMSESSION` (HttpOnly, do server set khi đăng nhập).
Các request `POST`/`PUT`/`DELETE` cần gửi kèm header `X-XSRF-TOKEN` lấy từ cookie `XSRF-TOKEN`.

### 🔑 1. Authentication & User Management (`/api/v1/auth`, `/api/v1/users`)
- `POST /auth/login` - Đăng nhập hệ thống (set cookie `EXAMSESSION` + `XSRF-TOKEN`, trả về thông tin người dùng & role).
- `POST /auth/logout` - Đăng xuất (invalidate phiên hiện tại).
- `GET /auth/me` - Thông tin người dùng hiện tại (khôi phục trạng thái sau khi reload trang).
- `POST /users/teachers` - *(Admin)* Tạo tài khoản Giáo viên mới.
- `POST /users/students` - *(Admin/Teacher)* Tạo tài khoản Sinh viên mới (sinh username/password tự động).
- `GET /users` - *(Admin/Teacher)* Lấy danh sách người dùng (hỗ trợ phân trang, lọc theo role, tìm kiếm).
- `PUT /users/{id}` - *(Admin)* Sửa thông tin tài khoản người dùng bất kỳ.
- `PUT /users/me` - *(Admin/Teacher)* Tự cập nhật thông tin cá nhân.
- `DELETE /users/{id}` - *(Admin)* Xóa mềm tài khoản người dùng.

### 📚 2. Môn Học & Chương (`/api/v1/subjects`)
- `GET /subjects` - Lấy danh sách tất cả môn học.
- `POST /subjects` - *(Admin/Teacher)* Tạo môn học mới.
- `PUT /subjects/{id}` - *(Admin/Teacher)* Cập nhật tên/mã môn học.
- `DELETE /subjects/{id}` - *(Admin/Teacher)* Xóa mềm môn học.
- `GET /subjects/{subjectId}/chapters` - Lấy danh sách chương theo môn học.
- `POST /subjects/{subjectId}/chapters` - *(Admin/Teacher)* Thêm chương mới vào môn học.

### ❓ 3. Ngân Hàng Câu Hỏi & Đáp Án (`/api/v1/questions`)
- `GET /questions` - *(Admin/Teacher)* Danh sách câu hỏi (lọc theo môn, chương, từ khóa, phân trang).
- `POST /questions` - *(Admin/Teacher)* Tạo câu hỏi kèm danh sách đáp án (hỗ trợ upload ảnh multipart).
- `PUT /questions/{id}` - *(Admin/Teacher)* Cập nhật nội dung câu hỏi, đáp án, ảnh minh họa.
- `DELETE /questions/{id}` - *(Admin/Teacher)* Xóa mềm câu hỏi.

### 📝 4. Quản Lý Kỳ Thi Online (`/api/v1/exams`)
- `GET /exams` - Danh sách các kỳ thi (Admin/Teacher thấy tất cả; Student chỉ thấy kỳ thi được tham gia).
- `POST /exams` - *(Admin/Teacher)* Tạo kỳ thi mới, cấu hình chương, đặt `maxAttempts` (số lượt thi tối đa) và tự động sinh $N$ mã đề Variant (kèm snapshot đóng băng đề).
- `POST /exams/{id}/participants` - *(Admin/Teacher)* Phân công danh sách sinh viên tham gia kỳ thi.
- `GET /exams/{id}/variants` - *(Admin/Teacher)* Xem danh sách các mã đề tráo sẵn của kỳ thi.

### ⏱ 5. Phiên Thi & Làm Bài (`/api/v1/sessions`)
- `POST /sessions/start/{examId}` - *(Student)* Bắt đầu làm bài thi (gán mã đề Variant ngẫu nhiên). Nếu đang có phiên `DOING` sẽ **trả lại phiên cũ** (resume) kèm đáp án đã autosave.
- `GET /sessions/active` - *(Student)* Phiên thi đang diễn ra hiện tại — dùng để **khôi phục sau khi đóng trình duyệt** (trả `204` nếu không có).
- `GET /sessions/{sessionId}` - *(Student)* Chi tiết phiên thi: `deadlineAt`, `remainingSeconds`, `attemptNo`, `maxAttempts`.
- `GET /sessions/{sessionId}/questions` - *(Student)* Lấy đề thi đã gán (đọc từ **snapshot**).
- `GET /sessions/{sessionId}/answers` - *(Student)* Lấy đáp án nháp đã autosave.
- `PUT /sessions/{sessionId}/answers` - *(Student)* **Autosave** đáp án (không chấm điểm, không đổi trạng thái).
- `POST /sessions/{sessionId}/submit` - *(Student)* Nộp bài thi (chấm điểm tự động ngay lập tức).

> **Cơ chế bảo vệ phiên thi:**
> - **Số lượt thi**: mỗi kỳ thi cấu hình `maxAttempts` (mặc định 1). Hết lượt → `400` với message rõ ràng.
> - **Hạn chót server-side**: `deadlineAt = min(startTime + duration, exams.endTime)`. Server là nguồn sự thật; mọi response trả kèm `serverTime` + `remainingSeconds` nên FE không tự đếm ngược.
> - **Cửa sổ gia hạn**: submit trong `grace = min(300s, max(15s, duration × 5%))` vẫn được nhận (`submitSource = GRACE`); quá hạn thì server tự nộp (`submitSource = TIMEOUT`).
> - **Scheduler**: quét mỗi 15 giây, tự nộp phiên quá hạn bằng draft đã autosave. Mọi request chạm phiên cũng kiểm tra hạn chót ngay (lazy check).
> - **Snapshot đề**: nội dung câu hỏi/đáp án và cờ đáp án đúng được đóng băng lúc tạo kỳ thi → sửa ngân hàng câu hỏi sau đó **không** ảnh hưởng đề đang thi hay kết quả chấm.

### 📊 6. Kết Quả & Báo Cáo (`/api/v1/results`)
- `GET /results/my-results` - *(Student)* Xem lịch sử kết quả các bài thi cá nhân.
- `GET /results/exam/{examId}` - *(Admin/Teacher)* Xem bảng điểm toàn bộ thí sinh trong kỳ thi.

### 📄 7. Đề Thi Giấy & Vision Integration (`/api/v1/paper-exams`)
- `POST /paper-exams` - *(Admin/Teacher)* Tạo đề thi giấy từ kho câu hỏi.
- `GET /paper-exams/{id}/export-pdf` - *(Admin/Teacher)* Xuất file PDF đề thi giấy chuẩn in ấn.
- `GET /paper-exams/{id}/answers` - *(Admin/Teacher)* Xem bảng đáp án chi tiết của đề thi giấy.
- `POST /paper-exams/{id}/scan` - *(Admin/Teacher)* Gửi ảnh scan bài làm giấy sang Vision Service để chấm điểm.

---

## 🛡 Quy Ước Vận Hành & Bảo Mật

1. **Cơ Chế Soft Delete:**
   Hệ thống không xóa vật lý các dòng dữ liệu nghiệp vụ quan trọng. Thao tác xóa đặt thuộc tính `deleted = true`. Mọi câu truy vấn JPA Repository đều được gắn filter `@Where(clause = "deleted = false")` để đảm bảo dữ liệu toàn vẹn lịch sử.

2. **Bảo Mật File Upload:**
   Các tệp tin hình ảnh tải lên được lưu trữ tại thư mục `/uploads/` trên máy chủ và phục vụ dưới dạng tĩnh qua URL mã hóa. Kiểm tra đuôi file và giới hạn dung lượng tối đa 10MB/ảnh.

3. **Đồng Bộ Múi Giờ & Thời Gian Thi:**
   Mọi mốc thời gian (`created_at`, `start_time`, `end_time`) được lưu trữ chuẩn UTC trong DB và convert sang múi giờ địa phương ở Client. Hệ thống tự động chặn nộp bài khi quá hạn `end_time` + thời lượng cho phép.

---

## 🔮 Định Hướng Phát Triển Tương Lai

- [ ] **AI Proctoring:** Tích hợp nhận diện khuôn mặt và phát hiện quaykop qua Webcam trong quá trình thi online.
- [ ] **OCR Trích Xuất Câu Hỏi:** Tự động đọc file PDF/Word đề thi có sẵn để import hàng loạt vào Ngân hàng câu hỏi.
- [ ] **Realtime Monitoring Dashboard:** Giao diện cho giáo viên giám sát tiến độ làm bài của sinh viên theo thời gian thực (Websocket).
- [ ] **Mobile Application:** Phát triển ứng dụng di động (React Native / Flutter) phục vụ sinh viên thi trên máy tính bảng/điện thoại.

---

## 👨‍💻 Tác Giả & Giấy Phép

- **Đơn vị phát triển:** Giang2011 / GR1 Team
- **Phiên bản:** `2.1.0-RELEASE`
- **Tài liệu tham chiếu:** `PROJECT_SPECIFICATION.md` & `API_SPEC.md`
