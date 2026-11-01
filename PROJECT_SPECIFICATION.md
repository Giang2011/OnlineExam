# TÀI LIỆU ĐẶC TẢ SẢN PHẨM

## Tên dự án
Hệ thống Quản lý & Tổ chức Thi Trắc nghiệm Toàn diện

**Phiên bản:** 2.1

---

## 1. TỔNG QUAN

### 1.1 Mục tiêu sản phẩm
Sản phẩm là một hệ thống phần mềm phục vụ toàn bộ quy trình thi trắc nghiệm, từ quản lý ngân hàng câu hỏi, tổ chức kỳ thi, sinh đề tráo sẵn, làm bài, chấm điểm cho đến mở rộng sang quét bài giấy bằng ảnh.

Hệ thống được thiết kế để:

- giảm tải công việc ra đề và chấm thi cho giáo viên
- tăng tính công bằng và bảo mật khi tổ chức thi
- hỗ trợ cả thi trực tuyến và thi giấy
- lưu trữ dữ liệu lịch sử an toàn thông qua soft delete
- dễ dàng mở rộng sang các luồng xử lý bằng AI/Vision trong tương lai

### 1.2 Phạm vi hệ thống
Hệ thống bao gồm các phân hệ chính:

- quản lý người dùng và phân quyền 3 cấp
- quản lý môn học, chương, câu hỏi và đáp án
- quản lý kỳ thi và sinh đề tráo sẵn
- quản lý phiên thi và nộp bài một lần
- chấm điểm tự động
- tích hợp vision/external service cho bài giấy
- xuất tài liệu phục vụ in ấn và vận hành thi

### 1.3 Định hướng thiết kế
Hệ thống được xây dựng theo mô hình backend module hoá theo tính năng, có thể kết hợp với frontend hiện đại và các dịch vụ bên ngoài như Python vision service. Các luồng nghiệp vụ quan trọng được thiết kế để tách biệt rõ:

- nghiệp vụ thi cử
- nhận diện ảnh bài làm
- chấm điểm
- hiển thị báo cáo

---

## 2. KIẾN TRÚC TỔNG QUAN

### 2.1 Công nghệ
| Thành phần | Công nghệ |
|---|---|
| Backend | Java 21, Spring Boot |
| ORM | Spring Data JPA, Hibernate |
| Bảo mật | Spring Security, JWT |
| Cơ sở dữ liệu | MySQL |
| Validation | Jakarta Validation |
| Cache | Spring Cache |
| API Documentation | SpringDoc / Swagger |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Vision / OCR | Python service bọc engine `open-mcr` |

### 2.2 Cấu trúc module
Hệ thống backend được chia theo module:

- `core`
- `user`
- `question`
- `exam`
- `session`
- `grading`
- `paperexam`
- `external/vision`

### 2.3 Vai trò của module vision
Module `com.gr1.exam.external.vision` là tầng tích hợp kỹ thuật cho bài thi giấy. Nhiệm vụ của module này là:

- nhận ảnh scan hoặc ảnh chụp phiếu trả lời
- gọi vision service bên ngoài
- chuẩn hoá dữ liệu nhận diện
- trả kết quả cho `paperexam`

Module này **không** thực hiện chấm điểm. Chấm điểm vẫn thuộc về nghiệp vụ `paperexam`.

---

## 3. MỤC TIÊU NGHIỆP VỤ

### 3.1 Quản lý người dùng
Hệ thống hỗ trợ 3 vai trò:

- `ADMIN`
- `TEACHER`
- `STUDENT`

Quy ước:

- `ADMIN` quản lý toàn bộ hệ thống
- `TEACHER` quản lý câu hỏi, đề thi, thí sinh và kỳ thi
- `STUDENT` chỉ tham gia thi và xem kết quả của mình

### 3.2 Quản lý câu hỏi
Hệ thống quản lý câu hỏi theo:

- môn học
- chương
- danh sách đáp án
- ảnh minh hoạ cho câu hỏi và đáp án

Câu hỏi có thể là:

- single choice
- multiple choice

### 3.3 Quản lý kỳ thi
Kỳ thi được cấu hình theo:

- tiêu đề
- môn học
- thời gian làm bài
- thời gian mở/đóng
- cấu hình số câu theo từng chương
- số lượng variant đề thi

### 3.4 Chấm thi
Hệ thống hỗ trợ:

- chấm online từ đáp án học sinh nộp trực tiếp
- chấm offline từ dữ liệu scan bài giấy qua vision service

### 3.5 Tích hợp bài giấy
Luồng bài giấy được thiết kế theo form 75 và hỗ trợ multiple choice. Vision service chỉ trả dữ liệu nhận diện, backend sẽ map dữ liệu đó vào bài thi và thực hiện chấm điểm.

---

## 4. ĐẶC TẢ CHỨC NĂNG CHI TIẾT

### 4.1 Đăng nhập và phân quyền
- hệ thống đăng nhập bằng `username` và `password`
- sử dụng JWT cho xác thực
- phân quyền theo role
- route và UI phải được bảo vệ theo role

### 4.2 Quản lý tài khoản
#### ADMIN
- tạo Teacher
- tạo Student
- xem, sửa, xoá tài khoản bất kỳ

#### TEACHER
- tạo Student
- xem danh sách Student
- tự cập nhật thông tin cá nhân

#### STUDENT
- không được quản trị tài khoản
- chỉ được tham gia thi và xem kết quả cá nhân

### 4.3 Quản lý môn học và chương
- CRUD môn học
- mỗi môn có nhiều chương
- câu hỏi bắt buộc thuộc một chương
- chương chỉ có tên, không cần thứ tự hiển thị riêng

### 4.4 Quản lý câu hỏi
- thêm/sửa/xoá mềm câu hỏi
- hỗ trợ nhiều đáp án đúng
- upload ảnh minh hoạ cho câu hỏi và từng đáp án
- lọc theo môn học, chương, từ khoá
- phân trang danh sách câu hỏi

### 4.5 Quản lý kỳ thi
Khi tạo kỳ thi cần khai báo:

- tiêu đề
- môn học
- thời lượng
- thời gian bắt đầu/kết thúc
- cấu hình số câu theo từng chương
- tổng số variant

Hệ thống tự sinh đề gốc và các variant tráo sẵn, lưu vào DB để sử dụng ngay khi học sinh bắt đầu thi.

### 4.6 Sinh đề tráo sẵn
Quy trình:

1. chọn câu hỏi gốc từ ngân hàng theo cấu hình chương
2. tạo đề gốc
3. tráo thứ tự câu hỏi
4. tráo thứ tự đáp án trong từng câu
5. lưu toàn bộ variant vào cơ sở dữ liệu

### 4.7 Phiên thi
- học sinh nhấn bắt đầu thi
- hệ thống kiểm tra điều kiện tham gia
- random gán một variant đã tạo sẵn
- tạo session thi
- trả đề theo variant đã gán
- học sinh nộp bài một lần
- hệ thống chấm và lưu kết quả

### 4.8 Chấm điểm tự động
- đáp án được so sánh theo exact-set-match
- điểm số tính theo số câu đúng trên tổng số câu
- lưu kết quả theo session
- hỗ trợ full online flow và flow scan bài giấy

### 4.9 Bài giấy và vision integration
Đây là luồng mở rộng cho bài thi giấy. Quy ước xử lý:

- chỉ dùng cho bài giấy
- giai đoạn đầu chỉ hỗ trợ form 75
- hỗ trợ single choice và multiple choice
- không chứa logic chấm điểm trong vision service

Luồng tích hợp:

1. `paperexam` nhận request scan
2. `paperexam` gọi `external/vision`
3. `external/vision` gửi ảnh sang service vision
4. service vision trả dữ liệu nhận diện
5. backend map kết quả vào bài thi
6. `paperexam` thực hiện chấm điểm

---

## 5. ĐẶC TẢ MODULE `external/vision`

### 5.1 Mục đích
Module `com.gr1.exam.external.vision` chịu trách nhiệm tích hợp giữa backend Java và engine nhận diện ảnh `open-mcr`.

### 5.2 Chức năng chính
- cấu hình kết nối vision service
- gửi request scan sang service ngoài
- nhận và chuẩn hoá response
- phân loại trạng thái scan
- cung cấp exception riêng cho vision
- làm lớp trung gian để `paperexam` không phụ thuộc trực tiếp vào engine bên dưới

### 5.3 Phạm vi dữ liệu đầu vào
Request scan chuẩn có thể gồm:

- `paperExamId`
- `formVariant` mặc định là `75`
- `actualQuestionCount`
- `scanMode`
- `debug`
- `imageBase64` hoặc `imageUrl`

### 5.4 Phạm vi dữ liệu đầu ra
Response chuẩn hoá từ vision service thường gồm:

- `status`
- `paperExamId`
- `recognizedAnswers[]`
- `rawOutput`
- `errors[]`

Mỗi phần tử trong `recognizedAnswers[]` gồm:

- `questionIndex`
- `selectedOptions[]`
- `isEmpty`
- `confidence`
- `markedCount`

### 5.5 Trạng thái chuẩn hoá
Một số trạng thái quan trọng:

- `SUCCESS`
- `FAILED_TO_READ`
- `NEEDS_REVIEW`
- `TIMEOUT`
- `INVALID_IMAGE`
- `SERVICE_UNAVAILABLE`

### 5.6 Nguyên tắc xử lý
- chỉ nhận 1 ảnh cho 1 lần scan ở giai đoạn đầu
- nếu ảnh lỗi, trả thông báo rõ ràng
- confidence thấp thì đánh dấu để review
- câu bỏ trống phải được biểu diễn rõ ràng
- câu nhiều đáp án phải giữ nguyên toàn bộ tập lựa chọn

---

## 6. MÔ HÌNH DỮ LIỆU

Hệ thống có các nhóm dữ liệu chính sau:

- `users`
- `subjects`
- `chapters`
- `questions`
- `answers`
- `exams`
- `exam_chapter_configs`
- `exam_variants`
- `exam_variant_questions`
- `exam_variant_answers`
- `exam_participants`
- `exam_sessions`
- `user_answers`
- `user_answer_selections`
- `results`

Các bảng này phục vụ toàn bộ chu trình từ tạo đề, phân công, làm bài, nộp bài cho tới chấm điểm và thống kê.

---

## 7. QUY ƯỚC VẬN HÀNH

### 7.1 Soft delete
Tất cả dữ liệu nghiệp vụ quan trọng đều sử dụng soft delete. Khi xoá, hệ thống chỉ đánh dấu `deleted = true` thay vì xoá vật lý.

### 7.2 Ảnh upload
Ảnh minh hoạ và ảnh scan được lưu trên server và truy cập thông qua đường dẫn công khai phù hợp.

### 7.3 Bảo mật API
- token JWT phải được đính kèm cho các request cần xác thực
- request không hợp lệ phải trả lỗi rõ ràng
- file quá lớn hoặc ảnh không hợp lệ phải được báo lỗi thân thiện

### 7.4 Tính nhất quán khi nộp bài
Hệ thống phải đảm bảo nộp bài một lần, chống submit trùng, và chặn các tình huống retry gây ghi đè dữ liệu.

---

## 8. TRẠNG THÁI VÀ ĐỊNH HƯỚNG MỞ RỘNG

### 8.1 Đã có trong hệ thống
- quản lý user theo 3 role
- quản lý câu hỏi theo môn/chương
- sinh đề tráo sẵn
- làm bài và chấm online
- soft delete toàn hệ thống
- hỗ trợ upload ảnh

### 8.2 Đang mở rộng / tích hợp
- kết xuất PDF đề thi và đáp án
- vision service cho bài giấy
- scan và nhận diện phiếu trả lời

### 8.3 Hướng phát triển tương lai
- OCR trích xuất câu hỏi từ PDF hoặc ảnh scan
- dashboard analytics
- giám sát thi realtime
- proctoring và phát hiện gian lận

---

## 9. KẾT LUẬN
Tài liệu này mô tả đặc tả tổng quan và chi tiết của hệ thống thi trắc nghiệm toàn diện, bao gồm cả luồng thi online và luồng bài giấy thông qua module `external/vision`. Đây là tài liệu tham chiếu cho phát triển backend, frontend, kiểm thử và mở rộng hệ thống trong các giai đoạn tiếp theo.