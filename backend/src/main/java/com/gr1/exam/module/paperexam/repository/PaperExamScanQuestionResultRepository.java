package com.gr1.exam.module.paperexam.repository;

import com.gr1.exam.module.paperexam.entity.PaperExamScanQuestionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaperExamScanQuestionResultRepository extends JpaRepository<PaperExamScanQuestionResult, Integer> {
}
