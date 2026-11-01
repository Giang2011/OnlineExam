package com.gr1.exam.module.question.repository;

import com.gr1.exam.module.question.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {

    List<Question> findBySubjectId(Integer subjectId);

    long countBySubjectId(Integer subjectId);

    List<Question> findBySubjectIdAndChapterId(Integer subjectId, Integer chapterId);

    @Query("""
            select count(q)
            from Question q
            where q.subject.id = :subjectId
              and q.chapter.id = :chapterId
    """)
    long countBySubjectIdAndChapterId(@Param("subjectId") Integer subjectId, @Param("chapterId") Integer chapterId);

    // Chapter-based queries
    List<Question> findByChapterId(Integer chapterId);

    long countByChapterId(Integer chapterId);

    // Pagination + filtering
    Page<Question> findBySubjectId(Integer subjectId, Pageable pageable);

    Page<Question> findByChapterId(Integer chapterId, Pageable pageable);

    Page<Question> findBySubjectIdAndChapterId(Integer subjectId, Integer chapterId, Pageable pageable);

    Page<Question> findByChapterIdAndContentContainingIgnoreCase(Integer chapterId, String keyword, Pageable pageable);

    Page<Question> findBySubjectIdAndChapterIdAndContentContainingIgnoreCase(
            Integer subjectId,
            Integer chapterId,
            String keyword,
            Pageable pageable
    );

    Page<Question> findByContentContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Question> findBySubjectIdAndContentContainingIgnoreCase(Integer subjectId, String keyword, Pageable pageable);
}
