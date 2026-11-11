# AGENTS.md — frontend/web

Hướng dẫn ngắn cho AI agent làm việc trong thư mục này.

## Trước khi sửa code

1. Đọc các rule ở `.cursor/rules/` (repo root) theo thứ tự số:
   `00-project-context` → `01-architecture` → `02-api-client` → `03-ui-design-system` → `04-coding-standards` → `05-frontend-workflow` → `06-testing`.
2. Đọc `frontend/web/PLAN.md` — mô tả phase, tiêu chí nghiệm thu và task brief.
3. Xác nhận hợp đồng API trong `API_SPEC.md` (repo root) khi chạm endpoint mới.

## Quy tắc nhanh

- Chỉ sửa file trong `frontend/web/`. **Không** sửa `backend/`.
- `features/X` chỉ import từ `shared/`, `app/`, `lib/`. Không import chéo feature. `shared/` không import từ `features/`.
- Mọi request đi qua `src/shared/lib/api-client.ts`: `credentials: 'include'`, header `X-XSRF-TOKEN` cho method ghi, multipart **không** set `Content-Type` thủ công.
- **401** → xoá session + redirect `/login?next=…`. **403** → toast, **không** redirect.
- Không dùng `Authorization: Bearer`. Không hardcode `localhost:8080` — dùng `VITE_API_BASE_URL`.
- Dev server **bắt buộc** port `5173` (`strictPort: true`) — backend chỉ whitelist CORS cho port này.
- Design: token màu trong `src/shared/styles/tokens.css`, font Be Vietnam Pro (UI) + Noto Serif (nội dung đề). Đọc `.cursor/rules/03-ui-design-system.mdc` trước khi dựng UI mới.
- UI copy tiếng Việt; code, tên biến, comment tiếng Anh. Comment giải thích *tại sao*.
- Không `any`, không `console.log`, không `setState` đồng bộ trong `useEffect`, không gọi hàm impure lúc render.

## Kiểm tra trước khi kết thúc

```bash
cd frontend/web
npm run typecheck && npm run lint && npm run build
```

Cả ba lệnh phải sạch. Cập nhật checklist trong `PLAN.md` nếu phase đã xong.

Ngoài ra:

```bash
npm run test        # Vitest — bắt buộc khi sửa src/shared/lib|utils
npm run test:e2e    # Playwright — bắt buộc khi đổi guard, đồng hồ thi, autosave
```

E2E cần backend thật ở `:8080`; luồng OMR cần thêm `SheetScanner` ở `:8000`.

## Cấu trúc

```text
src/
├─ app/        # providers, router, guards, layouts
├─ features/   # auth, users, subjects, questions, exams, exam-taking, results, paper-exams
├─ shared/     # components, hooks, lib, styles, types, utils
└─ lib/        # shadcn/ui sinh ra — KHÔNG sửa tay
```
