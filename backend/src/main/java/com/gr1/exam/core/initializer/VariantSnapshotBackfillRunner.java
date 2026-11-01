package com.gr1.exam.core.initializer;

import com.gr1.exam.module.exam.entity.ExamVariant;
import com.gr1.exam.module.exam.entity.ExamVariantAnswer;
import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import com.gr1.exam.module.exam.repository.ExamVariantAnswerRepository;
import com.gr1.exam.module.exam.repository.ExamVariantQuestionRepository;
import com.gr1.exam.module.exam.repository.ExamVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Backfill snapshot cho các variant cũ đã tạo trước khi có cột snapshot.
 *
 * <p>Đọc nội dung/đáp án đúng hiện tại trong ngân hàng câu hỏi rồi ghi vào
 * {@code exam_variant_questions.*_snapshot} / {@code exam_variant_answers.*_snapshot}.
 *
 * <p>Chạy một lần khi khởi động app (idempotent — chỉ xử lý row còn NULL).
 *
 * <p><b>Quan trọng — vì sao dùng JDBC thuần:</b> câu hỏi/đáp án bị soft-delete vẫn còn
 * dòng trong DB ({@code deleted = true}) nhưng bị {@code @Where(clause = "deleted = false")}
 * ẩn khỏi entity. Nếu đọc qua repository JPA thì sẽ ném
 * {@code Unable to find com.gr1.exam.module.question.entity.Answer with id N} và
 * cả lượt backfill bị bỏ qua. Dùng JDBC đọc thẳng bảng gốc (bỏ qua {@code deleted})
 * giúp backfill luôn hoàn tất và không bao giờ làm hỏng quá trình khởi động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VariantSnapshotBackfillRunner implements ApplicationRunner {

    private final ExamVariantRepository examVariantRepository;
    private final ExamVariantQuestionRepository examVariantQuestionRepository;
    private final ExamVariantAnswerRepository examVariantAnswerRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            backfill();
        } catch (Exception e) {
            // Không được làm hỏng quá trình khởi động app.
            log.warn("[SnapshotBackfill] Bỏ qua backfill do lỗi: {}", e.getMessage());
        }
    }

    @Transactional
    public void backfill() {
        List<ExamVariant> variants = examVariantRepository.findAll();
        if (variants.isEmpty()) {
            log.info("[SnapshotBackfill] Không có dữ liệu nào cần backfill.");
            return;
        }

        // Nạp sẵn toàn bộ câu hỏi / đáp án (kể cả dòng đã soft-delete) để tránh N+1
        // và tránh bị @Where lọc mất dữ liệu.
        Map<Integer, QuestionRow> questionById = loadQuestions();
        Map<Integer, AnswerRow> answerById = loadAnswers();

        int questionCount = 0;
        int answerCount = 0;
        int skipped = 0;

        for (ExamVariant variant : variants) {
            List<ExamVariantQuestion> vQuestions = examVariantQuestionRepository
                    .findByVariantIdOrderByOrderIndex(variant.getId());

            for (ExamVariantQuestion vq : vQuestions) {
                Integer questionId = vq.getQuestion() == null ? null : vq.getQuestion().getId();
                QuestionRow question = questionId == null ? null : questionById.get(questionId);

                boolean dirty = false;
                if (vq.getContentSnapshot() == null) {
                    if (question == null) {
                        // Câu hỏi đã bị xoá cứng — không có gì để snapshot.
                        skipped++;
                        continue;
                    }
                    vq.setContentSnapshot(question.content());
                    vq.setImageUrlSnapshot(question.imageUrl());
                    dirty = true;
                }
                if (vq.getMultiChoiceSnapshot() == null) {
                    if (question == null) {
                        skipped++;
                        continue;
                    }
                    vq.setMultiChoiceSnapshot(countCorrect(question.id(), answerById) > 1);
                    dirty = true;
                }
                if (dirty) {
                    examVariantQuestionRepository.save(vq);
                    questionCount++;
                }

                List<ExamVariantAnswer> vAnswers = examVariantAnswerRepository
                        .findByVariantQuestionIdOrderByOrderIndex(vq.getId());

                for (ExamVariantAnswer va : vAnswers) {
                    Integer answerId = va.getAnswer() == null ? null : va.getAnswer().getId();
                    AnswerRow answer = answerId == null ? null : answerById.get(answerId);

                    boolean vaDirty = false;
                    if (va.getContentSnapshot() == null) {
                        if (answer == null) {
                            skipped++;
                            continue;
                        }
                        va.setContentSnapshot(answer.content());
                        va.setImageUrlSnapshot(answer.imageUrl());
                        vaDirty = true;
                    }
                    if (va.getIsCorrectSnapshot() == null) {
                        if (answer == null) {
                            skipped++;
                            continue;
                        }
                        va.setIsCorrectSnapshot(answer.isCorrect());
                        vaDirty = true;
                    }
                    if (vaDirty) {
                        examVariantAnswerRepository.save(va);
                        answerCount++;
                    }
                }
            }
        }

        if (questionCount > 0 || answerCount > 0) {
            log.info("[SnapshotBackfill] Đã backfill {} câu hỏi và {} đáp án vào snapshot.",
                    questionCount, answerCount);
        } else {
            log.info("[SnapshotBackfill] Không có dữ liệu nào cần backfill.");
        }
        if (skipped > 0) {
            log.warn("[SnapshotBackfill] Bỏ qua {} bản ghi vì câu hỏi/đáp án gốc đã bị xoá.",
                    skipped);
        }
    }

    /**
     * Đếm số đáp án đúng của một câu hỏi (kể cả đáp án đã soft-delete — cần đúng với
     * trạng thái tại thời điểm sinh đề).
     */
    private long countCorrect(Integer questionId, Map<Integer, AnswerRow> answerById) {
        return answerById.values().stream()
                .filter(a -> questionId.equals(a.questionId()))
                .filter(AnswerRow::isCorrect)
                .count();
    }

    private Map<Integer, QuestionRow> loadQuestions() {
        Map<Integer, QuestionRow> map = new HashMap<>();
        jdbcTemplate.query("SELECT id, content, image_url FROM questions",
                rs -> {
                    map.put(rs.getInt("id"), new QuestionRow(
                            rs.getInt("id"), rs.getString("content"), rs.getString("image_url")));
                });
        return map;
    }

    private Map<Integer, AnswerRow> loadAnswers() {
        Map<Integer, AnswerRow> map = new HashMap<>();
        jdbcTemplate.query("SELECT id, question_id, content, image_url, is_correct FROM answers",
                rs -> {
                    map.put(rs.getInt("id"), new AnswerRow(
                            rs.getInt("id"),
                            rs.getInt("question_id"),
                            rs.getString("content"),
                            rs.getString("image_url"),
                            Boolean.TRUE.equals(rs.getBoolean("is_correct"))));
                });
        return map;
    }

    private record QuestionRow(Integer id, String content, String imageUrl) {}

    private record AnswerRow(Integer id, Integer questionId, String content,
                             String imageUrl, boolean isCorrect) {}
}
