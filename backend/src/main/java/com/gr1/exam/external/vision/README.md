# `com.gr1.exam.external.vision`

Module `com.gr1.exam.external.vision` là lớp tích hợp vision/OMR của backend cho luồng chấm bài giấy của `paperexam`. Nhiệm vụ của module này là kết nối backend Java với engine OMR **SheetScanner** (FastAPI service tại `SheetScanner/service/app.py`), nhận ảnh scan phiếu trả lời, chuẩn hoá dữ liệu nhận diện và trả kết quả cho tầng nghiệp vụ để chấm điểm.

> Trước đây module này gọi engine `open-mcr` (form 75 cứng, phải parse lại file CSV output).
> Đã được thay bằng SheetScanner: định dạng phiếu do backend kiểm soát, hỗ trợ multiple choice và multi-page, trả `fillRatios` thật.

## Mục đích của module

Module này chỉ làm nhiệm vụ **nhận diện đáp án từ ảnh** và **chuẩn hoá kết quả vision**. Việc đối chiếu với đáp án đúng, tính điểm, lưu kết quả chấm và trả báo cáo chi tiết thuộc về `paperexam`.

Nói cách khác:

- `external/vision` xử lý **ảnh → dữ liệu nhận diện**
- `paperexam` xử lý **dữ liệu nhận diện → kết quả chấm điểm**

## Phạm vi chức năng

Module này bao gồm các phần sau:

- cấu hình kết nối tới SheetScanner service
- DTO request/response cho luồng scan và sinh phiếu
- client gọi service nhận diện ảnh
- facade/service trung gian để các module khác chỉ cần gọi một API nội bộ
- exception riêng cho các lỗi liên quan đến vision
- các trạng thái chuẩn hoá cho kết quả scan

## Luồng tổng quát

1. `paperexam` nhận request upload **nhiều ảnh** scan (mỗi ảnh = 1 trang phiếu).
2. `paperexam` gọi service trong `external/vision` **một lần cho mỗi trang**.
3. `external/vision` gửi ảnh sang SheetScanner service.
4. SheetScanner warp trang về canonical (4 ArUco marker), đọc QR (mã đề + mã thí sinh + `page_index`), đo fill ratio từng ô.
5. Module này chuẩn hoá response thành DTO nội bộ.
6. `paperexam` union các trang theo `questionIndex` **toàn cục**, map với đáp án đúng và chấm điểm.

## Quy ước nghiệp vụ

### 1. Layout do backend kiểm soát

Không còn khái niệm form 75 cứng (`formVariant` đã bị xoá). Backend gửi kèm mỗi request:

- `choicesPerQ` — số lựa chọn tối đa mỗi câu
- `questionsPerPage` — số câu trên mỗi trang (quyết định offset câu toàn cục)
- `layout` — JSON layout OMR (mặc định lấy từ `app.vision.omrLayout`, hoặc từ `PaperExam.omrLayout` nếu đề đã lưu)

Cùng một layout được dùng cho cả lúc **sinh phiếu** lẫn lúc **chấm** ⇒ không lệch toạ độ.

### 2. Hỗ trợ multiple choice

Một câu có thể có nhiều đáp án được tô. Module này phải giữ nguyên tập lựa chọn được nhận diện để tầng `paperexam` chấm theo kiểu `exact-set-match`.

Ví dụ:

- câu 1: `['A']`
- câu 2: `['B', 'D']`
- câu 3: `[]` và `isEmpty = true`

### 3. Multi-page

Một đề 50–75 câu có thể nhiều trang. **Không** ghép các ảnh thành 1 ảnh lớn rồi gửi 1 lần — mỗi trang là một "document" độc lập với 4 ArUco marker riêng và phải warp riêng.

Engine trả `questionIndex` **toàn cục** (`page_index * questions_per_page + row + 1`) nên backend ghép các trang chỉ bằng cách union theo `questionIndex`, không phụ thuộc thứ tự upload.

`page_index` lấy từ QR trên phiếu (ArUco marker trùng ID giữa các trang là chủ ý).

### 4. Không làm grading trong module vision

SheetScanner và module `external/vision` không được chứa logic chấm điểm. Chúng chỉ trả dữ liệu nhận diện, còn việc:

- so sánh với đáp án đúng
- xác định đúng/sai/bỏ trống
- tính điểm
- lưu kết quả chi tiết

đều do `paperexam` đảm nhiệm.

## Thành phần chính

### `config`

Chứa cấu hình cho vision client:

- base URL của SheetScanner service (`app.vision.serviceUrl`)
- timeout
- layout OMR mặc định (`app.vision.omrLayout`)
- `defaultQuestionsPerPage`, `defaultChoicesPerQ`

> `VisionClientConfig` cố tình ép `HttpClient.Version.HTTP_1_1` — JDK HttpClient mặc định thử `Upgrade: h2c` khiến Uvicorn từ chối request.

### `dto`

Chứa các DTO dùng cho request/response của luồng scan và sinh phiếu, bao gồm:

- request gửi đi để scan ảnh (`VisionScanRequestDTO`)
- response chuẩn hoá từ vision service (`VisionScanResponseDTO`)
- kết quả từng câu được nhận diện (`VisionRecognizedAnswerDTO`)
- response sinh phiếu (`VisionSheetGenerateResponseDTO`)
- trạng thái scan (`VisionScanStatus`)
- trạng thái câu hỏi (`VisionQuestionScanStatus`)

### `service`

Chứa các lớp xử lý chính:

- `HttpVisionClientService` — client gọi HTTP tới Python `/scan`
- `VisionSheetClientService` — client gọi Python `/sheets/generate`
- `VisionScanFacadeService` — facade trung gian để module khác dùng
- xử lý lỗi, timeout và chuẩn hoá response

### `exception`

Chứa các exception chuyên biệt cho vision để tách biệt lỗi kỹ thuật của module này với các lỗi nghiệp vụ khác.

## Trạng thái kết quả scan

Module chuẩn hoá kết quả scan bằng các trạng thái như:

- `SUCCESS`
- `FAILED_TO_READ`
- `NEEDS_REVIEW`
- `TIMEOUT`
- `INVALID_IMAGE`
- `SERVICE_UNAVAILABLE`

Các trạng thái này giúp tầng nghiệp vụ biết khi nào có thể chấm tự động và khi nào cần kiểm tra thủ công.

## Trạng thái từng câu

Khi `paperexam` chấm kết quả, từng câu có thể được quy về các trạng thái:

- `CORRECT`
- `WRONG`
- `EMPTY`
- `MULTI_MARKED`
- `NEEDS_REVIEW`
- `IGNORED`

Phần này được giữ trong dữ liệu kết quả để UI có thể hiển thị chi tiết cho giáo viên hoặc người dùng cuối.

## Dữ liệu đầu vào phổ biện

Request scan gồm:

- `paperExamId`
- `actualQuestionCount`
- `choicesPerQ`
- `questionsPerPage`
- `layout`
- `pageIndex` (fallback khi QR không đọc được)
- `scanMode`
- `debug`
- `image` (multipart file — **1 ảnh = 1 trang**)

## Dữ liệu đầu ra phổ biện

Kết quả trả về thường gồm:

- `status`
- `paperExamId`
- `studentId`
- `examId`
- `pageIndex`
- `warpMethod`
- `recognizedAnswers[]`
- `rawOutput`
- `errors[]`

Mỗi phần tử trong `recognizedAnswers[]` thường có:

- `questionIndex` (toàn cục)
- `selectedOptions[]`
- `isEmpty`
- `confidence`
- `markedCount`
- `fillRatios[]`
- `status`

## Quan hệ với `paperexam`

Module này được thiết kế để `paperexam` chỉ cần gọi một service duy nhất mà không phải biết chi tiết SheetScanner, format ảnh, hay cách đọc ô tô.

Điều này giúp:

- giảm coupling giữa nghiệp vụ chấm điểm và engine nhận diện
- dễ thay thế engine vision sau này
- dễ debug khi cần lưu raw result
- dễ mở rộng sang batch scan hoặc multi-page scan

## Tóm tắt

`com.gr1.exam.external.vision` là tầng tích hợp vision độc lập, chịu trách nhiệm biến ảnh scan thành dữ liệu nhận diện chuẩn hoá. Mọi logic grading vẫn nằm ở `paperexam`, còn module này chỉ đảm bảo backend có thể gọi SheetScanner ổn định, nhận kết quả rõ ràng và xử lý lỗi nhất quán.
