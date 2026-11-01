package com.gr1.exam.module.paperexam.repository;

import com.gr1.exam.module.paperexam.entity.PaperExamScanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperExamScanResultRepository extends JpaRepository<PaperExamScanResult, Integer> {
    List<PaperExamScanResult> findByPaperExamIdOrderByCreatedAtDesc(Integer paperExamId);
}
