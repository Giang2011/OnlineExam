# Frontend Plan — `paperexam` scan flow theo `API_SPEC.md`

## 1. Mục tiêu

Xây dựng luồng **chấm bài giấy bằng ảnh scan/chụp ảnh** cho module `paper-exams` ở phía frontend, dành cho khu vực quản trị (`ADMIN`) và giáo viên (`TEACHER`), bám sát đúng contract trong `API_SPEC.md`.

Frontend cần cho phép:

- chọn một `paperExam` có sẵn;
- upload ảnh phiếu trả lời;
- gọi đúng endpoint `POST /paper-exams/{id}/scan`;
- hiển thị kết quả scan/chấm điểm trả về từ backend;
- xem lịch sử scan bằng `GET /paper-exams/{id}/scan-results`;
- mở chi tiết một lần scan bằng `GET /paper-exams/scan-results/{scanResultId}`;
- hiển thị ảnh đã lưu thông qua `imagePath`;
- giải thích rõ các trạng thái scan và trạng thái từng câu hỏi;
- hỗ trợ giáo viên đối chiếu nhanh kết quả chấm.

Mục tiêu cuối cùng là để admin/teacher có thể chấm bài giấy ngay trong `paper-exams` mà không phải ra khỏi màn hình quản lý đề giấy.

---

## 2. Bối cảnh nghiệp vụ và nguyên tắc bám spec

Backend đã expose đầy đủ API cho paper exam scan trong `API_SPEC.md`. Frontend **không tự tạo contract mới** và không suy diễn thêm field ngoài spec nếu backend chưa nói rõ.

### Nguyên tắc bắt buộc

- Dùng đúng base URL và prefix như `API_SPEC.md`.
- Chỉ làm việc với các endpoint đã có:
  - `POST /paper-exams/{id}/scan`
  - `GET /paper-exams/{id}/scan-results`
  - `GET /paper-exams/scan-results/{scanResultId}`
- Upload scan phải là `multipart/form-data`.
- Tên part phải đúng spec:
  - `image`
  - `actualQuestionCount`
  - `formVariant`
  - `debug`
  - `scanMode`
- Mặc định nếu không nhập:
  - `formVariant = 75`
  - `debug = false`
  - `scanMode = AUTO`
- Nếu không nhập `actualQuestionCount` thì backend sẽ tự dùng `paperExam.totalQuestions`.
- Trạng thái tổng thể cần hiển thị theo spec:
  - `SUCCESS`
  - `FAILED_TO_READ`
  - `NEEDS_REVIEW`
  - `TIMEOUT`
  - `INVALID_IMAGE`
  - `SERVICE_UNAVAILABLE`
- Trạng thái từng câu cần hiển thị theo spec:
  - `CORRECT`
  - `WRONG`
  - `EMPTY`
  - `MULTI_MARKED`
  - `NEEDS_REVIEW`
  - `IGNORED`

---

## 3. Phạm vi frontend cần triển khai

### 3.1. Màn hình scan trong `paper-exams`
Frontend cần có một màn hình riêng để upload ảnh scan cho một `paperExam` cụ thể. Màn hình này phải:

- nhận `paperExamId` từ route;
- cho phép chọn file ảnh;
- preview ảnh trước khi scan;
- gửi request scan theo đúng contract backend;
- hiển thị kết quả ngay sau khi scan thành công;
- hiển thị cảnh báo rõ ràng nếu scan lỗi hoặc cần review.

### 3.2. Màn hình lịch sử scan
Frontend cần có khu vực xem danh sách các kết quả scan đã lưu của một `paperExam`.
Từ đó giáo viên/admin có thể:

- xem lại các lần scan trước đó;
- mở chi tiết từng lần scan;
- đối chiếu ảnh gốc và kết quả chấm.

### 3.3. Màn hình chi tiết scan result
Frontend cần mở được một scan result theo `scanResultId` để xem đầy đủ:

- ảnh scan;
- tổng điểm;
- số câu đúng/sai/bỏ trống/cần review;
- danh sách `questionResults`;
- raw output nếu backend trả về;
- danh sách lỗi nếu có.

---

## 4. Phạm vi file và vị trí đặt code

Toàn bộ logic scan nên nằm trong `frontend/src/features/admin` để giữ đúng domain của feature.

### 4.1. Đề xuất cấu trúc thư mục

```text
frontend/src/features/admin/
├── api/
│   ├── paperExamApi.ts
│   └── paperExamScanApi.ts   (nếu tách riêng)
├── hooks/
│   ├── useAdminPaperExams.ts
│   ├── usePaperExamScan.ts
│   ├── usePaperExamScanResults.ts
│   └── usePaperExamScanResultDetail.ts
├── pages/
│   ├── PaperExamManagement.tsx
│   ├── PaperExamDetail.tsx
│   ├── PaperExamScan.tsx
│   └── PaperExamScanResultDetail.tsx
├── components/
│   ├── PaperExamScanUploader.tsx
│   ├── PaperExamScanSummary.tsx
│   ├── PaperExamScanQuestionList.tsx
│   ├── PaperExamScanQuestionCard.tsx
│   ├── PaperExamScanImagePreview.tsx
│   └── PaperExamScanHistoryTable.tsx
└── types/
    └── paperExam.types.ts
```

### 4.2. Có thể tái sử dụng từ feature hiện có

Nên tận dụng lại các file hiện có trong admin feature nếu phù hợp:

- `api/paperExamApi.ts`
- `types/paperExam.types.ts`
- `pages/PaperExamManagement.tsx`
- `pages/PaperExamDetail.tsx`
- `components/PaperExamDetailPanel.tsx`
- `components/PaperExamListTable.tsx`
- `components/PaperExamAnswerViewer.tsx`

Nếu `paperExamApi.ts` đã có sẵn CRUD paper exam, có thể mở rộng trực tiếp thay vì tách API mới, miễn là giữ rõ ràng các hàm scan riêng biệt.

---

## 5. Contract frontend cần bám theo

### 5.1. Scan request
Theo spec, request scan gửi lên `POST /paper-exams/{id}/scan` là `multipart/form-data` với các part:

- `image` — file ảnh scan, bắt buộc;
- `actualQuestionCount` — optional;
- `formVariant` — optional, mặc định `75`;
- `debug` — optional, mặc định `false`;
- `scanMode` — optional, mặc định `AUTO`.

Frontend cần giữ đúng tên part và không gói các field này vào một object `meta` riêng nếu backend không hỗ trợ.

### 5.2. Scan response
Response từ backend theo spec có thể chứa:

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

### 5.3. Cấu trúc `questionResults[]`
Mỗi phần tử cần thể hiện:

- `questionIndex`
- `selectedOptions[]`
- `correctOptions[]`
- `status`
- `isEmpty`
- `markedCount`
- `confidence`
- `note`

### 5.4. Ảnh scan đã lưu
`imagePath` có thể là đường dẫn tương đối dưới `uploads/`. Frontend cần render đúng theo convention hiện có của project để load ảnh public được.

---

## 6. Thiết kế trải nghiệm người dùng

### 6.1. Entry point trong paper exam detail
Từ màn `PaperExamDetail`, người dùng cần thấy rõ các action:

- `Chấm bằng ảnh`;
- `Xem lịch sử scan`;
- `Xem chi tiết scan` nếu đang ở một lần scan cụ thể.

### 6.2. Màn hình upload scan
UX đề xuất:

- chọn file ảnh từ máy;
- preview ảnh trước khi gửi;
- cho phép đổi file trước khi scan;
- có field nhập `actualQuestionCount` khi cần override;
- có toggle `debug` nếu muốn xem raw output;
- có selector `scanMode` nếu muốn hỗ trợ `AUTO` và `MANUAL_REVIEW`.

### 6.3. Màn hình kết quả scan
Sau khi nhận response, UI nên chia thành 3 khối:

1. **Tổng quan**
   - status tổng;
   - score;
   - totalCorrect;
   - totalWrong;
   - totalEmpty;
   - totalNeedsReview;
   - totalMultiMarked.

2. **Chi tiết từng câu**
   - câu số mấy;
   - `selectedOptions`;
   - `correctOptions`;
   - `status`;
   - `confidence`;
   - `markedCount`;
   - `note`.

3. **Ảnh + debug**
   - ảnh gốc từ `imagePath`;
   - `rawVisionOutput` nếu có;
   - `errors[]` nếu backend trả về lỗi phụ.

---

## 7. Data model frontend nên có

### Type cần có

- `PaperExamScanStatus`
- `PaperExamScanQuestionStatus`
- `PaperExamScanRequest`
- `PaperExamScanQuestionResult`
- `PaperExamScanResponse`
- `PaperExamScanListItem`

### Lưu ý

- `createdAt`, `updatedAt` dùng `string`.
- `selectedOptions` và `correctOptions` dùng `string[]`.
- `rawVisionOutput` nên để `unknown` hoặc `string | Record<string, unknown>` tùy backend thực tế.
- `errors` nên để `string[]` hoặc dạng object nếu backend trả structured error; khi chưa chắc, nên model theo cách linh hoạt nhất nhưng vẫn an toàn cho UI.

---

## 8. API layer frontend đề xuất

Frontend nên có API layer rõ ràng cho scan.

### Hàm cần có

- `scanPaperExam(paperExamId, payload)`
- `getPaperExamScanResults(paperExamId)`
- `getPaperExamScanResultById(scanResultId)`

### Yêu cầu khi implement

- `scanPaperExam` phải dùng `multipart/form-data`.
- `getPaperExamScanResults` gọi `GET /paper-exams/{id}/scan-results`.
- `getPaperExamScanResultById` gọi `GET /paper-exams/scan-results/{scanResultId}`.
- Nếu project đang dùng helper Axios chung, giữ đúng pattern hiện có.
- Nếu có handler download blob / error blob thì tái sử dụng helper chung của project nếu có.

---

## 9. Hook layer đề xuất

Hook giúp UI không phải gọi API trực tiếp.

### Hook nên có

- `usePaperExamScan`
- `usePaperExamScanResults`
- `usePaperExamScanResultDetail`

### Mục tiêu của hook

- quản lý loading/error/success;
- tự refetch sau khi scan thành công;
- đồng bộ giữa màn upload và màn lịch sử scan;
- tách logic fetch khỏi component.

---

## 10. Luồng hiển thị kết quả cần hỗ trợ

### 10.1. Scan thành công
- ảnh hợp lệ;
- backend trả status `SUCCESS`;
- frontend hiển thị kết quả tổng và từng câu;
- cho phép người dùng mở tiếp lịch sử scan hoặc scan ảnh khác.

### 10.2. Cần review
- backend trả `NEEDS_REVIEW` hoặc từng câu có `NEEDS_REVIEW`;
- UI phải highlight rõ;
- không để người dùng hiểu nhầm đây là kết quả chấm dứt khoát.

### 10.3. Lỗi scan
- ảnh sai định dạng;
- ảnh không đọc được;
- service timeout;
- service unavailable;
- backend trả error 400/413/500.

UI cần hiển thị thông báo lỗi rõ ràng, đồng thời không mất ảnh preview nếu người dùng muốn sửa và submit lại.

---

## 11. Phân quyền và điều hướng

Feature scan chỉ nên có với:

- `ADMIN`
- `TEACHER`

Frontend cần:

- ẩn menu/button nếu role không hợp lệ;
- bảo vệ route scan;
- điều hướng hợp lý từ danh sách và detail paper exam.

Nếu project dùng admin layout hoặc route config ở layer khác, chỉ cần thêm integration tối thiểu, không nhồi routing logic vào component feature.

---

## 12. Yêu cầu kỹ thuật cần lưu ý

### 12.1. Upload file
- dùng `FormData`;
- field name phải đúng spec;
- validate size và định dạng trước khi gọi API.

### 12.2. Render ảnh scan
- `imagePath` có thể là relative path;
- frontend phải chuẩn hoá URL theo convention của project;
- nếu ảnh không load được, phải có fallback state.

### 12.3. Hiển thị nhiều trạng thái
- dùng badge/color khác nhau cho từng trạng thái;
- câu nhiều đáp án hoặc cần review phải nổi bật;
- trạng thái lỗi cấp scan khác với trạng thái từng câu.

### 12.4. Mở rộng trong tương lai
- có thể thêm batch scan sau này;
- có thể thêm lọc lịch sử scan;
- có thể thêm màn review thủ công nếu backend mở rộng.

---

## 13. Thứ tự triển khai đề xuất

1. Mở rộng types cho scan.
2. Mở rộng API layer với 3 endpoint scan.
3. Tạo hooks query/mutation cho scan.
4. Tạo trang scan cho `paperExam`.
5. Tạo component upload và preview ảnh.
6. Tạo component render summary và question results.
7. Tạo màn lịch sử scan và màn chi tiết scan result.
8. Thêm route/action entry point từ paper exam detail.
9. Thêm trạng thái loading/error/empty.
10. Kiểm tra quyền truy cập theo role.
11. Test với ảnh rõ, ảnh lỗi, câu bỏ trống, multi-marked, và đề 10 câu trên form 75.

---

## 14. Definition of done

Feature frontend được xem là hoàn tất khi:

- gọi đúng các endpoint trong `API_SPEC.md`;
- upload scan đúng multipart field names;
- hiển thị được kết quả scan và kết quả từng câu;
- xem được lịch sử scan và scan detail;
- có entry point rõ ràng từ paper exam UI;
- chỉ `ADMIN` và `TEACHER` truy cập được;
- code nằm đúng trong `frontend/src/features/admin` và bám theo pattern hiện có của project.
