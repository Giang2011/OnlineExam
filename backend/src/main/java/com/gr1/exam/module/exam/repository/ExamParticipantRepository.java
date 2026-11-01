package com.gr1.exam.module.exam.repository;

import com.gr1.exam.module.exam.entity.ExamParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamParticipantRepository extends JpaRepository<ExamParticipant, Integer> {
    List<ExamParticipant> findByExamId(Integer examId);
    List<ExamParticipant> findByUserId(Integer userId);
    boolean existsByExamIdAndUserId(Integer examId, Integer userId);
    long countByExamId(Integer examId);
    Optional<ExamParticipant> findByExamIdAndUserId(Integer examId, Integer userId);

    @Query(value = "SELECT * FROM exam_participants ep WHERE ep.exam_id = :examId AND ep.user_id = :userId LIMIT 1", nativeQuery = true)
    Optional<ExamParticipant> findAnyByExamIdAndUserId(@Param("examId") Integer examId, @Param("userId") Integer userId);
}
