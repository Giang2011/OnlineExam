# Kế hoạch tích hợp `SheetScanner` vào `paperexam`

> **Trạng thái: đã triển khai.** Tài liệu này cập nhật lại kế hoạch cũ (dựa trên `open-mcr` / form 75) cho khớp với engine hiện tại là **SheetScanner**.

## 1. Mục tiêu
Tích hợp luồng **chấm bài giấy bằng ảnh scan** vào backend cho module `paperexam`, dùng **SheetScanner** (`SheetScanner/`, FastAPI service tại `SheetScanner/service/app.py`) làm engine OMR. Mục tiêu: từ ảnh phiếu trả lời của thí sinh, hệ thống đọc ra các lựa chọn đã tô, hỗ trợ **multiple choice** và **multi-page**, backend map kết quả với đáp án đúng trong đề giấy để chấm điểm và trả kết quả chi tiết.

## 2. Phạm vi sử dụng
Luồng này chỉ áp dụng cho **đề giấy** đã được tạo bởi module `paperexam`.

### Đầu vào nghiệp vụ
- Tập ảnh scan phiếu trả lời — **mỗi ảnh = 1 trang phiếu**.
- `paperExamId` và `actualQuestionCount`.

### Đầu ra nghiệp vụ
- Danh sách câu hỏi thí sinh đã tô đáp án nào.
- Câu đơn và **nhiều đáp án đúng**.
- Kết quả chấm: đúng / sai / bỏ trống / nhiều ô tô / cần review.
- Điểm tổng + `studentId` đọc từ QR.

## 3. Nguyên tắc tích hợp

### 3.1. SheetScanner chỉ làm vision, không làm grading
SheetScanner chỉ đọc ảnh và trả dữ liệu nhận diện. Toàn bộ logic map kết quả, so sánh đáp án, tính điểm, lưu kết quả nằm trong backend Java.

### 3.2. Layout do backend kiểm soát (không còn form 75 cứng)
- Khái niệm `formVariant` đã bị **xoá hoàn toàn**.
- Mỗi request scan mang `choicesPerQ`, `questionsPerPage`, `layout` (JSON).
- Layout được lưu kèm đề (`PaperExam.omrLayout`) để lúc sinh phiếu và lúc chấm **dùng chung một layout**.

### 3.3. Hỗ trợ multiple choice
- Engine trả `selectedOptions[]` là **tập**.
- Backend chấm theo kiểu **exact-set-match**: đúng khi tập lựa chọn của thí sinh trùng hoàn toàn tập đáp án đúng.
- `MULTI_MARKED` **chỉ** dùng cho câu có đúng 1 đáp án đúng mà thí sinh tô nhiều ô.

### 3.4. Tách biệt module rõ ràng
- `com.gr1.exam.external.vision` — toàn bộ code tích hợp SheetScanner.
- `com.gr1.exam.module.paperexam` — chỉ gọi service vision, không parse ảnh.

## 4. Kiến trúc

```mermaid
flowchart LR
    subgraph be["Backend Java (Spring Boot)"]
        C[PaperExamController]
        S[PaperExamScanService]
        G[Exact-set-match grading]
        V[external/vision<br/>HttpVisionClientService]
        PG[PaperExamSheetService<br/>sinh phiếu OMR]
    end
    subgraph py["OMR Service (Python)"]
        A["FastAPI /scan"]
        SS["SheetScanner omr/*<br/>detect + fill-ratio"]
        GEN["FastAPI /sheets/generate"]
    end
    C --> S --> V -->|POST /scan mỗi trang| A --> SS
    SS -->|recognizedAnswers[] questionIndex toàn cục| A --> V --> S --> G
    PG -->|GET /sheets/generate| GEN
    PG -->|PNG pages| PDF[openhtmltopdf<br/>gom PNG -> PDF]
```

## 5. Sinh phiếu OMR

Giữ **2 loại tài liệu song song**:

| Tài liệu | Mục đích | Nơi sinh | Endpoint |
|---|---|---|---|
| Đề giấy (PDF text) | Thí sinh đọc câu hỏi | Java (`PaperExamService`) | `GET /paper-exams/{id}/pdf` |
| **Phiếu trả lời OMR (PDF ảnh)** | Thí sinh tô ô | Python (SheetScanner) → Java gom PDF | `GET /paper-exams/{id}/omr-sheet` |

Vì sao sinh ở Python: ArUco marker + QR chỉ có ở Python. Nếu Java tự vẽ sẽ tạo **hai nguồn sự thật** cho geometry → dễ lệch toạ độ ô tô. `SheetScanner/omr/geometry.py` là nguồn sự thật duy nhất.

## 6. Ghép nhiều trang (multi-page)

### 6.1. Không ghép ở tầng pixel
Mỗi trang có 4 ArUco marker riêng và phải warp riêng về canonical 850×1100. Ghép N ảnh thành 1 ảnh lớn sẽ khiến `getPerspectiveTransform` map 4 điểm đó về 1 trang ⇒ các trang còn lại bị nén chồng lên nhau ⇒ chấm hỏng hoàn toàn.

### 6.2. Ghép ở tầng dữ liệu
Python trả `questionIndex` **toàn cục**:
```
questionIndex_toàn_cục = page_index * questions_per_page + row_trong_trang + 1
```
⇒ backend union các trang chỉ bằng `questionIndex`, không phụ thuộc thứ tự upload.

`page_index` lấy từ **QR** trên phiếu (ArUco marker trùng ID giữa các trang là chủ ý). QR cũng mang `student_id` và `exam_id`.

### 6.3. Kiểm tra an toàn
- `examId` trong QR lệch đề đang chấm ⇒ `INVALID_IMAGE`.
- Nhiều `studentId` khác nhau ⇒ `NEEDS_REVIEW` (trộn bài).
- 2 trang cùng `page_index` ⇒ `NEEDS_REVIEW`.
- Thiếu trang ⇒ câu của trang đó `EMPTY` + `NEEDS_REVIEW` + `errors[]` ghi "Thiếu trang N".

## 7. Chấm điểm

### 7.1. Rule
- Exact-set-match: tập được tô = tập đáp án đúng ⇒ `CORRECT`.
- Thiếu / thừa / sai ⇒ `WRONG`.
- Bỏ trống ⇒ `EMPTY`.
- Tô nhiều ô ở câu 1 đáp án đúng ⇒ `MULTI_MARKED`.
- Engine báo `AMBIGUOUS` hoặc confidence < 0.5 ⇒ `NEEDS_REVIEW`.
- Câu ngoài `actualQuestionCount` ⇒ `IGNORED`.

### 7.2. Snapshot đáp án
Đáp án đúng lấy từ snapshot `PaperExamAnswer` (`orderIndex` = thứ tự hiển thị), **không** phụ thuộc `answers.id` của câu gốc — đề không đổi sau khi tạo.

## 8. API

### Vision integration
- `POST /api/v1/paper-exams/{id}/scan` — multipart `images[]` (nhiều trang) + `actualQuestionCount`.
- `GET /api/v1/paper-exams/{id}/omr-sheet` — tải phiếu OMR PDF (download).
- `GET /api/v1/paper-exams/{id}/omr-sheet/preview` — xem trước (inline).

### Kết quả chấm
- `GET /api/v1/paper-exams/{id}/scan-results` — danh sách lần chấm.
- `GET /api/v1/paper-exams/{id}/scan-results/{scanResultId}` — chi tiết một lần chấm.

## 9. Kế hoạch triển khai (đã hoàn tất)
1. ✅ Sửa SheetScanner hỗ trợ multiple choice (`config.py`, `grader.py`, `analytics.py`).
2. ✅ Sửa SheetScanner hỗ trợ multi-page (`geometry.py`, `sheet_generator.py`, `identity.py`).
3. ✅ FastAPI service `SheetScanner/service/app.py` (`/scan`, `/sheets/generate`).
4. ✅ Backend `external/vision` đổi sang engine mới (bỏ `formVariant`, thêm `fillRatios`).
5. ✅ Backend `paperexam`: `omrLayout`, snapshot `PaperExamAnswer`, multi-page scan, `studentId` từ QR.
6. ✅ Sinh phiếu OMR (`PaperExamSheetService`) + endpoint + test.
7. ✅ Xoá `open-mcr`.
8. ✅ Cập nhật tài liệu (`API_SPEC.md`, `PROJECT_SPECIFICATION.md`, `external/vision/*.md`, `SheetScanner/README.md`).

## 10. Rủi ro và cách xử lý

### 10.1. Ảnh scan chất lượng thấp
- Engine đo `fillRatios` thật + ngưỡng động → `confidence` thấp ⇒ `NEEDS_REVIEW`.

### 10.2. Multiple choice bị đọc nhầm
- Rule `MULTI_MARKED` chỉ cho câu 1 đáp án đúng; câu nhiều đáp án đúng tô đủ ⇒ `CORRECT`.
- Giữ `rawVisionOutput` + `fillRatios` để người chấm kiểm tra lại.

### 10.3. HTTP/2 upgrade làm hỏng request tới Uvicorn
- `VisionClientConfig` ép `HttpClient.Version.HTTP_1_1`.

### 10.4. Font PDF không load được trong JAR
- Phải đọc font qua `ClassPathResource.getInputStream()` (không dùng `getFile()` vì resource nằm trong `jar:nested:`).

## 11. Definition of Done — đạt
- ✅ Có SheetScanner service gọi được từ `external.vision`.
- ✅ `paperexam` chỉ gọi service vision, không chứa logic xử lý ảnh.
- ✅ Hỗ trợ multiple choice (exact-set-match) và multi-page.
- ✅ Sinh được phiếu OMR PDF và quét lại được end-to-end.
- ✅ Backend trả được câu đúng/sai/bỏ trống cho từng câu + `studentId`.
- ✅ Kết quả chấm được lưu vào DB.
