package com.example.backend.entity;

import com.example.backend.constant.CourseSectionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "lecturer_id", nullable = false)
    private Lecturer lecturer;

    @ManyToOne
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "periods_per_session", nullable = false)
    private Integer periodsPerSession = 1;

    @Column(name = "enrolled_count", nullable = false)
    private Integer enrolledCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseSectionStatus status = CourseSectionStatus.DRAFT;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
