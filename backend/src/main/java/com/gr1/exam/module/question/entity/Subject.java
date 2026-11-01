package com.gr1.exam.module.question.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.util.List;

/**
 * Entity: Môn học.
 * Mapping: bảng `subjects`
 */
@Entity
@Table(name = "subjects")
@SQLDelete(sql = "UPDATE subjects SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Chapter> chapters;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
