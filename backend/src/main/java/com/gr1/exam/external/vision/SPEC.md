# Vision integration spec — `SheetScanner` + `paperexam`

## 1. Mục đích
Tài liệu này mô tả chuẩn tích hợp giữa backend và engine OMR **SheetScanner** (FastAPI service tại `SheetScanner/service/app.py`) để đọc ảnh phiếu trả lời trắc nghiệm cho module `paperexam`.

> Engine cũ `open-mcr` (vendor clone nằm trong `src/main/java`) đã bị loại bỏ. SheetScanner là nguồn sự thật duy nhất cho hình học ô tô (ArUco marker, toạ độ bubble).

## 2. Phạm vi
- Chỉ dùng cho bài giấy (`paperexam`).
- Hỗ trợ **multiple choice** (nhiều đáp án đúng mỗi câu) và **multi-page** (một đề nhiều trang phiếu).
- Không chứa logic chấm điểm trong `SheetScanner`; mọi grading nằm ở backend.

## 3. Cấu trúc module
### 3.1. `com.gr1.exam.external.vision`
Chứa toàn bộ code tích hợp vision:
- client gọi Python service (`HttpVisionClientService`, `VisionSheetClientService`)
- DTO request/response
- facade trung gian (`VisionScanFacadeService`)
- exception riêng cho vision
- cấu hình (`VisionProperties`, `VisionClientConfig`)

### 3.2. `com.gr1.exam.module.paperexam`
Chỉ làm nghiệp vụ:
- nhận request scan (nhiều ảnh)
- gọi service vision qua layer `external`
- map kết quả với snapshot `PaperExam` / `PaperExamAnswer`
- chấm điểm
- lưu kết quả

## 4. Contract đầu vào

### 4.1. Request gửi sang `/scan`
Tất cả request scan phải mang các trường sau (multipart/form-data):
- `paperExamId` — id của đề giấy đang được chấm
- `actualQuestionCount` — số câu thực tế cần chấm ở backend
- `image` — ảnh **một trang** phiếu (mỗi lần gọi chỉ 1 trang)
- `choicesPerQ` — số lựa chọn tối đa mỗi câu (A..E)
- `questionsPerPage` — số câu trên mỗi trang phiếu (quyết định offset câu toàn cục)
- `layout` — JSON layout OMR (xem `VisionProperties.omrLayout`)
- `pageIndex` — **fallback** khi QR không đọc được; engine tự đọc `page_index` trong QR
- `scanMode` — chế độ scan, ví dụ `AUTO`
- `debug` — bật/tắt dữ liệu debug

> **Không còn `formVariant`.** Layout phiếu do backend kiểm soát, không phụ thuộc form 75 cứng.

### 4.2. Request gửi sang `/sheets/generate`
JSON body:
- `examId` — mã đề nhúng vào QR (vd `EXAM-101`)
- `studentId` — mã thí sinh nhúng vào QR
- `numQuestions` — tổng số câu của đề
- `choicesPerQ` — số lựa chọn mỗi câu
- `questionsPerPage` — số câu mỗi trang
- `layout` — JSON layout OMR

### 4.3. Ràng buộc ảnh đầu vào
- Mỗi lần gọi `/scan` nhận **đúng 1 ảnh = 1 trang phiếu**.
- Ảnh phải là scan hoặc ảnh chụp phiếu trả lời hợp lệ (có 4 ArUco marker ở 4 góc).
- Nếu ảnh thiếu dữ liệu, sai định dạng, quá lớn hoặc không đọc được thì service trả lỗi rõ ràng.

## 5. Contract đầu ra từ vision service

### 5.1. Response chuẩn hoá (`/scan`)
- `status`
- `paperExamId`
- `actualQuestionCount`
- `studentId` — mã thí sinh đọc từ QR (có thể null)
- `examId` — mã đề đọc từ QR (có thể null)
- `pageIndex` — trang đang đọc (từ QR, fallback form field)
- `warpMethod` — cách warp ảnh (`aruco` / `contour`)
- `recognizedAnswers[]`
- `rawOutput`
- `errors[]`

### 5.2. Mỗi phần tử trong `recognizedAnswers[]`
- `questionIndex` — **số câu TOÀN CỤC** (1-based), đã offset theo trang
- `selectedOptions[]` — danh sách đáp án được tô, ví dụ `['A']` hoặc `['A', 'C']`
- `isEmpty` — `true` nếu không tô đáp án nào
- `confidence` — độ tin cậy nhận diện từ `0.0` đến `1.0`
- `markedCount` — số ô được tô mà vision đọc được
- `fillRatios[]` — **fill ratio thật** của từng ô (0..1), đo trực tiếp từ ảnh
- `status` — trạng thái ở tầng engine: `READ` / `BLANK` / `AMBIGUOUS`
- `pageIndex` — trang chứa câu này

> Khác biệt quan trọng so với engine cũ: `fillRatios` và `confidence` là số thật đo từ ảnh, **không suy đoán qua file CSV**.

### 5.3. Quy ước biểu diễn multiple choice và câu bỏ trống
- Câu chọn 1 đáp án: `selectedOptions[]` chứa đúng 1 phần tử.
- Câu chọn nhiều đáp án: `selectedOptions[]` chứa nhiều phần tử theo thứ tự chữ cái.
- Câu bỏ trống: `isEmpty = true`, `selectedOptions[] = []`, `markedCount = 0`.
- Nếu vision đọc được nhiều hơn 1 ô trong câu chỉ cho phép 1 đáp án, backend sẽ gán trạng thái `MULTI_MARKED` hoặc `NEEDS_REVIEW` tùy ngữ cảnh chấm.

### 5.4. Quy ước xử lý ảnh lỗi / không đọc được / confidence thấp
- Ảnh lỗi định dạng hoặc không hợp lệ: `INVALID_IMAGE`
- Không đọc được dữ liệu đáng tin cậy: `FAILED_TO_READ`
- Confidence thấp nhưng vẫn suy ra được dữ liệu: `NEEDS_REVIEW`
- Không phản hồi kịp thời: `TIMEOUT`
- Service không truy cập được: `SERVICE_UNAVAILABLE`

### 5.5. Response `/sheets/generate`
- `examId`, `studentId`, `numQuestions`, `choicesPerQ`, `questionsPerPage`, `pageCount`
- `pages[]` — **mỗi phần tử là 1 PNG base64** (1 trang phiếu). Java gom các PNG này thành PDF bằng openhtmltopdf.

## 6. Quy ước output của backend grading

### 6.1. Trạng thái mỗi câu
- `CORRECT`
- `WRONG`
- `EMPTY`
- `MULTI_MARKED`
- `NEEDS_REVIEW`
- `IGNORED` (câu ngoài phạm vi chấm)

### 6.2. Luật chấm
- **Exact-set-match**: tập đáp án được tô phải bằng đúng tập đáp án đúng (không quan tâm thứ tự).
- Câu nhiều đáp án đúng: tô đúng **cả** các ô đúng ⇒ `CORRECT`.
- `MULTI_MARKED` **chỉ** áp dụng cho câu có đúng 1 đáp án đúng mà thí sinh tô nhiều ô.
- Engine báo `AMBIGUOUS` ⇒ `NEEDS_REVIEW`.
- Bỏ trống: `EMPTY`.
- Câu ngoài `actualQuestionCount`: `IGNORED`.

### 6.3. Ghép nhiều trang (multi-page)
Một bài làm có thể gồm nhiều trang. Backend **không** ghép ảnh ở tầng pixel (mỗi trang phải warp riêng về canonical 850×1100), mà ghép ở tầng dữ liệu:

```
questionIndex_toàn_cục = page_index * questions_per_page + row_trong_trang + 1
```

Nhờ vậy backend union kết quả các trang chỉ bằng `questionIndex`, không phụ thuộc thứ tự upload.

Kiểm tra an toàn:
- `examId` trong QR lệch đề đang chấm ⇒ `INVALID_IMAGE`.
- Nhiều `studentId` khác nhau giữa các trang ⇒ `NEEDS_REVIEW` (trộn bài).
- 2 trang cùng `page_index` ⇒ `NEEDS_REVIEW`.
- Thiếu trang ⇒ các câu của trang đó `EMPTY` + `NEEDS_REVIEW` + `errors[]` ghi rõ "Thiếu trang N".

## 7. Acceptance criteria
- Backend gọi được SheetScanner service.
- SheetScanner trả JSON ổn định, có `fillRatios` thật.
- `paperexam` dùng lại được mà không biết chi tiết nội bộ SheetScanner.
- Đề nhiều trang (vd 16 câu → 2 trang) chấm đúng sau khi ghép.
- Multiple choice được chấm đúng theo exact-set-match.
- Phiếu OMR sinh được (`GET /paper-exams/{id}/omr-sheet`) và dùng để quét lại được.
