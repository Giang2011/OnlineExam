package com.gr1.exam.module.session.repository;

import com.gr1.exam.module.session.entity.ExamSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, Integer> {
    List<ExamSession> findByUserId(Integer userId);
    List<ExamSession> findByExamId(Integer examId);
    Optional<ExamSession> findByExamIdAndUserId(Integer examId, Integer userId);
    Optional<ExamSession> findByExamIdAndUserIdAndStatus(Integer examId, Integer userId, ExamSession.Status status);
    boolean existsByExamIdAndUserIdAndStatus(Integer examId, Integer userId, ExamSession.Status status);

    /**
     * Đếm số lượt thi đã kết thúc (SUBMITTED) — dùng để kiểm tra maxAttempts.
     */
    long countByExamIdAndUserIdAndStatus(Integer examId, Integer userId, ExamSession.Status status);

    /**
     * Phiên DOING bất kỳ của user (dùng cho GET /sessions/active).
     */
    @Query("SELECT s FROM ExamSession s WHERE s.user.id = :userId AND s.status = :status "
            + "ORDER BY s.startTime DESC")
    List<ExamSession> findDoingSessionsByUserId(@Param("userId") Integer userId,
            @Param("status") ExamSession.Status status);

    /**
     * Các phiên DOING đã quá hạn (deadline_at + grace < now) — dùng cho scheduler tự nộp.
     */
    @Query("SELECT s FROM ExamSession s WHERE s.status = :status "
            + "AND s.deadlineAt IS NOT NULL AND s.deadlineAt < :cutoff "
            + "ORDER BY s.deadlineAt ASC")
    List<ExamSession> findExpiredDoingSessions(@Param("status") ExamSession.Status status,
            @Param("cutoff") LocalDateTime cutoff);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ExamSession s WHERE s.id = :sessionId AND s.user.id = :userId")
    Optional<ExamSession> findByIdAndUserIdForUpdate(@Param("sessionId") Integer sessionId,
            @Param("userId") Integer userId);
}
