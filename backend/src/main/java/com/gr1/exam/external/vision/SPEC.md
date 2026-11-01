# Vision integration spec — `open-mcr` + `paperexam`

## 1. Mục đích
Tài liệu này mô tả chuẩn tích hợp giữa backend và engine `open-mcr` để đọc ảnh phiếu trả lời trắc nghiệm cho module `paperexam`.

## 2. Phạm vi
- Chỉ dùng cho bài giấy.
- Chỉ áp dụng cho form 75 ở giai đoạn đầu.
- Hỗ trợ single choice và multiple choice.
- Không chứa logic chấm điểm trong `open-mcr`; mọi grading nằm ở backend.

## 3. Cấu trúc module
### 3.1. `com.gr1.exam.external.vision`
Chứa toàn bộ code tích hợp vision:
- client gọi Python service
- DTO request/response
- xử lý file ảnh
- mapping kết quả OCR/OMR
- exception riêng cho vision

### 3.2. `com.gr1.exam.module.paperexam`
Chỉ làm nghiệp vụ:
- nhận request scan
- gọi service vision qua layer `external`
- map kết quả với snapshot paper exam
- chấm điểm
- lưu kết quả

## 4. Contract đầu vào
### 4.1. Request chuẩn gửi sang vision service
Tất cả request scan phải mang các trường sau:
- `paperExamId` — id của bài thi giấy đang được chấm
- `formVariant` — mặc định là `75`
- `actualQuestionCount` — số câu thực tế cần chấm ở backend
- `scanMode` — chế độ scan, ví dụ `AUTO` hoặc `MANUAL_REVIEW`
- `debug` — bật tắt dữ liệu debug khi cần đối chiếu

Ảnh đầu vào chỉ dùng một trong hai cách:
- `imageBase64` — chuỗi base64 của ảnh scan
- `imageUrl` — URL ảnh đã được lưu sẵn

### 4.2. Ràng buộc ảnh đầu vào
- Chỉ nhận 1 ảnh cho 1 lần scan ở giai đoạn 1.
- Ảnh phải là scan hoặc ảnh chụp phiếu trả lời hợp lệ.
- Nếu ảnh thiếu dữ liệu, sai định dạng, quá lớn hoặc không đọc được thì service phải trả lỗi rõ ràng.

## 5. Contract đầu ra từ vision service
### 5.1. Response chuẩn hoá
Response JSON từ vision service phải có các trường:
- `status`
- `paperExamId`
- `recognizedAnswers[]`
- `rawOutput`
- `errors[]`

### 5.2. Mỗi phần tử trong `recognizedAnswers[]`
- `questionIndex` — số thứ tự câu trên form 75
- `selectedOptions[]` — danh sách đáp án được tô, ví dụ `['A']` hoặc `['A', 'C']`
- `isEmpty` — `true` nếu không tô đáp án nào
- `confidence` — độ tin cậy nhận diện từ `0.0` đến `1.0`
- `markedCount` — số ô được tô mà vision đọc được

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

## 6. Quy ước output của backend grading
### 6.1. Trạng thái mỗi câu
- `CORRECT`
- `WRONG`
- `EMPTY`
- `MULTI_MARKED`
- `NEEDS_REVIEW`

### 6.2. Luật chấm
- Single answer: phải khớp đúng 1 đáp án.
- Multiple choice: phải khớp đúng tập đáp án.
- Bỏ trống: không tô gì.
- Câu ngoài `actualQuestionCount`: bỏ qua hoàn toàn.

### 6.3. Quy ước form 75 cho đề ngắn
Nếu `paperExamId` chỉ có 10 câu thì:
- câu 1..10 là câu thật
- câu 11..75 là trống
- backend chỉ chấm 10 câu đầu

## 7. Acceptance criteria
- Backend gọi được vision service.
- Vision service trả JSON ổn định.
- `paperexam` dùng lại được mà không biết chi tiết `open-mcr`.
- Đề 10 câu vẫn chấm được trên form 75.
- Multiple choice được chấm đúng theo exact-set-match.
