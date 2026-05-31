package com.example.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class CourseSectionScheduleResponse {
    private Integer id;
    private Integer roomId;
    private String roomCode;
    private String roomName;
    private String building;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer startPeriod;
    private Integer endPeriod;
    private Integer periodsPerSession;
}
