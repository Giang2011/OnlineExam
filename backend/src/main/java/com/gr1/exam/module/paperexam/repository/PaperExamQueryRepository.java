package com.gr1.exam.module.paperexam.repository;

import com.gr1.exam.module.question.entity.Question;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaperExamQueryRepository extends org.springframework.data.repository.Repository<Question, Integer> {

    @Query("""
        select q
        from Question q
        join q.chapter c
        where c.id = :chapterId
          and q.subject.id = :subjectId
        order by q.id
    """)
    List<Question> findRandomableQuestionsBySubjectAndChapter(
        @Param("subjectId") Integer subjectId,
        @Param("chapterId") Integer chapterId
    );
}
