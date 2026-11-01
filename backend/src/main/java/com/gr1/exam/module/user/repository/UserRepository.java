package com.gr1.exam.module.user.repository;

import com.gr1.exam.module.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByStudentId(String studentId);
    List<User> findByRole(User.Role role);
    List<User> findByRoleIn(List<User.Role> roles);
}
