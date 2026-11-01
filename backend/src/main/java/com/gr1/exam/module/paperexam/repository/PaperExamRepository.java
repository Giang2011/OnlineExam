package com.gr1.exam.module.paperexam.repository;

import com.gr1.exam.module.paperexam.entity.PaperExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperExamRepository extends JpaRepository<PaperExam, Integer> {
    List<PaperExam> findBySubjectId(Integer subjectId);
}
