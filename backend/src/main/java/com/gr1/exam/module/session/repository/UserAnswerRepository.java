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
}
