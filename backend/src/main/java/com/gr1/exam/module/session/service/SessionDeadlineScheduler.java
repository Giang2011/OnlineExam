package com.gr1.exam.module.session.service;

import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler tự nộp bài khi phiên thi quá hạn.
 *
 * <p>Đảm bảo hết giờ luôn được xử lý ở phía server, không phụ thuộc frontend.
 * Bổ sung cho cơ chế "lazy check" trong service (mọi request chạm phiên đều kiểm tra hạn chót).
 *
 * <p><b>Quan trọng:</b> method phải chạy trong transaction để các lazy proxy
 * ({@code session.getExam().getDuration()}) được khởi tạo hợp lệ — nếu không sẽ
 * ném {@code LazyInitializationException} mỗi 15 giây.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionDeadlineScheduler {

    private final ExamSessionRepository examSessionRepository;
    private final ExamSessionService examSessionService;

    /**
     * Quét mỗi 15 giây (mặc định) — quét phiên DOING đã quá deadline + grace.
     */
    @Scheduled(fixedDelayString = "${app.session.deadline-scan-interval-ms:15000}",
            initialDelayString = "${app.session.deadline-scan-interval-ms:15000}")
    @Transactional
    public void autoSubmitExpiredSessions() {
        // Ứng viên: phiên đã qua deadline. Cửa sổ gia hạn (grace) được kiểm tra chính xác
        // trong ExamSessionService.isExpired() vì grace phụ thuộc thời lượng từng kỳ thi.
        List<ExamSession> candidates = examSessionRepository.findExpiredDoingSessions(
                ExamSession.Status.DOING, LocalDateTime.now());
        if (candidates.isEmpty()) {
            return;
        }

        List<ExamSession> expired = candidates.stream()
                .filter(examSessionService::isExpired)
                .toList();
        if (expired.isEmpty()) {
            return;
        }

        log.info("[SessionDeadlineScheduler] Tìm thấy {} phiên quá hạn — tự nộp bài.", expired.size());
        for (ExamSession session : expired) {
            try {
                autoSubmitOne(session);
            } catch (Exception e) {
                log.error("[SessionDeadlineScheduler] Lỗi khi tự nộp phiên {}: {}",
                        session.getId(), e.getMessage(), e);
            }
        }
    }

    /**
     * Tự nộp một phiên đã quá hạn bằng draft đã autosave.
     *
     * <p>Gọi trực tiếp (không self-invocation qua proxy) vì đang ở trong transaction
     * của {@link #autoSubmitExpiredSessions()}.
     */
    private void autoSubmitOne(ExamSession session) {
        if (session.getStatus() == ExamSession.Status.SUBMITTED) {
            return;
        }
        examSessionService.autoSubmit(session, ExamSession.SubmitSource.TIMEOUT);
        log.info("[SessionDeadlineScheduler] Đã tự nộp phiên {} (user={}, exam={}).",
                session.getId(), session.getUser().getId(), session.getExam().getId());
    }
}
