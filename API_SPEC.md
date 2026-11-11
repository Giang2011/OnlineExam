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
12. [Paper Exams — Đề giấy](#11-paper-exams--đề-giấy)
13. [Error Handling](#-error-handling)
14. [Quick Reference](#-quick-reference)

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
| `204` | Xóa thành công (no content) — cũng dùng cho `GET /sessions/active` khi không có phiên đang chạy |
| `400` | Bad Request — Dữ liệu không hợp lệ |
| `401` | Unauthorized — Chưa đăng nhập / Token hết hạn |
| `403` | Forbidden — Đã đăng nhập nhưng không đủ quyền (service hoặc Spring Security `AccessDeniedHandler`) |
| `404` | Not Found — Không tìm thấy tài nguyên |
| `413` | Payload Too Large — File upload vượt quá giới hạn (10MB/file, 15MB/request) |
| `500` | Internal Server Error |

> [!NOTE]
> **File upload vượt quá giới hạn trả về `413 Payload Too Large`** với message
> "File upload vượt quá kích thước cho phép (tối đa 10MB/file, 15MB/request)."

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

> **Phân quyền**: TEACHER chỉ xem được STUDENT. Xem ADMIN/TEACHER khác → `403`.

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

> [!CAUTION]
> Endpoint này chỉ cho phép sửa tài khoản có role `TEACHER`. Nếu user đích không phải TEACHER, backend trả lỗi rõ ràng (`400` — "Chỉ được sửa tài khoản có role TEACHER.").

**Request Body** — **partial update**: chỉ cần gửi field muốn đổi, field bỏ trống/null sẽ được giữ nguyên:

```json
{
  "username": "teacher1",
  "password": "securePass123",
  "name": "Trần Thị B"
}
```

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `username` | `string` | ❌ | Username mới (check unique) |
| `password` | `string` | ❌ | Mật khẩu mới (đã hash) |
| `name` | `string` | ❌ | Tên hiển thị mới |

> [!TIP]
> Gửi `{}` (rỗng) → không có gì thay đổi, trả về user hiện tại.

**Response** `200 OK`: UserResponseDTO
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
| `400` | Username đã tồn tại, hoặc user đích không phải TEACHER |
| `400` | Username đã tồn tại |
| `404` | User không tồn tại |

---

### `PUT /users/me` — Teacher/Admin tự cập nhật

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Content-Type** | `application/json` |

> [!NOTE]
> Cả `ADMIN` và `TEACHER` đều dùng được endpoint này. `STUDENT` gọi → `403`.

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

**Errors**:
| Status | Khi nào |
|---|---|
| `403` | Caller là `STUDENT` |
| `400` | Username đã tồn tại |

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
    { "id": 1, "subjectId": 1, "name": "Chương 1 - đại cương", "questionCount": 20 },
    { "id": 2, "subjectId": 1, "name": "Chương 2 - Giải tích", "questionCount": 15 }
  ]
}
```

**Errors**:
| Status | Message ví dụ |
|---|---|
| `404` | "Môn học không tìm thấy với id: 999." |

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
| `keyword` | `string` | Tìm trong `content` của câu hỏi (không phân biệt hoa thường) |
| `page` | `number` | Trang (0-indexed), mặc định `0` |
| `size` | `number` | Số item/trang, mặc định `20` |

**Response** `200 OK` — **object phân trang kiểu Spring `Page`** (KHÔNG phải mảng thuần):
```json
{
  "content": [
    {
      "id": 1,
      "content": "2 + 2 = ?",
      "imageUrl": "abc123-uuid.jpg",
      "subjectId": 1,
      "subjectName": "Toán cao cấp",
      "chapterId": 1,
      "chapterName": "Chương 1 - Đại cương",
      "createdAt": "2026-04-20T09:00:00",
      "answers": [
        { "id": 1, "content": "3", "imageUrl": null, "isCorrect": false },
        { "id": 2, "content": "4", "imageUrl": null, "isCorrect": true },
        { "id": 3, "content": "5", "imageUrl": null, "isCorrect": false },
        { "id": 4, "content": "6", "imageUrl": null, "isCorrect": false }
      ]
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "number": 0,
  "size": 20,
  "first": true,
  "last": true,
  "empty": false,
  "sort": { "sorted": true, "unsorted": false, "empty": false }
}
```

> [!IMPORTANT]
> FE phải đọc danh sách ở **`response.data.content`**, không phải `response.data` trực tiếp.

| Field (trong `content[]`) | Type | Mô tả |
|---|---|---|
| `id` | `number` | ID câu hỏi |
| `content` | `string` | Nội dung câu hỏi |
| `imageUrl` | `string \| null` | Đường dẫn ảnh, luôn có prefix `/uploads/` (VD `/uploads/questions/uuid.jpg`). Có thể `null` |
| `subjectId` | `number` | ID môn học |
| `subjectName` | `string` | Tên môn học |
| `chapterId` | `number` | ID chương |
| `chapterName` | `string` | Tên chương |
| `createdAt` | `string` | Thời điểm tạo |
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
| `400` | Thiếu required fields (`content`, `subjectId`, `chapterId`), hoặc ít hơn 2 đáp án, hoặc **không có đáp án nào đúng** |
| `400` | Định dạng file ảnh không hỗ trợ (chỉ nhận JPEG, PNG, GIF, WebP, SVG) |
| `400` | File upload vượt quá 10MB (file) / 15MB (request) — **backend trả `413`** |
| `404` | Subject hoặc Chapter không tồn tại |
| `404` | Chapter không thuộc subject đã chọn → thực ra trả `400` ("Chương '...' không thuộc môn học này.") |

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
GET /api/v1/uploads/questions/a1b2c3d4-uuid.jpg
```

> [!NOTE]
> Do `server.servlet.context-path=/api/v1`, URL thật của static resource là
> **`/api/v1/uploads/...`** (đã gồm cả prefix context-path).
>
> `imageUrl` trả về từ API **luôn có sẵn prefix `/uploads/`** (VD `/uploads/questions/uuid.jpg`),
> không bao giờ là filename trần. Nhưng để an toàn, FE vẫn nên check trước khi ghép.

**Frontend sử dụng**:
```tsx
const rawImage = question.imageUrl;
const imagePath = rawImage
  ? rawImage.startsWith('/uploads/')
    ? rawImage
    : `/uploads/${rawImage}`
  : null;

// Nếu dùng Vite proxy (dev) — proxy `/uploads` → backend
<img src={imagePath ?? undefined} alt="Ảnh câu hỏi" />

// Nếu không dùng proxy — nhớ thêm context-path `/api/v1`
<img
  src={imagePath ? `http://localhost:8080/api/v1${imagePath}` : undefined}
  alt="Ảnh câu hỏi"
/>
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
    "endTime": "2026-05-01T10:00:00",
    "status": "UPCOMING",
    "participantCount": 25
  }
]
```

| Field | Type | Mô tả |
|---|---|---|
| `status` | `string` | `UPCOMING` (chưa bắt đầu) \| `ONGOING` (đang diễn ra) \| `COMPLETED` (đã kết thúc) — tính từ `serverTime` |
| `participantCount` | `number` | Số thí sinh đã được phân công (chỉ tính participant chưa bị xoá) |

> [!IMPORTANT]
> - `GET /exams` **lọc theo role**: `ADMIN`/`TEACHER` thấy tất cả; `STUDENT` chỉ thấy kỳ thi được phân công.
> - `GET /exams/{id}` **KHÔNG** lọc — `STUDENT` có thể xem chi tiết bất kỳ kỳ thi nào bằng ID (xem mục "Hạn chế đã biết" ở cuối tài liệu).
> - `maxAttempts` luôn ≥ 1 (backend chuẩn hoá giá trị 0/null về 1).

---

### `GET /exams/{id}` — Chi tiết Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ALL` (có kiểm tra sở hữu cho `STUDENT`) |

**Response** `200 OK`: ExamResponseDTO (giống hệt shape của `GET /exams`, xem bảng field ở trên).

> [!IMPORTANT]
> **Phân quyền theo danh sách thí sinh**: `ADMIN`/`TEACHER` xem được mọi kỳ thi;
> `STUDENT` chỉ xem được kỳ thi mình được phân công. Gọi `id` của kỳ thi khác
> → `403 Forbidden`.

> [!NOTE]
> `ExamResponseDTO` **không** có trường `chapterConfigs`. Cấu hình chương chỉ được dùng nội bộ
> khi tạo kỳ thi (để sinh đề), FE không đọc được từ API này.

**Errors**:
| Status | Khi nào |
|---|---|
| `404` | Không tìm thấy kỳ thi với id |
| `403` | `STUDENT` gọi kỳ thi không thuộc danh sách thí sinh của mình |

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
| `startTime` | `string (ISO)` | ✅ | Thời gian bắt đầu — **bắt buộc** |
| `endTime` | `string (ISO)` | ✅ | Thời gian kết thúc — **bắt buộc** |

**Validation Rules**:
1. `Σ chapterConfigs[].questionCount == totalQuestions` — Tổng câu phải khớp
2. Mỗi `questionCount ≤ availableQuestions` trong chương đó
3. `totalVariants ≥ 1`
4. Tất cả `chapterId` phải thuộc `subjectId`
5. `maxAttempts ≥ 1` (nếu có truyền)
6. `startTime` và `endTime` đều bắt buộc, và `startTime` phải **trước** `endTime`

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
| `400` | "Thời gian bắt đầu và thời gian kết thúc không được để trống." |
| `400` | "Thời gian bắt đầu phải trước thời gian kết thúc." |
| `404` | "Chương không tìm thấy: 99" |

---

### `PUT /exams/{id}` — Cập nhật Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |
| **Điều kiện** | Chỉ kỳ thi `UPCOMING` (chưa bắt đầu) |

**Request Body**: giống hệt `POST /exams` (ExamRequestDTO).

**Response** `200 OK`: ExamResponseDTO

> [!TIP]
> **Backend ĐÃ cập nhật lại `exam_chapter_configs`** khi `PUT` với `chapterConfigs` mới.
> Nếu cấu hình chương thực sự thay đổi, backend **sinh lại toàn bộ đề (variants)**
> để khớp với cấu hình mới (chỉ an toàn khi kỳ thi còn `UPCOMING` — lúc này chưa có
> phiên thi nào dùng đề cũ).
>
> Backend cũng validate lại: mỗi chương phải thuộc `subjectId`, số câu yêu cầu không được
> vượt quá số câu có trong chương, và tổng `questionCount` phải bằng `totalQuestions`.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Kỳ thi không ở trạng thái `UPCOMING` |
| `400` | Chương không thuộc môn học này / số câu yêu cầu vượt số câu có sẵn / tổng `questionCount` ≠ `totalQuestions` |
| `404` | Kỳ thi không tồn tại |

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

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `userId` | `number` | ✅ | ID user (phải có role `STUDENT`) |

**Response** `201 Created` — **không có body**.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | User không có role `STUDENT` |
| `400` | User đã được thêm vào kỳ thi này |
| `404` | Kỳ thi hoặc user không tồn tại |

---

### `GET /exams/{examId}/participants` — DS Thí sinh

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK`:
```json
[
  {
    "id": 5,
    "username": "stu_a3x9k2m1",
    "name": "Nguyễn Văn A",
    "studentId": "2021001",
    "role": "STUDENT"
  }
]
```

> [!IMPORTANT]
> Backend trả về **`UserResponseDTO`** — dùng chung shape với `GET /users`:
> `{ id, username, name, studentId, role }`.
>
> - **KHÔNG có field `userId`** — `id` chính là user id.
> - **CÓ thêm field `role`** (luôn là `"STUDENT"` vì chỉ thí sinh mới được thêm).
>
> FE nên dùng `id` làm `userId` khi gọi `DELETE /exams/{examId}/participants/{userId}`.

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
  "submitSource": null
}
```

> [!NOTE]
> `submitSource` là **`null`** khi phiên vừa được tạo mới (chưa nộp bài).
> Chỉ khi resume phiên cũ thì nó mang giá trị `"RESUME"`.

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
| `submitSource` | `string \| null` | `MANUAL` \| `TIMEOUT` \| `GRACE` \| `RESUME` — **null** khi phiên vừa tạo mới (chưa nộp) |

> [!IMPORTANT]
> **FE không tự đếm ngược từ `Date.now()`** — luôn dùng `serverTime` + `remainingSeconds`
> từ server để đồng bộ, tránh lệch đồng hồ máy thí sinh.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Student không nằm trong danh sách thí sinh |
| `400` | Kỳ thi chưa bắt đầu ("Kỳ thi chưa bắt đầu.") / đã kết thúc ("Kỳ thi đã kết thúc.") |
| `400` | Kỳ thi chưa có đề thi nào ("Kỳ thi chưa có đề thi nào được tạo.") |
| `400` | **Bạn đã hết lượt thi** ("Bạn đã hết lượt thi của kỳ thi này (tối đa N lượt).") |
| `404` | Kỳ thi hoặc user không tồn tại |

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
  "submitSource": null,
  "attemptsExhausted": false
}
```

| Field | Type | Mô tả |
|---|---|---|
| `maxAttempts` | `number` | Số lượt thi tối đa của kỳ thi |
| `attemptsExhausted` | `boolean` | `true` nếu thí sinh đã dùng hết lượt |
| `submitSource` | `string \| null` | `null` nếu phiên đang `DOING` |

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
| `imageUrl` | `string \| null` | Ảnh minh họa — luôn có prefix `/uploads/` (VD `/uploads/questions/uuid.jpg`), có thể `null` |
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

**Response** `200 OK` — trả về **thông tin phiên thi sau khi nộp** (`ExamSessionResponseDTO`),
**KHÔNG phải** object kết quả chấm điểm:
```json
{
  "id": 1,
  "examId": 1,
  "examTitle": "Kiểm tra giữa kỳ - Toán",
  "userId": 42,
  "userName": "Nguyễn Văn A",
  "startTime": "2026-05-01T08:05:00",
  "endTime": "2026-05-01T08:55:00",
  "status": "SUBMITTED",
  "attemptNo": 1,
  "deadlineAt": "2026-05-01T09:05:00",
  "serverTime": "2026-05-01T08:55:00",
  "remainingSeconds": -3000,
  "submitSource": "MANUAL",
  "score": 8.5,
  "totalCorrect": 17,
  "totalQuestions": 20
}
```

> [!TIP]
> **Backend đã chấm điểm ngay khi nộp và trả kèm `score`, `totalCorrect`, `totalQuestions`**
> trong response này (thang điểm 10). FE không cần gọi thêm `GET /results/session/{id}`
> để hiển thị điểm — nhưng vẫn có thể gọi để lấy `rank` hoặc lịch sử đầy đủ.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Session đã SUBMITTED (chống submit trùng) — "Phiên thi đã được nộp trước đó." |
| `400` | **Đã quá thời gian thi** (quá `deadlineAt` + cửa sổ gia hạn) — "Đã quá thời gian thi, bài đã được hệ thống tự nộp." |
| `400` | Câu hỏi không thuộc phiên thi / đáp án không thuộc câu hỏi / câu hỏi bị lặp |
| `404` | Phiên thi không tồn tại |

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

> [!NOTE]
> **Tất cả response của module Results dùng chung DTO `ResultResponseDTO`:**
> ```json
> {
>   "id": 1,
>   "rank": 1,
>   "examSessionId": 1,
>   "examTitle": "Kiểm tra giữa kỳ - Toán",
>   "studentName": "Nguyễn Văn A",
>   "score": 8.0,
>   "totalCorrect": 8,
>   "totalQuestions": 10,
>   "submittedAt": "2026-05-01T08:55:00"
> }
> ```
>
> | Field | Type | Mô tả |
> |---|---|---|
> | `id` | `number` | ID result |
> | `rank` | `number \| null` | Hạng — chỉ có giá trị trong `GET /results/exam/{examId}`, các endpoint khác là `null` |
> | `examSessionId` | `number` | ID phiên thi |
> | `examTitle` | `string` | Tên kỳ thi |
> | `studentName` | `string` | Họ tên thí sinh |
> | `score` | `number` | Điểm (thang 0–10) |
> | `totalCorrect` | `number` | Số câu trả lời đúng |
> | `totalQuestions` | `number` | Tổng số câu của kỳ thi |
> | `submittedAt` | `string` | Thời điểm nộp bài |
>
> ⚠️ **Không có field `studentId` (MSSV)** trong DTO này.

### `GET /results/session/{sessionId}` — Kết quả Phiên thi

| | |
|---|---|
| **Auth** | ✅ `ALL` (nhưng có kiểm tra sở hữu) |

**Response** `200 OK`: `ResultResponseDTO` (xem shape ở trên).

> [!IMPORTANT]
> **Phân quyền theo chủ phiên**: `ADMIN`/`TEACHER` xem được mọi phiên;
> `STUDENT` chỉ xem được phiên **của chính mình**. Nếu `STUDENT` gọi
> `sessionId` của thí sinh khác → `403 Forbidden`.

**Errors**:
| Status | Khi nào |
|---|---|
| `404` | Không tìm thấy kết quả cho session (chưa nộp bài) hoặc session không tồn tại |
| `403` | `STUDENT` gọi phiên thi không thuộc về mình |

---

### `GET /results/exam/{examId}` — Bảng điểm Kỳ thi

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Response** `200 OK` — **object** (`ExamResultsResponseDTO`), **KHÔNG phải mảng phẳng**:
```json
{
  "examId": 1,
  "examTitle": "Kiểm tra giữa kỳ - Toán",
  "statistics": {
    "average": 7.25,
    "highest": 9.5,
    "lowest": 4.0,
    "totalSubmitted": 12,
    "distribution": {
      "from0To2": 0,
      "from2To4": 1,
      "from4To6": 3,
      "from6To8": 4,
      "from8To10": 4
    }
  },
  "results": [
    {
      "id": 1,
      "rank": 1,
      "examSessionId": 1,
      "examTitle": "Kiểm tra giữa kỳ - Toán",
      "studentName": "Nguyễn Văn A",
      "score": 9.5,
      "totalCorrect": 9,
      "totalQuestions": 10,
      "submittedAt": "2026-05-01T08:55:00"
    },
    {
      "id": 2,
      "rank": 2,
      "examSessionId": 2,
      "examTitle": "Kiểm tra giữa kỳ - Toán",
      "studentName": "Trần Văn B",
      "score": 6.5,
      "totalCorrect": 6,
      "totalQuestions": 10,
      "submittedAt": "2026-05-01T09:10:00"
    }
  ]
}
```

> [!IMPORTANT]
> FE phải đọc danh sách ở **`response.data.results`**, không phải `response.data` trực tiếp.
>
> `results[]` đã được **sort sẵn theo `score` giảm dần** (tie → `submittedAt` tăng dần),
> và `rank` được gán theo thứ tự đó (1 = cao nhất).
>
> `distribution` chia theo thang điểm 0–10: `[0,2)`, `[2,4)`, `[4,6)`, `[6,8)`, `[8,10]`.

**Errors**:
| Status | Khi nào |
|---|---|
| `404` | Kỳ thi không tồn tại (khi chưa có bài nộp nào) |

---

### `GET /results/me` — Lịch sử thi của tôi

| | |
|---|---|
| **Auth** | ✅ `STUDENT` |

**Response** `200 OK` — **mảng** `ResultResponseDTO[]` (xem shape ở đầu section):
```json
[
  {
    "id": 1,
    "rank": null,
    "examSessionId": 1,
    "examTitle": "Kiểm tra giữa kỳ - Toán",
    "studentName": "Nguyễn Văn A",
    "score": 8.0,
    "totalCorrect": 8,
    "totalQuestions": 10,
    "submittedAt": "2026-05-01T08:55:00"
  }
]
```

> [!NOTE]
> Đã sort theo `submittedAt` **giảm dần** (mới nhất trước).

---

## 11. Paper Exams — Đề giấy

> Module này phục vụ luồng tạo, xem đáp án, xuất PDF và quét phiếu trả lời cho đề giấy. Backend expose controller tại `/paper-exams`.
>
> ⚠️ **Lưu ý phân quyền**: `SecurityConfig` hiện chỉ chặn riêng 2 path `scan-results` là `ADMIN/TEACHER`;
> các path `/paper-exams/**` còn lại rơi vào `anyRequest().authenticated()` → **`STUDENT` vẫn gọi được**
> (tạo, xoá, xem, xuất PDF, scan). Đây là hạn chế của backend, không phải thiết kế.

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
>
> Backend cũng **luôn** set `showAnswers = true` khi tạo đề giấy.

**Response** `200 OK` (không phải `201 Created`):
```json
{
  "id": 1,
  "title": "Đề giữa kỳ - Toán cao cấp",
  "subjectId": 1,
  "subjectName": "Toán cao cấp",
  "durationMinutes": 45,
  "totalQuestions": 10,
  "omrQuestionsPerPage": 10,
  "omrChoicesPerQ": 4,
  "omrPageCount": 1,
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

**Response field notes (OMR)**:
- `omrQuestionsPerPage` — số câu trên mỗi trang phiếu OMR (mặc định `min(totalQuestions, 14)`, đọc từ `PaperExam.omrLayout`).
- `omrChoicesPerQ` — số lựa chọn tối đa mỗi câu (A..E), lấy theo câu có nhiều đáp án nhất.
- `omrPageCount` — số trang phiếu cần thiết để chứa hết câu hỏi của đề (`ceil(totalQuestions / omrQuestionsPerPage)`, tối thiểu 1).
- `status` — hiện luôn là `"DRAFT"` (backend chưa hỗ trợ các trạng thái khác).

> Client nên dùng 3 giá trị OMR này để biết mỗi trang chứa bao nhiêu câu và tổng số trang cần upload khi quét.

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
    "omrQuestionsPerPage": 10,
    "omrChoicesPerQ": 4,
    "omrPageCount": 1,
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
        { "id": 7001, "answerId": 9001, "orderIndex": 1, "content": "3", "imageUrl": null, "isCorrect": false },
        { "id": 7002, "answerId": 9002, "orderIndex": 2, "content": "4", "imageUrl": null, "isCorrect": true }
      ]
    }
  ]
}
```

> [!TIP]
> `answers[].id` = ID của **snapshot đáp án trong đề giấy** (`paper_exam_answers.id`),
> `answers[].answerId` = ID đáp án gốc trong ngân hàng câu hỏi (`answers.id`).
> `answers[].orderIndex` = thứ tự hiển thị (1 = A, 2 = B, ...).
>
> Dùng **`answerId`** làm định danh đáp án (đây là ID ổn định giữa các lần đọc đề).
>
> Đây là API duy nhất trả `isCorrect` đầy đủ. Các API PDF sẽ ẩn `isCorrect` khi render.

> [!NOTE]
> **Nội dung đề giấy được đóng băng (snapshot)** tại thời điểm tạo đề. Nếu giáo viên
> sửa câu hỏi gốc sau khi đã in phiếu OMR, đề giấy và phiếu vẫn khớp nhau —
> nội dung trả về đến từ `paper_exam_questions.*_snapshot` / `paper_exam_answers.*_snapshot`.

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
| `images` | File[] | ✅ | Ảnh scan phiếu trả lời — **mỗi ảnh = 1 trang phiếu**, gửi nhiều file cùng tên `images` |
| `actualQuestionCount` | Text/number | ❌ | Số câu thực tế của đề giấy |
| `debug` | Text/boolean | ❌ | Bật chế độ debug (mặc định `false`) |
| `scanMode` | Text/string | ❌ | Chế độ chấm, mặc định `AUTO` |

**Lưu ý quan trọng**:
- Frontend gửi trực tiếp từng part như trên, **không có part `meta`**.
- Param tên là **`images` (số nhiều)** — backend dùng `@RequestParam("images") MultipartFile[]`.
  Gửi sai tên (VD `image`) sẽ bị `400` vì thiếu param bắt buộc.
- Param **`formVariant` đã bị xoá** — layout phiếu do backend kiểm soát qua `PaperExam.omrLayout`.
- Nếu không truyền `actualQuestionCount`, backend sẽ dùng `paperExam.totalQuestions`.
- `scanMode` hiện tại là chuỗi, mặc định `AUTO`.
- `debug` mặc định `false`.
- **Thứ tự ảnh không quan trọng**: mỗi trang có QR chứa `page_index`, backend ghép các trang bằng `questionIndex` toàn cục.

**Request ví dụ** (đề 16 câu → 2 trang):
```text
images=<file page0.png>
images=<file page1.png>
actualQuestionCount=16
debug=false
scanMode=AUTO
```

**Response** `200 OK`:
```json
{
  "id": 9001,
  "status": "SUCCESS",
  "paperExamId": 1,
  "studentId": "S001",
  "actualQuestionCount": 16,
  "totalQuestions": 16,
  "score": 12,
  "totalCorrect": 12,
  "totalWrong": 3,
  "totalEmpty": 1,
  "totalNeedsReview": 0,
  "totalMultiMarked": 0,
  "imagePath": "uploads/paper-exams/1/scan-1-a1b2c3d4.png,uploads/paper-exams/1/scan-2-e5f6g7h8.png",
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
      "questionIndex": 3,
      "selectedOptions": ["A", "C"],
      "correctOptions": ["A", "C"],
      "status": "CORRECT",
      "isEmpty": false,
      "markedCount": 2,
      "confidence": 0.95,
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
- `status` là trạng thái tổng thể của lần scan (`SUCCESS` \| `FAILED_TO_READ` \| `NEEDS_REVIEW` \| `TIMEOUT` \| `INVALID_IMAGE` \| `SERVICE_UNAVAILABLE`).
- `studentId` là mã thí sinh đọc được từ QR trên phiếu (có thể `null` nếu QR không đọc được).
- `questionResults[].status` là trạng thái chấm theo từng câu, có thể là `CORRECT`, `WRONG`, `EMPTY`, `MULTI_MARKED`, `NEEDS_REVIEW`, `IGNORED`.
- `questionIndex` là **số câu toàn cục** (1-based) trong đề, đã offset theo trang.
- `totalCorrect`, `totalWrong`, `totalEmpty`, `totalNeedsReview`, `totalMultiMarked` là thống kê theo các trạng thái tương ứng.
- `score` được tính theo công thức: `totalCorrect / actualQuestionCount * totalQuestions` (thang điểm = tổng số câu của đề).
- `imagePath` là đường dẫn ảnh đã lưu dưới `uploads/` (nhiều ảnh nối bằng dấu phẩy), VD `uploads/paper-exams/1/scan-1-a1b2c3d4.png`.
- `rawVisionOutput` chỉ dùng cho debug.
- `errors` là danh sách lỗi từ vision service nếu có (vd "Thiếu trang 2", "Các trang thuộc nhiều thí sinh khác nhau").

**Luật chấm (exact-set-match)**:
- Tập đáp án được tô phải **bằng đúng** tập đáp án đúng ⇒ `CORRECT`.
- Câu nhiều đáp án đúng: tô đúng cả các ô đúng ⇒ `CORRECT`.
- Tô nhiều ô ở câu chỉ có 1 đáp án đúng ⇒ `MULTI_MARKED`.
- Engine báo `AMBIGUOUS` hoặc confidence < 0.5 ⇒ `NEEDS_REVIEW`.
- Bỏ trống ⇒ `EMPTY`. Câu ngoài `actualQuestionCount` ⇒ `IGNORED`.

**Errors**:
| Status | Khi nào |
|---|---|
| `400` | Ảnh không hợp lệ, `actualQuestionCount <= 0`, thiếu param `images`, hoặc không thể lưu ảnh |
| `400` | Ảnh vượt quá giới hạn upload (10MB/file, 15MB/request) — **backend trả `413`** |
| `404` | Đề giấy không tồn tại |
| `500` | Vision service lỗi hoặc backend không xử lý được kết quả scan |

---

### `GET /paper-exams/{id}/omr-sheet` — Tải phiếu trả lời OMR (PDF)

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Query Params**:

| Tên | Type | Required | Mô tả |
|---|---|---|---|
| `studentId` | Text | ❌ | Mã thí sinh nhúng vào QR của phiếu |

**Response** `200 OK`:
- `Content-Type`: `application/pdf`
- `Content-Disposition`: `attachment; filename="<slug>-<id>-omr.pdf"`

> Phiếu được vẽ bởi SheetScanner (ArUco marker + QR), Java gom các trang PNG thành PDF. Mỗi trang chứa `questionsPerPage` câu, có QR chứa `exam_id`, `student_id` và `page_index`.

---

### `GET /paper-exams/{id}/omr-sheet/preview` — Xem trước phiếu trả lời OMR

| | |
|---|---|
| **Auth** | ✅ `ADMIN`, `TEACHER` |

**Query Params**: giống `/omr-sheet`.

**Response** `200 OK`:
- `Content-Type`: `application/pdf`
- `Content-Disposition`: `inline; filename="<slug>-<id>-omr.pdf"`

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
    "studentId": "S001",
    "actualQuestionCount": 16,
    "totalQuestions": 16,
    "score": 12,
    "totalCorrect": 12,
    "totalWrong": 3,
    "totalEmpty": 1,
    "totalNeedsReview": 0,
    "totalMultiMarked": 0,
    "imagePath": "uploads/paper-exams/1/scan-1-a1b2c3d4.png",
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
      default:
        toast.error(message);
    }

    return Promise.reject(error);
  }
);
```

> [!NOTE]
> `401` = **chưa xác thực** (Spring Security `AuthenticationEntryPoint` → "Bạn chưa đăng nhập
> hoặc phiên đăng nhập đã hết hạn.") → FE nên redirect về trang login.
>
> `403` = **đã xác thực nhưng không đủ quyền** → chỉ cần hiện toast, không redirect.
> Nguồn: `ForbiddenException` từ service (VD `GET /results/session/{id}` của phiên người khác,
> `GET /exams/{id}` ngoài danh sách thí sinh) hoặc `AccessDeniedHandler` của Spring Security
> (VD `STUDENT` gọi `/paper-exams/**`).

### File Upload Limits

| Config | Giá trị |
|---|---|
| Max file size (mỗi file) | **10 MB** |
| Max request size (tổng) | **15 MB** |
| Định dạng hỗ trợ | JPEG, PNG, GIF, WebP, SVG |

> Backend kiểm tra content-type (không kiểm tra phần mở rộng file). File có content-type
> không nằm trong danh sách trên sẽ bị `400` với message
> "Định dạng file không được hỗ trợ. Chỉ chấp nhận: JPEG, PNG, GIF, WebP, SVG."

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
| | `PUT` | `/users/{id}` | ADMIN (chỉ sửa được user có role TEACHER, partial update) |
| | `PUT` | `/users/me` | ADMIN, TEACHER |
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
| **Questions** | `GET` | `/questions` | ADMIN, TEACHER (trả `Page` object) |
| | `GET` | `/questions/{id}` | ADMIN, TEACHER |
| | `POST` | `/questions` | ADMIN, TEACHER |
| | `PUT` | `/questions/{id}` | ADMIN, TEACHER |
| | `DELETE` | `/questions/{id}` | ADMIN, TEACHER |
| **Uploads** | `GET` | `/uploads/**` | Public (URL thật: `/api/v1/uploads/**`) |
| **Exams** | `GET` | `/exams` | ALL (auto-filter theo role) |
| | `GET` | `/exams/{id}` | ALL (STUDENT chỉ xem được kỳ thi của mình) |
| | `POST` | `/exams` | ADMIN, TEACHER |
| | `PUT` | `/exams/{id}` | ADMIN, TEACHER (chỉ `UPCOMING`, cập nhật `chapterConfigs`) |
| | `DELETE` | `/exams/{id}` | ADMIN, TEACHER (chỉ `UPCOMING`) |
| **Participants** | `POST` | `/exams/{id}/participants` | ADMIN, TEACHER |
| | `GET` | `/exams/{id}/participants` | ADMIN, TEACHER |
| | `DELETE` | `/exams/{id}/participants/{userId}` | ADMIN, TEACHER |
| **Sessions** | `POST` | `/sessions/start/{examId}` | STUDENT |
| | `GET` | `/sessions/active` | STUDENT (204 nếu không có) |
| | `GET` | `/sessions/{id}` | STUDENT |
| | `GET` | `/sessions/{id}/questions` | STUDENT |
| | `GET` | `/sessions/{id}/answers` | STUDENT |
| | `PUT` | `/sessions/{id}/answers` | STUDENT |
| | `POST` | `/sessions/{id}/submit` | STUDENT (trả session info **kèm `score`**) |
| **Results** | `GET` | `/results/session/{sessionId}` | ALL (STUDENT chỉ xem được phiên của mình) |
| | `GET` | `/results/exam/{examId}` | ADMIN, TEACHER (trả object `{statistics, results[]}`) |
| | `GET` | `/results/me` | STUDENT |
| **Paper Exams** | `POST` | `/paper-exams` | ADMIN, TEACHER |
| | `GET` | `/paper-exams` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/answers` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/pdf/preview` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/pdf` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/omr-sheet/preview` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/omr-sheet` | ADMIN, TEACHER |
| | `POST` | `/paper-exams/{id}/scan` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/{id}/scan-results` | ADMIN, TEACHER |
| | `GET` | `/paper-exams/scan-results/{scanResultId}` | ADMIN, TEACHER |
| | `DELETE` | `/paper-exams/{id}` | ADMIN, TEACHER |
| **Swagger** | `GET` | `/v3/api-docs/**`, `/swagger-ui/**` | Public (chưa có trong tài liệu này) |

---

## ⚠️ Hạn chế đã biết của backend hiện tại

Các điểm dưới đây là **hành vi thực tế** của backend, không phải lỗi của tài liệu.
Nếu backend được sửa, cần cập nhật lại file này.

| # | Hạn chế | Ảnh hưởng |
|---|---|---|
| 1 | **`GET /questions` trả Spring `Page` object** | FE đọc `data.content`, không phải `data` |
| 2 | **`GET /results/exam/{examId}` trả object có `statistics`** | FE đọc `data.results`, không phải `data` |
| 3 | **`GET /exams/{id}/participants` không có field `userId`** | FE dùng `id` làm `userId` |
| 4 | **`POST /paper-exams` trả `200` (không phải `201`)** | FE không nên kiểm tra `201` |

> [!NOTE]
> Các hạn chế sau **đã được sửa** trong backend:
> - ~~`GET /subjects/{id}` không tồn tại~~ → đã implement
> - ~~`POST /sessions/{id}/submit` không trả điểm~~ → đã trả `score` / `totalCorrect` / `totalQuestions`
> - ~~`GET /exams/{id}` không lọc theo participant~~ → `STUDENT` chỉ xem được kỳ thi của mình (`403` nếu không)
> - ~~`GET /results/session/{sessionId}` lộ điểm của thí sinh khác~~ → đã kiểm tra chủ phiên (`403`)
> - ~~`PUT /users/{id}` yêu cầu đủ 3 field~~ → đã hỗ trợ partial update
> - ~~`PUT /users/me` chỉ nhận `TEACHER`~~ → đã nhận cả `ADMIN`
> - ~~`PUT /exams/{id}` không cập nhật `chapterConfigs`~~ → đã cập nhật + sinh lại đề
> - ~~`/paper-exams/**` chưa giới hạn role~~ → đã chặn `STUDENT`
> - ~~File upload quá lớn trả `400`~~ → đã trả `413`
> - ~~`answers[].id` / `answers[].orderIndex` của paper exam luôn `null`~~ → đã trả đầy đủ + snapshot đóng băng
