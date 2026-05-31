package com.example.backend.dto.response;

import com.example.backend.constant.EnrollmentStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RosterStudentResponse {
    private Integer studentId;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String programCode;
    private String address;
    private Integer enrollmentYear;
    private EnrollmentStatus enrollmentStatus;
}
