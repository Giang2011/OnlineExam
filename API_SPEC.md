# 📡 API Specification — Exam Management System

> Đặc tả API chi tiết cho phía Frontend. Tất cả endpoint đều có prefix `server.servlet.context-path` nếu cấu hình (mặc định không có).
>
> **Base URL**: `http://localhost:8080/api/v1`
> 
> > Tất cả endpoint bên dưới được viết theo dạng **path tương đối** so với base URL này. Ví dụ `GET /users` tương ứng với `GET http://localhost:8080/api/v1/users`.
> **Authentication**: Cookie phiên `EXAMSESSION` (HttpOnly) + CSRF header `X-XSRF-TOKEN` (trừ endpoint Public)
> **Content-Type**: `application/json` (trừ Questions POST/PUT dùng `multipart/form-data`)

---

## 📑 Mục lục

1. [Quy ước chung](#-quy-ước-chung)
2. [Authentication](#1-authentication)
3. [Users — Quản lý Tài khoản](#2-users--quản-lý-tài-khoản)
4. [Subjects — Môn học](#3-subjects--môn-học)
5. [Chapters — Chương](#4-chapters--chương)
6. [Questions — Câu hỏi](#5-questions--câu-hỏi)
7. [Uploads — File ảnh](#6-uploads--file-ảnh)
8. [Exams — Kỳ thi](#7-exams--kỳ-thi)
9. [Exam Participants — Thí sinh](#8-exam-participants--thí-sinh)
10. [Exam Sessions — Phiên thi](#9-exam-sessions--phiên-thi)
11. [Results — Kết quả](#10-results--kết-quả)
12. [Error Handling](#-error-handling)
13. [TypeScript Interfaces](#-typescript-interfaces)

---

## 📌 Quy ước chung

### Headers

```
Content-Type: application/json
Cookie: EXAMSESSION=<session_id>; XSRF-TOKEN=<csrf_token>
X-XSRF-TOKEN: <csrf_token>     // bắt buộc cho POST/PUT/DELETE
```

> [!IMPORTANT]
> **Không dùng `Authorization: Bearer` nữa.** Xác thực bằng cookie phiên.
> FE gọi `POST /auth/login` (kèm `credentials: 'include'`), browser tự lưu cookie `EXAMSESSION`.
> Mọi request mutation (POST/PUT/DELETE) phải gửi header `X-XSRF-TOKEN` lấy từ cookie `XSRF-TOKEN`.
> Cookie `XSRF-TOKEN` cần được đọc bằng JS (`document.cookie`) — cố tình không set `HttpOnly` cho nó.

### Response format — Thành công

```json
// Single object
{ "id": 1, "name": "..." }

// List
[{ "id": 1 }, { "id": 2 }]

// Paginated (nếu có)
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 10,
  "number": 0,
  "size": 10
}
```

### Response format — Lỗi

```json
{
  "status": 400,
  "message": "Tổng số câu từ các chương (8) phải bằng số câu hỏi của kỳ thi (10).",
  "timestamp": "2026-04-21T14:30:00"
}
```

### HTTP Status Codes

| Code | Ý nghĩa |
|---|---|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `204` | Xóa thành công (no content) |
| `400` | Bad Request — Dữ liệu không hợp lệ |
| `401` | Unauthorized — Chưa đăng nhập / Token hết hạn |
| `403` | Forbidden — Không có quyền |
| `404` | Not Found — Không tìm thấy tài nguyên |
| `413` | Payload Too Large — File upload vượt quá giới hạn |
| `500` | Internal Server Error |

---

## 1. Authentication

### `POST /auth/login` — Đăng nhập

| | |
|---|---|
| **Auth** | ❌ Public |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "username": "admin",
  "password": "12345678"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | `string` | ✅ | Tên đăng nhập |
| `password` | `string` | ✅ | Mật khẩu |

**Response** `200 OK`:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "name": "admin",
    "studentId": null,
    "role": "ADMIN"
  },
  "role": "ADMIN"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `user` | `object` | Thông tin user vừa đăng nhập |
| `role` | `string` | `"ADMIN"` \| `"TEACHER"` \| `"STUDENT"` |

**Set-Cookie** (trong response header):
```
Set-Cookie: EXAMSESSION=<session_id>; Path=/; HttpOnly; SameSite=Lax
```

**Lưu trữ phía Frontend**:
```typescript
// Không lưu token. Cookie được browser quản lý tự động.
// Chỉ cần dùng fetch với credentials để gửi cookie đi:
const res = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username, password }),
});
```

**Errors**:
| Status | Khi nào |
|---|---|
| `401` | Sai username hoặc password |

> [!WARNING]
> **Không có endpoint đăng ký (`/auth/register`)**. Tài khoản được tạo bởi Admin/Teacher qua API `/users/*`.

---

### `POST /auth/logout` — Đăng xuất

| | | |
|---|---|---|
| **Auth** | ❌ Public (nhưng cần cookie để invalidate đúng phiên) | |

Vô hiệu hoá phiên hiện tại (session bị xoá khỏi DB, cookie hết hiệu lực).

**Response** `204 No Content`

> [!NOTE]
> Endpoint này được bỏ qua CSRF check trong backend.

---

### `GET /auth/me` — Thông tin user hiện tại

| | | |
|---|---|---|
| **Auth** | ✅ Bất kỳ role đã đăng nhập | |

Dùng để khôi phục trạng thái đăng nhập sau khi reload trang (hoặc mở lại trình duyệt).

**Response** `200 OK`:
```json
{
  "id": 1,
  "username": "admin",
  "name": "admin",
  "studentId": null,
  "role": "ADMIN"
}
```

**Errors**:
| Status | Khi nào |
|---|---|
| `401` | Chưa đăng nhập / phiên đã hết hạn |

---

## 2. Users — Quản lý Tài khoản

### `GET /users` — Danh sách Users

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "username": "admin",
    "name": "admin",
    "studentId": null,
    "role": "ADMIN"
  },
  {
    "id": 2,
    "username": "teacher1",
    "name": "Trần Thị B",
    "studentId": null,
    "role": "TEACHER"
  },
  {
    "id": 3,
    "username": "stu_a3x9k2m1",
    "name": "Nguyễn Văn A",
    "studentId": "2021001",
    "role": "STUDENT"
  }
]
```

> **Phân quyền**: ADMIN xem tất cả users. TEACHER chỉ xem STUDENT.

---

### `GET /users/{id}` — Chi tiết User

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
{
  "id": 3,
  "username": "stu_a3x9k2m1",
  "name": "Nguyễn Văn A",
  "studentId": "2021001",
  "role": "STUDENT"
}
```

> **Phân quyền**: TEACHER chỉ xem được STUDENT. Xem ADMIN/TEACHER khác → `401`.

---

### `POST /users/students` — Tạo Student

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "studentId": "2021001",
  "name": "Nguyễn Văn A"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `studentId` | `string` | ✅ | Mã số sinh viên (MSSV), unique |
| `name` | `string` | ✅ | Tên hiển thị |

**Response** `201 Created`:
```json
{
  "id": 5,
  "studentId": "2021001",
  "name": "Nguyễn Văn A",
  "username": "stu_a3x9k2m1",
  "password": "P@k7mN2xQ5",
  "role": "STUDENT"
}
```

> [!CAUTION]
> **`username` và `password` chỉ trả về 1 lần duy nhất trong response này!** Frontend PHẢI hiển thị popup cho Admin/Teacher ghi lại credentials trước khi đóng.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | MSSV đã tồn tại |

---

### `POST /users/teachers` — Tạo Teacher

| | |
|---|---|
| **Auth** | ✅ `ADMIN` only |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "username": "teacher1",
  "password": "securePass123",
  "name": "Trần Thị B"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | `string` | ✅ | Tên đăng nhập, unique |
| `password` | `string` | ✅ | Mật khẩu |
| `name` | `string` | ✅ | Tên hiển thị |

**Response** `201 Created`:
```json
{
  "id": 4,
  "username": "teacher1",
  "name": "Trần Thị B",
  "studentId": null,
  "role": "TEACHER"
}
```

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Username đã tồn tại |
| `403` | Caller không phải ADMIN |

---

### `PUT /users/{id}` — Cập nhật User (Teacher)

| | |
|---|---|
| **Auth** | ✅ `ADMIN` only |
| **Content-Type** | `application/json` |

> Endpoint này chỉ cho phép sửa tài khoản có role `TEACHER`. Nếu user đích không phải TEACHER, backend trả lỗi rõ ràng.

**Request Body**: Tùy theo field cần sửa.

---

### `PUT /users/me` — Teacher tự cập nhật

| | |
|---|---|
| **Auth** | ✅ `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body** (tất cả optional):
```json
{
  "username": "new_teacher_name",
  "password": "newPass456",
  "name": "Tên mới"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | `string` | ❌ | Username mới (check unique) |
| `password` | `string` | ❌ | Password mới |
| `name` | `string` | ❌ | Tên hiển thị mới |

**Response** `200 OK`:
```json
{
  "id": 4,
  "username": "new_teacher_name",
  "name": "Tên mới",
  "studentId": null,
  "role": "TEACHER"
}
```

---

### `DELETE /users/{id}` — Xóa User (Soft Delete)

| | |
|---|---|
| **Auth** | ✅ `ADMIN` only |

**Response** `204 No Content`

> Soft delete — dữ liệu vẫn còn trong DB nhưng không xuất hiện trong các query.

---

## 3. Subjects — Môn học

### `GET /subjects` — Danh sách Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "name": "Toán cao cấp",
    "chapters": [
      { "id": 1, "subjectId": 1, "name": "Chương 1 - Đại cương", "questionCount": 20 },
      { "id": 2, "subjectId": 1, "name": "Chương 2 - Giải tích", "questionCount": 15 }
    ]
  }
]
```

---

### `GET /subjects/{id}` — Chi tiết Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
{
  "id": 1,
  "name": "Toán cao cấp",
  "chapters": [
    { "id": 1, "subjectId": 1, "name": "Chương 1 - Đại cương", "questionCount": 20 },
    { "id": 2, "subjectId": 1, "name": "Chương 2 - Giải tích", "questionCount": 15 }
  ]
}
```

---

### `POST /subjects` — Tạo Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Toán cao cấp"
}
```

**Response** `201 Created`: SubjectResponseDTO

---

### `PUT /subjects/{id}` — Cập nhật Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Toán cao cấp (sửa)"
}
```

**Response** `200 OK`: SubjectResponseDTO

---

### `DELETE /subjects/{id}` — Xóa Môn học

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 4. Chapters — Chương

> Chapters là nested resource của Subjects: `/subjects/{subjectId}/chapters`

### `GET /subjects/{subjectId}/chapters` — DS Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  { "id": 1, "subjectId": 1, "name": "Chương 1 - Đại cương", "questionCount": 20 },
  { "id": 2, "subjectId": 1, "name": "Chương 2 - Giải tích", "questionCount": 15 }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `number` | ID chương |
| `subjectId` | `number` | ID môn học cha |
| `name` | `string` | Tên chương |
| `chapterOrder` | — | Đã loại bỏ khỏi contract backend |
| `questionCount` | `number` | Số câu hỏi hiện có trong chương |

---

### `POST /subjects/{subjectId}/chapters` — Tạo Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Chương 3 - Xác suất"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `name` | `string` | ✅ | Tên chương |

**Response** `201 Created`: ChapterResponseDTO

**Errors**:
| Status | Khi nào |
|---|---|
| `404` | Subject không tồn tại |

---

### `PUT /subjects/{subjectId}/chapters/{id}` — Sửa Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "name": "Chương 3 - Xác suất (sửa)"
}
```

**Response** `200 OK`: ChapterResponseDTO

---

### `DELETE /subjects/{subjectId}/chapters/{id}` — Xóa Chương

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 5. Questions — Câu hỏi

> [!IMPORTANT]
> POST và PUT dùng `multipart/form-data`, **KHÔNG** dùng `application/json`.

### `GET /questions` — Danh sách Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Query Parameters**:

| Param | Type | Mô tả |
|---|---|---|
| `subjectId` | `number` | Filter theo môn học |
| `chapterId` | `number` | Filter theo chương |
| `page` | `number` | Trang (0-indexed) |
| `size` | `number` | Số item/trang |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "content": "2 + 2 = ?",
    "imageUrl": "abc123-uuid.jpg",
    "subjectId": 1,
    "chapterId": 1,
    "answers": [
      { "id": 1, "content": "3", "imageUrl": null, "isCorrect": false },
      { "id": 2, "content": "4", "imageUrl": null, "isCorrect": true },
      { "id": 3, "content": "5", "imageUrl": null, "isCorrect": false },
      { "id": 4, "content": "6", "imageUrl": null, "isCorrect": false }
    ]
  }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `number` | ID câu hỏi |
| `content` | `string` | Nội dung câu hỏi |
| `imageUrl` | `string \| null` | Có thể là filename hoặc path đã gồm `/uploads/` (ví dụ `/uploads/answers/...`). Nếu là filename thì truy cập qua `/uploads/{imageUrl}` |
| `subjectId` | `number` | ID môn học |
| `chapterId` | `number` | ID chương |
| `answers` | `Answer[]` | Danh sách đáp án |

---

### `GET /questions/{id}` — Chi tiết Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`: QuestionResponseDTO (như trên)

---

### `POST /questions` — Tạo Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `multipart/form-data` |

**Multipart Parts**:

| Part Name | Type | Required | Mô tả |
|---|---|---|---|
| `data` | Text (JSON string) | ✅ | Dữ liệu câu hỏi (xem format bên dưới) |
| `questionImage` | File | ❌ | Ảnh minh họa câu hỏi |
| `answerImages` | File[] | ❌ | Ảnh minh họa đáp án (theo thứ tự index) |

**JSON trong part `data`**:
```json
{
  "content": "Hình nào dưới đây là hình vuông?",
  "subjectId": 1,
  "chapterId": 2,
  "answers": [
    { "content": "Hình A", "isCorrect": false },
    { "content": "Hình B", "isCorrect": true },
    { "content": "Hình C", "isCorrect": false },
    { "content": "Hình D", "isCorrect": false }
  ]
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `content` | `string` | ✅ | Nội dung câu hỏi |
| `subjectId` | `number` | ✅ | ID môn học |
| `chapterId` | `number` | ✅ | ID chương |
| `answers` | `AnswerDTO[]` | ✅ | Tối thiểu 2 đáp án |
| `answers[].content` | `string` | ✅ | Nội dung đáp án |
| `answers[].isCorrect` | `boolean` | ✅ | Đáp án đúng? |

**Code ví dụ (TypeScript)**:
```typescript
const createQuestion = async (
  data: QuestionRequest,
  questionImage?: File,
  answerImages?: File[]
) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));

  if (questionImage) {
    formData.append('questionImage', questionImage);
  }

  if (answerImages) {
    answerImages.forEach((file) => {
      formData.append('answerImages', file);
    });
  }

  return axiosClient.post('/questions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

**Response** `201 Created`: QuestionResponseDTO

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Thiếu required fields, ít hơn 2 answers |
| `404` | Subject hoặc Chapter không tồn tại |
| `413` | File vượt quá 10MB (file) / 15MB (request) |

**File upload hỗ trợ**: JPEG, PNG, GIF, WebP, SVG

---

### `PUT /questions/{id}` — Cập nhật Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `multipart/form-data` |

Giống POST, nhưng có thêm cơ chế gỡ ảnh cũ bằng cờ trong JSON part `data`.

**Multipart Parts**:

| Part Name | Type | Required | Mô tả |
|---|---|---|---|
| `data` | Text (JSON string) | ✅ | Dữ liệu câu hỏi (xem format bên dưới) |
| `questionImage` | File | ❌ | Ảnh minh họa câu hỏi (nếu có file mới thì thay ảnh cũ) |
| `answerImages` | File[] | ❌ | Ảnh minh họa đáp án (theo thứ tự index) |

**JSON trong part `data`**:
```json
{
  "content": "Noi dung cau hoi",
  "subjectId": 1,
  "chapterId": 2,
  "questionImageRemoved": true,
  "answers": [
    { "content": "A", "isCorrect": false, "imageRemoved": false },
    { "content": "B", "isCorrect": true, "imageRemoved": true }
  ]
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `questionImageRemoved` | `boolean` | ❌ | `true` để xóa ảnh câu hỏi hiện tại khi không upload file mới |
| `answers[].imageRemoved` | `boolean` | ❌ | `true` để xóa ảnh đáp án hiện tại (theo đúng index) |

**Quy tắc cập nhật ảnh**:
- Có file mới -> thay ảnh cũ (ảnh cũ bị xóa khỏi thư mục `uploads/`).
- Không có file mới + `questionImageRemoved = true` -> xóa ảnh câu hỏi.
- Với đáp án: nếu có file mới ở index đó -> thay; nếu không có file mới và `imageRemoved = true` -> xóa.
- Không có file mới và không set cờ -> giữ nguyên ảnh cũ.

---

### `DELETE /questions/{id}` — Xóa Câu hỏi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 6. Uploads — File ảnh

### `GET /uploads/{filename}` — Truy cập ảnh

| | |
|---|---|
| **Auth** | ❌ Public |

**Ví dụ**:
```
GET /uploads/a1b2c3d4-uuid.jpg
```

**Frontend sử dụng**:
```tsx
const rawImage = question.imageUrl;
const imagePath = rawImage
  ? rawImage.startsWith('/uploads/')
    ? rawImage
    : `/uploads/${rawImage}`
  : null;

// Nếu dùng Vite proxy (dev)
<img src={imagePath ?? undefined} alt="Ảnh câu hỏi" />

// Nếu không dùng proxy
<img src={imagePath ? `http://localhost:8080${imagePath}` : undefined} alt="Ảnh câu hỏi" />
```

> [!NOTE]
> `imageUrl` có thể là `null` — luôn kiểm tra trước khi render `<img>`.

---

## 7. Exams — Kỳ thi

### `GET /exams` — Danh sách Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ALL` (auto-filter theo role) |

- **ADMIN/TEACHER**: Trả tất cả kỳ thi
- **STUDENT**: Chỉ trả kỳ thi mà student được phân công

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "title": "Kiểm tra giữa kỳ - Toán",
    "subjectId": 1,
    "subjectName": "Toán cao cấp",
    "duration": 60,
    "totalQuestions": 10,
    "totalVariants": 4,
    "maxAttempts": 1,
    "startTime": "2026-05-01T08:00:00",
    "endTime": "2026-05-01T10:00:00"
  }
]
```

---

### `GET /exams/{id}` — Chi tiết Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ALL` |

**Response** `200 OK`: ExamResponseDTO (như trên, có thể kèm thêm chapterConfigs)

---

### `POST /exams` — Tạo Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "title": "Kiểm tra giữa kỳ - Toán",
  "subjectId": 1,
  "duration": 60,
  "totalQuestions": 10,
  "totalVariants": 4,
  "maxAttempts": 2,
  "chapterConfigs": [
    { "chapterId": 1, "questionCount": 5 },
    { "chapterId": 2, "questionCount": 3 },
    { "chapterId": 3, "questionCount": 2 }
  ],
  "startTime": "2026-05-01T08:00:00",
  "endTime": "2026-05-01T10:00:00"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `title` | `string` | ✅ | Tên kỳ thi |
| `subjectId` | `number` | ✅ | ID môn học |
| `duration` | `number` | ✅ | Thời lượng (phút) |
| `totalQuestions` | `number` | ✅ | Tổng số câu hỏi |
| `totalVariants` | `number` | ✅ | Tổng số đề (1 gốc + N-1 tráo), ≥ 1 |
| `maxAttempts` | `number` | ❌ | Số lần thi tối đa cho mỗi thí sinh (mặc định `1`) |
| `chapterConfigs` | `ChapterConfig[]` | ✅ | Cấu hình số câu/chương |
| `chapterConfigs[].chapterId` | `number` | ✅ | ID chương |
| `chapterConfigs[].questionCount` | `number` | ✅ | Số câu lấy từ chương này |
| `startTime` | `string (ISO)` | ❌ | Thời gian bắt đầu |
| `endTime` | `string (ISO)` | ❌ | Thời gian kết thúc |

**Validation Rules**:
1. `Σ chapterConfigs[].questionCount == totalQuestions` — Tổng câu phải khớp
2. Mỗi `questionCount ≤ availableQuestions` trong chương đó
3. `totalVariants ≥ 1`
4. Tất cả `chapterId` phải thuộc `subjectId`
5. `maxAttempts ≥ 1` (nếu có truyền)

**Response** `201 Created`: ExamResponseDTO

> [!TIP]
> **Frontend nên validate trước khi submit**: Tính tổng `questionCount` realtime và so sánh với `totalQuestions`. Gọi `GET /subjects/{id}` để biết số câu có sẵn trong mỗi chương.
> Backend hiện bắt buộc cả `startTime` và `endTime`; thiếu một trong hai hoặc `endTime` không lớn hơn `startTime` sẽ bị trả `400`.

**Errors**:
| Status | Message ví dụ |
|---|---|
| `400` | "Tổng số câu từ các chương (8) phải bằng số câu hỏi của kỳ thi (10)." |
| `400` | "Chương 'Đại cương' chỉ có 10 câu hỏi, nhưng yêu cầu 15 câu." |
| `400` | "Chương 'Đại cương' không thuộc môn học này." |
| `404` | "Chương không tìm thấy: 99" |

---

### `PUT /exams/{id}` — Cập nhật Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Điều kiện** | Chỉ kỳ thi `UPCOMING` (chưa bắt đầu) |

---

### `DELETE /exams/{id}` — Xóa Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Điều kiện** | Chỉ kỳ thi `UPCOMING` |

**Response** `204 No Content`

---

## 8. Exam Participants — Thí sinh

### `POST /exams/{examId}/participants` — Thêm Thí sinh

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "userId": 5
}
```

**Response** `201 Created`

---

### `GET /exams/{examId}/participants` — DS Thí sinh

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "userId": 5,
    "username": "stu_a3x9k2m1",
    "name": "Nguyễn Văn A",
    "studentId": "2021001"
  }
]
```

---

### `DELETE /exams/{examId}/participants/{userId}` — Xóa Thí sinh

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

---

## 9. Exam Sessions — Phiên thi

### `POST /sessions/start/{examId}` — Bắt đầu (hoặc khôi phục) Phiên thi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

Server sẽ:
1. Validate student là participant của exam
2. Kiểm tra thời gian kỳ thi (đã bắt đầu / chưa kết thúc)
3. **Nếu đang có phiên `DOING`** → **trả lại phiên đó** (resume), không tạo phiên mới
4. Kiểm tra số lượt thi còn lại (`exams.maxAttempts`)
5. Random gán 1 variant (đề đã tráo sẵn) — nội dung đã được **đóng băng (snapshot)** từ lúc tạo kỳ thi
6. Tạo `exam_session` với `deadlineAt = min(startTime + duration, exams.endTime)`

**Response** `200 OK`:
```json
{
  "id": 1,
  "examId": 1,
  "examTitle": "Kiểm tra giữa kỳ - Toán",
  "userId": 42,
  "userName": "Nguyễn Văn A",
  "startTime": "2026-05-01T08:05:00",
  "endTime": null,
  "status": "DOING",
  "attemptNo": 1,
  "deadlineAt": "2026-05-01T09:05:00",
  "serverTime": "2026-05-01T08:12:33",
  "remainingSeconds": 3147,
  "submitSource": "MANUAL"
}
```

| Field | Type | Mô tả |
|---|---|---|
| `id` | `number` | Session ID — dùng cho các API tiếp theo |
| `examId` | `number` | ID kỳ thi |
| `userId` | `number` | ID thí sinh |
| `userName` | `string` | Họ tên thí sinh |
| `startTime` | `string` | Thời gian bắt đầu |
| `endTime` | `string \| null` | Thời gian kết thúc (null khi đang thi) |
| `status` | `string` | `"DOING"` \| `"SUBMITTED"` |
| `attemptNo` | `number` | Lượt thi thứ mấy (1..maxAttempts) |
| `deadlineAt` | `string` | **Hạn chót server-side** — nguồn sự thật |
| `serverTime` | `string` | Thời gian hiện tại của server |
| `remainingSeconds` | `number` | Số giây còn lại (có thể âm nếu đã quá hạn) |
| `submitSource` | `string` | `MANUAL` \| `TIMEOUT` \| `GRACE` \| `RESUME` |

> [!IMPORTANT]
> **FE không tự đếm ngược từ `Date.now()`** — luôn dùng `serverTime` + `remainingSeconds`
> từ server để đồng bộ, tránh lệch đồng hồ máy thí sinh.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Student không nằm trong danh sách thí sinh |
| `400` | Kỳ thi chưa bắt đầu / đã kết thúc |
| `400` | Kỳ thi chưa có đề thi nào |
| `400` | **Bạn đã hết lượt thi** (số lượt `SUBMITTED` ≥ `exams.maxAttempts`) |

---

### `GET /sessions/active` — Phiên thi đang diễn ra

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

Dùng để **khôi phục phiên thi sau khi đóng trình duyệt**. FE gọi endpoint này khi mount app.

**Response** `200 OK` (có phiên đang diễn ra):
```json
{
  "sessionId": 1,
  "examId": 1,
  "examTitle": "Kiểm tra giữa kỳ - Toán",
  "attemptNo": 1,
  "status": "DOING",
  "startTime": "2026-05-01T08:05:00",
  "deadlineAt": "2026-05-01T09:05:00",
  "serverTime": "2026-05-01T08:12:33",
  "remainingSeconds": 3147
}
```

**Response** `204 No Content` — không có phiên nào đang diễn ra.

---

### `GET /sessions/{sessionId}` — Chi tiết phiên thi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

**Response** `200 OK`:
```json
{
  "sessionId": 1,
  "examId": 1,
  "examTitle": "Kiểm tra giữa kỳ - Toán",
  "attemptNo": 1,
  "maxAttempts": 3,
  "status": "DOING",
  "startTime": "2026-05-01T08:05:00",
  "endTime": null,
  "deadlineAt": "2026-05-01T09:05:00",
  "serverTime": "2026-05-01T08:12:33",
  "remainingSeconds": 3147,
  "submitSource": "MANUAL",
  "attemptsExhausted": false
}
```

| Field | Type | Mô tả |
|---|---|---|
| `maxAttempts` | `number` | Số lượt thi tối đa của kỳ thi |
| `attemptsExhausted` | `boolean` | `true` nếu thí sinh đã dùng hết lượt |

---

### `GET /sessions/{sessionId}/answers` — Lấy đáp án draft đã autosave

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

**Response** `200 OK`:
```json
{
  "sessionId": 1,
  "attemptNo": 1,
  "answers": [
    { "variantQuestionId": 10, "selectedAnswerIds": [42] },
    { "variantQuestionId": 11, "selectedAnswerIds": [46, 47] }
  ]
}
```

---

### `PUT /sessions/{sessionId}/answers` — Autosave đáp án

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |
| **Content-Type** | `application/json` |

**Request Body** (giống hệt body của `POST /sessions/{sessionId}/submit`):
```json
{
  "answers": [
    { "variantQuestionId": 10, "selectedAnswerIds": [42] },
    { "variantQuestionId": 11, "selectedAnswerIds": [46] }
  ]
}
```

**Response** `200 OK`: trả về trạng thái draft sau khi lưu (giống `GET .../answers`).

| | |
|---|---|
| **Ghi chú** | Không chấm điểm, không đổi `status`. Cập nhật `exam_sessions.last_saved_at`. |

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Câu hỏi không thuộc phiên thi / đáp án không thuộc câu hỏi |
| `400` | Đã quá thời gian thi (bài đã được hệ thống tự nộp) |

> [!TIP]
> FE nên gọi endpoint này **mỗi 15–30 giây** và khi `beforeunload`, để không mất bài khi đóng tab.

---

### `GET /sessions/{sessionId}/questions` — Lấy Đề thi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

**Response** `200 OK`:
```json
[
  {
    "variantQuestionId": 10,
    "content": "H₂O là gì?",
    "imageUrl": null,
    "orderIndex": 1,
    "isMultipleChoice": false,
    "answers": [
      { "answerId": 41, "content": "Muối", "imageUrl": null, "orderIndex": 1 },
      { "answerId": 42, "content": "Nước", "imageUrl": null, "orderIndex": 2 },
      { "answerId": 43, "content": "Đường", "imageUrl": null, "orderIndex": 3 },
      { "answerId": 44, "content": "Axít", "imageUrl": null, "orderIndex": 4 }
    ]
  },
  {
    "variantQuestionId": 11,
    "content": "2 + 2 = ?",
    "imageUrl": "math-image.jpg",
    "orderIndex": 2,
    "isMultipleChoice": true,
    "answers": [
      { "answerId": 45, "content": "6", "imageUrl": null, "orderIndex": 1 },
      { "answerId": 46, "content": "4", "imageUrl": null, "orderIndex": 2 },
      { "answerId": 47, "content": "3", "imageUrl": null, "orderIndex": 3 },
      { "answerId": 48, "content": "5", "imageUrl": null, "orderIndex": 4 }
    ]
  }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `variantQuestionId` | `number` | ID câu hỏi trong variant (dùng để submit) |
| `content` | `string` | Nội dung câu hỏi |
| `imageUrl` | `string \| null` | Ảnh minh họa; nếu đã có prefix `/uploads/` thì dùng trực tiếp, nếu không thì prefix `/uploads/` |
| `orderIndex` | `number` | Thứ tự câu hỏi |
| `isMultipleChoice` | `boolean` | `true` nếu câu có nhiều đáp án đúng |
| `answers[].answerId` | `number` | ID đáp án (dùng để submit) |
| `answers[].content` | `string` | Nội dung đáp án |
| `answers[].imageUrl` | `string \| null` | Ảnh đáp án |
| `answers[].orderIndex` | `number` | Thứ tự đáp án |

> [!WARNING]
> **Không trả về `isCorrect`** — Student không được biết đáp án đúng khi đang thi!

---

### `POST /sessions/{sessionId}/submit` — Nộp bài

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "answers": [
    {
      "variantQuestionId": 10,
      "selectedAnswerIds": [42]
    },
    {
      "variantQuestionId": 11,
      "selectedAnswerIds": [46]
    }
  ]
}
```

| Field | Type | Mô tả |
|---|---|---|
| `answers` | `SubmitAnswer[]` | Danh sách câu trả lời |
| `answers[].variantQuestionId` | `number` | ID câu hỏi trong variant |
| `answers[].selectedAnswerIds` | `number[]` | ID đáp án đã chọn (mảng — hỗ trợ multi-select) |

> [!TIP]
> `selectedAnswerIds` là **mảng** để hỗ trợ câu hỏi có nhiều đáp án đúng. Với câu hỏi single-choice, mảng chỉ có 1 phần tử.

**Response** `200 OK`: Kết quả chấm điểm ngay lập tức
```json
{
  "id": 1,
  "examSessionId": 1,
  "score": 8.0,
  "totalCorrect": 8,
  "totalQuestions": 10,
  "submittedAt": "2026-05-01T08:55:00"
}
```

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Session đã SUBMITTED (chống submit trùng) |
| `400` | **Đã quá thời gian thi** (quá `deadlineAt` + cửa sổ gia hạn) — bài đã được hệ thống tự nộp |

> **Concurrency-safe**: Backend dùng pessimistic write lock. Nếu student click submit 2 lần, lần 2 sẽ nhận `400`.

> [!NOTE]
> **Cửa sổ gia hạn (grace window)**: nếu thí sinh bấm nộp hơi muộn (request về tới BE sau
> `deadlineAt` nhưng chưa vượt `grace` = `min(300s, max(15s, duration * 5%))`), vẫn được nhận
> với `submitSource = "GRACE"`. Quá khoảng đó → bị từ chối, bài được server tự nộp từ draft đã autosave.

> [!IMPORTANT]
> **Server tự nộp bài khi hết giờ.** Một scheduler quét mỗi 15 giây, tự nộp các phiên
> `DOING` đã quá hạn (`submitSource = "TIMEOUT"`), dùng đáp án draft đã autosave.
> Ngoài ra, mọi request chạm vào phiên (đọc đề, xem chi tiết, submit) đều kiểm tra hạn chót
> ngay — nên kết quả luôn sẵn sàng dù cron bị trễ.

---

## 10. Results — Kết quả

### `GET /results/session/{sessionId}` — Kết quả Phiên thi

| | |
|---|---|
| **Auth** | ✅ `ALL` |

**Response** `200 OK`:
```json
{
  "id": 1,
  "examSessionId": 1,
  "score": 8.0,
  "totalCorrect": 8,
  "totalQuestions": 10,
  "submittedAt": "2026-05-01T08:55:00"
}
```

---

### `GET /results/exam/{examId}` — Bảng điểm Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "examSessionId": 1,
    "studentName": "Nguyễn Văn A",
    "studentId": "2021001",
    "score": 8.0,
    "totalCorrect": 8,
    "submittedAt": "2026-05-01T08:55:00"
  },
  {
    "id": 2,
    "examSessionId": 2,
    "studentName": "Trần Văn B",
    "studentId": "2021002",
    "score": 6.5,
    "totalCorrect": 6,
    "submittedAt": "2026-05-01T09:10:00"
  }
]
```

---

### `GET /results/me` — Lịch sử thi của tôi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "examTitle": "Kiểm tra giữa kỳ - Toán",
    "score": 8.0,
    "totalCorrect": 8,
    "totalQuestions": 10,
    "submittedAt": "2026-05-01T08:55:00"
  }
]
```

---

## 11. Paper Exams — Đề giấy

> Module này phục vụ luồng tạo, xem đáp án, xuất PDF và quét phiếu trả lời cho đề giấy. Backend expose controller tại `/paper-exams`.

### `POST /paper-exams` — Tạo đề giấy

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

**Request Body**:
```json
{
  "title": "Đề giữa kỳ - Toán cao cấp",
  "subjectId": 1,
  "durationMinutes": 45,
  "totalQuestions": 10,
  "chapterConfigs": [
    { "chapterId": 1, "questionCount": 5 },
    { "chapterId": 2, "questionCount": 5 }
  ]
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `title` | `string` | ✅ | Tiêu đề đề giấy |
| `subjectId` | `number` | ✅ | ID môn học |
| `durationMinutes` | `number` | ✅ | Thời lượng làm bài (phút) |
| `totalQuestions` | `number` | ✅ | Tổng số câu hỏi |
| `chapterConfigs` | `PaperExamChapterConfigRequest[]` | ✅ | Danh sách cấu hình số câu theo chương |
| `chapterConfigs[].chapterId` | `number` | ✅ | ID chương thuộc môn học |
| `chapterConfigs[].questionCount` | `number` | ✅ | Số câu lấy từ chương đó |

**Validation Rules**:
1. `Σ chapterConfigs[].questionCount == totalQuestions`
2. Mỗi `chapterId` phải thuộc `subjectId`
3. `questionCount` của từng chương không vượt quá số câu có trong kho
4. Mỗi chương chỉ được xuất hiện 1 lần trong `chapterConfigs`

> `showAnswers` không còn là field đầu vào của API tạo đề giấy. Backend luôn lưu snapshot câu hỏi và đáp án để phục vụ xem đáp án, nhưng PDF preview/download sẽ không render cột/trường `isCorrect`.

**Response** `200 OK`:
```json
{
  "id": 1,
  "title": "Đề giữa kỳ - Toán cao cấp",
  "subjectId": 1,
  "subjectName": "Toán cao cấp",
  "durationMinutes": 45,
  "totalQuestions": 10,
  "showAnswers": true,
  "status": "DRAFT",
  "createdById": 2,
  "createdByName": "Trần Thị B",
  "createdAt": "2026-05-28T10:15:30",
  "updatedAt": "2026-05-28T10:15:30",
  "chapterConfigs": [
    { "id": 11, "chapterId": 1, "chapterName": "Chương 1 - Đại cương", "questionCount": 5 },
    { "id": 12, "chapterId": 2, "chapterName": "Chương 2 - Giải tích", "questionCount": 5 }
  ]
}
```

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Tổng câu theo chương không khớp `totalQuestions` |
| `400` | Chương không thuộc môn học đã chọn |
| `400` | Chương yêu cầu nhiều câu hơn số câu hiện có |
| `400` | Một chương xuất hiện nhiều lần trong cấu hình |
| `404` | Môn học hoặc chương không tồn tại |

---

### `GET /paper-exams` — Danh sách đề giấy

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "title": "Đề giữa kỳ - Toán cao cấp",
    "subjectId": 1,
    "subjectName": "Toán cao cấp",
    "durationMinutes": 45,
    "totalQuestions": 10,
    "showAnswers": true,
    "status": "DRAFT",
    "createdById": 2,
    "createdByName": "Trần Thị B",
    "createdAt": "2026-05-28T10:15:30",
    "updatedAt": "2026-05-28T10:15:30",
    "chapterConfigs": []
  }
]
```

---

### `GET /paper-exams/{id}` — Chi tiết đề giấy

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`: giống `PaperExamResponseDTO`.

---

### `GET /paper-exams/{id}/answers` — Xem đáp án

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
{
  "paperExamId": 1,
  "title": "Đề giữa kỳ - Toán cao cấp",
  "showAnswers": true,
  "questions": [
    {
      "id": 101,
      "questionId": 501,
      "chapterId": 1,
      "chapterName": "Chương 1 - Đại cương",
      "orderIndex": 1,
      "content": "2 + 2 = ?",
      "imageUrl": null,
      "answers": [
        { "id": 1001, "answerId": 9001, "orderIndex": 1, "content": "3", "imageUrl": null, "isCorrect": false },
        { "id": 1002, "answerId": 9002, "orderIndex": 2, "content": "4", "imageUrl": null, "isCorrect": true }
      ]
    }
  ]
}
```

> Đây là API duy nhất trả `isCorrect` đầy đủ. Các API PDF sẽ ẩn `isCorrect` khi render.

---

### `GET /paper-exams/{id}/pdf/preview` — Xem trước PDF

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
- `Content-Type`: `application/pdf`
- `Content-Disposition`: `inline; filename="<file-name>.pdf"`

> Dùng để mở xem trước trên trình duyệt hoặc nhúng bằng `<iframe>`/`<object>`. PDF preview không chứa `isCorrect`.

---

### `GET /paper-exams/{id}/pdf` — Tải PDF

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
- `Content-Type`: `application/pdf`
- `Content-Disposition`: `attachment; filename="<file-name>.pdf"`

> PDF tải xuống cũng không chứa `isCorrect`.

---

### `POST /paper-exams/{id}/scan` — Upload ảnh phiếu trả lời và chấm điểm

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `multipart/form-data` |

**Multipart Parts**:

| Part Name | Type | Required | Mô tả |
|---|---|---|---|
| `image` | File | ✅ | Ảnh scan phiếu trả lời |
| `actualQuestionCount` | Text/number | ❌ | Số câu thực tế của đề giấy |
| `formVariant` | Text/number | ❌ | Biến thể form scan, mặc định `75` |
| `debug` | Text/boolean | ❌ | Bật chế độ debug |
| `scanMode` | Text/string | ❌ | Chế độ chấm, mặc định `AUTO` |

**Lưu ý quan trọng**:
- Frontend gửi trực tiếp từng part như trên, **không có part `meta`**.
- Nếu không truyền `actualQuestionCount`, backend sẽ dùng `paperExam.totalQuestions`.
- Nếu không truyền `formVariant`, backend dùng mặc định `75`.
- `scanMode` hiện tại là chuỗi, mặc định `AUTO`.
- `debug` mặc định `false`.

**Request ví dụ**:
```text
image=<file>
actualQuestionCount=10
formVariant=75
debug=false
scanMode=AUTO
```

**Response** `200 OK`:
```json
{
  "id": 9001,
  "status": "SUCCESS",
  "paperExamId": 1,
  "formVariant": 75,
  "actualQuestionCount": 10,
  "totalQuestions": 10,
  "score": 8,
  "totalCorrect": 8,
  "totalWrong": 1,
  "totalEmpty": 1,
  "totalNeedsReview": 0,
  "totalMultiMarked": 0,
  "imagePath": "uploads/paper-exams/1/scan-20260601200727776-656fba43.jpg",
  "createdAt": "2026-06-01T20:07:27",
  "updatedAt": "2026-06-01T20:07:27",
  "questionResults": [
    {
      "questionIndex": 1,
      "selectedOptions": ["A"],
      "correctOptions": ["A"],
      "status": "CORRECT",
      "isEmpty": false,
      "markedCount": 1,
      "confidence": 0.98,
      "note": null
    },
    {
      "questionIndex": 2,
      "selectedOptions": [],
      "correctOptions": ["B"],
      "status": "EMPTY",
      "isEmpty": true,
      "markedCount": 0,
      "confidence": 0,
      "note": null
    }
  ],
  "rawVisionOutput": "{...}",
  "errors": []
}
```

**Response field notes**:
- `status` là trạng thái tổng thể của lần scan.
- `questionResults[].status` là trạng thái chấm theo từng câu, có thể là `CORRECT`, `WRONG`, `EMPTY`, `MULTI_MARKED`, `NEEDS_REVIEW`, `IGNORED`.
- `totalCorrect`, `totalWrong`, `totalEmpty`, `totalNeedsReview`, `totalMultiMarked` là thống kê theo các trạng thái tương ứng.
- `score` được tính theo công thức: `totalCorrect / actualQuestionCount * totalQuestions`.
- `imagePath` là đường dẫn ảnh đã lưu dưới `uploads/`.
- `rawVisionOutput` chỉ dùng cho debug.
- `errors` là danh sách lỗi từ vision service nếu có.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Ảnh không hợp lệ, `actualQuestionCount <= 0`, hoặc không thể lưu ảnh |
| `413` | Ảnh vượt quá giới hạn upload |
| `500` | Vision service lỗi hoặc backend không xử lý được kết quả scan |

---

### `GET /paper-exams/{id}/scan-results` — Danh sách kết quả scan của đề giấy

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 9001,
    "status": "SUCCESS",
    "paperExamId": 1,
    "formVariant": 75,
    "actualQuestionCount": 10,
    "totalQuestions": 10,
    "score": 8,
    "totalCorrect": 8,
    "totalWrong": 1,
    "totalEmpty": 1,
    "totalNeedsReview": 0,
    "totalMultiMarked": 0,
    "imagePath": "uploads/paper-exams/1/scan-20260601200727776-656fba43.jpg",
    "createdAt": "2026-06-01T20:07:27",
    "updatedAt": "2026-06-01T20:07:27",
    "questionResults": [],
    "rawVisionOutput": null,
    "errors": []
  }
]
```

> API này dùng để liệt kê các lần scan đã lưu của một `paperExamId`.

---

### `GET /paper-exams/scan-results/{scanResultId}` — Xem chi tiết kết quả scan

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`: giống cấu trúc trả về từ `POST /paper-exams/{id}/scan`, bao gồm `questionResults`, `rawVisionOutput` và `errors`.

---

### `DELETE /paper-exams/{id}` — Xóa đề giấy

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `204 No Content`

> Xóa mềm, đề giấy vẫn có thể được khôi phục nếu backend hỗ trợ sau này.

## 🚨 Error Handling

### Error Response Format

Tất cả error đều trả về cùng format:

```json
{
  "status": 400,
  "message": "Mô tả lỗi chi tiết bằng tiếng Việt",
  "timestamp": "2026-04-21T14:30:00"
}
```

### Frontend Global Error Handler

```typescript
// axiosClient.ts
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Đã có lỗi xảy ra';

    switch (status) {
      case 401:
        // Phiên đăng nhập hết hạn → gọi /auth/me để xác nhận, rồi redirect login
        window.location.href = '/auth/login';
        break;
      case 403:
        toast.error('Bạn không có quyền thực hiện thao tác này.');
        break;
      case 413:
        toast.error('File upload quá lớn. Tối đa 10MB/file.');
        break;
      default:
        toast.error(message);
    }

    return Promise.reject(error);
  }
);
```

### File Upload Limits

| Config | Giá trị |
|---|---|
| Max file size (mỗi file) | **10 MB** |
| Max request size (tổng) | **15 MB** |
| Định dạng hỗ trợ | JPEG, PNG, GIF, WebP, SVG |

---

---

## 📎 Quick Reference

### Endpoint Summary

| Module | Method | Endpoint | Auth |
|---|---|---|---|
| **Auth** | `POST` | `/auth/login` | Public |
| | `POST` | `/auth/logout` | Public |
| | `GET` | `/auth/me` | ALL |
| **Users** | `GET` | `/users` | ADMIN, TEACHER |
| | `GET` | `/users/{id}` | ADMIN, TEACHER |
| | `POST` | `/users/students` | ADMIN, TEACHER |
| | `POST` | `/users/teachers` | ADMIN |
| | `PUT` | `/users/{id}` | ADMIN |
| | `PUT` | `/users/me` | TEACHER |
| | `DELETE` | `/users/{id}` | ADMIN |
| **Subjects** | `GET` | `/subjects` | ADMIN, TEACHER |
| | `GET` | `/subjects/{id}` | ADMIN, TEACHER |
| | `POST` | `/subjects` | ADMIN, TEACHER |
| | `PUT` | `/subjects/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/subjects/{id}` | ADMIN, TEACHER |
| **Chapters** | `GET` | `/subjects/{subjectId}/chapters` | ADMIN, TEACHER |
| | `POST` | `/subjects/{subjectId}/chapters` | ADMIN, TEACHER |
| | `PUT` | `/subjects/{subjectId}/chapters/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/subjects/{subjectId}/chapters/{id}` | ADMIN, TEACHER |
| **Questions** | `GET` | `/questions` | ADMIN, TEACHER |
| | `GET` | `/questions/{id}` | ADMIN, TEACHER |
| | `POST` | `/questions` | ADMIN, TEACHER |
| | `PUT` | `/questions/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/questions/{id}` | ADMIN, TEACHER |
| **Uploads** | `GET` | `/uploads/**` | Public |
| **Exams** | `GET` | `/exams` | ALL |
| | `GET` | `/exams/{id}` | ALL |
| | `POST` | `/exams` | ADMIN, TEACHER |
| | `PUT` | `/exams/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/exams/{id}` | ADMIN, TEACHER |
| **Participants** | `POST` | `/exams/{id}/participants` | ADMIN, TEACHER |
| | `GET` | `/exams/{id}/participants` | ADMIN, TEACHER |
| | `DELETE` | `/exams/{id}/participants/{userId}` | ADMIN, TEACHER |
| **Sessions** | `POST` | `/sessions/start/{examId}` | STUDENT |
| | `GET` | `/sessions/active` | STUDENT |
| | `GET` | `/sessions/{id}` | STUDENT |
| | `GET` | `/sessions/{id}/questions` | STUDENT |
| | `GET` | `/sessions/{id}/answers` | STUDENT |
| | `PUT` | `/sessions/{id}/answers` | STUDENT |
| | `POST` | `/sessions/{id}/submit` | STUDENT |
| **Results** | `GET` | `/results/session/{sessionId}` | ALL |
| | `GET` | `/results/exam/{examId}` | ADMIN, TEACHER |
| | `GET` | `/results/me` | STUDENT |
| **Paper Exams** | `POST` | `/paper-exams` | ADMIN, TEACHER |
| | `GET` | `/paper-exams` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/answers` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/pdf/preview` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/pdf` | ADMIN, TEACHER |
| | `POST` | `/paper-exams/{id}/scan` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/scan-results` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/scan-results/{scanResultId}` | ADMIN, TEACHER |
| | `DELETE` | `/paper-exams/{id}` | ADMIN, TEACHER |
