package com.gr1.exam.module.session.repository;

import com.gr1.exam.module.session.entity.UserAnswerSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserAnswerSelectionRepository extends JpaRepository<UserAnswerSelection, Integer> {
}
