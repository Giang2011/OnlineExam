# Task List — Implement `paperexam` in `frontend/src/features/admin`

> Mục tiêu của file này là để các coding agents có thể follow theo từng bước và hoàn thành feature một cách nhất quán, đồng thời bám sát cấu trúc folder mục tiêu trong `frontend/FOLDER_STRUCTURE.md`.

---

## Nguyên tắc chung

- Chỉ triển khai trong `frontend/src/features/admin` và các điểm tích hợp tối thiểu liên quan (`src/app` routing/guard/menu nếu cần).
- Bám sát contract backend trong `API_SPEC.md`.
- Ưu tiên tái sử dụng pattern hiện có trong admin feature.
- Không để lộ `isCorrect` trong PDF preview/download.
- Chỉ `ADMIN` và `TEACHER` được truy cập feature.
- Cần xử lý tốt: loading, error, empty state, confirm delete, blob download.
- Nếu có helper chung phù hợp, nên đặt vào `src/shared` thay vì copy logic vào feature.

---

## Phase 1 — Khảo sát & chuẩn bị

> Trạng thái phase 1: **completed**.
>
> Ghi chú handoff cho các agent sau:
>
> - Pattern hiện có của admin feature đã được xác định từ `adminApiClient.ts`, `examApi.ts`, `useAdminExams.ts` và các màn hình quản lý hiện hữu.
> - Cách triển khai cần bám theo convention hiện tại: Axios client dùng interceptor auth + toast lỗi chung, data fetching theo hook riêng cho feature, UI theo pattern list/detail/modal/form tách lớp rõ ràng.
> - Route/menu/permission cần được bổ sung ở layer `src/app` hoặc nơi navigation đang sống, không nhét logic điều hướng vào component feature.
> - Phần tiếp theo của task nên ưu tiên dựng data layer trước, sau đó mới đi vào pages/components và cuối cùng là routing/menu.

### Task 1.1 — Review cấu trúc admin hiện có
- Đọc các file sau để nắm pattern:
  - `frontend/src/features/admin/api/adminApiClient.ts`
  - `frontend/src/features/admin/api/examApi.ts`
  - `frontend/src/features/admin/api/questionApi.ts`
  - `frontend/src/features/admin/hooks/useAdminExams.ts`
  - `frontend/src/features/admin/hooks/useAdminQuestions.ts`
  - `frontend/src/features/admin/pages/ExamManagement.tsx`
  - `frontend/src/features/admin/components/ExamManagementComponents.tsx`
  - `frontend/src/features/admin/types/*.types.ts`
- Xác định convention cho:
  - API client
  - naming hooks
  - table/modal/form pattern
  - query invalidation / refresh
  - toast / error handling

**Done when**:
- Có thể mô tả rõ pattern code hiện tại để áp vào paperexam.

### Task 1.2 — Xác định route/menu tích hợp theo structure mới
- Tìm file khai báo routes admin và sidebar menu.
- Xác định vị trí thêm mục `Paper Exams`.
- Kiểm tra cơ chế bảo vệ role hiện có.
- Xác minh file nào thuộc `src/app` và file nào thuộc `src/features/admin` để không đặt nhầm logic.

**Done when**:
- Biết chính xác file nào cần chỉnh để feature xuất hiện đúng cho ADMIN/TEACHER.

---

## Phase 2 — Data layer

### Task 2.1 — Tạo `paperExam.types.ts`
- Thêm type/interface cho:
  - `PaperExamStatus`
  - `PaperExamChapterConfigPayload`
  - `PaperExamCreatePayload`
  - `PaperExamChapterConfig`
  - `PaperExamListItem`
  - `PaperExamDetail`
  - `PaperExamAnswerItem`
  - `PaperExamAnswerQuestion`
  - `PaperExamAnswerView`
- Đảm bảo kiểu phù hợp với response backend.
- Dùng `string` cho ISO date-time.
- Nếu status enum có thể thay đổi, giữ union type dễ render UI.

**Done when**:
- Type dùng được cho API, hook, UI.

### Task 2.2 — Tạo `paperExamApi.ts`
- Implement các hàm:
  - `getPaperExams()`
  - `getPaperExamById(id)`
  - `createPaperExam(payload)`
  - `getPaperExamAnswers(id)`
  - `previewPaperExamPdf(id)`
  - `downloadPaperExamPdf(id)`
  - `deletePaperExam(id)`
- PDF APIs phải dùng `responseType: 'blob'`.
- Nếu cần, tách helper download file để tái sử dụng.
- Nên cân nhắc helper parse filename từ `Content-Disposition` nếu codebase chưa có.

**Done when**:
- Tất cả endpoint paperexam gọi được từ frontend.

### Task 2.3 — Tạo hooks cho data fetching
- Implement hooks theo pattern hiện có, ví dụ:
  - `useAdminPaperExams`
  - `useAdminPaperExamDetail`
  - `useAdminPaperExamAnswers`
  - `useCreatePaperExam`
  - `useDeletePaperExam`
- Đảm bảo invalidate/refetch list sau create/delete.
- Nếu đang dùng React Query, giữ convention key nhất quán.
- Nếu project có shared query client helpers, tái sử dụng thay vì tự tạo mới.

**Done when**:
- UI có thể lấy data và mutate không cần viết logic fetch trực tiếp trong component.

---

## Phase 3 — UI tạo đề giấy

### Task 3.1 — Tạo trang `PaperExamCreate.tsx`
- Tạo route/page cho form tạo đề giấy.
- Tối thiểu gồm:
  - title
  - subject selector
  - durationMinutes
  - totalQuestions
  - chapter config editor
  - submit/cancel actions

**Done when**:
- Người dùng có thể mở form tạo đề giấy từ admin.

### Task 3.2 — Xây component `PaperExamChapterConfigEditor`
- Cho phép:
  - load chapters theo subject
  - nhập `questionCount` theo từng chapter
  - hiển thị `questionCount` hiện có của chapter nếu backend subject detail cung cấp
  - tránh trùng chapter
  - xóa chapter config
- Tính tổng câu realtime.
- Nếu backend trả chapter theo `subjects/{id}`, nên tận dụng để cảnh báo chapter không đủ câu.

**Done when**:
- Có thể cấu hình chapter giống backend yêu cầu.

### Task 3.3 — Validate form trước submit
- Kiểm tra:
  - title không rỗng
  - subjectId hợp lệ
  - durationMinutes > 0
  - totalQuestions > 0
  - có ít nhất 1 chapter config
  - tổng `questionCount` == `totalQuestions`
  - chapter không bị lặp
  - questionCount không âm / không rỗng
- Hiển thị lỗi rõ ràng theo từng field hoặc theo khối.

**Done when**:
- Không thể submit payload sai contract backend.

### Task 3.4 — Gửi payload tạo đề giấy
- Map form state sang `PaperExamCreatePayload`.
- Handle success:
  - toast success
  - redirect sang detail hoặc list
- Handle error:
  - hiển thị message backend

**Done when**:
- Tạo đề giấy thành công từ UI.

---

## Phase 4 — UI danh sách và chi tiết

### Task 4.1 — Tạo trang `PaperExamManagement.tsx`
- Hiển thị list đề giấy.
- Có nút chuyển tới trang tạo mới.
- Có trạng thái loading / empty / error.

**Done when**:
- Admin/teacher xem được danh sách paper exams.

### Task 4.2 — Tạo bảng list `PaperExamListTable`
- Cột đề xuất:
  - title
  - subjectName
  - durationMinutes
  - totalQuestions
  - status
  - createdByName
  - createdAt
  - updatedAt
  - actions
- Actions:
  - view detail
  - preview PDF
  - download PDF
  - view answers
  - delete

**Done when**:
- Người dùng thao tác được với từng row trong danh sách.

### Task 4.3 — Tạo trang `PaperExamDetail.tsx`
- Hiển thị:
  - metadata
  - chapterConfigs
  - trạng thái
  - người tạo
- Có action bar:
  - preview
  - download
  - answers
  - delete

**Done when**:
- Có thể xem chi tiết một đề giấy rõ ràng.

### Task 4.4 — Tạo component detail panel / section
- Tách block hiển thị metadata ra component riêng nếu cần.
- Dễ tái sử dụng giữa page detail và drawer/modal.

**Done when**:
- Code dễ đọc, không bị nhồi quá nhiều logic vào page.

---

## Phase 5 — Answers & PDF flows

### Task 5.1 — Tạo `PaperExamAnswerViewer`
- Fetch `/paper-exams/{id}/answers`.
- Hiển thị:
  - câu hỏi
  - đáp án
  - đáp án đúng được highlight
  - chapter name / order index nếu có
- Đảm bảo UX dễ dùng để chấm bài giấy.

**Done when**:
- Teacher/admin xem được lời giải chi tiết của đề giấy.

### Task 5.2 — Implement preview PDF
- Với `/paper-exams/{id}/pdf/preview`:
  - mở modal / drawer / new tab / iframe tùy convention của project
- Response blob phải được convert thành object URL đúng cách.
- Clean up object URL khi unmount / đóng modal.
- Nếu project có shared helper tạo object URL, tái sử dụng.

**Done when**:
- Có thể xem PDF trực tiếp trên trình duyệt.

### Task 5.3 — Implement download PDF
- Với `/paper-exams/{id}/pdf`:
  - trigger download file
  - filename nên lấy từ content-disposition nếu có thể
- Xử lý tốt trên browser phổ biến.

**Done when**:
- Người dùng tải được file PDF đúng format.

---

## Phase 6 — Xóa mềm và xác nhận

### Task 6.1 — Tạo delete flow
- Gọi `DELETE /paper-exams/{id}`.
- Dùng confirm modal trước khi xóa.
- Sau xóa thành công:
  - refresh list
  - nếu đang ở detail page thì redirect về list

**Done when**:
- Paper exam xóa mềm được từ UI.

### Task 6.2 — Chuẩn hóa toast/error handling
- Dùng message backend nếu có.
- Với lỗi PDF/blob, hiển thị fallback message phù hợp.
- Tái sử dụng handler lỗi chung nếu project có.
- Nếu cần helper xử lý lỗi blob, cân nhắc để ở `shared/utils`.

**Done when**:
- Các thao tác đều phản hồi rõ ràng cho user.

---

## Phase 7 — Routing, navigation, permission

### Task 7.1 — Thêm routes cho paperexam
- Thêm route cho:
  - list
  - create
  - detail
- Bảo vệ route theo role.
- Nếu project dùng route config ở `src/app`, thêm mapping tại đó thay vì nhét logic route vào feature component.

**Done when**:
- Người dùng truy cập đúng trang theo URL.

### Task 7.2 — Thêm menu/sidebar item
- Add mục `Paper Exams` trong admin navigation.
- Chỉ hiện với ADMIN/TEACHER.
- Nếu menu được cấu hình ở `shared/layouts` hoặc `src/app`, chỉnh đúng nơi đó.

**Done when**:
- Tính năng xuất hiện đúng trong UI điều hướng.

### Task 7.3 — Kiểm tra access control
- Nếu role không hợp lệ:
  - không render menu
  - redirect hoặc forbidden screen theo pattern hiện có

**Done when**:
- Feature không lộ cho role không được phép.

---

## Phase 8 — Hoàn thiện chất lượng

### Task 8.1 — Kiểm tra responsive & accessibility cơ bản
- Table, form, modal, preview PDF phải dùng ổn trên màn hình phổ biến.
- Button có label rõ.
- Input có label/error text.

**Done when**:
- UI dùng được tốt trong thực tế.

### Task 8.2 — Rà soát type & lint
- Đảm bảo không còn type mismatch.
- Không để warning/lint errors mới sinh ra.
- Tối ưu import, tránh code dư.
- Nếu các file chung được thêm vào `shared`, đảm bảo naming không gây xung đột với legacy folders.

**Done when**:
- Code sạch và compile ổn.

### Task 8.3 — Manual test checklist
- Tạo đề giấy thành công.
- Validate sai tổng câu.
- Preview PDF.
- Download PDF.
- Xem đáp án.
- Xóa đề giấy.
- Kiểm tra role ADMIN / TEACHER.

**Done when**:
- Luồng end-to-end hoạt động ổn.

---

## Definition of Done

Feature `paperexam` được xem là hoàn tất khi:

- Có types, api, hooks, pages, components cần thiết.
- Tạo / xem danh sách / xem chi tiết / xem đáp án / preview PDF / download PDF / delete hoạt động.
- Route và menu đã tích hợp đúng layer (`src/app` hoặc nơi router/menu đang sống).
- Chỉ ADMIN và TEACHER truy cập được.
- UX rõ ràng, không lộ `isCorrect` ở PDF.
- Code bám sát patterns hiện có trong `frontend/src/features/admin` và tôn trọng cấu trúc folder mục tiêu của frontend.
