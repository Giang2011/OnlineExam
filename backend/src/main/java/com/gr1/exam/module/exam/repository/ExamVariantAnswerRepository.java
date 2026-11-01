package com.gr1.exam.module.exam.repository;

import com.gr1.exam.module.exam.entity.ExamVariantAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamVariantAnswerRepository extends JpaRepository<ExamVariantAnswer, Integer> {
    List<ExamVariantAnswer> findByVariantQuestionIdOrderByOrderIndex(Integer variantQuestionId);
    List<ExamVariantAnswer> findByIdIn(List<Integer> ids);
}
