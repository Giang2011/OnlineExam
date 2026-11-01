# Task backend — tích hợp `open-mcr` cho chấm bài giấy

## Mục tiêu
Hoàn thiện luồng **chấm bài giấy bằng ảnh scan** cho module `paperexam`, sử dụng `open-mcr` làm engine nhận diện phiếu trả lời theo form 75, hỗ trợ multiple choice, và backend chịu trách nhiệm map kết quả nhận diện với đáp án để tính điểm và hiển thị đúng/sai/bỏ trống theo từng câu.

---

## Danh sách việc cần làm

### 1. Chốt contract vision I/O
- [x] Xác định request chuẩn gửi sang Python service bọc `open-mcr`
- [x] Xác định response JSON trả về từ vision service
- [x] Quy định cách biểu diễn multiple choice
- [x] Quy định cách biểu diễn câu bỏ trống
- [x] Quy định cách xử lý ảnh lỗi / không đọc được / confidence thấp
- [x] Quy định trạng thái chuẩn: `SUCCESS`, `FAILED_TO_READ`, `NEEDS_REVIEW`, `TIMEOUT`, `INVALID_IMAGE`

### 2. Thiết kế dữ liệu chấm scan trong backend
- [x] Thêm model/DTO cho scan request
- [x] Thêm model/DTO cho scan result
- [x] Thêm model/DTO cho từng câu được nhận diện
- [x] Lưu metadata liên quan tới form 75 và số câu thực tế của đề giấy
- [x] Lưu trạng thái câu đúng/sai/bỏ trống/multi-marked
- [x] Lưu raw vision output để phục vụ debug

### 3. Bọc `open-mcr` thành vision service trong `external/vision`
- [x] Tạo entrypoint HTTP cho Python service
- [x] Nhận ảnh upload từ backend
- [x] Chạy `open-mcr` theo form 75
- [x] Trả kết quả nhận diện dạng JSON thay vì chỉ CSV
- [x] Hỗ trợ multiple choice và empty answers
- [x] Hỗ trợ chế độ debug nếu cần đối chiếu ảnh/ô tô
- [x] Quy định timeout và retry cho service này

### 4. Tích hợp backend VisionService
- [x] Viết client gọi vision service từ Spring Boot
- [x] Cấu hình URL, timeout, retry, logging
- [x] Chuẩn hoá lỗi từ vision service thành lỗi backend rõ ràng
- [x] Map response vision sang structure nội bộ của `paperexam`

### 5. Implement luồng scan và chấm điểm
- [x] Tạo API upload ảnh phiếu trả lời cho `paperexam`
- [x] Gửi ảnh sang vision service để đọc đáp án
- [x] Map kết quả nhận diện với câu hỏi/đáp án snapshot của đề giấy
- [x] Chấm điểm theo exact-set-match
- [x] Trả về danh sách câu đúng/sai/bỏ trống cho từng thí sinh
- [x] Xử lý đề ít hơn 75 câu bằng quy ước cố định: các câu thật nằm ở đầu form, phần còn lại bỏ trống
- [x] Xử lý câu nhiều lựa chọn được tô nhưng đề chỉ cho phép 1 đáp án đúng

### 6. Lưu kết quả chấm
- [x] Tạo entity/table nếu cần để lưu scan result
- [x] Lưu tổng điểm
- [x] Lưu số câu đúng/sai/bỏ trống
- [x] Lưu chi tiết từng câu đã tô
- [x] Lưu raw vision output để debug khi cần
- [x] Lưu ảnh sheet vào `backend/uploads` và chỉ lưu đường dẫn tương đối trong database
- [x] Dùng chính ảnh upload làm định danh của lần scan/thí sinh (không phụ thuộc vào tên thí sinh OCR)
- [x] Kiểm tra và đảm bảo đường dẫn `uploads/**` đang được public để frontend có thể truy cập ảnh
- [x] Gắn scan result với `paperExamId` và ảnh tương ứng

### 7. API xem lại kết quả
- [x] Tạo endpoint xem kết quả scan chi tiết
- [x] Tạo endpoint xem từng câu đã tô gì và đáp án đúng là gì
- [x] Tạo endpoint phục vụ giáo viên kiểm tra lại kết quả chấm
- [x] Tạo response để frontend có thể highlight câu đúng/sai/bỏ trống

### 8. Kiểm thử và hardening
- [ ] Test ảnh rõ nét
- [ ] Test ảnh mờ / nghiêng / thiếu sáng
- [ ] Test multiple choice
- [ ] Test câu bỏ trống
- [ ] Test đề 10 câu chạy trên form 75
- [ ] Test trường hợp nhiều ảnh / nhiều trang nếu có hỗ trợ sau này
- [ ] Kiểm tra lint / compile / API contract

---

## Thứ tự thực hiện đề xuất
1. Chốt contract vision I/O
2. Tạo Python vision service bọc `open-mcr`
3. Tích hợp `VisionService` trong `external/vision`
4. Implement API upload ảnh và chấm điểm trong `paperexam`
5. Lưu kết quả chấm
6. API xem chi tiết kết quả
7. Test thực tế với form 75 và đề ngắn hơn 75 câu

---

## Definition of done
- `open-mcr` được bọc thành service trong `com.gr1.exam.external.vision`.
- `paperexam` chỉ gọi service vision, không chứa logic xử lý ảnh.
- Backend gọi được vision service và nhận JSON.
- Form 75 được hỗ trợ.
- Multiple choice được đọc và chấm đúng.
- Đề ngắn hơn 75 câu vẫn chấm được bằng quy ước câu đầu tiên là câu thật.
- Backend trả được từng câu đúng/sai/bỏ trống.
- Kết quả scan được lưu và xem lại được.
