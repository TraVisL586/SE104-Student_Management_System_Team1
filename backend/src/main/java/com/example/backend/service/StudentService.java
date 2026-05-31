package com.example.backend.service;

import com.example.backend.constant.RoleName;
import com.example.backend.dto.request.ChangePasswordRequest;
import com.example.backend.dto.request.StudentRequest;
import com.example.backend.dto.response.StudentResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.Student;
import com.example.backend.entity.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.constant.StudentAcademicStatus;
import com.example.backend.dto.request.StudentAcademicStatusRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        validateRequired(request.getUsername(), "Username is required");
        validateRequired(request.getPassword(), "Password is required");
        validateRequired(request.getEmail(), "Email is required");
        validateRequired(request.getFullName(), "Full name is required");
        validateRequired(request.getStudentCode(), "Student code is required");

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (studentRepository.existsByStudentCode(request.getStudentCode())) {
            throw new RuntimeException("Student code already exists");
        }

        Role studentRole = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new RuntimeException("Role STUDENT does not exist"));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        user.setRoles(Set.of(studentRole));
        userRepository.save(user);

        Student student = new Student();
        student.setUser(user);
        student.setStudentCode(request.getStudentCode());
        student.setFullName(request.getFullName());
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setDepartment(request.getDepartment());
        student.setProgramCode(request.getProgramCode());
        student.setAddress(request.getAddress());
        student.setEnrollmentYear(request.getEnrollmentYear());
        student.setAcademicStatus(StudentAcademicStatus.STUDYING);
        studentRepository.save(student);

        return mapToResponse(student);
    }

    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public StudentResponse getStudentById(Integer id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return mapToResponse(student);
    }

    public StudentResponse getStudentByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return mapToResponse(student);
    }

    @Transactional
    public StudentResponse updateStudent(Integer id, StudentRequest request) {
        validateRequired(request.getEmail(), "Email is required");
        validateRequired(request.getFullName(), "Full name is required");

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        User user = student.getUser();

        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        student.setFullName(request.getFullName());
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setDepartment(request.getDepartment());
        student.setProgramCode(request.getProgramCode());
        student.setAddress(request.getAddress());
        student.setEnrollmentYear(request.getEnrollmentYear());

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        userRepository.save(user);
        studentRepository.save(student);

        return mapToResponse(student);
    }

    @Transactional
    public void deleteStudent(Integer id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        User user = student.getUser();
        user.setIsActive(false);

        student.setAcademicStatus(StudentAcademicStatus.SUSPENDED);

        userRepository.save(user);
        studentRepository.save(student);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public StudentResponse updateAcademicStatus(Integer id, StudentAcademicStatusRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setAcademicStatus(request.getAcademicStatus());
        studentRepository.save(student);

        return mapToResponse(student);
    }

    private void validateRequired(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }
    }

    private StudentResponse mapToResponse(Student student) {
        StudentResponse response = new StudentResponse();
        response.setId(student.getId());
        response.setStudentCode(student.getStudentCode());
        response.setFullName(student.getFullName());
        response.setEmail(student.getEmail());
        response.setPhone(student.getPhone());
        response.setDateOfBirth(student.getDateOfBirth());
        response.setDepartment(student.getDepartment());
        response.setProgramCode(student.getProgramCode());
        response.setAddress(student.getAddress());
        response.setEnrollmentYear(student.getEnrollmentYear());
        response.setCreatedAt(student.getCreatedAt());
        response.setAcademicStatus(student.getAcademicStatus());

        if (student.getUser() != null) {
            response.setUsername(student.getUser().getUsername());
            response.setIsActive(student.getUser().getIsActive());
        }

        return response;
    }
}
