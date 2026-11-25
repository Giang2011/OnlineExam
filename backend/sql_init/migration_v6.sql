-- ============================================================
-- Migration v6 — Ảnh phiếu đã khoanh (khoanh xanh/đỏ)
--   paper_exam_scan_results.annotated_image_path -> đường dẫn ảnh PNG
--   đã khoanh, nhiều trang nối bằng dấu phẩy (giống image_path).
--
-- Dùng cho DB đã tồn tại. Chạy 1 lần. Idempotent.
--
-- Lưu ý: prod dùng spring.jpa.hibernate.ddl-auto=validate => phải chạy
-- migration này TRƯỚC khi deploy, nếu không app sẽ fail start.
-- ============================================================

USE online_exam_db;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_scan_results'
      AND COLUMN_NAME = 'annotated_image_path'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exam_scan_results ADD COLUMN annotated_image_path TEXT DEFAULT NULL COMMENT ''Ảnh phiếu đã khoanh: vòng xanh = ô thí sinh tô đúng, vòng đỏ = ô thí sinh tô sai'' AFTER image_path',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

