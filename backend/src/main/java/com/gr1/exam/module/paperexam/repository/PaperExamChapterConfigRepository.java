package com.gr1.exam.module.paperexam.repository;

import com.gr1.exam.module.paperexam.entity.PaperExamChapterConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperExamChapterConfigRepository extends JpaRepository<PaperExamChapterConfig, Integer> {
    List<PaperExamChapterConfig> findByPaperExamId(Integer paperExamId);
}
