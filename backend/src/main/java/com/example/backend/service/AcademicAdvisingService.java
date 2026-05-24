package com.example.backend.service;

import com.example.backend.constant.AcademicRequestStatus;
import com.example.backend.constant.EnrollmentStatus;
import com.example.backend.constant.GradeStatus;
import com.example.backend.dto.request.AcademicRequestCreateRequest;
import com.example.backend.dto.request.AcademicRequestDecisionRequest;
import com.example.backend.dto.request.AdvisorAssignmentRequest;
import com.example.backend.dto.response.AcademicRequestResponse;
import com.example.backend.dto.response.AdvisorStudentResponse;
import com.example.backend.dto.response.GradeResponse;
import com.example.backend.dto.response.StudentAdvisingProfileResponse;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicAdvisingService {
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final AcademicAdvisorRepository advisorRepository;
    private final AdvisorStudentRepository advisorStudentRepository;
    private final AcademicRequestRepository academicRequestRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentGradeRepository gradeRepository;
    private final NotificationEmailService notificationEmailService;

    @Transactional
    public AdvisorStudentResponse assignAdvisor(AdvisorAssignmentRequest request) {
        AcademicAdvisor advisor = findAdvisor(request.getAdvisorId());
        Student student = findStudent(request.getStudentId());

        advisorStudentRepository.findByStudentId(student.getId())
                .ifPresent(existing -> advisorStudentRepository.delete(existing));

        AdvisorStudent advisorStudent = new AdvisorStudent();
        advisorStudent.setAdvisor(advisor);
        advisorStudent.setStudent(student);
        advisorStudentRepository.save(advisorStudent);

        return mapAdvisorStudent(advisorStudent);
    }

    @Transactional
    public void unassignAdvisor(Integer advisorId, Integer studentId) {
        advisorStudentRepository.deleteByAdvisorIdAndStudentId(advisorId, studentId);
    }

    public List<AdvisorStudentResponse> getAdvisorAssignments() {
        return advisorStudentRepository.findAll().stream()
                .map(this::mapAdvisorStudent)
                .toList();
    }

    public List<AdvisorStudentResponse> getMyStudents(String advisorUsername) {
        AcademicAdvisor advisor = findAdvisorByUsername(advisorUsername);

        return advisorStudentRepository.findByAdvisorId(advisor.getId()).stream()
                .map(this::mapAdvisorStudent)
                .toList();
    }

    public StudentAdvisingProfileResponse getStudentProfileForAdvisor(String advisorUsername, Integer studentId) {
        AcademicAdvisor advisor = findAdvisorByUsername(advisorUsername);

        if (!advisorStudentRepository.existsByAdvisorIdAndStudentId(advisor.getId(), studentId)) {
            throw new RuntimeException("Student is not assigned to this advisor");
        }

        return buildStudentProfile(findStudent(studentId));
    }

    @Transactional
    public AcademicRequestResponse createAcademicRequest(
            String studentUsername,
            AcademicRequestCreateRequest request) {
        Student student = findStudentByUsername(studentUsername);

        AcademicAdvisor advisor = advisorStudentRepository.findByStudentId(student.getId())
                .map(AdvisorStudent::getAdvisor)
                .orElseThrow(() -> new RuntimeException("Student has not been assigned to an advisor"));

        AcademicRequest academicRequest = new AcademicRequest();
        academicRequest.setStudent(student);
        academicRequest.setAdvisor(advisor);
        academicRequest.setType(request.getType());
        academicRequest.setTitle(request.getTitle());
        academicRequest.setContent(request.getContent());
        academicRequest.setAttachmentUrl(request.getAttachmentUrl());
        academicRequest.setStatus(AcademicRequestStatus.PENDING);
        academicRequestRepository.save(academicRequest);

        return mapAcademicRequest(academicRequest);
    }

    public List<AcademicRequestResponse> getMyRequests(String studentUsername) {
        Student student = findStudentByUsername(studentUsername);

        return academicRequestRepository.findByStudentId(student.getId()).stream()
                .map(this::mapAcademicRequest)
                .toList();
    }

    public List<AcademicRequestResponse> getAdvisorRequests(
            String advisorUsername,
            AcademicRequestStatus status) {
        AcademicAdvisor advisor = findAdvisorByUsername(advisorUsername);

        List<AcademicRequest> requests = status == null
                ? academicRequestRepository.findByAdvisorId(advisor.getId())
                : academicRequestRepository.findByAdvisorIdAndStatus(advisor.getId(), status);

        return requests.stream()
                .map(this::mapAcademicRequest)
                .toList();
    }

    @Transactional
    public AcademicRequestResponse decideAcademicRequest(
            String advisorUsername,
            Integer requestId,
            AcademicRequestDecisionRequest request) {
        AcademicAdvisor advisor = findAdvisorByUsername(advisorUsername);

        AcademicRequest academicRequest = academicRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Academic request not found"));

        if (academicRequest.getAdvisor() == null
                || !academicRequest.getAdvisor().getId().equals(advisor.getId())) {
            throw new RuntimeException("Academic request is not assigned to this advisor");
        }

        if (academicRequest.getStatus() != AcademicRequestStatus.PENDING) {
            throw new RuntimeException("Academic request has already been reviewed");
        }

        academicRequest.setStatus(Boolean.TRUE.equals(request.getApproved())
                ? AcademicRequestStatus.APPROVED
                : AcademicRequestStatus.REJECTED);
        academicRequest.setAdvisorNote(request.getAdvisorNote());
        academicRequest.setReviewedAt(LocalDateTime.now());
        academicRequestRepository.save(academicRequest);
        notificationEmailService.sendAcademicRequestDecision(academicRequest);

        return mapAcademicRequest(academicRequest);
    }

    private StudentAdvisingProfileResponse buildStudentProfile(Student student) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        int passedCredits = enrollments.stream()
                .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.PASSED)
                .mapToInt(enrollment -> enrollment.getCourseSection().getCourse().getCredits())
                .sum();

        int failedCourses = (int) enrollments.stream()
                .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.FAILED)
                .count();

        List<EnrollmentGrade> publishedGrades = gradeRepository
                .findByEnrollmentStudentIdAndStatus(student.getId(), GradeStatus.PUBLISHED);

        BigDecimal gpa = BigDecimal.ZERO;
        if (!publishedGrades.isEmpty()) {
            BigDecimal total = publishedGrades.stream()
                    .map(EnrollmentGrade::getTotalScore)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            gpa = total.divide(BigDecimal.valueOf(publishedGrades.size()), 2, RoundingMode.HALF_UP);
        }

        StudentAdvisingProfileResponse response = new StudentAdvisingProfileResponse();
        response.setStudentId(student.getId());
        response.setStudentCode(student.getStudentCode());
        response.setFullName(student.getFullName());
        response.setEmail(student.getEmail());
        response.setPhone(student.getPhone());
        response.setAcademicStatus(student.getAcademicStatus());
        response.setPassedCredits(passedCredits);
        response.setFailedCourses(failedCourses);
        response.setGpa(gpa);
        response.setAcademicHistory(enrollments.stream()
                .map(this::mapAdvisingGrade)
                .toList());

        return response;
    }

    private GradeResponse mapAdvisingGrade(Enrollment enrollment) {
        CourseSection section = enrollment.getCourseSection();
        EnrollmentGrade grade = gradeRepository.findByEnrollmentId(enrollment.getId()).orElse(null);

        GradeResponse response = new GradeResponse();
        response.setEnrollmentId(enrollment.getId());

        response.setStudentId(enrollment.getStudent().getId());
        response.setStudentCode(enrollment.getStudent().getStudentCode());
        response.setStudentName(enrollment.getStudent().getFullName());

        response.setCourseSectionId(section.getId());
        response.setCourseSectionCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());

        if (grade != null) {
            response.setId(grade.getId());
            response.setProcessScore(grade.getProcessScore());
            response.setMidtermScore(grade.getMidtermScore());
            response.setFinalScore(grade.getFinalScore());
            response.setTotalScore(grade.getTotalScore());
            response.setStatus(grade.getStatus());
            response.setPublishedAt(grade.getPublishedAt());
            response.setUpdatedAt(grade.getUpdatedAt());
        }

        return response;
    }

    private AcademicAdvisor findAdvisorByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return advisorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Academic advisor not found"));
    }

    private Student findStudentByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private AcademicAdvisor findAdvisor(Integer id) {
        return advisorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Academic advisor not found"));
    }

    private Student findStudent(Integer id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private AdvisorStudentResponse mapAdvisorStudent(AdvisorStudent advisorStudent) {
        Student student = advisorStudent.getStudent();
        AcademicAdvisor advisor = advisorStudent.getAdvisor();
        AdvisorStudentResponse response = new AdvisorStudentResponse();
        response.setAdvisorId(advisor.getId());
        response.setAdvisorCode(advisor.getAdvisorCode());
        response.setAdvisorName(advisor.getFullName());
        response.setStudentId(student.getId());
        response.setStudentCode(student.getStudentCode());
        response.setFullName(student.getFullName());
        response.setEmail(student.getEmail());
        response.setPhone(student.getPhone());
        response.setAcademicStatus(student.getAcademicStatus());
        response.setAssignedAt(advisorStudent.getAssignedAt());
        return response;
    }

    private AcademicRequestResponse mapAcademicRequest(AcademicRequest academicRequest) {
        AcademicRequestResponse response = new AcademicRequestResponse();

        response.setId(academicRequest.getId());

        response.setStudentId(academicRequest.getStudent().getId());
        response.setStudentCode(academicRequest.getStudent().getStudentCode());
        response.setStudentName(academicRequest.getStudent().getFullName());

        if (academicRequest.getAdvisor() != null) {
            response.setAdvisorId(academicRequest.getAdvisor().getId());
            response.setAdvisorCode(academicRequest.getAdvisor().getAdvisorCode());
            response.setAdvisorName(academicRequest.getAdvisor().getFullName());
        }

        response.setType(academicRequest.getType());
        response.setTitle(academicRequest.getTitle());
        response.setContent(academicRequest.getContent());
        response.setAttachmentUrl(academicRequest.getAttachmentUrl());
        response.setStatus(academicRequest.getStatus());
        response.setAdvisorNote(academicRequest.getAdvisorNote());
        response.setCreatedAt(academicRequest.getCreatedAt());
        response.setReviewedAt(academicRequest.getReviewedAt());

        return response;
    }
}
