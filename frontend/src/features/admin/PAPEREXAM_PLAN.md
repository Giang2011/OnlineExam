# Frontend Plan — `paperexam` cho `frontend/src/features/admin`

## 1. Mục tiêu

Xây dựng đầy đủ trải nghiệm quản lý **Đề giấy (`paperexam`)** cho vai trò **ADMIN** và **TEACHER** ở phía frontend, bám sát backend hiện có trong `API_SPEC.md` và module `backend/src/main/java/com/gr1/exam/module/paperexam`.

Tính năng cần bao gồm:

- Tạo đề giấy từ ngân hàng câu hỏi theo **môn học + cấu hình số câu theo chương**.
- Danh sách đề giấy.
- Chi tiết đề giấy.
- Preview PDF đề giấy trên trình duyệt.
- Tải PDF đề giấy.
- Xem đáp án để chấm bài giấy.
- Xóa mềm đề giấy.
- Phân quyền đúng: chỉ `ADMIN` và `TEACHER` mới thấy/ dùng feature.

> Lưu ý: Đây là tính năng mới trong khu vực `admin`, nhưng cũng là nghiệp vụ dùng chung cho teacher. Kế hoạch này được viết bám sát cấu trúc folder mục tiêu trong `frontend/FOLDER_STRUCTURE.md`, ưu tiên đặt logic vào đúng lớp `feature-based + shared/common`.

---

## 2. Ràng buộc theo folder structure của frontend

Theo `frontend/FOLDER_STRUCTURE.md`, code nên được tổ chức như sau:

- `src/features/admin` chứa toàn bộ business logic của paperexam.
- `src/shared` chỉ dùng cho phần tái sử dụng rộng hơn như dialog, table, helper tải file, formatter.
- `src/app` chỉ chỉnh khi cần đăng ký route/guard/menu global.
- Không nên đưa logic paperexam vào `src/pages`, `src/components`, `src/layouts` legacy trừ khi codebase hiện tại vẫn import ở đó và chưa refactor xong.

### Bố cục đề xuất trong `src/features/admin`

```text
frontend/src/features/admin/
├── api/
│   └── paperExamApi.ts
├── hooks/
│   ├── useAdminPaperExams.ts
│   ├── useAdminPaperExamDetail.ts
│   ├── useAdminPaperExamAnswers.ts
│   ├── useCreatePaperExam.ts
│   └── useDeletePaperExam.ts
├── pages/
│   ├── PaperExamManagement.tsx
│   ├── PaperExamCreate.tsx
│   └── PaperExamDetail.tsx
├── components/
│   ├── PaperExamManagementComponents.tsx
│   ├── PaperExamListTable.tsx
│   ├── PaperExamForm.tsx
│   ├── PaperExamChapterConfigEditor.tsx
│   ├── PaperExamDetailPanel.tsx
│   ├── PaperExamAnswerViewer.tsx
│   └── PaperExamPdfActions.tsx
└── types/
    └── paperExam.types.ts
```

### Các phần nên cân nhắc đưa vào `shared`

Chỉ đưa vào `src/shared` nếu thực sự tái sử dụng rộng rãi, ví dụ:

- helper tải file PDF từ `blob`
- helper parse `Content-Disposition`
- component modal xác nhận xóa dùng cho nhiều feature
- table wrapper / empty state dùng toàn app
- hook dùng chung để tạo object URL từ blob

Nếu chỉ dùng riêng cho paperexam thì vẫn nên giữ trong `features/admin`.

---

## 3. Phạm vi backend đã có sẵn

Frontend sẽ tích hợp các API sau:

- `POST /paper-exams`
- `GET /paper-exams`
- `GET /paper-exams/{id}`
- `GET /paper-exams/{id}/answers`
- `GET /paper-exams/{id}/pdf/preview`
- `GET /paper-exams/{id}/pdf`
- `DELETE /paper-exams/{id}`

### Payload tạo đề giấy

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

### Response quan trọng

- `PaperExamResponse`: metadata + `chapterConfigs`
- `PaperExamDetailResponse`: chi tiết 1 đề giấy
- `PaperExamAnswerViewResponse`: nội dung xem đáp án, có `isCorrect`
- PDF response: `application/pdf`

### Quy ước quan trọng từ backend

- `showAnswers` không còn là input khi tạo đề.
- PDF preview và PDF download **không được lộ `isCorrect`**.
- Chỉ API `/answers` mới trả full đáp án đúng/sai.
- `chapterConfigs` phải khớp tổng `totalQuestions` và mỗi chương chỉ xuất hiện 1 lần.

---

## 4. Hiện trạng frontend liên quan

Các pattern đang có sẵn trong `frontend/src/features/admin` cần bám theo:

- `api/*Api.ts`: tách riêng từng resource.
- `hooks/useAdmin*.ts`: wrapper cho query/mutation và normalize data.
- `pages/*Management.tsx`: mỗi resource có 1 trang quản lý.
- `components/*ManagementComponents.tsx`: tách UI theo feature.
- `types/*.types.ts`: contract type theo resource.
- `api/adminApiClient.ts`: axios client dùng auth token.

Các feature đang có sẵn như `subject`, `chapter`, `question`, `exam`, `participant`, `report` là tham chiếu tốt cho cách tổ chức code và naming.

---

## 5. Kiến trúc đề xuất cho feature paperexam

### 5.1 API layer

Tạo file:

- `frontend/src/features/admin/api/paperExamApi.ts`

Mục tiêu:

- gom toàn bộ call liên quan đến paper exam
- dùng lại `adminApiClient`
- xử lý `blob` cho PDF preview/download
- cung cấp helper chung để download file nếu project chưa có helper dùng chung

### 5.2 Type layer

Tạo file:

- `frontend/src/features/admin/types/paperExam.types.ts`

Mục tiêu:

- mô tả contract của list/detail/create/answers/pdf action
- tránh lẫn với `exam.types.ts`
- giữ type ISO datetime là `string`

### 5.3 Hook layer

Tạo các hook để UI không phải gọi API trực tiếp:

- `useAdminPaperExams` — load list + delete + refresh
- `useAdminPaperExamDetail` — detail query
- `useAdminPaperExamAnswers` — answers query
- `useCreatePaperExam` — create mutation
- `useDeletePaperExam` — delete mutation
- nếu cần, thêm hook riêng xử lý preview/download PDF hoặc object URL

### 5.4 Page layer

Tạo các trang:

- `PaperExamManagement.tsx` — danh sách
- `PaperExamCreate.tsx` — tạo mới
- `PaperExamDetail.tsx` — chi tiết + actions

### 5.5 Component layer

Tách UI thành các khối nhỏ:

- `PaperExamForm.tsx` — form tạo đề
- `PaperExamChapterConfigEditor.tsx` — editor cấu hình chapter
- `PaperExamListTable.tsx` — bảng danh sách
- `PaperExamDetailPanel.tsx` — khối hiển thị metadata
- `PaperExamAnswerViewer.tsx` — xem đáp án
- `PaperExamPdfActions.tsx` — preview / download / open pdf

Nếu project hiện tại đang thích gộp component theo page, có thể gộp bớt. Nhưng nên giữ ít nhất 3 khối độc lập: form, table, answer/pdf actions.

---

## 6. Luồng nghiệp vụ frontend cần hỗ trợ

### 6.1 Danh sách đề giấy

Người dùng vào trang quản lý sẽ thấy:

- danh sách đề đã tạo
- các cột chính:
  - Tiêu đề
  - Môn học
  - Thời lượng
  - Tổng số câu
  - Trạng thái
  - Người tạo
  - Ngày tạo / cập nhật
  - Hành động
- hành động từng dòng:
  - xem chi tiết
  - xem trước PDF
  - tải PDF
  - xem đáp án
  - xóa

### 6.2 Tạo đề giấy

Form tạo đề cần cho phép:

- chọn môn học
- nhập tiêu đề
- nhập thời lượng
- nhập tổng số câu
- load danh sách chapter theo subject
- nhập `questionCount` cho từng chapter
- tự tính tổng số câu từ chapter configs
- validate client-side trước khi submit

Nên có UX sau:

- khi chọn môn học, auto reset chapter config
- khi đổi môn học, re-fetch chapter list
- nếu tổng `questionCount` chưa bằng `totalQuestions`, disable submit và hiển thị cảnh báo
- nếu chapter trùng nhau hoặc để trống, chặn submit
- nếu component lấy được `questionCount` hiện có của chapter từ `GET /subjects/{id}`, nên hiển thị cảnh báo chapter đó không đủ câu

### 6.3 Chi tiết đề giấy

Trang chi tiết nên hiển thị:

- metadata đề
- danh sách chapter config
- trạng thái
- thông tin người tạo
- nút thao tác:
  - preview PDF
  - tải PDF
  - xem đáp án
  - xóa

### 6.4 Xem đáp án

Cần tách rõ luồng xem đáp án khỏi PDF:

- `GET /paper-exams/{id}/answers` trả danh sách câu hỏi + đáp án + `isCorrect`
- UI nên thể hiện rõ đáp án đúng, có thể dùng badge màu hoặc highlight
- vì đây là dữ liệu nhạy cảm nghiệp vụ, chỉ hiển thị cho `ADMIN` / `TEACHER`

### 6.5 PDF preview / download

Có 2 trải nghiệm:

- **Preview**: mở inline trong modal / drawer / tab mới / iframe theo convention hiện tại của project
- **Download**: tải file về máy

Frontend cần xử lý đúng response blob và `Content-Type: application/pdf`.

---

## 7. Data contracts frontend nên xây

Tạo type riêng cho paper exam để tránh lẫn với `exam.types.ts`.

### Gợi ý interface

- `PaperExamStatus`
- `PaperExamChapterConfigPayload`
- `PaperExamCreatePayload`
- `PaperExamChapterConfig`
- `PaperExamListItem`
- `PaperExamDetail`
- `PaperExamAnswerView`
- `PaperExamAnswerQuestion`
- `PaperExamQuestionAnswer`

### Một số lưu ý type

- `createdAt`, `updatedAt` nên là `string`.
- `chapterConfigs` trong response list có thể là mảng rỗng, nhưng detail nên đầy đủ.
- `answers[].isCorrect` chỉ tồn tại ở response xem đáp án.
- PDF actions cần typing blob response rõ ràng.
- Nếu backend dùng status enum, nên map thành union type string ở FE để dễ render badge.

---

## 8. API layer đề xuất

Tạo `paperExamApi.ts` theo style các api khác trong admin:

- `getPaperExams()`
- `getPaperExamById(id)`
- `createPaperExam(payload)`
- `getPaperExamAnswers(id)`
- `previewPaperExamPdf(id)`
- `downloadPaperExamPdf(id)`
- `deletePaperExam(id)`

### Những điểm cần lưu ý

- PDF APIs phải set `responseType: 'blob'`.
- Nếu có helper download file hiện hữu, nên dùng lại.
- Cần sanitize filename từ `Content-Disposition` nếu backend gửi về.
- Nên chuẩn hóa error handler theo `adminApiClient`.

---

## 9. Hook layer đề xuất

Nên tạo hooks theo mô hình tương tự các module khác:

- `useAdminPaperExams` — load list + refresh + delete mutation
- `useAdminPaperExamDetail(id)` — detail query
- `useAdminPaperExamAnswers(id)` — answers query
- `useCreatePaperExamMutation()` — mutation tạo mới
- `useDeletePaperExamMutation()` — mutation xóa
- nếu cần: `usePaperExamPdfActions()` — helper cho preview/download

### Mục tiêu của hooks

- tách logic fetching khỏi UI
- giảm prop drilling
- dễ tái dùng giữa list / detail / modal
- chuẩn hóa query key theo convention hiện có của admin

---

## 10. UX / UI expectations

### 10.1 Danh sách

- Có nút `Tạo đề giấy`.
- Có empty state nếu chưa có đề.
- Có loading skeleton / spinner.
- Có confirm modal trước khi xóa.
- Có toast cho success/error.

### 10.2 Form tạo mới

- Form chia thành 3 khối:
  1. Thông tin đề
  2. Cấu hình chapter
  3. Review / validation summary
- Nên hiển thị tổng câu hiện tại và tổng câu yêu cầu.
- Nếu chapter nào không đủ câu, hiển thị cảnh báo cụ thể.
- Disable submit khi dữ liệu chưa hợp lệ.

### 10.3 Chi tiết

- Có action bar cố định hoặc nhóm nút rõ ràng.
- Panel thông tin đề nên dễ scan nhanh.
- Chapter config hiển thị dưới dạng list/table.
- Answers viewer nên có phân biệt đúng/sai rõ ràng.

---

## 11. Phân quyền & điều hướng

Feature này chỉ hiển thị nếu role là:

- `ADMIN`
- `TEACHER`

Cần đảm bảo:

- sidebar / menu admin thêm mục `Paper Exams`
- route guard chặn role khác
- nếu user không có quyền, redirect hoặc forbidden screen theo convention hiện có

Theo folder structure hiện tại, phần route/guard sẽ nằm ở `src/app` hoặc layer routing đang được project dùng, không nên nhét logic điều hướng vào `features/admin` nếu đã có router trung tâm.

---

## 12. Tương thích với code hiện có

Cần kiểm tra các điểm sau trước khi implement:

- `adminApiClient` đang cấu hình base URL / auth header thế nào
- cách `useAdminExams`, `useAdminQuestions` xử lý query/mutation
- cấu trúc route trong admin layout
- component UI chung đang dùng thư viện nào
- pattern modal / drawer / table / form validation hiện tại

Mục tiêu là:

- giữ style thống nhất với admin module hiện có
- không tạo kiến trúc mới nếu không cần thiết
- ưu tiên tận dụng các helper ở `shared` thay vì tạo bản sao trong feature

---

## 13. Checklist triển khai ở mức cao

1. Tạo types cho paper exam.
2. Tạo API client cho paper exam.
3. Tạo hooks query/mutation.
4. Tạo page list + page create + page detail.
5. Tạo component form chapter config.
6. Tạo component PDF actions.
7. Tạo component answers viewer.
8. Thêm route và menu vào admin.
9. Kiểm tra phân quyền, loading, error, empty states.
10. Validate blob handling cho PDF.
11. Kiểm tra responsive và accessibility cơ bản.
12. Nếu có helper chung phù hợp, chuyển vào `shared` đúng chỗ.

---

## 14. Kết quả mong muốn sau khi hoàn thành

Sau khi hoàn tất, teacher/admin có thể:

- tạo đề giấy từ kho câu hỏi hiện có
- xem danh sách đề đã tạo
- mở chi tiết đề
- xem trước và tải PDF
- xem đáp án để chấm bài giấy
- xóa mềm đề giấy

Feature phải hoạt động ổn định, dễ bảo trì và bám sát backend contract hiện tại, đồng thời tôn trọng cấu trúc folder target của frontend.
