package com.gr1.exam.module.exam.repository;

import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamVariantQuestionRepository extends JpaRepository<ExamVariantQuestion, Integer> {
    List<ExamVariantQuestion> findByVariantIdOrderByOrderIndex(Integer variantId);
}
