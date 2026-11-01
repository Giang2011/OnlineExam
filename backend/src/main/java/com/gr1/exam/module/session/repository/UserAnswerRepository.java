package com.gr1.exam.module.session.repository;

import com.gr1.exam.module.session.entity.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Integer> {
    List<UserAnswer> findByExamSessionId(Integer examSessionId);

    Optional<UserAnswer> findByVariantQuestionId(Integer variantQuestionId);

    /**
     * Đáp án của 1 câu trong đúng 1 phiên thi — dùng cho autosave (tránh lẫn giữa các lượt thi).
     */
    Optional<UserAnswer> findFirstByExamSessionIdAndVariantQuestionId(Integer examSessionId, Integer variantQuestionId);
}
