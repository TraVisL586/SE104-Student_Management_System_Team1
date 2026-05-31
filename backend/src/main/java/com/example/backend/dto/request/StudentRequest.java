package com.example.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class StudentRequest {
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;

    @Email(message = "Email is invalid")
    private String email;

    private String fullName;
    private String studentCode;
    private String phone;
    private LocalDate dateOfBirth;
    private String department;
    private String programCode;
    private String address;
    private Integer enrollmentYear;
    private Boolean isActive;
}
