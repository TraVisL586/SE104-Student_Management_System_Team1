package com.example.backend.dto.response;

import com.example.backend.constant.StudentAcademicStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdvisorStudentResponse {
    private Integer advisorId;
    private String advisorCode;
    private String advisorName;
    private Integer studentId;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String programCode;
    private String address;
    private Integer enrollmentYear;
    private StudentAcademicStatus academicStatus;
    private LocalDateTime assignedAt;
}
