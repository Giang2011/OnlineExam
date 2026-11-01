package com.gr1.exam.module.exam.repository;

import com.gr1.exam.module.exam.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Integer> {
    List<Exam> findBySubjectId(Integer subjectId);
}
