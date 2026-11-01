package com.gr1.exam.module.paperexam.repository;

import com.gr1.exam.module.paperexam.entity.PaperExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperExamQuestionRepository extends JpaRepository<PaperExamQuestion, Integer> {
    List<PaperExamQuestion> findByPaperExamId(Integer paperExamId);

    List<PaperExamQuestion> findByPaperExamIdOrderByOrderIndexAsc(Integer paperExamId);
}
