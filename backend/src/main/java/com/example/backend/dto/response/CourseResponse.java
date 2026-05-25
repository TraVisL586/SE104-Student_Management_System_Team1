package com.example.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CourseResponse {
    private Integer id;
    private String code;
    private String name;
    private Integer credits;
    private Integer periodsPerSession;
    private String description;
    private Boolean isActive;
    private Integer departmentId;
    private String departmentCode;
    private String departmentName;
    private List<CourseResponse> prerequisites;
    private LocalDateTime createdAt;
}
