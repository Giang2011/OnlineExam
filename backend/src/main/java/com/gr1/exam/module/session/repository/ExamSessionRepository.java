package com.gr1.exam.module.session.repository;

import com.gr1.exam.module.session.entity.ExamSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, Integer> {
    List<ExamSession> findByUserId(Integer userId);
    List<ExamSession> findByExamId(Integer examId);
    Optional<ExamSession> findByExamIdAndUserId(Integer examId, Integer userId);
    Optional<ExamSession> findByExamIdAndUserIdAndStatus(Integer examId, Integer userId, ExamSession.Status status);
    boolean existsByExamIdAndUserIdAndStatus(Integer examId, Integer userId, ExamSession.Status status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ExamSession s WHERE s.id = :sessionId AND s.user.id = :userId")
    Optional<ExamSession> findByIdAndUserIdForUpdate(@Param("sessionId") Integer sessionId,
            @Param("userId") Integer userId);
}
