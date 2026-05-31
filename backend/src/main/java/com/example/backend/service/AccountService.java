package com.example.backend.service;

import com.example.backend.constant.RoleName;
import com.example.backend.dto.request.AccountRequest;
import com.example.backend.dto.request.AccountStatusRequest;
import com.example.backend.dto.request.ResetPasswordRequest;
import com.example.backend.dto.response.AccountResponse;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final AcademicAdvisorRepository academicAdvisorRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AccountResponse createAccount(AccountRequest request) {
        validateRequired(request.getUsername(), "Username is required");
        validateRequired(request.getEmail(), "Email is required");
        validateRequired(request.getFullName(), "Full name is required");
        validateRequired(request.getPassword(), "Password is required");

        if (request.getRole() == null) {
            throw new RuntimeException("Role is required");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role does not exist"));

        validateProfileCode(request);

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        user.setRoles(Set.of(role));
        userRepository.save(user);

        createProfile(user, request);

        return mapToResponse(user);
    }

    public List<AccountResponse> getAllAccounts() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public AccountResponse getAccountById(Integer id) {
        return mapToResponse(findUser(id));
    }

    @Transactional
    public AccountResponse updateStatus(Integer id, AccountStatusRequest request) {
        User user = findUser(id);
        user.setIsActive(request.getIsActive());
        userRepository.save(user);

        return mapToResponse(user);
    }

    @Transactional
    public void resetPassword(Integer id, ResetPasswordRequest request) {
        User user = findUser(id);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User findUser(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateProfileCode(AccountRequest request) {
        RoleName role = request.getRole();

        if (role == RoleName.ADMIN) {
            return;
        }

        if (!StringUtils.hasText(request.getProfileCode())) {
            throw new RuntimeException("Profile code is required");
        }

        if (role == RoleName.STUDENT
                && studentRepository.existsByStudentCode(request.getProfileCode())) {
            throw new RuntimeException("Student code already exists");
        }

        if (role == RoleName.LECTURER
                && lecturerRepository.existsByLecturerCode(request.getProfileCode())) {
            throw new RuntimeException("Lecturer code already exists");
        }

        if (role == RoleName.ACADEMIC_ADVISOR
                && academicAdvisorRepository.existsByAdvisorCode(request.getProfileCode())) {
            throw new RuntimeException("Advisor code already exists");
        }
    }

    private void createProfile(User user, AccountRequest request) {
        if (request.getRole() == RoleName.STUDENT) {
            Student student = new Student();
            student.setUser(user);
            student.setStudentCode(request.getProfileCode());
            student.setFullName(request.getFullName());
            student.setEmail(request.getEmail());
            student.setPhone(request.getPhone());
            student.setDateOfBirth(request.getDateOfBirth());
            student.setDepartment(request.getDepartment());
            student.setProgramCode(request.getProgramCode());
            student.setAddress(request.getAddress());
            student.setEnrollmentYear(request.getEnrollmentYear());
            studentRepository.save(student);
            return;
        }

        if (request.getRole() == RoleName.LECTURER) {
            Lecturer lecturer = new Lecturer();
            lecturer.setUser(user);
            lecturer.setLecturerCode(request.getProfileCode());
            lecturer.setFullName(request.getFullName());
            lecturer.setEmail(request.getEmail());
            lecturer.setPhone(request.getPhone());
            lecturer.setDepartment(request.getDepartment());
            lecturerRepository.save(lecturer);
            return;
        }

        if (request.getRole() == RoleName.ACADEMIC_ADVISOR) {
            AcademicAdvisor advisor = new AcademicAdvisor();
            advisor.setUser(user);
            advisor.setAdvisorCode(request.getProfileCode());
            advisor.setFullName(request.getFullName());
            advisor.setEmail(request.getEmail());
            advisor.setPhone(request.getPhone());
            advisor.setDepartment(request.getDepartment());
            academicAdvisorRepository.save(advisor);
        }
    }

    private AccountResponse mapToResponse(User user) {
        AccountResponse response = new AccountResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setIsActive(user.getIsActive());
        response.setCreatedAt(user.getCreatedAt());
        response.setRoles(user.getRoles().stream()
                .map(role -> role.getName().name())
                .toList());

        studentRepository.findByUserId(user.getId()).ifPresent(student -> {
            response.setProfileId(student.getId());
            response.setProfileType("STUDENT");
            response.setProfileCode(student.getStudentCode());
            response.setPhone(student.getPhone());
            response.setDepartment(student.getDepartment());
            response.setProgramCode(student.getProgramCode());
            response.setAddress(student.getAddress());
            response.setEnrollmentYear(student.getEnrollmentYear());
        });

        lecturerRepository.findByUserId(user.getId()).ifPresent(lecturer -> {
            response.setProfileId(lecturer.getId());
            response.setProfileType("LECTURER");
            response.setProfileCode(lecturer.getLecturerCode());
            response.setPhone(lecturer.getPhone());
            response.setDepartment(lecturer.getDepartment());
        });

        academicAdvisorRepository.findByUserId(user.getId()).ifPresent(advisor -> {
            response.setProfileId(advisor.getId());
            response.setProfileType("ACADEMIC_ADVISOR");
            response.setProfileCode(advisor.getAdvisorCode());
            response.setPhone(advisor.getPhone());
            response.setDepartment(advisor.getDepartment());
        });

        if (response.getProfileType() == null) {
            response.setProfileType("NONE");
        }

        return response;
    }

    private void validateRequired(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }
    }
}
