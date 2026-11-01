package com.gr1.exam.module.exam.repository;

import com.gr1.exam.module.exam.entity.ExamChapterConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamChapterConfigRepository extends JpaRepository<ExamChapterConfig, Integer> {
    List<ExamChapterConfig> findByExamId(Integer examId);
    void deleteByExamId(Integer examId);
}
