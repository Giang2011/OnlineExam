package com.gr1.exam.module.question.repository;

import com.gr1.exam.module.question.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Integer> {
    List<Answer> findByQuestionId(Integer questionId);

    List<Answer> findByQuestionIdInAndIsCorrectTrue(List<Integer> questionIds);
}
