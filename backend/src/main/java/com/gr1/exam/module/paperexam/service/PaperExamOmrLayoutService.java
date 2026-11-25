package com.gr1.exam.module.paperexam.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.external.vision.config.VisionProperties;
import com.gr1.exam.module.paperexam.entity.PaperExam;
import com.gr1.exam.module.paperexam.entity.PaperExamAnswer;
import com.gr1.exam.module.paperexam.entity.PaperExamQuestion;
import com.gr1.exam.module.paperexam.repository.PaperExamAnswerRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bộ giải quyết thông số OMR của một đề giấy.
 *
 * Gom logic "đề này có bao nhiêu lựa chọn / bao nhiêu câu mỗi trang / layout là gì"
 * vào một chỗ để lúc sinh phiếu và lúc chấm luôn dùng chung — tránh tình trạng
 * phiếu in ra theo layout A nhưng lại chấm theo layout B.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaperExamOmrLayoutService {

    private final PaperExamQuestionRepository paperExamQuestionRepository;
    private final PaperExamAnswerRepository paperExamAnswerRepository;
    private final VisionProperties visionProperties;
    private final ObjectMapper objectMapper;

    /** Layout mặc định khi đề chưa lưu layout riêng. */
    public static final int DEFAULT_QUESTIONS_PER_PAGE = 14;

    /**
     * Số lựa chọn tối đa trong đề — quyết định số cột ô tô trên phiếu.
     * Lấy theo số đáp án của câu có nhiều đáp án nhất.
     */
    public int resolveChoicesPerQ(PaperExam paperExam) {
        List<PaperExamQuestion> questions =
                paperExamQuestionRepository.findByPaperExamIdOrderByOrderIndexAsc(paperExam.getId());

        int max = 0;
        for (PaperExamQuestion question : questions) {
            int count = resolveAnswerOptions(question).size();
            if (count > max) {
                max = count;
            }
        }
        return max > 0 ? max : visionProperties.getDefaultChoicesPerQ();
    }

    /**
     * Số câu trên mỗi trang phiếu — đọc từ layout của đề, fallback về mặc định.
     * Giá trị này quyết định offset câu toàn cục khi ghép các trang.
     */
    public int resolveQuestionsPerPage(PaperExam paperExam) {
        Integer fromLayout = readLayoutInt(paperExam, "questions_per_page");
        if (fromLayout != null && fromLayout > 0) {
            return fromLayout;
        }
        return visionProperties.getDefaultQuestionsPerPage() > 0
                ? visionProperties.getDefaultQuestionsPerPage()
                : DEFAULT_QUESTIONS_PER_PAGE;
    }

    /** Số trang cần thiết để chứa hết câu hỏi của đề. */
    public int resolvePageCount(int totalQuestions, int questionsPerPage) {
        if (questionsPerPage <= 0) {
            return 1;
        }
        return Math.max(1, (int) Math.ceil((double) totalQuestions / questionsPerPage));
    }

    /**
     * Layout OMR ở dạng JSON để gửi cho Python service.
     * Lấy từ `PaperExam.omrLayout` nếu có, không thì dùng layout mặc định.
     */
    public String resolveLayoutJson(PaperExam paperExam) {
        String stored = paperExam.getOmrLayout();
        if (stored != null && !stored.isBlank()) {
            return stored;
        }
        return visionProperties.getOmrLayout();
    }

    /** Đọc một field số từ layout JSON của đề. */
    public Integer readLayoutInt(PaperExam paperExam, String field) {
        String stored = paperExam.getOmrLayout();
        if (stored == null || stored.isBlank()) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(stored).get(field);
            if (node == null || node.isNull()) {
                return null;
            }
            return node.asInt();
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    /**
     * Các lựa chọn (letter) của một câu trong đề, theo đúng thứ tự hiển thị.
     *
     * Dùng snapshot `PaperExamAnswer` + `orderIndex` (thứ tự hiển thị) thay vì
     * `question.getQuestion().getAnswers()` (câu gốc) — nhờ vậy đáp án của đề không
     * đổi khi câu hỏi gốc bị sửa sau khi đề đã tạo.
     */
    public List<String> resolveAnswerOptions(PaperExamQuestion paperExamQuestion) {
        List<PaperExamAnswer> sorted = sortedAnswers(paperExamQuestion);
        List<String> options = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            options.add(String.valueOf((char) ('A' + i)));
        }
        return options;
    }

    /**
     * Các đáp án đúng (letter) của một câu trong đề, theo snapshot `PaperExamAnswer`.
     * Một câu có thể có nhiều đáp án đúng.
     */
    public List<String> resolveCorrectOptions(PaperExamQuestion paperExamQuestion) {
        List<PaperExamAnswer> sorted = sortedAnswers(paperExamQuestion);
        List<String> correct = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            PaperExamAnswer answer = sorted.get(i);
            Boolean isCorrect = answer.getIsCorrectSnapshot() != null
                    ? answer.getIsCorrectSnapshot()
                    : safeLiveIsCorrect(answer);
            if (Boolean.TRUE.equals(isCorrect)) {
                correct.add(String.valueOf((char) ('A' + i)));
            }
        }
        return correct;
    }

    /**
     * Đáp án đúng của toàn bộ đề, ở dạng JSON cho engine vision.
     *
     * <p>Định dạng: {@code [["B"], ["A","C"], ...]} — mảng 0-based theo thứ tự câu,
     * nên phần tử thứ {@code q} là đáp án đúng của câu có {@code orderIndex == q + 1}.
     * Engine dùng mảng này để vẽ ảnh đã khoanh (xanh = ô thí sinh tô đúng,
     * đỏ = ô tô sai); nó không tự quyết định đúng/sai.
     */
    public String buildAnswerKeyJson(List<PaperExamQuestion> questions) {
        List<List<String>> key = new ArrayList<>();
        for (PaperExamQuestion question : questions) {
            key.add(resolveCorrectOptions(question));
        }
        try {
            return objectMapper.writeValueAsString(key);
        } catch (JsonProcessingException ex) {
            log.warn("Không dựng được answerKey cho engine vision: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Ngưỡng đọc ô tô mà engine dùng, dạng JSON.
     *
     * <p>Gửi kèm để hai tầng cùng một tham số, tránh việc ảnh khoanh và bảng kết quả
     * lệch nhau do mỗi tầng dùng một ngưỡng mặc định khác nhau.
     */
    public String buildThresholdsJson() {
        Map<String, Double> thresholds = new LinkedHashMap<>();
        thresholds.put("fillThreshold", visionProperties.getFillThreshold());
        thresholds.put("ambiguityMargin", visionProperties.getAmbiguityMargin());
        try {
            return objectMapper.writeValueAsString(thresholds);
        } catch (JsonProcessingException ex) {
            log.warn("Không dựng được thresholds cho engine vision: {}", ex.getMessage());
            return null;
        }
    }
    /**
     * Đọc {@code isCorrect} live của đáp án — trả {@code null} nếu đáp án đã bị soft-delete.
     */
    private Boolean safeLiveIsCorrect(PaperExamAnswer answer) {
        try {
            return answer.getAnswer() == null ? null : answer.getAnswer().getIsCorrect();
        } catch (RuntimeException e) {
            return null;
        }
    }

    /** Snapshot đáp án của một câu, sắp xếp theo thứ tự hiển thị. */
    public List<PaperExamAnswer> sortedAnswers(PaperExamQuestion paperExamQuestion) {
        List<PaperExamAnswer> answers = paperExamAnswerRepository.findByPaperExamQuestionId(paperExamQuestion.getId());
        if (answers == null || answers.isEmpty()) {
            return List.of();
        }
        List<PaperExamAnswer> sorted = new ArrayList<>(answers);
        sorted.sort(Comparator.comparing(
                answer -> answer.getOrderIndex() == null ? Integer.MAX_VALUE : answer.getOrderIndex()));
        return sorted;
    }
}
