package com.gr1.exam.module.grading.repository;

import com.gr1.exam.module.grading.entity.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResultRepository extends JpaRepository<Result, Integer> {
    Optional<Result> findByExamSessionId(Integer examSessionId);
    List<Result> findByExamSessionExamId(Integer examId);
    List<Result> findByExamSessionUserId(Integer userId);
}
