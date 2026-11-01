package com.gr1.exam.module.session.repository;

import com.gr1.exam.module.session.entity.UserAnswerSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAnswerSelectionRepository extends JpaRepository<UserAnswerSelection, Integer> {

    /**
     * Xoá các lựa chọn cũ của một câu trước khi insert lại.
     *
     * <p>Cần DELETE tường minh (không dùng {@code collection.clear()}) vì Hibernate
     * sẽ ghi DELETE lúc flush — tức là sau các INSERT — gây vi phạm unique constraint
     * {@code (user_answer_id, selected_answer_id)}.
     */
    @Modifying
    @Query("DELETE FROM UserAnswerSelection s WHERE s.userAnswer.id = :userAnswerId")
    void deleteByUserAnswerId(@Param("userAnswerId") Integer userAnswerId);
}
