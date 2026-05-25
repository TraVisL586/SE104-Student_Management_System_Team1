package com.example.backend.dto.response;

import com.example.backend.constant.CourseSectionStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CourseSectionResponse {
    private Integer id;
    private String code;

    private Integer courseId;
    private String courseCode;
    private String courseName;
    private Integer credits;
    private Integer periodsPerSession;

    private Integer lecturerId;
    private String lecturerCode;
    private String lecturerName;

    private Integer semesterId;
    private String semesterCode;
    private String semesterName;

    private Integer capacity;
    private Integer enrolledCount;
    private Integer availableSeats;
    private CourseSectionStatus status;
    private List<CourseSectionScheduleResponse> schedules;
    private LocalDateTime createdAt;
}
