-- ============================================================
-- Migration v4 — Thay engine OMR open-mcr bằng SheetScanner
--   1. paper_exam_scan_results.form_variant  -> bỏ (đã thay bằng student_id từ QR)
--   2. paper_exam_scan_results.student_id     -> mã thí sinh đọc từ QR của phiếu
--   3. paper_exams.omr_layout                -> layout OMR JSON của đề
--
-- Dùng cho DB đã tồn tại. Chạy 1 lần.
-- ============================================================

USE online_exam_db;

-- ============================================================
-- 1. paper_exam_scan_results.form_variant (NOT NULL, không còn dùng)
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_scan_results'
      AND COLUMN_NAME = 'form_variant'
);

SET @ddl := IF(@col_exists = 1,
    'ALTER TABLE paper_exam_scan_results DROP COLUMN form_variant',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. paper_exam_scan_results.student_id
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_scan_results'
      AND COLUMN_NAME = 'student_id'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exam_scan_results ADD COLUMN student_id VARCHAR(100) DEFAULT NULL COMMENT ''Mã thí sinh đọc từ QR trên phiếu OMR'' AFTER actual_question_count',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. paper_exams.omr_layout
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exams'
      AND COLUMN_NAME = 'omr_layout'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exams ADD COLUMN omr_layout TEXT DEFAULT NULL COMMENT ''Layout OMR JSON của đề (sinh phiếu + chấm dùng chung)'' AFTER total_questions',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
