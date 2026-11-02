package com.gr1.exam.module.paperexam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.external.vision.dto.VisionQuestionScanStatus;
import com.gr1.exam.external.vision.dto.VisionRecognizedAnswerDTO;
import com.gr1.exam.external.vision.dto.VisionScanResponseDTO;
import com.gr1.exam.external.vision.dto.VisionScanStatus;
import com.gr1.exam.external.vision.service.VisionScanFacadeService;
import com.gr1.exam.module.paperexam.dto.PaperExamScanQuestionResultDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamScanRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamScanResponseDTO;
import com.gr1.exam.module.paperexam.entity.PaperExam;
import com.gr1.exam.module.paperexam.entity.PaperExamAnswer;
import com.gr1.exam.module.paperexam.entity.PaperExamQuestion;
import com.gr1.exam.module.paperexam.entity.PaperExamScanResult;
import com.gr1.exam.module.paperexam.repository.PaperExamAnswerRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamQuestionRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamScanQuestionResultRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamScanResultRepository;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Test cho logic chấm phiếu OMR: exact-set-match, nhiều đáp án đúng, và ghép nhiều trang.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaperExamScanServiceTest {

    @Mock
    private PaperExamRepository paperExamRepository;
    @Mock
    private PaperExamQuestionRepository paperExamQuestionRepository;
    @Mock
    private PaperExamAnswerRepository paperExamAnswerRepository;
    @Mock
    private PaperExamScanResultRepository paperExamScanResultRepository;
    @Mock
    private PaperExamScanQuestionResultRepository paperExamScanQuestionResultRepository;
    @Mock
    private VisionScanFacadeService visionScanFacadeService;

    private PaperExamScanService service;
    private PaperExamOmrLayoutService omrLayoutService;

    private PaperExam paperExam;
    private List<PaperExamQuestion> questions;

    @BeforeEach
    void setUp() {
        paperExam = PaperExam.builder()
                .id(501)
                .title("Đề OMR")
                .totalQuestions(2)
                .omrLayout("{\"questions_per_page\":10}")
                .build();

        // Câu 1: 1 đáp án đúng (B). Câu 2: 2 đáp án đúng (A, C).
        questions = List.of(
                buildQuestion(1, 1, List.of(false, true, false)),
                buildQuestion(2, 2, List.of(true, false, true))
        );

        omrLayoutService = new PaperExamOmrLayoutService(
                paperExamQuestionRepository,
                paperExamAnswerRepository,
                new com.gr1.exam.external.vision.config.VisionProperties(),
                new ObjectMapper());

        service = new PaperExamScanService(
                paperExamRepository,
                paperExamQuestionRepository,
                paperExamScanResultRepository,
                paperExamScanQuestionResultRepository,
                visionScanFacadeService,
                omrLayoutService,
                new ObjectMapper());

        when(paperExamRepository.findById(501)).thenReturn(Optional.of(paperExam));
        when(paperExamQuestionRepository.findByPaperExamIdOrderByOrderIndexAsc(501)).thenReturn(questions);
        when(paperExamScanResultRepository.save(any(PaperExamScanResult.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paperExamScanQuestionResultRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // --- exact-set-match ----------------------------------------------------

    @Test
    void scan_shouldMarkCorrect_whenExactlyOneCorrectOptionSelected() {
        stubSinglePageResponse(answer(1, List.of("B"), 1, 0.95));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q1 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 1).findFirst().orElseThrow();
        assertThat(q1.getStatus()).isEqualTo(VisionQuestionScanStatus.CORRECT);
        assertThat(q1.getSelectedOptions()).containsExactly("B");
        assertThat(q1.getCorrectOptions()).containsExactly("B");
    }

    @Test
    void scan_shouldMarkWrong_whenWrongOptionSelected() {
        stubSinglePageResponse(answer(1, List.of("A"), 1, 0.95));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q1 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 1).findFirst().orElseThrow();
        assertThat(q1.getStatus()).isEqualTo(VisionQuestionScanStatus.WRONG);
    }

    @Test
    void scan_shouldMarkEmpty_whenNothingSelected() {
        stubSinglePageResponse(answer(1, List.of(), 0, 0.0));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q1 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 1).findFirst().orElseThrow();
        assertThat(q1.getStatus()).isEqualTo(VisionQuestionScanStatus.EMPTY);
        assertThat(q1.getIsEmpty()).isTrue();
    }

    @Test
    void scan_shouldMarkCorrect_whenBothCorrectOptionsSelectedOnMultiAnswerQuestion() {
        stubSinglePageResponse(answer(2, List.of("A", "C"), 2, 0.92));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q2 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 2).findFirst().orElseThrow();
        assertThat(q2.getStatus()).isEqualTo(VisionQuestionScanStatus.CORRECT);
        assertThat(q2.getSelectedOptions()).containsExactly("A", "C");
        assertThat(q2.getCorrectOptions()).containsExactly("A", "C");
    }

    @Test
    void scan_shouldMarkWrong_whenOnlyOneOfTwoCorrectOptionsSelected() {
        stubSinglePageResponse(answer(2, List.of("A"), 1, 0.92));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q2 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 2).findFirst().orElseThrow();
        assertThat(q2.getStatus()).isEqualTo(VisionQuestionScanStatus.WRONG);
    }

    @Test
    void scan_shouldMarkMultiMarked_onlyWhenQuestionHasSingleCorrectOption() {
        // Câu 1 chỉ có 1 đáp án đúng -> tô 2 ô là MULTI_MARKED
        stubSinglePageResponse(answer(1, List.of("A", "B"), 2, 0.9));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q1 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 1).findFirst().orElseThrow();
        assertThat(q1.getStatus()).isEqualTo(VisionQuestionScanStatus.MULTI_MARKED);
    }

    @Test
    void scan_shouldNotMarkMultiMarked_whenQuestionHasTwoCorrectOptions() {
        // Câu 2 có 2 đáp án đúng -> tô 3 ô (thừa) là WRONG, không phải MULTI_MARKED
        stubSinglePageResponse(answer(2, List.of("A", "B", "C"), 3, 0.9));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q2 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 2).findFirst().orElseThrow();
        assertThat(q2.getStatus()).isEqualTo(VisionQuestionScanStatus.WRONG);
    }

    @Test
    void scan_shouldMarkNeedsReview_whenEngineReportsAmbiguous() {
        stubSinglePageResponse(answer(1, List.of("B"), 1, 0.9, "AMBIGUOUS"));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q1 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 1).findFirst().orElseThrow();
        assertThat(q1.getStatus()).isEqualTo(VisionQuestionScanStatus.NEEDS_REVIEW);
    }

    @Test
    void scan_shouldMarkNeedsReview_whenConfidenceIsLow() {
        stubSinglePageResponse(answer(1, List.of("B"), 1, 0.2));

        PaperExamScanResponseDTO response = scan(1);

        PaperExamScanQuestionResultDTO q1 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 1).findFirst().orElseThrow();
        assertThat(q1.getStatus()).isEqualTo(VisionQuestionScanStatus.NEEDS_REVIEW);
    }

    // --- multi page ---------------------------------------------------------

    @Test
    void scan_shouldMergeTwoPages_byGlobalQuestionIndex() {
        // Trang 0 -> câu 1..2, trang 1 -> câu 3..4
        useFourQuestionExam();

        stubResponses(
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(0)
                        .studentId("S001")
                        .recognizedAnswers(List.of(answer(1, List.of("B"), 1, 0.95), answer(2, List.of("A"), 1, 0.95)))
                        .build(),
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(1)
                        .studentId("S001")
                        .recognizedAnswers(List.of(answer(3, List.of("B"), 1, 0.95), answer(4, List.of("A"), 1, 0.95)))
                        .build());

        PaperExamScanResponseDTO response = scan(2);

        assertThat(response.getQuestionResults()).hasSize(4);
        assertThat(response.getQuestionResults().stream().map(PaperExamScanQuestionResultDTO::getQuestionIndex))
                .containsExactly(1, 2, 3, 4);
        assertThat(response.getQuestionResults()).allMatch(r -> r.getStatus() == VisionQuestionScanStatus.CORRECT);
        assertThat(response.getTotalCorrect()).isEqualTo(4);
        assertThat(response.getStudentId()).isEqualTo("S001");
    }

    @Test
    void scan_shouldMarkEmptyAndFlag_whenOnePageMissing() {
        useFourQuestionExam();

        // Chỉ trang 0 được gửi -> câu 3, 4 không đọc được
        stubResponses(VisionScanResponseDTO.builder()
                .status(VisionScanStatus.SUCCESS)
                .pageIndex(0)
                .studentId("S001")
                .recognizedAnswers(List.of(answer(1, List.of("B"), 1, 0.95), answer(2, List.of("A"), 1, 0.95)))
                .build());

        PaperExamScanResponseDTO response = scan(1);

        assertThat(response.getQuestionResults()).hasSize(4);
        PaperExamScanQuestionResultDTO q3 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 3).findFirst().orElseThrow();
        PaperExamScanQuestionResultDTO q4 = response.getQuestionResults().stream()
                .filter(r -> r.getQuestionIndex() == 4).findFirst().orElseThrow();
        assertThat(q3.getStatus()).isEqualTo(VisionQuestionScanStatus.EMPTY);
        assertThat(q4.getStatus()).isEqualTo(VisionQuestionScanStatus.EMPTY);
        assertThat(response.getTotalEmpty()).isEqualTo(2);
    }

    @Test
    void scan_shouldFlagNeedsReview_whenTwoPagesShareTheSameQuestionIndex() {
        stubResponses(
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(0)
                        .studentId("S001")
                        .recognizedAnswers(List.of(answer(1, List.of("B"), 1, 0.95)))
                        .build(),
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(1)
                        .studentId("S001")
                        .recognizedAnswers(List.of(answer(1, List.of("A"), 1, 0.95)))
                        .build());

        PaperExamScanResponseDTO response = scan(2);

        assertThat(response.getStatus()).isEqualTo(VisionScanStatus.NEEDS_REVIEW);
    }

    @Test
    void scan_shouldWarn_whenPagesBelongToDifferentStudents() {
        stubResponses(
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(0)
                        .studentId("S001")
                        .recognizedAnswers(List.of(answer(1, List.of("B"), 1, 0.95)))
                        .build(),
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(1)
                        .studentId("S002")
                        .recognizedAnswers(List.of(answer(2, List.of("A"), 1, 0.95)))
                        .build());

        PaperExamScanResponseDTO response = scan(2);

        assertThat(response.getStatus()).isEqualTo(VisionScanStatus.NEEDS_REVIEW);
        assertThat(response.getErrors()).anyMatch(err -> err.contains("S002"));
    }

    @Test
    void scan_shouldMarkInvalidImage_whenExamIdInQrDoesNotMatch() {
        stubResponses(
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(0)
                        .examId("EXAM-999")
                        .studentId("S001")
                        .recognizedAnswers(List.of(answer(1, List.of("B"), 1, 0.95)))
                        .build(),
                VisionScanResponseDTO.builder()
                        .status(VisionScanStatus.SUCCESS)
                        .pageIndex(1)
                        .examId("EXAM-888")
                        .studentId("S001")
                        .recognizedAnswers(List.of(answer(2, List.of("A"), 1, 0.95)))
                        .build());

        PaperExamScanResponseDTO response = scan(2);

        assertThat(response.getStatus()).isEqualTo(VisionScanStatus.INVALID_IMAGE);
    }

    @Test
    void scan_shouldReject_whenNoImageProvided() {
        PaperExamScanRequestDTO request = new PaperExamScanRequestDTO();
        request.setActualQuestionCount(2);

        assertThatThrownBy(() -> service.scanPaperExam(501, new MultipartFile[0], request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ảnh scan không được để trống");
    }

    // --- helpers ------------------------------------------------------------

    /** Đổi đề sang 4 câu, 2 câu mỗi trang (2 trang phiếu). */
    private void useFourQuestionExam() {
        paperExam = PaperExam.builder()
                .id(501).title("Đề OMR").totalQuestions(4)
                .omrLayout("{\"questions_per_page\":2}")
                .build();
        when(paperExamRepository.findById(501)).thenReturn(Optional.of(paperExam));

        List<PaperExamQuestion> questions4 = List.of(
                buildQuestion(1, 1, List.of(false, true)),
                buildQuestion(2, 2, List.of(true, false)),
                buildQuestion(3, 3, List.of(false, true)),
                buildQuestion(4, 4, List.of(true, false))
        );
        when(paperExamQuestionRepository.findByPaperExamIdOrderByOrderIndexAsc(501)).thenReturn(questions4);
    }

    private PaperExamScanResponseDTO scan(int imageCount) {
        MultipartFile[] images = new MultipartFile[imageCount];
        for (int i = 0; i < imageCount; i++) {
            images[i] = new MockMultipartFile("images", "page" + (i + 1) + ".png", "image/png", new byte[]{1, 2, 3});
        }
        PaperExamScanRequestDTO request = new PaperExamScanRequestDTO();
        request.setActualQuestionCount(paperExam.getTotalQuestions());
        return service.scanPaperExam(501, images, request);
    }

    private void stubSinglePageResponse(VisionRecognizedAnswerDTO... answers) {
        stubResponses(VisionScanResponseDTO.builder()
                .status(VisionScanStatus.SUCCESS)
                .pageIndex(0)
                .studentId("S001")
                .recognizedAnswers(List.of(answers))
                .build());
    }

    private void stubResponses(VisionScanResponseDTO... responses) {
        List<VisionScanResponseDTO> queue = new ArrayList<>(List.of(responses));
        when(visionScanFacadeService.scanPaperExam(any())).thenAnswer(inv -> {
            if (queue.isEmpty()) {
                return responses[responses.length - 1];
            }
            return queue.remove(0);
        });
    }

    private VisionRecognizedAnswerDTO answer(int questionIndex, List<String> selected, int markedCount, double confidence) {
        return answer(questionIndex, selected, markedCount, confidence, "READ");
    }

    private VisionRecognizedAnswerDTO answer(int questionIndex, List<String> selected, int markedCount,
                                             double confidence, String status) {
        return VisionRecognizedAnswerDTO.builder()
                .questionIndex(questionIndex)
                .selectedOptions(selected)
                .isEmpty(selected.isEmpty())
                .markedCount(markedCount)
                .confidence(confidence)
                .status(status)
                .fillRatios(List.of())
                .build();
    }

    /**
     * Tạo một câu trong đề với `correctFlags` mô tả đáp án nào đúng (theo thứ tự A, B, C...).
     */
    private PaperExamQuestion buildQuestion(int orderIndex, int id, List<Boolean> correctFlags) {
        Subject subject = Subject.builder().id(1).name("Toán").build();
        Chapter chapter = Chapter.builder().id(11).name("Chương 1").subject(subject).build();

        List<Answer> answers = new ArrayList<>();
        List<PaperExamAnswer> snapshots = new ArrayList<>();
        for (int i = 0; i < correctFlags.size(); i++) {
            Answer answer = Answer.builder()
                    .id(id * 100 + i)
                    .content("Đáp án " + i)
                    .isCorrect(correctFlags.get(i))
                    .build();
            answers.add(answer);
            snapshots.add(PaperExamAnswer.builder()
                    .id(id * 1000 + i)
                    .answer(answer)
                    .orderIndex(i)
                    .build());
        }

        Question question = Question.builder()
                .id(id).content("Câu " + orderIndex).chapter(chapter).subject(subject)
                .answers(answers)
                .build();

        PaperExamQuestion paperExamQuestion = PaperExamQuestion.builder()
                .id(id * 10)
                .paperExam(paperExam)
                .question(question)
                .chapter(chapter)
                .orderIndex(orderIndex)
                .answers(snapshots)
                .build();

        // repository trả về snapshot đáp án của câu này
        when(paperExamAnswerRepository.findByPaperExamQuestionId(id * 10)).thenReturn(snapshots);

        return paperExamQuestion;
    }
}
