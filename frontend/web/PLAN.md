# PLAN — Frontend Web (Hệ thống Quản lý Thi Trắc nghiệm)

Thư mục: `frontend/web` · Stack: React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query + Zustand.

Đọc `.cursor/rules/00-project-context.mdc` → `06-testing.mdc` trước khi sửa code trong thư mục này.

---

## Các lệnh

```bash
cd frontend/web
npm install
npm run dev        # http://localhost:5173 (bắt buộc port này — CORS backend chỉ whitelist 5173)
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint .
npm run test       # Vitest (unit)
npm run test:watch # Vitest ở chế độ watch
npm run test:e2e   # Playwright (E2E, cần backend ở :8080)
npm run build      # vite build
```

Backend chạy ở `http://localhost:8080/api/v1`. Vite proxy `/api` và `/uploads` sang backend nên không dính CORS, nhưng request vẫn phải có `credentials: 'include'`.

> **Lưu ý khi chạy E2E**: Playwright tự khởi động dev server ở port 5173 (`webServer.reuseExistingServer = true`). Backend phải chạy sẵn ở `:8080`. Riêng luồng OMR cần thêm service Python `SheetScanner` ở `:8000` — xem `SheetScanner/README.md`.

---

## Checklist hiện trạng

| Phase | Nội dung | Trạng thái |
|---|---|---|
| 0 | Foundation — scaffold, design tokens, api-client, router, guards, layouts | ✅ xong |
| 1 | Auth — login, session restore, logout, profile, role routing | ✅ xong |
| 2 | Users & Subjects/Chapters — CRUD, credentials 1 lần, RBAC | ✅ xong |
| 3 | Questions — filter/phân trang, multipart, cờ xoá ảnh | ✅ xong |
| 4 | Exams & Participants — validate realtime, biến thể đề, gán thí sinh | ✅ xong |
| 5 | Exam Taking — session, đồng hồ bám server, autosave, lưới OMR | ✅ xong |
| 6 | Results — lịch sử học sinh, bảng điểm giáo viên, biểu đồ | ✅ xong |
| 7 | Paper Exams & OMR Scan — PDF, upload ảnh scan, kết quả scan | ✅ xong |
| 8 | Polish — responsive, a11y, empty/error state, build sạch | ✅ xong |
| Rules | `.cursor/rules/00..06` + `AGENTS.md` + `PLAN.md` | ✅ xong |
| Mobile | `frontend/mobile` placeholder | ✅ xong |
| Testing | Vitest + Testing Library (unit) + Playwright (E2E) | ✅ xong |

Trạng thái build hiện tại: `typecheck` ✅ · `lint` ✅ (0 error, 0 warning) · `build` ✅ · `test` ✅ (48/48) · `test:e2e` ✅ (7/7).

---

## Testing

Hạ tầng test đã dựng đầy đủ theo `.cursor/rules/06-testing.mdc`.

**Tầng 1 — Unit (Vitest + Testing Library)**

| File | Phủ |
|---|---|
| `src/shared/lib/api-client.test.ts` | credentials, CSRF header theo method, FormData không set Content-Type, parse lỗi 401/403/404, handler 401 |
| `src/shared/lib/csrf.test.ts` | đọc cookie, URL-decode, `requiresCsrf` theo method |
| `src/shared/lib/upload-url.test.ts` | `resolveUploadUrl` với filename trần / `uploads/...` / `/uploads/...` / URL tuyệt đối / data URI |
| `src/shared/lib/query-keys.test.ts` | tính ổn định key, tiền tố phân cấp |
| `src/shared/utils/format.test.ts` | định dạng ngày/điểm/thời lượng, `toIsoString` / `toDateTimeLocal` |
| `src/features/exam-taking/hooks/useServerCountdown.test.ts` | đồng hồ bám server, phát hiện lệch đồng hồ máy, trừ 0.5s mỗi nhịp |

**Tầng 2 — E2E (Playwright, `e2e/`)**

| File | Phủ |
|---|---|
| `e2e/auth.spec.ts` | sai mật khẩu, đúng mật khẩu vào shell theo role, route bảo vệ khi chưa đăng nhập |
| `e2e/exam-creation.spec.ts` | giáo viên tạo kỳ thi (chọn môn/chương, cấu hình câu) và thấy trong danh sách |
| `e2e/exam-taking.spec.ts` | học sinh làm bài → autosave 20s → đóng/mở lại tab còn đáp án → nộp bài → thấy điểm; giáo viên xem bảng điểm + biểu đồ |
| `e2e/rbac.spec.ts` | STUDENT mở `/paper-exams` thấy thông báo từ chối, không bị đưa về `/login` |

E2E dùng backend thật ở `:8080`, tự chuẩn bị dữ liệu (học sinh + kỳ thi + gán thí sinh) qua API nên chạy lặp lại được.

---

## Phase 0 — Foundation

**Mục tiêu**: app chạy được, shell hiển thị, guard hoạt động, hợp đồng API nền tảng sẵn sàng.

**Việc đã làm**

- Scaffold Vite + React 19 + TS strict, alias `@/*`.
- `vite.config.ts`: `server.port = 5173`, `strictPort: true`, proxy `/api` + `/uploads` → `http://localhost:8080`.
- Tailwind v4 + shadcn/ui (`components.json`, `src/lib/ui/` sinh ra).
- `src/shared/styles/tokens.css` + `globals.css`: palette "Phòng thi", font Be Vietnam Pro + Noto Serif.
- `src/shared/lib/api-client.ts` (credentials, CSRF, `ApiError`, nhánh 401/403), `csrf.ts`, `upload-url.ts`, `query-keys.ts`.
- `src/app/`: providers, router, guards (`RequireAuth`, `RequireRole`, `GuestOnly`), layouts (`AppShell`, `AuthLayout`, `ExamLayout`).
- ESLint + Prettier + `npm run typecheck`.

**Nghiệm thu**: `npm run dev` mở được shell trắng; `build` + `typecheck` sạch; guard redirect đúng.

---

## Phase 1 — Auth

- Trang `/login` (react-hook-form + zod), báo lỗi 401 bằng tiếng Việt.
- `POST /auth/login`, `GET /auth/me` (khôi phục session khi reload), `POST /auth/logout`.
- Zustand `authStore` ở `src/features/auth/store.ts`.
- `/profile` tự cập nhật qua `PUT /users/me` (ADMIN và TEACHER).
- Route `/` phân tuyến theo role.

**Nghiệm thu**: đăng nhập → đúng shell theo role; đóng tab mở lại vẫn đăng nhập; sai mật khẩu hiện thông báo đúng.

---

## Phase 2 — Users & Subjects/Chapters

- Danh sách tài khoản: filter + phân trang **client-side** (backend trả mảng phẳng).
- Tạo STUDENT → popup username/password **chỉ 1 lần** + nút sao chép.
- Tạo TEACHER chỉ ADMIN.
- `PUT /users/{id}` là **partial update** và **chỉ sửa được tài khoản role `TEACHER`** → FE ẩn nút sửa với user khác role TEACHER (không gửi request rồi mới nhận lỗi).
- `GET /users/{id}`: TEACHER xem user khác role → `403`.
- Môn học + chương: CRUD chương lồng trong trang môn, dùng `GET /subjects/{id}` (`chapters[].questionCount`).

**Nghiệm thu**: phân quyền đúng theo role; popup credentials copy được; CRUD môn/chương hoạt động.

---

## Phase 3 — Questions

- Filter `subjectId` / `chapterId` / `keyword` + phân trang chuẩn Spring (`content` / `totalElements` / `totalPages` / `number` / `size`).
- Form tạo/sửa **multipart**: part `data` = chuỗi JSON, `questionImage`, `answerImages[]`.
- Cờ `questionImageRemoved` / `answers[].imageRemoved`.
- Preview ảnh qua `resolveUploadUrl`; xoá mềm có confirm.

**Nghiệm thu**: tạo câu hỏi có ảnh câu + ảnh đáp án hiển thị đúng URL; sửa ảnh giữ/xoá đúng; filter + phân trang đúng.

---

## Phase 4 — Exams & Participants

- Form tạo kỳ thi: validate realtime `Σ questionCount == totalQuestions`.
- Chặn `questionCount > chapters[].questionCount` (đếm bằng `GET /subjects/{id}`, không cần `GET /questions`).
- `totalVariants`, `maxAttempts`, `startTime` / `endTime` bắt buộc.
- Danh sách kỳ thi, trạng thái `UPCOMING` / `ONGOING` / `COMPLETED` (**do backend tính**, không suy diễn ở FE).
- Gán / xoá thí sinh.
- Sửa kỳ thi chỉ cho phép ở trạng thái `UPCOMING` + confirm dialog *"Đổi cấu hình chương sẽ sinh lại đề thi — thí sinh sẽ thi đề mới"* (backend sinh lại variants khi `chapterConfigs` đổi).

**Nghiệm thu**: tạo kỳ thi hợp lệ tạo đúng số variant; lỗi validation hiện message backend nguyên văn; gán thí sinh hoạt động.

---

## Phase 5 — Exam Taking (phase khó nhất)

- `GET /exams` — STUDENT chỉ thấy kỳ thi được phân công; `GET /exams/{id}` kỳ thi khác → `403` → toast, **không** redirect.
- `POST /sessions/start/{examId}` — tự resume nếu đang `DOING`.
- `GET /sessions/{id}/questions` — **không** có `isCorrect`.
- `GET/PUT /sessions/{id}/answers` — autosave mỗi 20s + `visibilitychange` + `beforeunload` (dùng `fetch(..., { keepalive: true })` vì `sendBeacon` không set được header CSRF).
- Đồng hồ đếm ngược **bám server**: `remaining = (deadlineAt - serverTime)/1000` rồi trừ dần theo clock 500ms (`useClock` qua `useSyncExternalStore`); cảnh báo khi < 5 phút; phát hiện lệch đồng hồ máy > 2s.
- Giao diện single/multi choice + **lưới OMR** điều hướng.
- Nộp bài `POST /sessions/{id}/submit` — chặn submit trùng; response đã trả `score` / `totalCorrect` / `totalQuestions` → **hiển thị điểm ngay**; chỉ gọi thêm `GET /results/session/{id}` khi cần `rank` hoặc khi server đã tự nộp (submit trả `400`).

**Nghiệm thu**: đóng tab mở lại vẫn còn đáp án; đồng hồ không lệch khi đổi tab; hết giờ server tự nộp và FE hiển thị điểm; không bao giờ lộ `isCorrect` khi đang thi; STUDENT không xem được dữ liệu của người khác (`403` → toast).

---

## Phase 6 — Results & Reports

- `GET /results/me` — lịch sử thi của học sinh.
- `GET /results/exam/{examId}` — bảng điểm giáo viên: tên, MSSV, điểm, đúng/tổng, thời điểm nộp.
- Biểu đồ phân bố điểm (recharts).

**Nghiệm thu**: bảng điểm sắp xếp/lọc được; STUDENT gọi `GET /results/exam/{examId}` → `403` → toast, **không** redirect login.

---

## Phase 7 — Paper Exams & OMR Scan

- Tạo đề giấy: `durationMinutes`, `chapterConfigs`, validate tổng số câu.
- Xem đáp án: dùng **`answerId`** (id đáp án gốc trong ngân hàng) làm định danh ổn định; `id` là id snapshot đáp án trong đề giấy; `orderIndex` = thứ tự hiển thị (1 = A).
- PDF preview/download: response là `byte[]` → tạo object URL, mở trong modal `<object>`, revoke URL khi đóng.
- Phiếu OMR PDF.
- Upload nhiều ảnh scan: drag & drop, `images[]` + `actualQuestionCount` + `scanMode` + `debug`.
- Kết quả scan theo từng câu: `CORRECT` / `WRONG` / `EMPTY` / `MULTI_MARKED` / `NEEDS_REVIEW` / `IGNORED`, `confidence`, `selectedOptions` vs `correctOptions`.
- Lịch sử scan: `GET /paper-exams/{id}/scan-results`, `GET /paper-exams/scan-results/{id}`.

**Nghiệm thu**: upload 2 trang phiếu → kết quả gộp đúng `questionIndex` toàn cục; PDF mở được; hiển thị đúng số liệu backend trả về.

---

## Phase 8 — Polish

- Responsive từ 360px; rail → drawer trên mobile; bảng → card list; lưới OMR cuốn ngang.
- Focus states rõ, `prefers-reduced-motion` được tôn trọng, tương phản AA.
- Loading / error / empty state có chủ đích cho mọi màn hình.
- Copy tiếng Việt nhất quán.
- ESLint + TS sạch, `npm run build` qua.

---

## Task brief mẫu (để dán cho agent)

> Bạn là frontend agent của `E:\gr1`. Đọc `.cursor/rules/00-project-context.mdc` → `01` → `02` → `03` → `04` → `05` → `06` và `frontend/web/PLAN.md`. Làm **Phase N** (mục tiêu, việc cần làm, tiêu chí nghiệm thu nằm ngay trong PLAN.md). Chỉ sửa file trong `frontend/web/`. Không sửa backend. Cuối cùng chạy `npm run typecheck && npm run lint && npm run build` và cập nhật checklist trong `PLAN.md`.

## Định nghĩa "Done" chung

`typecheck` + `lint` + `build` sạch; không còn TODO; không phá hợp đồng API; UI copy tiếng Việt; kiểm tra bằng browser ở 3 role.

---

## Việc chưa làm / để lại sau

_(không còn mục nào)_

### Ghi chú đối chiếu runtime

Đã kiểm chứng bằng browser + E2E với backend thật:

- `resolveUploadUrl` sinh `/api/v1/uploads/...` — khớp với context-path `/api/v1` và resource handler `/uploads/**` của backend. Đã sửa lỗi URL lặp (`/uploads/uploads/...`).
- Luồng OMR đầy đủ (`SheetScanner/scripts/e2e_check.py`): sinh phiếu → tô ô → scan 2 trang → đối chiếu điểm → **PASS**, kể cả câu nhiều đáp án đúng (exact-set-match) và câu bỏ trống (`EMPTY`).
- 4 endpoint PDF của đề giấy (`/pdf`, `/pdf/preview`, `/omr-sheet`, `/omr-sheet/preview`) đều trả `application/pdf` hợp lệ.
- Hạ tầng test đã dựng xong — xem mục **Testing** ở trên.
