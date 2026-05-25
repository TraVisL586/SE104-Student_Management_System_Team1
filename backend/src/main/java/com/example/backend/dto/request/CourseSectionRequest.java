package com.example.backend.dto.request;

import com.example.backend.constant.CourseSectionStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseSectionRequest {

    @NotBlank(message = "Course section code is required")
    @Size(max = 50, message = "Course section code must not exceed 50 characters")
    private String code;

    @NotNull(message = "Course id is required")
    private Integer courseId;

    @NotNull(message = "Lecturer id is required")
    private Integer lecturerId;

    @NotNull(message = "Semester id is required")
    private Integer semesterId;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @Min(value = 1, message = "Periods per session must be at least 1")
    private Integer periodsPerSession;

    private CourseSectionStatus status;
}
