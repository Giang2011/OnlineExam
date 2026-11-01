-- ============================================================
-- Exam Management System — Database Schema
-- Version: 2.0 (Restructured)
-- ============================================================

-- Tạo database (Nếu chưa có)
CREATE DATABASE IF NOT EXISTS online_exam_db;
USE online_exam_db;

-- ============================================================
-- 1. Bảng users
--    - username: tên đăng nhập (unique, dùng để login)
--    - name: tên hiển thị
--    - student_id: MSSV — bắt buộc với STUDENT, để trống với ADMIN/TEACHER
--    - role: ADMIN > TEACHER > STUDENT
--    - deleted: soft delete
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    student_id VARCHAR(50) DEFAULT NULL COMMENT 'MSSV — bắt buộc với STUDENT, NULL với ADMIN/TEACHER',
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') DEFAULT 'STUDENT',
    deleted BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 2. Bảng subjects
--    - Danh mục môn học
-- ============================================================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'VD: Toán, Lý, Hóa',
    deleted BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 3. Bảng chapters
--    - Chương trong mỗi môn học, chỉ lưu tên chương
-- ============================================================
CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    name VARCHAR(255) NOT NULL COMMENT 'VD: Chương 1 - Đại cương',
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. Bảng questions
--    - Ngân hàng câu hỏi, liên kết với môn học VÀ chương
--    - Hỗ trợ ảnh minh họa qua image_url
-- ============================================================
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL COMMENT 'Đường dẫn ảnh minh họa câu hỏi (trong /uploads/)',
    subject_id INT NOT NULL,
    chapter_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. Bảng answers
--    - Đáp án của mỗi câu hỏi
--    - Hỗ trợ ảnh minh họa qua image_url
-- ============================================================
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL COMMENT 'Đường dẫn ảnh minh họa đáp án (trong /uploads/)',
    is_correct BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. Bảng exams
--    - Kỳ thi, liên kết với môn học
--    - total_variants: tổng số đề (1 gốc + N-1 tráo)
-- ============================================================
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'VD: Thi giữa kỳ Toán',
    subject_id INT NOT NULL,
    duration INT NOT NULL COMMENT 'Thời gian làm bài tính bằng phút',
    total_questions INT NOT NULL COMMENT 'Tổng số câu hỏi của đề thi',
    total_variants INT NOT NULL DEFAULT 1 COMMENT 'Tổng số đề (bao gồm 1 gốc + N-1 tráo)',
    start_time DATETIME,
    end_time DATETIME,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. Bảng exam_chapter_configs
--    - Cấu hình số câu lấy từ mỗi chương cho kỳ thi
--    - Tổng question_count tất cả chương = exams.total_questions
--    - question_count phải ≤ số câu hỏi thực tế trong chương đó
-- ============================================================
CREATE TABLE exam_chapter_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    chapter_id INT NOT NULL COMMENT 'Chương muốn lấy câu hỏi',
    question_count INT NOT NULL COMMENT 'Số câu lấy từ chương này',
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE KEY uk_exam_chapter (exam_id, chapter_id)
);

-- ============================================================
-- 8. Bảng exam_variants
--    - Mỗi đề thi (gốc hoặc tráo) của kỳ thi
--    - variant_order = 0: đề gốc
--    - variant_order = 1..N: đề tráo
-- ============================================================
CREATE TABLE exam_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    variant_order INT NOT NULL COMMENT '0 = đề gốc, 1..N-1 = đề tráo',
    is_original BOOLEAN DEFAULT FALSE COMMENT 'TRUE nếu là đề gốc',
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    UNIQUE KEY uk_exam_variant (exam_id, variant_order)
);

-- ============================================================
-- 9. Bảng exam_variant_questions
--    - Câu hỏi trong từng đề tráo, với thứ tự đã xáo trộn
-- ============================================================
CREATE TABLE exam_variant_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT NOT NULL,
    question_id INT NOT NULL,
    order_index INT NOT NULL COMMENT 'Thứ tự câu hỏi trong đề này',
    FOREIGN KEY (variant_id) REFERENCES exam_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. Bảng exam_variant_answers
--     - Đáp án đã xáo trộn trong từng câu hỏi của đề tráo
-- ============================================================
CREATE TABLE exam_variant_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    variant_question_id INT NOT NULL,
    answer_id INT NOT NULL,
    order_index INT NOT NULL COMMENT 'Thứ tự đáp án (A, B, C, D...)',
    FOREIGN KEY (variant_question_id) REFERENCES exam_variant_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);

-- ============================================================
-- 11. Bảng exam_participants
--     - Thí sinh được phân công vào kỳ thi
-- ============================================================
CREATE TABLE exam_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_exam_user (exam_id, user_id)
);

-- ============================================================
-- 12. Bảng exam_sessions
--     - Phiên thi cụ thể, gán 1 variant (đề tráo) cho thí sinh
-- ============================================================
CREATE TABLE exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT NOT NULL,
    variant_id INT DEFAULT NULL COMMENT 'Đề tráo được gán cho thí sinh',
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    status ENUM('DOING', 'SUBMITTED') DEFAULT 'DOING',
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES exam_variants(id) ON DELETE SET NULL
);

-- ============================================================
-- 13. Bảng user_answers
--     - Đáp án thí sinh chọn, liên kết qua exam_session + variant_question
-- ============================================================
CREATE TABLE user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_session_id INT NOT NULL,
    variant_question_id INT NOT NULL COMMENT 'Câu hỏi trong đề tráo mà thí sinh trả lời',
    FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_question_id) REFERENCES exam_variant_questions(id) ON DELETE CASCADE
);

-- ============================================================
-- 14. Bảng user_answer_selections
--     - Đáp án cụ thể thí sinh chọn (hỗ trợ multi-select)
-- ============================================================
CREATE TABLE user_answer_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_answer_id INT NOT NULL,
    selected_answer_id INT NOT NULL,
    UNIQUE KEY uk_user_answer_selection (user_answer_id, selected_answer_id),
    FOREIGN KEY (user_answer_id) REFERENCES user_answers(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_answer_id) REFERENCES answers(id) ON DELETE CASCADE
);

-- ============================================================
-- 15. Bảng results
--     - Kết quả chấm điểm phiên thi
-- ============================================================
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_session_id INT NOT NULL UNIQUE,
    score FLOAT DEFAULT 0.0,
    total_correct INT DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);