package com.example.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class TimetableEntryResponse {
    private Integer courseSectionId;
    private String courseSectionCode;

    private Integer courseId;
    private String courseCode;
    private String courseName;
    private Integer credits;

    private Integer semesterId;
    private String semesterCode;
    private String semesterName;

    private Integer enrolledCount;
    private Integer periodsPerSession;

    private Integer lecturerId;
    private String lecturerCode;
    private String lecturerName;

    private Integer roomId;
    private String roomCode;
    private String roomName;
    private String building;

    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
}
