package com.gr1.exam.module.paperexam.repository;

import com.gr1.exam.module.paperexam.entity.PaperExamAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperExamAnswerRepository extends JpaRepository<PaperExamAnswer, Integer> {
    List<PaperExamAnswer> findByPaperExamQuestionId(Integer paperExamQuestionId);
}
