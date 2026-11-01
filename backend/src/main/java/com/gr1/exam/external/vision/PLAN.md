# Kế hoạch tích hợp `open-mcr` vào `paperexam`

## 1. Mục tiêu
Tích hợp luồng **chấm bài giấy bằng ảnh scan** vào backend để hỗ trợ module `paperexam`, sử dụng `open-mcr` như engine OMR/vision. Mục tiêu là: từ ảnh phiếu trả lời của thí sinh, hệ thống đọc ra các lựa chọn đã tô, hỗ trợ **multiple choice**, dùng **form 75**, sau đó backend map kết quả này với đáp án đúng trong đề giấy để chấm điểm, xác định câu đúng/sai/bỏ trống, và trả kết quả chi tiết cho giáo viên/thí sinh.

## 2. Phạm vi sử dụng
Luồng này chỉ áp dụng cho **đề giấy** đã được tạo bởi module `paperexam`.

### Đầu vào nghiệp vụ mong muốn
- Ảnh scan phiếu trả lời của thí sinh.
- `paperExamId` hoặc mã đề giấy tương ứng.
- Thông tin nhận dạng thí sinh nếu có (tuỳ flow nhập ảnh).
- Tập ảnh có thể gồm nhiều trang, nhưng giai đoạn 1 chỉ hỗ trợ **1 ảnh / 1 phiếu**.

### Đầu ra nghiệp vụ mong muốn
- Danh sách câu hỏi mà thí sinh đã tô đáp án nào.
- Hỗ trợ câu chọn đơn và **multiple choice**.
- Kết quả chấm: câu đúng, câu sai, câu bỏ trống, câu nhiều đáp án.
- Điểm tổng.
- Dữ liệu để UI/giáo viên xem lại từng câu.

## 3. Nguyên tắc tích hợp
### 3.1. `open-mcr` chỉ làm vision, không làm grading
`open-mcr` chỉ làm nhiệm vụ đọc ảnh và trả về dữ liệu nhận diện. Toàn bộ logic:
- map kết quả đọc được với đề giấy,
- so sánh với đáp án,
- tính điểm,
- lưu kết quả,
- trả báo cáo chi tiết,

nằm trong backend Java, cụ thể là lớp tích hợp trong `com.gr1.exam.external` và lớp nghiệp vụ `paperexam` chỉ gọi service đó.

### 3.2. Sử dụng form 75 làm chuẩn xử lý ảnh
- Vision layer chạy theo chuẩn **75 câu**.
- Nếu đề giấy thực tế ít hơn 75 câu, ví dụ 10 câu, thì quy ước:
  - 10 câu đầu tiên là câu thật cần chấm.
  - 65 câu còn lại là bỏ trống.
- Backend phải lưu được quy ước mapping này để không chấm nhầm các câu trống.

### 3.3. Hỗ trợ multiple choice
- Nếu `open-mcr` nhận ra một câu có nhiều lựa chọn được tô, backend phải lưu được tập lựa chọn đó.
- Khi chấm, backend so sánh theo kiểu **exact-set-match**:
  - đúng khi tập lựa chọn của thí sinh trùng hoàn toàn với tập đáp án đúng.
  - sai khi thiếu đáp án, thừa đáp án, hoặc chọn sai đáp án.

### 3.4. Tách biệt module rõ ràng
- `com.gr1.exam.external.vision` là nơi đặt toàn bộ code tích hợp `open-mcr`.
- `com.gr1.exam.module.paperexam` chỉ gọi service vision qua interface/service đã định nghĩa.
- `paperexam` không được chứa logic parse ảnh, không được phụ thuộc vào chi tiết `open-mcr`.

## 4. Kiến trúc đề xuất

### 4.1. Thành phần mới trong `external/vision`
1. **Python Vision Adapter Service**
   - Một service Python nhỏ bọc `open-mcr`.
   - Nhận ảnh scan từ backend.
   - Trả JSON chuẩn hoá về backend.

2. **Backend Vision Client**
   - Một service Java trong `com.gr1.exam.external.vision` để gọi Python service.
   - Chuyển ảnh thành request phù hợp.
   - Nhận kết quả nhận diện.
   - Xử lý lỗi, retry, timeout, và map dữ liệu.

3. **Vision DTO / Model**
   - Request/response chuẩn hoá cho luồng nhận diện.
   - Không phụ thuộc trực tiếp vào entity `paperexam`.

### 4.2. Thành phần nghiệp vụ trong `paperexam`
1. **Paper Exam Offline Grading Service**
   - Nhận `paperExamId` + ảnh scan.
   - Gọi service vision.
   - Lấy snapshot đề giấy.
   - Map kết quả nhận diện với câu hỏi/đáp án.
   - Tính điểm và trạng thái đúng/sai của từng câu.

### 4.3. Tách rõ 2 lớp dữ liệu
- **Vision layer**: ảnh → đáp án đã tô.
- **Grading layer**: đáp án đã tô → đối chiếu với đáp án đúng.

Không để `open-mcr` biết về logic chấm điểm của đề giấy.

## 5. Luồng nghiệp vụ đề xuất

### 5.1. Chuẩn bị đề giấy
Khi tạo `paperexam`, backend cần lưu thêm metadata phục vụ chấm ảnh:
- `paperFormVariant = 75`
- `questionCountActual`
- `paperLayoutMode`
- `filledQuestionRange = 1..N` (ví dụ 1..10)
- quy ước câu nào được chấm, câu nào bỏ trống

### 5.2. Xử lý ảnh scan
1. User upload ảnh phiếu trả lời.
2. Backend lưu file tạm hoặc file thật theo quy ước hệ thống.
3. Backend gọi service `com.gr1.exam.external.vision`.
4. Python service trả danh sách câu hỏi và các lựa chọn đã tô.
5. Backend nhận kết quả và map sang danh sách câu thật của đề giấy.
6. Backend chấm theo đáp án snapshot đã lưu trong `paperexam`.
7. Backend lưu kết quả chấm và trả response chi tiết.

## 6. Quy ước mapping cho đề không đủ 75 câu
Đây là phần quan trọng nhất cho case của bạn.

### 6.1. Nếu đề có 10 câu
- Hệ thống coi **câu 1 đến câu 10** là câu thật.
- Các vị trí từ câu 11 đến 75 là trống.
- Khi `open-mcr` trả về 75 vị trí, backend chỉ lấy 10 vị trí đầu để chấm.

### 6.2. Nếu đề có số câu khác 10 nhưng vẫn dưới 75
- Backend phải biết `actualQuestionCount`.
- Backend chỉ chấm từ câu 1 đến câu `actualQuestionCount`.
- Câu còn lại bỏ qua, nhưng vẫn có thể giữ trong kết quả OCR để debug.

### 6.3. Trường hợp đề không khớp vị trí đơn giản
Nếu sau này cần layout không phải “câu 1 ở vị trí 1, câu 2 ở vị trí 2”, thì cần thêm mapping chi tiết hơn.
Tuy nhiên, trong phạm vi hiện tại, chọn quy ước đơn giản:
- đề 10 câu → luôn là 10 câu đầu tiên trên form 75.

## 7. Thiết kế dữ liệu trả về từ vision
Backend chuẩn hoá kết quả từ `open-mcr` về dạng nội bộ có các trường:
- `questionIndex`
- `selectedOptions[]`
- `confidence`
- `isEmpty`
- `rawRecognitionData`
- `status` (`SUCCESS`, `FAILED_TO_READ`, `NEEDS_REVIEW`, `TIMEOUT`, `INVALID_IMAGE`)

### Ví dụ kết quả logic
- Câu 1 → A
- Câu 2 → B, D
- Câu 3 → bỏ trống

Backend sẽ map kết quả này sang câu hỏi tương ứng trong `paperexam`.

## 8. Chấm điểm cho paper exam
### 8.1. Rule chấm
- Đúng nếu tập đáp án được tô khớp hoàn toàn với tập đáp án đúng.
- Sai nếu:
  - thiếu đáp án đúng,
  - tô thừa đáp án sai,
  - bỏ trống câu có đáp án.
- Nếu một câu có nhiều lựa chọn được tô nhưng đề chỉ cho phép 1 đáp án đúng thì câu đó là `WRONG` hoặc `MULTI_MARKED` theo rule hiển thị.

### 8.2. Kết quả cần lưu
- Tổng số câu đúng.
- Tổng số câu sai.
- Tổng số câu bỏ trống.
- Điểm cuối cùng.
- Trạng thái từng câu:
  - `CORRECT`
  - `WRONG`
  - `EMPTY`
  - `MULTI_MARKED` nếu nhận diện nhiều lựa chọn nhưng đề chỉ có 1 đáp án đúng.

### 8.3. Trả về cho UI
- Tổng điểm.
- Danh sách từng câu với đáp án đúng và đáp án thí sinh đã tô.
- Cho biết câu nào đúng/sai/bỏ trống.
- Highlight câu nhiều đáp án nếu cần.

## 9. API đề xuất
### 9.1. Vision integration
- `POST /api/paper-exams/{id}/scan`
  - upload ảnh phiếu trả lời
  - trả kết quả nhận diện + chấm điểm

- `POST /api/paper-exams/{id}/scan/batch`
  - xử lý nhiều ảnh nếu sau này có multi-page

### 9.2. Kết quả chấm
- `GET /api/paper-exams/{id}/scan-results/{scanResultId}`
  - xem lại chi tiết một lần chấm

## 10. Kế hoạch triển khai theo bước
### Bước 1 — Chốt contract input/output của vision
- Xác định request gửi sang Python service.
- Xác định response JSON chuẩn hoá.
- Quy định rõ multiple choice, empty answer, rejected image.
- Quy định ngưỡng confidence và trạng thái `NEEDS_REVIEW`.

### Bước 2 — Bọc `open-mcr` thành Python service
- Tạo entrypoint HTTP.
- Cho phép upload ảnh.
- Trả JSON thay vì chỉ ghi CSV.
- Hỗ trợ form 75.

### Bước 3 — Tích hợp backend VisionService
- Viết client gọi Python service.
- Cấu hình URL, timeout, retry, logging.
- Chuẩn hoá lỗi vision.

### Bước 4 — Tạo luồng scan cho paper exam
- Upload ảnh.
- Gọi vision.
- Map kết quả với `PaperExamQuestion` / `PaperExamAnswer` snapshot.
- Tính điểm.

### Bước 5 — Lưu kết quả chấm
- Lưu metadata scan.
- Lưu chi tiết từng câu.
- Lưu điểm tổng.

### Bước 6 — API trả kết quả chi tiết
- Trả cho giáo viên xem câu đúng/sai.
- Trả cho student nếu policy cho phép.

### Bước 7 — Kiểm thử thực tế
- Test ảnh rõ nét.
- Test multiple choice.
- Test câu 1..10 trên form 75.
- Test bỏ trống phần còn lại.
- Test ảnh lỗi / mờ / nghiêng.

## 11. Rủi ro và cách xử lý
### 11.1. Ảnh scan chất lượng thấp
- Cần threshold confidence.
- Nếu confidence quá thấp, đánh dấu cần kiểm tra tay.

### 11.2. Multiple choice bị đọc nhầm
- Cần rule xử lý “tô nhiều ô một câu”.
- Cần hiển thị raw result để người chấm kiểm tra lại.

### 11.3. Đề ngắn hơn 75 câu
- Cố định quy ước top-N câu đầu tiên.
- Không để backend suy đoán ngẫu nhiên.

### 11.4. Không đồng nhất giữa form và metadata đề
- Backend phải validate `paperexam` trước khi cho scan.
- Chỉ cho scan khi đề đã khai báo rõ số câu thực tế.

## 12. Definition of Done
- Có service vision bọc `open-mcr` trong `com.gr1.exam.external.vision`.
- `paperexam` chỉ gọi service vision, không chứa logic xử lý ảnh.
- Backend gọi được vision service và nhận JSON.
- Hỗ trợ form 75.
- Hỗ trợ multiple choice.
- Đề 10 câu vẫn chấm được bằng form 75 với 10 câu đầu tiên.
- Backend trả được câu đúng/sai/bỏ trống cho từng câu.
- Kết quả chấm được lưu vào DB.
