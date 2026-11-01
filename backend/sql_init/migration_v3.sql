-- ============================================================
-- Migration v3 — Backend Hardening
--   1. exams.max_attempts                    (số lần thi tối đa per-exam)
--   2. exam_sessions.attempt_no              (lượt thi thứ mấy)
--   3. exam_sessions.deadline_at             (hạn chót server-side)
--   4. exam_sessions.submit_source           (MANUAL/TIMEOUT/GRACE/RESUME)
--   5. exam_sessions.last_saved_at           (mốc autosave đáp án)
--   6. exam_variant_questions.*_snapshot     (snapshot nội dung câu hỏi)
--   7. exam_variant_answers.*_snapshot       (snapshot nội dung + đáp án đúng)
--   8. SPRING_SESSION / SPRING_SESSION_ATTRIBUTES (xác thực cookie)
--
-- Dùng cho DB đã tồn tại. Chạy 1 lần.
-- ============================================================

USE online_exam_db;

-- ============================================================
-- 1. exams.max_attempts
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exams'
      AND COLUMN_NAME = 'max_attempts'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exams ADD COLUMN max_attempts INT NOT NULL DEFAULT 1 COMMENT ''Số lần thi tối đa mỗi thí sinh'' AFTER total_variants',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2-5. exam_sessions: attempt_no / deadline_at / submit_source / last_saved_at
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_sessions'
      AND COLUMN_NAME = 'attempt_no'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_sessions ADD COLUMN attempt_no INT NOT NULL DEFAULT 1 COMMENT ''Lượt thi thứ mấy'' AFTER variant_id',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_sessions'
      AND COLUMN_NAME = 'deadline_at'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_sessions ADD COLUMN deadline_at DATETIME NULL COMMENT ''Hạn chót server-side'' AFTER end_time',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_sessions'
      AND COLUMN_NAME = 'submit_source'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_sessions ADD COLUMN submit_source ENUM(''MANUAL'', ''TIMEOUT'', ''GRACE'', ''RESUME'') DEFAULT ''MANUAL'' AFTER deadline_at',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_sessions'
      AND COLUMN_NAME = 'last_saved_at'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_sessions ADD COLUMN last_saved_at DATETIME NULL COMMENT ''Mốc autosave đáp án gần nhất'' AFTER submit_source',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 6. exam_variant_questions snapshot columns
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_questions'
      AND COLUMN_NAME = 'content_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_variant_questions ADD COLUMN content_snapshot TEXT NULL COMMENT ''Snapshot nội dung câu hỏi lúc sinh đề'' AFTER order_index',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_questions'
      AND COLUMN_NAME = 'image_url_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_variant_questions ADD COLUMN image_url_snapshot VARCHAR(500) NULL COMMENT ''Snapshot ảnh minh hoạ câu hỏi'' AFTER content_snapshot',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_questions'
      AND COLUMN_NAME = 'multi_choice_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_variant_questions ADD COLUMN multi_choice_snapshot BOOLEAN DEFAULT NULL COMMENT ''Snapshot: câu có nhiều đáp án đúng (NULL = chưa snapshot)'' AFTER image_url_snapshot',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 7. exam_variant_answers snapshot columns
-- ============================================================
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_answers'
      AND COLUMN_NAME = 'content_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_variant_answers ADD COLUMN content_snapshot TEXT NULL COMMENT ''Snapshot nội dung đáp án'' AFTER order_index',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_answers'
      AND COLUMN_NAME = 'image_url_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_variant_answers ADD COLUMN image_url_snapshot VARCHAR(500) NULL COMMENT ''Snapshot ảnh minh hoạ đáp án'' AFTER content_snapshot',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_answers'
      AND COLUMN_NAME = 'is_correct_snapshot'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE exam_variant_answers ADD COLUMN is_correct_snapshot BOOLEAN DEFAULT NULL COMMENT ''Snapshot đáp án đúng (NULL = chưa snapshot)'' AFTER image_url_snapshot',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 8. SPRING_SESSION / SPRING_SESSION_ATTRIBUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS SPRING_SESSION (
    PRIMARY_ID CHAR(36) NOT NULL,
    SESSION_ID CHAR(36) NOT NULL,
    CREATION_TIME BIGINT NOT NULL,
    LAST_ACCESS_TIME BIGINT NOT NULL,
    MAX_INACTIVE_INTERVAL INT NOT NULL,
    EXPIRY_TIME BIGINT NOT NULL,
    PRINCIPAL_NAME VARCHAR(100),
    CONSTRAINT SPRING_SESSION_PK PRIMARY KEY (PRIMARY_ID)
);

CREATE UNIQUE INDEX SPRING_SESSION_IX1 ON SPRING_SESSION (SESSION_ID);
CREATE INDEX SPRING_SESSION_IX2 ON SPRING_SESSION (EXPIRY_TIME);
CREATE INDEX SPRING_SESSION_IX3 ON SPRING_SESSION (PRINCIPAL_NAME);

CREATE TABLE IF NOT EXISTS SPRING_SESSION_ATTRIBUTES (
    SESSION_PRIMARY_ID CHAR(36) NOT NULL,
    ATTRIBUTE_NAME VARCHAR(200) NOT NULL,
    ATTRIBUTE_BYTES BLOB NOT NULL,
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_PK PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID)
        REFERENCES SPRING_SESSION (PRIMARY_ID) ON DELETE CASCADE
);

-- ============================================================
-- 9. Backfill deadline_at cho phiên thi đang tồn tại (DOING)
--    deadline_at = LEAST(start_time + duration, exams.end_time)
-- ============================================================
UPDATE exam_sessions es
JOIN exams e ON e.id = es.exam_id
SET es.deadline_at = LEAST(
        DATE_ADD(es.start_time, INTERVAL e.duration MINUTE),
        COALESCE(e.end_time, DATE_ADD(es.start_time, INTERVAL e.duration MINUTE))
    )
WHERE es.deadline_at IS NULL
  AND es.status = 'DOING';

-- ============================================================
-- 10. Unique constraint cho user_answers — mỗi (phiên thi, câu hỏi)
--     chỉ có 1 dòng đáp án (chống trùng khi autosave rồi submit).
-- ============================================================
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_answers'
      AND INDEX_NAME = 'uk_user_answer_session_question'
);

SET @ddl := IF(@idx_exists = 0,
    'ALTER TABLE user_answers ADD UNIQUE KEY uk_user_answer_session_question (exam_session_id, variant_question_id)',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 11. Sửa dữ liệu cũ bị sai do ALTER TABLE ADD COLUMN NOT NULL
--     (MySQL gán default 0 cho các dòng đã tồn tại).
--     - exams.max_attempts = 0  → mọi thí sinh bị chặn ngay ("đã hết lượt thi")
--     - exam_sessions.attempt_no = 0 → lượt thi không hợp lệ
-- ============================================================
UPDATE exams SET max_attempts = 1 WHERE max_attempts IS NULL OR max_attempts < 1;
UPDATE exam_sessions SET attempt_no = 1 WHERE attempt_no IS NULL OR attempt_no < 1;

-- ============================================================
-- 12. Cho phép NULL cho các cột boolean snapshot
--     (NULL = "chưa snapshot" → fallback về entity live; FALSE là giá trị thật).
-- ============================================================
SET @col_nullable := (
    SELECT IS_NULLABLE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_questions'
      AND COLUMN_NAME = 'multi_choice_snapshot'
);

SET @ddl := IF(@col_nullable = 'NO',
    'ALTER TABLE exam_variant_questions MODIFY COLUMN multi_choice_snapshot BOOLEAN DEFAULT NULL',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_nullable := (
    SELECT IS_NULLABLE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'exam_variant_answers'
      AND COLUMN_NAME = 'is_correct_snapshot'
);

SET @ddl := IF(@col_nullable = 'NO',
    'ALTER TABLE exam_variant_answers MODIFY COLUMN is_correct_snapshot BOOLEAN DEFAULT NULL',
    'DO 0');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 13. Đồng bộ độ dài cột image_url_snapshot với init.sql (VARCHAR(500)).
-- ============================================================
SET @ddl := 'ALTER TABLE exam_variant_questions MODIFY COLUMN image_url_snapshot VARCHAR(500) NULL';
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := 'ALTER TABLE exam_variant_answers MODIFY COLUMN image_url_snapshot VARCHAR(500) NULL';
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
