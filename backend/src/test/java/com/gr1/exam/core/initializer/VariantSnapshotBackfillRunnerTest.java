package com.gr1.exam.core.initializer;

import com.gr1.exam.module.exam.entity.ExamVariant;
import com.gr1.exam.module.exam.entity.ExamVariantAnswer;
import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import com.gr1.exam.module.exam.repository.ExamVariantAnswerRepository;
import com.gr1.exam.module.exam.repository.ExamVariantQuestionRepository;
import com.gr1.exam.module.exam.repository.ExamVariantRepository;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Question;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;

import java.sql.ResultSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regression test cho {@link VariantSnapshotBackfillRunner}.
 *
 * <p>Bug gốc: runner dùng repository JPA để đọc câu hỏi/đáp án, nhưng entity có
 * {@code @Where(clause = "deleted = false")} nên đáp án đã soft-delete không resolve được
 * → ném {@code Unable to find ... Answer with id N} và cả lượt backfill bị bỏ qua.
 * Sửa: đọc bằng JDBC thuần nên vẫn snapshot được dữ liệu đã soft-delete.
 */
@ExtendWith(MockitoExtension.class)
class VariantSnapshotBackfillRunnerTest {

    @Mock
    private ExamVariantRepository examVariantRepository;
    @Mock
    private ExamVariantQuestionRepository examVariantQuestionRepository;
    @Mock
    private ExamVariantAnswerRepository examVariantAnswerRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private ResultSet questionRs;
    @Mock
    private ResultSet answerRs;

    private VariantSnapshotBackfillRunner runner;

    @BeforeEach
    void setUp() {
        runner = new VariantSnapshotBackfillRunner(
                examVariantRepository, examVariantQuestionRepository,
                examVariantAnswerRepository, jdbcTemplate);
    }

    /**
     * Trả lời cho câu hỏi id=21 (content "Q1") và đáp án id=31 (content "A", isCorrect=true).
     */
    /**
     * Trả lời cho câu hỏi id=21 (content "Q1") và đáp án id=31 (content "A", isCorrect=true).
     *
     * <p>Hai lệnh SQL đều đi qua cùng overload {@code query(String, RowCallbackHandler)}
     * nên stub chung một lần và rẽ nhánh theo nội dung SQL.
     */
    private void stubJdbc() throws Exception {
        when(questionRs.getInt("id")).thenReturn(21);
        when(questionRs.getString("content")).thenReturn("Q1");
        when(questionRs.getString("image_url")).thenReturn("/img/q1.png");

        when(answerRs.getInt("id")).thenReturn(31);
        when(answerRs.getInt("question_id")).thenReturn(21);
        when(answerRs.getString("content")).thenReturn("A");
        when(answerRs.getString("image_url")).thenReturn("/img/a1.png");
        when(answerRs.getBoolean("is_correct")).thenReturn(true);

        doAnswer(inv -> {
            String sql = (String) inv.getArgument(0);
            RowCallbackHandler handler = (RowCallbackHandler) inv.getArgument(1);
            if (sql != null && sql.contains("FROM questions")) {
                handler.processRow(questionRs);
            } else if (sql != null && sql.contains("FROM answers")) {
                handler.processRow(answerRs);
            }
            return null;
        }).when(jdbcTemplate).query(anyString(), any(RowCallbackHandler.class));
    }

    @Test
    void backfill_shouldSnapshotAnswers_readViaJdbc_evenWhenEntityIsSoftDeleted() throws Exception {
        stubJdbc();

        ExamVariant variant = ExamVariant.builder().id(100).variantOrder(0).isOriginal(true).build();
        Question question = Question.builder().id(21).content("Q1").build();
        Answer answer = Answer.builder().id(31).question(question).content("A").isCorrect(true).build();

        ExamVariantQuestion vq = ExamVariantQuestion.builder()
                .id(201).variant(variant).question(question).orderIndex(1).build();
        ExamVariantAnswer va = ExamVariantAnswer.builder()
                .id(301).variantQuestion(vq).answer(answer).orderIndex(1).build();

        when(examVariantRepository.findAll()).thenReturn(List.of(variant));
        when(examVariantQuestionRepository.findByVariantIdOrderByOrderIndex(100)).thenReturn(List.of(vq));
        when(examVariantAnswerRepository.findByVariantQuestionIdOrderByOrderIndex(201)).thenReturn(List.of(va));

        runner.backfill();

        ArgumentCaptor<ExamVariantQuestion> qCaptor = ArgumentCaptor.forClass(ExamVariantQuestion.class);
        verify(examVariantQuestionRepository).save(qCaptor.capture());
        assertThat(qCaptor.getValue().getContentSnapshot()).isEqualTo("Q1");
        assertThat(qCaptor.getValue().getImageUrlSnapshot()).isEqualTo("/img/q1.png");
        // Chỉ 1 đáp án đúng → multiChoice = false
        assertThat(qCaptor.getValue().getMultiChoiceSnapshot()).isFalse();

        ArgumentCaptor<ExamVariantAnswer> aCaptor = ArgumentCaptor.forClass(ExamVariantAnswer.class);
        verify(examVariantAnswerRepository).save(aCaptor.capture());
        assertThat(aCaptor.getValue().getContentSnapshot()).isEqualTo("A");
        assertThat(aCaptor.getValue().getIsCorrectSnapshot()).isTrue();
    }

    @Test
    void backfill_shouldNotTouchRows_thatAlreadyHaveSnapshot() throws Exception {
        stubJdbc();

        ExamVariant variant = ExamVariant.builder().id(100).variantOrder(0).isOriginal(true).build();
        Question question = Question.builder().id(21).content("Q1").build();
        Answer answer = Answer.builder().id(31).question(question).content("A").isCorrect(true).build();

        ExamVariantQuestion vq = ExamVariantQuestion.builder()
                .id(201).variant(variant).question(question).orderIndex(1)
                .contentSnapshot("Đã có snapshot")
                .multiChoiceSnapshot(true)
                .build();
        ExamVariantAnswer va = ExamVariantAnswer.builder()
                .id(301).variantQuestion(vq).answer(answer).orderIndex(1)
                .contentSnapshot("Đã có snapshot")
                .isCorrectSnapshot(false)
                .build();

        when(examVariantRepository.findAll()).thenReturn(List.of(variant));
        when(examVariantQuestionRepository.findByVariantIdOrderByOrderIndex(100)).thenReturn(List.of(vq));
        when(examVariantAnswerRepository.findByVariantQuestionIdOrderByOrderIndex(201)).thenReturn(List.of(va));

        runner.backfill();

        verify(examVariantQuestionRepository, never()).save(any());
        verify(examVariantAnswerRepository, never()).save(any());
    }
}
