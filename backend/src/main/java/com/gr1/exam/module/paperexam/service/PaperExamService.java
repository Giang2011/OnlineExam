package com.gr1.exam.module.paperexam.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.utils.ShuffleUtils;
import com.gr1.exam.external.vision.config.VisionProperties;
import com.gr1.exam.module.paperexam.dto.PaperExamAnswerResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamAnswerViewResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamChapterConfigRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamChapterConfigResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamPdfMetaResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamPreviewResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamQuestionResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamResponseDTO;
import com.gr1.exam.module.paperexam.entity.PaperExam;
import com.gr1.exam.module.paperexam.entity.PaperExamAnswer;
import com.gr1.exam.module.paperexam.entity.PaperExamChapterConfig;
import com.gr1.exam.module.paperexam.entity.PaperExamQuestion;
import com.gr1.exam.module.paperexam.repository.PaperExamAnswerRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamChapterConfigRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamQueryRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamQuestionRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamRepository;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaperExamService {

    private final PaperExamRepository paperExamRepository;
    private final PaperExamChapterConfigRepository paperExamChapterConfigRepository;
    private final PaperExamQuestionRepository paperExamQuestionRepository;
    private final PaperExamAnswerRepository paperExamAnswerRepository;
    private final PaperExamQueryRepository paperExamQueryRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final VisionProperties visionProperties;
    private final PaperExamOmrLayoutService omrLayoutService;

    /** Số câu tối đa trên mỗi trang phiếu OMR với layout chuẩn. */
    private static final int DEFAULT_QUESTIONS_PER_PAGE = 14;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    @Transactional
    public PaperExamResponseDTO createPaperExam(PaperExamRequestDTO request, Integer creatorUserId) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        User creator = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Người tạo không tìm thấy với id: " + creatorUserId));

        validateChapterConfigs(request, subject.getId());

        PaperExam paperExam = PaperExam.builder()
                .title(request.getTitle())
                .subject(subject)
                .durationMinutes(request.getDurationMinutes())
                .totalQuestions(request.getTotalQuestions())
                .showAnswers(true)
                .createdBy(creator)
                .status(PaperExam.PaperExamStatus.DRAFT)
                .build();
        paperExam = paperExamRepository.save(paperExam);

        List<PaperExamChapterConfig> savedConfigs = new ArrayList<>();
        for (PaperExamChapterConfigRequestDTO config : request.getChapterConfigs()) {
            Chapter chapter = chapterRepository.findById(config.getChapterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy với id: " + config.getChapterId()));

            PaperExamChapterConfig entity = PaperExamChapterConfig.builder()
                    .paperExam(paperExam)
                    .chapter(chapter)
                    .questionCount(config.getQuestionCount())
                    .build();
            savedConfigs.add(paperExamChapterConfigRepository.save(entity));
        }

        List<PaperExamQuestion> snapshotQuestions = createQuestionSnapshot(paperExam, request, savedConfigs);
        createAnswerSnapshot(snapshotQuestions);
        paperExam.setChapterConfigs(savedConfigs);
        paperExam.setQuestions(snapshotQuestions);

        // Ghi lại layout OMR của đề để lúc sinh phiếu và lúc chấm dùng chung một layout.
        paperExam.setOmrLayout(buildOmrLayoutJson(request.getTotalQuestions()));
        paperExam = paperExamRepository.save(paperExam);

        return toResponseDTO(paperExam);
    }

    /**
     * Layout OMR mặc định khi tạo đề: số câu mỗi trang được tính từ tổng số câu
     * (mỗi trang chứa tối đa 14 câu với layout chuẩn).
     */
    private String buildOmrLayoutJson(int totalQuestions) {
        int questionsPerPage = Math.max(1, Math.min(totalQuestions, DEFAULT_QUESTIONS_PER_PAGE));
        String layout = visionProperties.getOmrLayout();
        if (layout == null || layout.isBlank()) {
            return "{\"questions_per_page\":" + questionsPerPage + "}";
        }
        return layout.substring(0, layout.length() - 1) + ",\"questions_per_page\":" + questionsPerPage + "}";
    }

    private void validateChapterConfigs(PaperExamRequestDTO request, Integer subjectId) {
        int totalFromChapters = 0;
        Set<Integer> seenChapterIds = new HashSet<>();

        for (var config : request.getChapterConfigs()) {
            if (!seenChapterIds.add(config.getChapterId())) {
                throw new BadRequestException("Mỗi chương chỉ được xuất hiện một lần trong cấu hình đề giấy.");
            }

            Chapter chapter = chapterRepository.findById(config.getChapterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy với id: " + config.getChapterId()));

            if (!chapter.getSubject().getId().equals(subjectId)) {
                throw new BadRequestException("Chương '" + chapter.getName() + "' không thuộc môn học đã chọn.");
            }

            long availableInChapter = questionRepository.countBySubjectIdAndChapterId(subjectId, config.getChapterId());
            if (config.getQuestionCount() > availableInChapter) {
                throw new BadRequestException("Chương '" + chapter.getName() + "' chỉ có " + availableInChapter + " câu hỏi, nhưng yêu cầu " + config.getQuestionCount() + " câu.");
            }

            totalFromChapters += config.getQuestionCount();
        }

        if (totalFromChapters != request.getTotalQuestions()) {
            throw new BadRequestException("Tổng số câu theo chương (" + totalFromChapters + ") phải bằng tổng số câu hỏi của đề (" + request.getTotalQuestions() + ").");
        }
    }

    private List<PaperExamQuestion> createQuestionSnapshot(PaperExam paperExam, PaperExamRequestDTO request, List<PaperExamChapterConfig> savedConfigs) {
        List<Question> selectedQuestions = new ArrayList<>();

        for (PaperExamChapterConfig config : savedConfigs) {
            List<Question> questions = paperExamQueryRepository.findRandomableQuestionsBySubjectAndChapter(request.getSubjectId(), config.getChapter().getId());
            List<Question> shuffled = ShuffleUtils.shuffle(questions);
            selectedQuestions.addAll(shuffled.subList(0, config.getQuestionCount()));
        }

        if (selectedQuestions.size() != request.getTotalQuestions()) {
            throw new BadRequestException("Không thể tạo đủ số câu hỏi cho đề giấy.");
        }

        List<Question> globallyShuffledQuestions = ShuffleUtils.shuffle(selectedQuestions);

        List<PaperExamQuestion> snapshotQuestions = new ArrayList<>();
        int orderIndex = 1;
        for (Question question : globallyShuffledQuestions) {
            PaperExamQuestion entity = PaperExamQuestion.builder()
                    .paperExam(paperExam)
                    .question(question)
                    .chapter(question.getChapter())
                    .orderIndex(orderIndex++)
                    .build();
            snapshotQuestions.add(entity);
        }
        return paperExamQuestionRepository.saveAll(snapshotQuestions);
    }

    private void createAnswerSnapshot(List<PaperExamQuestion> snapshotQuestions) {
        List<PaperExamAnswer> snapshotAnswers = new ArrayList<>();

        for (PaperExamQuestion snapshotQuestion : snapshotQuestions) {
            List<PaperExamAnswer> answers = snapshotQuestion.getQuestion().getAnswers().stream()
                    .sorted(Comparator.comparing(answer -> answer.getId() == null ? Integer.MAX_VALUE : answer.getId()))
                    .map(answer -> PaperExamAnswer.builder()
                            .paperExamQuestion(snapshotQuestion)
                            .answer(answer)
                            .orderIndex(answer.getId())
                            .build())
                    .toList();
            snapshotAnswers.addAll(answers);
        }

        paperExamAnswerRepository.saveAll(snapshotAnswers);
    }

    @Transactional(readOnly = true)
    public List<PaperExamResponseDTO> getPaperExams() {
        return paperExamRepository.findAll().stream()
                .sorted(Comparator.comparing(PaperExam::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponseDTO)
                .toList();
    }

    public PaperExamResponseDTO getPaperExamById(Integer id) {
        PaperExam paperExam = paperExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + id));
        return toResponseDTO(paperExam);
    }

    @Transactional
    public void softDeletePaperExam(Integer id) {
        PaperExam paperExam = paperExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + id));
        paperExamRepository.delete(paperExam);
    }

    @Transactional(readOnly = true)
    public PaperExamPreviewResponseDTO getPaperExamPreview(Integer id) {
        PaperExam paperExam = paperExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + id));

        List<PaperExamQuestionResponseDTO> questions = paperExamQuestionRepository.findByPaperExamIdOrderByOrderIndexAsc(id).stream()
                .map(question -> toQuestionResponseDTO(question, false))
                .toList();

        return PaperExamPreviewResponseDTO.builder()
                .paperExamId(paperExam.getId())
                .title(paperExam.getTitle())
                .durationMinutes(paperExam.getDurationMinutes())
                .totalQuestions(paperExam.getTotalQuestions())
                .showAnswers(paperExam.getShowAnswers())
                .questions(questions)
                .build();
    }

    @Transactional(readOnly = true)
    public PaperExamAnswerViewResponseDTO getPaperExamAnswerView(Integer id) {
        PaperExam paperExam = paperExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + id));

        List<PaperExamQuestionResponseDTO> questions = paperExamQuestionRepository.findByPaperExamIdOrderByOrderIndexAsc(id).stream()
                .map(question -> toQuestionResponseDTO(question, true))
                .toList();

        return PaperExamAnswerViewResponseDTO.builder()
                .paperExamId(paperExam.getId())
                .title(paperExam.getTitle())
                .showAnswers(paperExam.getShowAnswers())
                .questions(questions)
                .build();
    }

    private PaperExamQuestionResponseDTO toQuestionResponseDTO(PaperExamQuestion paperExamQuestion, boolean includeCorrectAnswer) {
        return PaperExamQuestionResponseDTO.builder()
                .id(paperExamQuestion.getId())
                .questionId(paperExamQuestion.getQuestion().getId())
                .chapterId(paperExamQuestion.getChapter().getId())
                .chapterName(paperExamQuestion.getChapter().getName())
                .orderIndex(paperExamQuestion.getOrderIndex())
                .content(paperExamQuestion.getQuestion().getContent())
                .imageUrl(paperExamQuestion.getQuestion().getImageUrl())
                .answers(paperExamQuestion.getQuestion().getAnswers().stream()
                        .sorted(Comparator.comparing(answer -> answer.getId() == null ? Integer.MAX_VALUE : answer.getId()))
                        .map(answer -> PaperExamAnswerResponseDTO.builder()
                                .answerId(answer.getId())
                                .content(answer.getContent())
                                .imageUrl(answer.getImageUrl())
                                .isCorrect(includeCorrectAnswer ? answer.getIsCorrect() : null)
                                .build())
                        .toList())
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] generatePaperExamPdf(Integer id) {
        PaperExamPreviewResponseDTO preview = getPaperExamPreview(id);
        String html = buildPdfHtml(preview);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);

            ClassPathResource fontResource = new ClassPathResource("fonts/NotoSans-Regular.ttf");
            if (fontResource.exists()) {
                // Đọc qua InputStream: resource nằm trong jar khi đóng gói nên không có file path hệ thống.
                byte[] fontBytes;
                try (InputStream in = fontResource.getInputStream()) {
                    fontBytes = in.readAllBytes();
                }
                builder.useFont(() -> new ByteArrayInputStream(fontBytes), "Noto Sans");
            }

            builder.toStream(baos);
            builder.run();
            return baos.toByteArray();
        } catch (Exception ex) {
            throw new BadRequestException("Không thể tạo PDF đề giấy: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PaperExamPdfMetaResponseDTO getPaperExamPdfMeta(Integer id) {
        PaperExam paperExam = paperExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + id));

        return PaperExamPdfMetaResponseDTO.builder()
                .paperExamId(paperExam.getId())
                .title(paperExam.getTitle())
                .totalPages(null)
                .fileName(buildSafeFileName(paperExam.getTitle(), paperExam.getId()))
                .contentType("application/pdf")
                .build();
    }

    private String buildPdfHtml(PaperExamPreviewResponseDTO preview) {
        String template = readTemplateOrDefault("templates/paperexam/paper-exam-template.html");

        StringBuilder questionsBlock = new StringBuilder();
        for (PaperExamQuestionResponseDTO q : preview.getQuestions()) {
            questionsBlock.append("<div class='q'>")
                    .append("<div class='q-title'>Câu ").append(q.getOrderIndex()).append(": ").append(escapeHtml(q.getContent())).append("</div>");
            if (q.getImageUrl() != null && !q.getImageUrl().isBlank()) {
                questionsBlock.append("<img class='question-image' src='").append(resolveImageSrc(q.getImageUrl())).append("' alt='question-image' />");
            }

            List<PaperExamAnswerResponseDTO> answers = q.getAnswers();
            for (int i = 0; i < answers.size(); i++) {
                PaperExamAnswerResponseDTO a = answers.get(i);
                String label = String.valueOf((char) ('A' + i));
                questionsBlock.append("<div class='ans'><span class='ans-label'>").append(label).append(".</span> ")
                        .append(escapeHtml(a.getContent()));
                if (a.getImageUrl() != null && !a.getImageUrl().isBlank()) {
                    questionsBlock.append("<br/><img class='answer-image' src='").append(resolveImageSrc(a.getImageUrl())).append("' alt='answer-image' />");
                }
                questionsBlock.append("</div>");
            }
            questionsBlock.append("</div>");
        }

        return template
                .replace("{{TITLE}}", escapeHtml(preview.getTitle()))
                .replace("{{DURATION_MINUTES}}", String.valueOf(preview.getDurationMinutes()))
                .replace("{{TOTAL_QUESTIONS}}", String.valueOf(preview.getTotalQuestions()))
                .replace("{{QUESTIONS_BLOCK}}", questionsBlock.toString());
    }

    private String readTemplateOrDefault(String classpathLocation) {
        try {
            ClassPathResource resource = new ClassPathResource(classpathLocation);
            if (resource.exists()) {
                try (InputStream in = resource.getInputStream()) {
                    return new String(in.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (Exception ignored) {
            // fallback template below
        }

        return "<!doctype html><html><head><meta charset='UTF-8'/><style>"
                + "@page{size:A4;margin:18mm 14mm;}body{font-family:'Noto Sans','Roboto','Arial',sans-serif;font-size:13px;color:#111;line-height:1.4;}"
                + ".header{margin-bottom:14px;border-bottom:1px solid #ccc;padding-bottom:8px;}"
                + ".title{font-size:20px;font-weight:700;margin-bottom:4px;}"
                + ".meta{font-size:12px;color:#333;}"
                + ".q{margin:12px 0;page-break-inside:avoid;}"
                + ".q-title{font-weight:600;margin-bottom:6px;}"
                + ".ans{margin-left:16px;margin-bottom:4px;}"
                + ".ans-label{font-weight:600;display:inline-block;min-width:18px;}"
                + "img{max-width:460px;max-height:260px;object-fit:contain;display:block;margin:6px 0;}"
                + ".question-image,.answer-image{display:block;}"
                + "</style></head><body><div class='header'><div class='title'>{{TITLE}}</div><div class='meta'>Thời gian: {{DURATION_MINUTES}} phút | Số câu: {{TOTAL_QUESTIONS}}</div></div>{{QUESTIONS_BLOCK}}</body></html>";
    }

    private String resolveImageSrc(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return "";
        }

        String trimmed = imageUrl.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
            return escapeHtml(trimmed);
        }

        String base = appBaseUrl == null ? "" : appBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }

        String normalizedPath = trimmed.startsWith("/") ? trimmed : "/" + trimmed;
        return escapeHtml(base + normalizedPath);
    }

    private String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String buildSafeFileName(String title, Integer id) {
        String normalized = Normalizer.normalize(title == null ? "paper-exam" : title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase();
        String slug = normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (slug.isBlank()) {
            slug = "paper-exam";
        }
        return (slug + "-" + id + ".pdf").getBytes(StandardCharsets.UTF_8).length > 0 ? slug + "-" + id + ".pdf" : "paper-exam-" + id + ".pdf";
    }

    private PaperExamResponseDTO toResponseDTO(PaperExam paperExam) {
        int questionsPerPage = omrLayoutService.resolveQuestionsPerPage(paperExam);
        int choicesPerQ = omrLayoutService.resolveChoicesPerQ(paperExam);
        int totalQuestions = paperExam.getTotalQuestions() == null ? 0 : paperExam.getTotalQuestions();

        return PaperExamResponseDTO.builder()
                .id(paperExam.getId())
                .title(paperExam.getTitle())
                .subjectId(paperExam.getSubject().getId())
                .subjectName(paperExam.getSubject().getName())
                .durationMinutes(paperExam.getDurationMinutes())
                .totalQuestions(paperExam.getTotalQuestions())
                .omrQuestionsPerPage(questionsPerPage)
                .omrChoicesPerQ(choicesPerQ)
                .omrPageCount(omrLayoutService.resolvePageCount(totalQuestions, questionsPerPage))
                .showAnswers(paperExam.getShowAnswers())
                .status(paperExam.getStatus().name())
                .createdById(paperExam.getCreatedBy().getId())
                .createdByName(paperExam.getCreatedBy().getName())
                .createdAt(paperExam.getCreatedAt())
                .updatedAt(paperExam.getUpdatedAt())
                .chapterConfigs(paperExamChapterConfigRepository.findByPaperExamId(paperExam.getId()).stream()
                        .map(cfg -> PaperExamChapterConfigResponseDTO.builder()
                                .id(cfg.getId())
                                .chapterId(cfg.getChapter().getId())
                                .chapterName(cfg.getChapter().getName())
                                .questionCount(cfg.getQuestionCount())
                                .build())
                        .toList())
                .build();
    }
}
