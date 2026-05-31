package com.example.backend.dto.response;

import com.example.backend.constant.StudentAcademicStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class StudentResponse {
    private Integer id;
    private String studentCode;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String department;
    private String programCode;
    private String address;
    private Integer enrollmentYear;
    private StudentAcademicStatus academicStatus;
    private LocalDateTime createdAt;

    private String username;
    private Boolean isActive;
}
