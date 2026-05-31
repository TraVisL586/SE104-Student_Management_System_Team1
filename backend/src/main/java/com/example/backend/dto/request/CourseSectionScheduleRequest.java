package com.example.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class CourseSectionScheduleRequest {

    @NotNull(message = "Room id is required")
    private Integer roomId;

    @NotNull(message = "Day of week is required")
    @Min(value = 1, message = "Day of week must be between 1 and 7")
    @Max(value = 7, message = "Day of week must be between 1 and 7")
    private Integer dayOfWeek;

    private LocalTime startTime;

    private LocalTime endTime;

    @Min(value = 1, message = "Start period must be between 1 and 10")
    @Max(value = 10, message = "Start period must be between 1 and 10")
    private Integer startPeriod;

    @Min(value = 1, message = "End period must be between 1 and 10")
    @Max(value = 10, message = "End period must be between 1 and 10")
    private Integer endPeriod;
}
