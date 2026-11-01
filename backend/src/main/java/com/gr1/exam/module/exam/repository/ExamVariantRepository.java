package com.gr1.exam.module.exam.repository;

import com.gr1.exam.module.exam.entity.ExamVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamVariantRepository extends JpaRepository<ExamVariant, Integer> {
    List<ExamVariant> findByExamId(Integer examId);
    long countByExamId(Integer examId);
}
