package com.gr1.exam.module.exam.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.exam.dto.ChapterConfigDTO;
import com.gr1.exam.module.exam.dto.ExamParticipantDTO;
import com.gr1.exam.module.exam.dto.ExamRequestDTO;
import com.gr1.exam.module.exam.dto.ExamResponseDTO;
import com.gr1.exam.module.exam.entity.*;
import com.gr1.exam.module.exam.repository.*;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamParticipantRepository participantRepository;
    private final ExamChapterConfigRepository examChapterConfigRepository;
    private final ExamVariantRepository examVariantRepository;
    private final ExamVariantQuestionRepository examVariantQuestionRepository;
    private final ExamVariantAnswerRepository examVariantAnswerRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    // ==================== CRUD Kỳ thi ====================

    /**
     * Danh sách kỳ thi — phân quyền theo caller.
     * Admin/Teacher: xem tất cả. Student: chỉ xem kỳ thi được phân công.
     */
    public List<ExamResponseDTO> getAllExams(String callerUsername) {
        User caller = userRepository.findByUsername(callerUsername).orElseThrow();

        List<Exam> exams;
        if (caller.getRole() == User.Role.STUDENT) {
            // Student chỉ xem kỳ thi được phân công
            List<ExamParticipant> participations = participantRepository.findByUserId(caller.getId());
            exams = participations.stream()
                    .map(ExamParticipant::getExam)
                    .collect(Collectors.toList());
        } else {
            // Admin/Teacher xem tất cả
            exams = examRepository.findAll();
        }

        return exams.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    /**
     * Chi tiết kỳ thi theo ID.
     */
    public ExamResponseDTO getExamById(Integer id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + id));
        return toResponseDTO(exam);
    }

    /**
     * Tạo kỳ thi mới với:
     * - Validate chapterConfig
     * - Sinh đề gốc + tráo sẵn N đề
     */
    @Transactional
    public ExamResponseDTO createExam(ExamRequestDTO request) {
        // 1. Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // 2. Validate chapterConfigs
        int totalFromChapters = 0;
        for (ChapterConfigDTO config : request.getChapterConfigs()) {
            Chapter chapter = chapterRepository.findById(config.getChapterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy: " + config.getChapterId()));

            // Đảm bảo chapter thuộc subject
            if (!chapter.getSubject().getId().equals(request.getSubjectId())) {
                throw new BadRequestException("Chương '" + chapter.getName() + "' không thuộc môn học này.");
            }

            // Validate: questionCount ≤ số câu thực tế trong chương
            long availableInChapter = questionRepository.countByChapterId(config.getChapterId());
            if (config.getQuestionCount() > availableInChapter) {
                throw new BadRequestException(
                        "Chương '" + chapter.getName() + "' chỉ có " + availableInChapter
                        + " câu hỏi, nhưng yêu cầu " + config.getQuestionCount() + " câu.");
            }

            totalFromChapters += config.getQuestionCount();
        }

        // Validate: Σ questionCount == totalQuestions
        if (totalFromChapters != request.getTotalQuestions()) {
            throw new BadRequestException(
                    "Tổng số câu từ các chương (" + totalFromChapters
                    + ") phải bằng số câu hỏi của kỳ thi (" + request.getTotalQuestions() + ").");
        }

        // Validate thời gian
        validateTimeRange(request.getStartTime(), request.getEndTime());

        // 3. Tạo Exam
        Exam exam = Exam.builder()
                .title(request.getTitle())
                .subject(subject)
                .duration(request.getDuration())
                .totalQuestions(request.getTotalQuestions())
                .totalVariants(request.getTotalVariants())
                .maxAttempts(resolveMaxAttempts(request))
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();
        exam = examRepository.save(exam);

        // 4. Lưu exam_chapter_configs
        for (ChapterConfigDTO config : request.getChapterConfigs()) {
            Chapter chapter = chapterRepository.findById(config.getChapterId()).orElseThrow();
            ExamChapterConfig ecc = ExamChapterConfig.builder()
                    .exam(exam)
                    .chapter(chapter)
                    .questionCount(config.getQuestionCount())
                    .build();
            examChapterConfigRepository.save(ecc);
        }

        // 5. Sinh đề gốc (variant_order = 0)
        List<Question> originalQuestions = new ArrayList<>();
        for (ChapterConfigDTO config : request.getChapterConfigs()) {
            List<Question> chapterQuestions = questionRepository.findByChapterId(config.getChapterId());
            Collections.shuffle(chapterQuestions);
            originalQuestions.addAll(chapterQuestions.subList(0, config.getQuestionCount()));
        }

        createVariant(exam, 0, true, originalQuestions);

        // 6. Tráo thêm (totalVariants - 1) đề
        for (int i = 1; i < request.getTotalVariants(); i++) {
            List<Question> shuffled = new ArrayList<>(originalQuestions);
            Collections.shuffle(shuffled);
            createVariant(exam, i, false, shuffled);
        }

        return toResponseDTO(exam);
    }

    /**
     * Helper: Tạo 1 variant (đề) với câu hỏi cho trước + tráo đáp án.
     */
    private ExamVariant createVariant(Exam exam, int variantOrder, boolean isOriginal, List<Question> questions) {
        ExamVariant variant = ExamVariant.builder()
                .exam(exam)
                .variantOrder(variantOrder)
                .isOriginal(isOriginal)
                .build();
        variant = examVariantRepository.save(variant);

        for (int q = 0; q < questions.size(); q++) {
            Question question = questions.get(q);

            // ===== Snapshot nội dung câu hỏi tại thời điểm tạo đề =====
            // Đóng băng nội dung + loại câu (trắc nhiều đáp án) để giáo viên sửa
            // ngân hàng câu hỏi sau này không làm thay đổi đề đang thi.
            long correctCount = question.getAnswers() == null ? 0L : question.getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
            boolean multiChoice = correctCount > 1;

            ExamVariantQuestion vq = ExamVariantQuestion.builder()
                    .variant(variant)
                    .question(question)
                    .orderIndex(q + 1)
                    .contentSnapshot(question.getContent())
                    .imageUrlSnapshot(question.getImageUrl())
                    .multiChoiceSnapshot(multiChoice)
                    .build();
            vq = examVariantQuestionRepository.save(vq);

            // Tráo đáp án
            List<Answer> answers = new ArrayList<>(question.getAnswers());
            if (!isOriginal) {
                Collections.shuffle(answers);
            }

            for (int a = 0; a < answers.size(); a++) {
                Answer answer = answers.get(a);
                ExamVariantAnswer va = ExamVariantAnswer.builder()
                        .variantQuestion(vq)
                        .answer(answer)
                        .orderIndex(a + 1)
                        // ===== Snapshot đáp án (nội dung + đáp án đúng) =====
                        .contentSnapshot(answer.getContent())
                        .imageUrlSnapshot(answer.getImageUrl())
                        .isCorrectSnapshot(Boolean.TRUE.equals(answer.getIsCorrect()))
                        .build();
                examVariantAnswerRepository.save(va);
            }
        }

        return variant;
    }

    /**
     * Cập nhật kỳ thi — không cho phép sửa nếu đang ONGOING hoặc COMPLETED.
     */
    @Transactional
    public ExamResponseDTO updateExam(Integer id, ExamRequestDTO request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + id));

        // Kiểm tra trạng thái — chỉ cho sửa khi UPCOMING
        String status = computeStatus(exam);
        if (!"UPCOMING".equals(status)) {
            throw new BadRequestException("Không thể sửa kỳ thi đang ở trạng thái: " + status);
        }

        // Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // Validate thời gian
        validateTimeRange(request.getStartTime(), request.getEndTime());

        // Cập nhật
        exam.setTitle(request.getTitle());
        exam.setSubject(subject);
        exam.setDuration(request.getDuration());
        exam.setTotalQuestions(request.getTotalQuestions());
        exam.setTotalVariants(request.getTotalVariants());
        exam.setMaxAttempts(resolveMaxAttempts(request));
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());

        Exam updated = examRepository.save(exam);
        return toResponseDTO(updated);
    }

    /**
     * Xoá kỳ thi — soft delete, chỉ khi UPCOMING.
     */
    @Transactional
    public void deleteExam(Integer id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + id));

        String status = computeStatus(exam);
        if (!"UPCOMING".equals(status)) {
            throw new BadRequestException("Không thể xoá kỳ thi đang ở trạng thái: " + status);
        }

        examRepository.delete(exam);
    }

    // ==================== Quản lý Thí sinh ====================

    /**
     * Thêm thí sinh vào kỳ thi.
     */
    @Transactional
    public void addParticipant(Integer examId, ExamParticipantDTO request) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + examId));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + request.getUserId()));

        if (user.getRole() != User.Role.STUDENT) {
            throw new BadRequestException("Chỉ có thể thêm user có role STUDENT vào kỳ thi.");
        }

        Optional<ExamParticipant> existingParticipant = participantRepository.findAnyByExamIdAndUserId(examId, request.getUserId());

        if (existingParticipant.isPresent()) {
            ExamParticipant participant = existingParticipant.get();
            if (Boolean.FALSE.equals(participant.getDeleted())) {
                throw new BadRequestException("User \"" + user.getName() + "\" đã được thêm vào kỳ thi này.");
            }

            participant.setDeleted(false);
            participantRepository.save(participant);
            return;
        }

        ExamParticipant participant = ExamParticipant.builder()
                .exam(exam)
                .user(user)
                .build();

        participantRepository.save(participant);
    }

    /**
     * Xóa thí sinh khỏi kỳ thi (soft delete).
     */
    @Transactional
    public void removeParticipant(Integer examId, Integer userId) {
        ExamParticipant participant = participantRepository.findByExamIdAndUserId(examId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Thí sinh không có trong kỳ thi này."));

        participantRepository.delete(participant); // Soft delete nhờ @SQLDelete
    }

    /**
     * Danh sách thí sinh của kỳ thi.
     */
    public List<UserResponseDTO> getParticipants(Integer examId) {
        examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + examId));

        return participantRepository.findByExamId(examId)
                .stream()
                .map(p -> UserResponseDTO.builder()
                        .id(p.getUser().getId())
                        .username(p.getUser().getUsername())
                        .name(p.getUser().getName())
                        .studentId(p.getUser().getStudentId())
                        .role(p.getUser().getRole().name())
                        .build())
                .collect(Collectors.toList());
    }

    // ==================== Helpers ====================

    private String computeStatus(Exam exam) {
        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() == null || now.isBefore(exam.getStartTime())) {
            return "UPCOMING";
        } else if (exam.getEndTime() == null || now.isAfter(exam.getEndTime())) {
            return "COMPLETED";
        } else {
            return "ONGOING";
        }
    }

    /**
     * Chuẩn hoá số lần thi tối đa — mặc định 1 lượt nếu không cấu hình.
     */
    private int resolveMaxAttempts(ExamRequestDTO request) {
        Integer maxAttempts = request.getMaxAttempts();
        if (maxAttempts == null) {
            return 1;
        }
        if (maxAttempts < 1) {
            throw new BadRequestException("Số lần thi tối đa phải lớn hơn 0.");
        }
        return maxAttempts;
    }

    /**
     * Đọc {@code max_attempts} từ entity — luôn trả về giá trị hợp lệ (>= 1).
     *
     * <p>Cần defensive vì dữ liệu cũ có thể có {@code max_attempts = 0}
     * (cột được thêm bằng {@code ALTER TABLE ... ADD COLUMN ... NOT NULL} mà
     * MySQL gán default 0 cho các dòng sẵn có). Giá trị 0 khiến mọi thí sinh
     * bị chặn ngay lập tức với thông báo "đã hết lượt thi".
     */
    public static int effectiveMaxAttempts(Exam exam) {
        Integer maxAttempts = exam == null ? null : exam.getMaxAttempts();
        return (maxAttempts == null || maxAttempts < 1) ? 1 : maxAttempts;
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {        if (startTime == null || endTime == null) {
            throw new BadRequestException("Thời gian bắt đầu và thời gian kết thúc không được để trống.");
        }
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Thời gian bắt đầu phải trước thời gian kết thúc.");
        }
    }

    private ExamResponseDTO toResponseDTO(Exam exam) {
        long participantCount = participantRepository.countByExamId(exam.getId());

        return ExamResponseDTO.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .subjectId(exam.getSubject().getId())
                .subjectName(exam.getSubject().getName())
                .duration(exam.getDuration())
                .totalQuestions(exam.getTotalQuestions())
                .totalVariants(exam.getTotalVariants())
                .maxAttempts(effectiveMaxAttempts(exam))
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .status(computeStatus(exam))
                .participantCount(participantCount)
                .build();
    }
}
