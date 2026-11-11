-- ============================================================
-- Migration v5 — Đóng băng đề giấy (paper exam)
--   1. paper_exam_questions.content_snapshot / image_url_snapshot
--   2. paper_exam_answers.content_snapshot / image_url_snapshot / is_correct_snapshot
--   3. Backfill order_index của paper_exam_answers theo thứ tự hiển thị (1,2,3...)
--      (trước đó order_index lưu answer.id — sai ngữ nghĩa)
--
-- Dùng cho DB đã tồn tại. Chạy 1 lần.
-- ============================================================

USE online_exam_db;

-- ============================================================
-- 1. paper_exam_questions snapshot columns
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_questions'
      AND COLUMN_NAME = 'content_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exam_questions ADD COLUMN content_snapshot TEXT NULL COMMENT ''Snapshot nội dung câu hỏi lúc tạo đề'' AFTER order_index',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_questions'
      AND COLUMN_NAME = 'image_url_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exam_questions ADD COLUMN image_url_snapshot VARCHAR(500) NULL COMMENT ''Snapshot ảnh minh họa câu hỏi'' AFTER content_snapshot',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. paper_exam_answers snapshot columns
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_answers'
      AND COLUMN_NAME = 'content_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exam_answers ADD COLUMN content_snapshot TEXT NULL COMMENT ''Snapshot nội dung đáp án'' AFTER order_index',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_answers'
      AND COLUMN_NAME = 'image_url_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exam_answers ADD COLUMN image_url_snapshot VARCHAR(500) NULL COMMENT ''Snapshot ảnh minh họa đáp án'' AFTER content_snapshot',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_answers'
      AND COLUMN_NAME = 'is_correct_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE paper_exam_answers ADD COLUMN is_correct_snapshot BOOLEAN DEFAULT NULL COMMENT ''Snapshot đáp án đúng (NULL = chưa snapshot)'' AFTER image_url_snapshot',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cho phép NULL cho cột boolean snapshot (NULL = "chưa snapshot" -> fallback entity live).
SET @col_nullable := (
    SELECT IS_NULLABLE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'paper_exam_answers'
      AND COLUMN_NAME = 'is_correct_snapshot'
);

SET @ddl := IF(@col_nullable = 'NO',
    'ALTER TABLE paper_exam_answers MODIFY COLUMN is_correct_snapshot BOOLEAN DEFAULT NULL',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 3. Backfill snapshot cho đề giấy đã tồn tại
--    - content/image của câu hỏi & đáp án lấy từ entity gốc
--    - is_correct lấy từ answers.is_correct
-- ============================================================
UPDATE paper_exam_questions peq
JOIN questions q ON q.id = peq.question_id
SET peq.content_snapshot = COALESCE(peq.content_snapshot, q.content),
    peq.image_url_snapshot = COALESCE(peq.image_url_snapshot, q.image_url)
WHERE peq.content_snapshot IS NULL;

UPDATE paper_exam_answers pea
JOIN answers a ON a.id = pea.answer_id
SET pea.content_snapshot = COALESCE(pea.content_snapshot, a.content),
    pea.image_url_snapshot = COALESCE(pea.image_url_snapshot, a.image_url),
    pea.is_correct_snapshot = COALESCE(pea.is_correct_snapshot, a.is_correct)
WHERE pea.content_snapshot IS NULL;

-- ============================================================
-- 4. Sửa order_index của paper_exam_answers
--    Trước đây order_index = answers.id (sai ngữ nghĩa).
--    Đặt lại theo thứ tự hiển thị: 1, 2, 3... theo answer_id tăng dần trong mỗi câu.
--    Yêu cầu MySQL 8.0+ (dùng ROW_NUMBER()).
-- ============================================================
UPDATE paper_exam_answers pea
JOIN (
    SELECT pea2.id AS id,
           ROW_NUMBER() OVER (PARTITION BY pea2.paper_exam_question_id ORDER BY pea2.answer_id ASC) AS rn
    FROM paper_exam_answers pea2
) r ON r.id = pea.id
SET pea.order_index = r.rn;
