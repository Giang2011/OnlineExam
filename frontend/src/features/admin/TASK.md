# Task List — `paperexam` scan flow theo `API_SPEC.md`

> File này dành cho coding agent để triển khai feature scan/chấm bài giấy trong `frontend/src/features/admin`.
>
> Spec cần bám chặt:
> - `POST /paper-exams/{id}/scan`
> - `GET /paper-exams/{id}/scan-results`
> - `GET /paper-exams/scan-results/{scanResultId}`
>
> Không tự thêm contract mới ngoài `API_SPEC.md`.

---

## Nguyên tắc chung

- Chỉ triển khai trong `frontend/src/features/admin` và điểm tích hợp tối thiểu ở route/menu.
- Bám đúng API contract, field names và status enum trong `API_SPEC.md`.
- Upload scan dùng `multipart/form-data`.
- Part names phải đúng spec: `image`, `actualQuestionCount`, `formVariant`, `debug`, `scanMode`.
- Mặc định nếu không set:
  - `formVariant = 75`
  - `debug = false`
  - `scanMode = AUTO`
- Nếu không nhập `actualQuestionCount` ở UI, frontend phải tự gán bằng `totalQuestions` của đề giấy đang chấm.
- Feature chỉ dành cho `ADMIN` và `TEACHER`.
- Không để lộ `isCorrect` trong PDF flow; scan flow không được tự suy đoán field này ngoài spec.
- Cần render rõ các trạng thái scan và từng câu như spec quy định.

---

## Phase 1 — Đọc spec và xác định điểm gắn vào paper exams

### Task 1.1 — Đọc `API_SPEC.md` phần `Paper Exams`
- Đọc kỹ các endpoint và response của:
  - `POST /paper-exams`
  - `GET /paper-exams`
  - `GET /paper-exams/{id}`
  - `GET /paper-exams/{id}/answers`
  - `GET /paper-exams/{id}/pdf/preview`
  - `GET /paper-exams/{id}/pdf`
  - `POST /paper-exams/{id}/scan`
  - `GET /paper-exams/{id}/scan-results`
  - `GET /paper-exams/scan-results/{scanResultId}`
- Xác định đúng field nào scan response có sẵn để map vào UI.
- Kết luận đã xác nhận: `actualQuestionCount` phải bằng số lượng câu hỏi của đề (`totalQuestions` của `paperExam`) trước khi upload.

**Done when**:
- Agent biết chính xác response scan gồm những field nào, không thêm field ngoài spec, và cách xử lý `actualQuestionCount` ở frontend.

### Task 1.2 — Khảo sát file admin hiện có
- Mở các file sau để hiểu pattern hiện tại:
  - `frontend/src/features/admin/api/paperExamApi.ts`
  - `frontend/src/features/admin/types/paperExam.types.ts`
  - `frontend/src/features/admin/pages/PaperExamManagement.tsx`
  - `frontend/src/features/admin/pages/PaperExamDetail.tsx`
  - `frontend/src/features/admin/components/PaperExamDetailPanel.tsx`
  - `frontend/src/features/admin/components/PaperExamListTable.tsx`
  - `frontend/src/features/admin/components/PaperExamAnswerViewer.tsx`
- Xác định file nào nên mở rộng, file nào nên tạo mới.

**Done when**:
- Có danh sách file chính xác để implement scan flow.

### Task 1.3 — Xác định route và menu entry
- Tìm nơi quản lý route của admin.
- Tìm nơi render menu/sidebar cho admin.
- Xác định entry point từ `PaperExamDetail` hoặc `PaperExamManagement` để mở màn scan.
- Đảm bảo chỉ `ADMIN`/`TEACHER` thấy được.

**Done when**:
- Biết chính xác chỗ gắn màn scan vào UI hiện tại.

---

## Phase 2 — Types cho scan

### Task 2.1 — Mở rộng `paperExam.types.ts`
- Thêm type/interface cho scan theo đúng response spec.
- Cần có các type tối thiểu:
  - `PaperExamScanStatus`
  - `PaperExamScanQuestionStatus`
  - `PaperExamScanRequest`
  - `PaperExamScanQuestionResult`
  - `PaperExamScanResponse`
  - `PaperExamScanListItem`
- Các field tối thiểu của response cần map:
  - `id`
  - `status`
  - `paperExamId`
  - `formVariant`
  - `actualQuestionCount`
  - `totalQuestions`
  - `score`
  - `totalCorrect`
  - `totalWrong`
  - `totalEmpty`
  - `totalNeedsReview`
  - `totalMultiMarked`
  - `imagePath`
  - `createdAt`
  - `updatedAt`
  - `questionResults[]`
  - `rawVisionOutput`
  - `errors[]`
- `questionResults[]` cần có:
  - `questionIndex`
  - `selectedOptions[]`
  - `correctOptions[]`
  - `status`
  - `isEmpty`
  - `markedCount`
  - `confidence`
  - `note`

**Done when**:
- Types cover được response từ scan API, history API, detail API.

### Task 2.2 — Nếu cần, thêm type phụ cho UI
- Có thể thêm type cho `PaperExamScanSummary` hoặc `PaperExamScanHistoryItem` nếu UI cần tách riêng.
- Không tách quá nhiều nếu chưa cần.
- Ưu tiên type rõ ràng, dễ map với response thực tế.

**Done when**:
- Không còn phải dùng `any` cho response scan.

---

## Phase 3 — API layer

### Task 3.1 — Mở rộng `paperExamApi.ts` hoặc tạo `paperExamScanApi.ts`
- Nếu project đang gộp resource, có thể thêm hàm scan vào `paperExamApi.ts`.
- Nếu muốn tách rõ, tạo `api/paperExamScanApi.ts`.
- Implement các hàm tối thiểu:
  - `scanPaperExam(paperExamId, payload)`
  - `getPaperExamScanResults(paperExamId)`
  - `getPaperExamScanResultById(scanResultId)`

**Done when**:
- Có API layer rõ ràng cho scan flow.

### Task 3.2 — Implement `scanPaperExam`
- Gửi request tới `POST /paper-exams/{id}/scan`.
- Dùng `FormData`.
- Append đúng part names:
  - `image` — file bắt buộc
  - `actualQuestionCount` — optional
  - `formVariant` — optional, mặc định `75`
  - `debug` — optional, mặc định `false`
  - `scanMode` — optional, mặc định `AUTO`
- Không gửi field tên khác nếu backend không có trong spec.
- Nếu `actualQuestionCount` không có, để backend tự fallback.

**Done when**:
- Request tạo ra đúng multipart body theo spec.

### Task 3.3 — Implement history/detail fetch API
- `getPaperExamScanResults(paperExamId)` gọi `GET /paper-exams/{id}/scan-results`.
- `getPaperExamScanResultById(scanResultId)` gọi `GET /paper-exams/scan-results/{scanResultId}`.
- Nếu response là list, giữ type list; nếu response là object, map đúng type detail.

**Done when**:
- Frontend đọc được lịch sử scan và scan detail.

---

## Phase 4 — Hooks

### Task 4.1 — Tạo hook mutation scan
- Tạo hook theo pattern hiện có, ví dụ `usePaperExamScan`.
- Hook cần cung cấp:
  - mutate function
  - loading state
  - error state
  - success callback
- Sau khi scan thành công, invalidate/refetch list scan nếu cần.

**Done when**:
- Component upload không cần gọi API trực tiếp.

### Task 4.2 — Tạo hook query lịch sử scan
- Tạo `usePaperExamScanResults(paperExamId)`.
- Hook cần quản lý loading/error/empty state.
- Nên cache theo `paperExamId`.

**Done when**:
- UI lấy được danh sách scan của một paper exam.

### Task 4.3 — Tạo hook query scan detail
- Tạo `usePaperExamScanResultDetail(scanResultId)`.
- Dùng cho màn chi tiết scan và có thể tái sử dụng ở modal/detail panel.

**Done when**:
- UI mở được một lần scan bất kỳ và hiển thị lại.

---

## Phase 5 — Màn hình scan

### Task 5.1 — Tạo page `PaperExamScan.tsx`
- Page nhận `paperExamId` từ route.
- Hiển thị thông tin cơ bản của `PaperExam` đang được scan.
- Có nút quay lại detail/list.
- Có khu vực upload ảnh và khu vực hiển thị kết quả.

**Done when**:
- Có thể mở màn scan từ route.

### Task 5.2 — Tạo component upload ảnh
- Component upload cần hỗ trợ:
  - chọn file ảnh;
  - preview ảnh trước khi submit;
  - thay file khác nếu cần;
  - validate file trước khi scan.
- Nên validate:
  - chưa chọn file;
  - file quá lớn;
  - file không phải ảnh hợp lệ.

**Done when**:
- Người dùng có thể chọn ảnh và xem trước ảnh.

### Task 5.3 — Submit scan request
- Khi user bấm `Chấm bài`:
  - tạo `FormData`
  - append `image`
  - append `actualQuestionCount` nếu có
  - append `formVariant` mặc định `75` nếu không nhập
  - append `debug` mặc định `false` nếu không nhập
  - append `scanMode` mặc định `AUTO` nếu không nhập
- Handle response `200` từ backend.
- Nếu status tổng là `SUCCESS`, hiển thị kết quả ngay.
- Nếu status là `FAILED_TO_READ`, `NEEDS_REVIEW`, `TIMEOUT`, `INVALID_IMAGE`, `SERVICE_UNAVAILABLE`, hiển thị cảnh báo rõ.

**Done when**:
- Một ảnh scan hợp lệ có thể được gửi và trả kết quả ra UI.

### Task 5.4 — Giữ state input sau lỗi
- Nếu API lỗi hoặc status xấu, không xoá hết preview file của user.
- Cho phép sửa và scan lại nhanh.

**Done when**:
- UX không làm người dùng phải chọn lại file vô ích.

---

## Phase 6 — Hiển thị kết quả scan

### Task 6.1 — Tạo component tổng quan kết quả
- Hiển thị:
  - `status`
  - `score`
  - `totalCorrect`
  - `totalWrong`
  - `totalEmpty`
  - `totalNeedsReview`
  - `totalMultiMarked`
- Dùng badge/color theo trạng thái.

**Done when**:
- Người dùng nhìn nhanh được kết quả tổng của lần scan.

### Task 6.2 — Tạo danh sách `questionResults`
- Render theo `questionIndex`.
- Mỗi item cần hiển thị:
  - `questionIndex`
  - `selectedOptions`
  - `correctOptions`
  - `status`
  - `isEmpty`
  - `markedCount`
  - `confidence`
  - `note`
- Highlight khác nhau cho:
  - `CORRECT`
  - `WRONG`
  - `EMPTY`
  - `MULTI_MARKED`
  - `NEEDS_REVIEW`
  - `IGNORED`

**Done when**:
- Có thể review từng câu rõ ràng theo response backend.

### Task 6.3 — Hiển thị ảnh scan
- Render ảnh từ `imagePath`.
- Nếu `imagePath` là relative path, prepend base URL theo convention project.
- Nếu ảnh lỗi load, hiển thị fallback.

**Done when**:
- Người dùng xem lại được ảnh scan đã lưu.

### Task 6.4 — Hiển thị raw output và errors
- Nếu `rawVisionOutput` tồn tại, hiển thị trong panel debug/collapse.
- Nếu `errors[]` tồn tại, render block cảnh báo riêng.

**Done when**:
- Có thông tin đủ để đối chiếu khi scan cần review.

---

## Phase 7 — Lịch sử scan và scan detail

### Task 7.1 — Tạo panel/table lịch sử scan
- Dùng `GET /paper-exams/{id}/scan-results`.
- Hiển thị list scan result theo thời gian.
- Cột đề xuất:
  - id
  - status
  - score
  - totalCorrect
  - totalWrong
  - totalEmpty
  - createdAt
  - actions

**Done when**:
- Có thể xem các lần scan trước đó của một paper exam.

### Task 7.2 — Tạo page chi tiết scan result
- Dùng `GET /paper-exams/scan-results/{scanResultId}`.
- Dùng lại component hiển thị kết quả tổng và từng câu nếu có thể.
- Có link quay lại history hoặc paper exam detail.

**Done when**:
- Có thể mở và xem lại một scan result bất kỳ.

### Task 7.3 — Tích hợp vào `PaperExamDetail`
- Thêm section/tab/panel `Scan Results` vào detail page.
- Từ đây có thể:
  - mở màn scan mới
  - xem lịch sử scan
  - xem một scan detail cụ thể

**Done when**:
- Flow scan được truy cập trực tiếp từ trang detail paper exam.

---

## Phase 8 — Route, menu, permission

### Task 8.1 — Thêm route cho scan feature
- Route tối thiểu nên có:
  - `paper-exams/:id/scan`
  - `paper-exams/:id/scan-results`
  - `paper-exams/scan-results/:scanResultId`
- Route phải nằm đúng layer routing của project.

**Done when**:
- Có thể mở màn scan và scan detail trực tiếp bằng URL.

### Task 8.2 — Thêm action/button trong admin UI
- Thêm nút trong `PaperExamDetail` hoặc `PaperExamManagement`:
  - `Chấm bằng ảnh`
  - `Xem lịch sử scan`
- Chỉ hiển thị cho `ADMIN` và `TEACHER`.

**Done when**:
- Người dùng thấy entry point rõ ràng cho scan flow.

### Task 8.3 — Kiểm tra access control
- Nếu role không hợp lệ:
  - không render menu/button
  - redirect hoặc forbidden theo convention hiện có

**Done when**:
- Feature không lộ cho role không có quyền.

---

## Phase 9 — Hoàn thiện UX và lỗi

### Task 9.1 — Chuẩn hóa loading / empty / error state
- Loading khi upload scan và khi fetch history/detail.
- Empty state khi chưa có scan result.
- Error state khi API lỗi hoặc file invalid.
- Không hiển thị nhầm lỗi thành success.

**Done when**:
- UX rõ ràng trong mọi trạng thái.

### Task 9.2 — Chuẩn hóa thông báo
- Dùng toast/message theo convention project.
- Với lỗi blob/file/API, hiển thị message thân thiện.

**Done when**:
- User hiểu ngay chuyện gì đang xảy ra.

### Task 9.3 — Test case theo spec
- Test ảnh rõ nét.
- Test ảnh mờ / nghiêng / thiếu sáng.
- Test câu bỏ trống.
- Test multiple choice.
- Test đề 10 câu trên form 75.
- Test scan history và scan detail.

**Done when**:
- Feature chạy ổn với các tình huống quan trọng.

---

## Phase 10 — Rà soát chất lượng

### Task 10.1 — Rà soát type và lint
- Kiểm tra type khớp response spec.
- Tránh dùng `any` nếu không cần thiết.
- Không tạo lint error mới.

**Done when**:
- Code sạch, dễ bảo trì.

### Task 10.2 — Kiểm tra end-to-end
- Tạo paper exam.
- Mở scan screen.
- Upload ảnh.
- Nhận kết quả.
- Xem lịch sử scan.
- Mở scan detail.
- Quay lại paper exam detail/list.

**Done when**:
- Luồng scan hoàn chỉnh chạy được trên UI.

---

## Definition of Done

Feature `paperexam scan` hoàn tất khi:

- Frontend gọi đúng các endpoint trong `API_SPEC.md`.
- Upload scan dùng đúng multipart field names.
- Kết quả scan và từng câu được render đầy đủ.
- Có lịch sử scan và scan detail.
- Có entry point rõ ràng từ admin UI.
- Chỉ `ADMIN` và `TEACHER` truy cập được.
- Code nằm đúng trong `frontend/src/features/admin` và bám sát pattern hiện có của project.
