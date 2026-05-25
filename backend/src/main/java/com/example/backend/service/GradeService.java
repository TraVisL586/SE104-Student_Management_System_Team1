package com.example.backend.service;

import com.example.backend.constant.EnrollmentStatus;
import com.example.backend.constant.GradeStatus;
import com.example.backend.constant.GradeUnlockRequestStatus;
import com.example.backend.dto.request.GradeRequest;
import com.example.backend.dto.request.GradeUnlockDecisionRequest;
import com.example.backend.dto.request.GradeUnlockReasonRequest;
import com.example.backend.dto.response.AuditLogResponse;
import com.example.backend.dto.response.GradeResponse;
import com.example.backend.dto.response.GradeUnlockRequestResponse;
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
public class GradeService {
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentGradeRepository gradeRepository;
    private final GradeUnlockRequestRepository unlockRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final CourseSectionRepository courseSectionRepository;

    public List<GradeResponse> getSectionGradesForLecturer(String username, Integer sectionId) {
        Lecturer lecturer = findLecturerByUsername(username);
        assertLecturerTeachesSection(lecturer, sectionId);

        return enrollmentRepository.findByCourseSectionId(sectionId).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED
                        || e.getStatus() == EnrollmentStatus.PASSED
                        || e.getStatus() == EnrollmentStatus.FAILED)
                .map(this::mapEnrollmentToGradeResponse)
                .toList();
    }

    private GradeResponse mapEnrollmentToGradeResponse(Enrollment enrollment) {
        CourseSection section = enrollment.getCourseSection();
        return gradeRepository.findByEnrollmentId(enrollment.getId())
                .map(this::mapGrade)
                .orElseGet(() -> {
                    GradeResponse response = new GradeResponse();
                    response.setId(null);
                    response.setEnrollmentId(enrollment.getId());

                    response.setStudentId(enrollment.getStudent().getId());
                    response.setStudentCode(enrollment.getStudent().getStudentCode());
                    response.setStudentName(enrollment.getStudent().getFullName());

                    response.setCourseSectionId(section.getId());
                    response.setCourseSectionCode(section.getCode());

                    response.setCourseId(section.getCourse().getId());
                    response.setCourseCode(section.getCourse().getCode());
                    response.setCourseName(section.getCourse().getName());

                    response.setProcessScore(null);
                    response.setMidtermScore(null);
                    response.setFinalScore(null);
                    response.setTotalScore(null);
                    response.setStatus(GradeStatus.DRAFT);
                    response.setPublishedAt(null);
                    response.setUpdatedAt(null);

                    return response;
                });
    }


    @Transactional
    public GradeResponse updateGradeForLecturer(String username, Integer enrollmentId, GradeRequest request) {
        Lecturer lecturer = findLecturerByUsername(username);
        Enrollment enrollment = findEnrollment(enrollmentId);
        assertLecturerTeachesSection(lecturer, enrollment.getCourseSection().getId());

        EnrollmentGrade grade = gradeRepository.findByEnrollmentId(enrollmentId)
                .orElseGet(() -> createDraftGrade(enrollment));

        if (grade.getStatus() == GradeStatus.PUBLISHED) {
            throw new RuntimeException("Published grade is locked");
        }

        applyScores(grade, request);
        gradeRepository.save(grade);
        writeAudit(username, "UPDATE_GRADE", "ENROLLMENT_GRADE", grade.getId(), "Updated draft grade");

        return mapGrade(grade);
    }

    @Transactional
    public GradeResponse publishGradeForLecturer(String username, Integer enrollmentId) {
        Lecturer lecturer = findLecturerByUsername(username);
        Enrollment enrollment = findEnrollment(enrollmentId);
        assertLecturerTeachesSection(lecturer, enrollment.getCourseSection().getId());

        EnrollmentGrade grade = gradeRepository.findByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Grade not found"));

        ensureCompleteScores(grade);

        grade.setTotalScore(calculateTotal(grade));
        grade.setStatus(GradeStatus.PUBLISHED);
        grade.setPublishedAt(LocalDateTime.now());
        grade.setUpdatedAt(LocalDateTime.now());
        gradeRepository.save(grade);

        enrollment.setStatus(grade.getTotalScore().compareTo(BigDecimal.valueOf(5.0)) >= 0
                ? EnrollmentStatus.PASSED
                : EnrollmentStatus.FAILED);
        enrollment.setUpdatedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);

        writeAudit(username, "PUBLISH_GRADE", "ENROLLMENT_GRADE", grade.getId(), "Published official grade");

        return mapGrade(grade);
    }

    public List<GradeResponse> getMyPublishedGrades(String username) {
        Student student = findStudentByUsername(username);

        return gradeRepository.findByEnrollmentStudentIdAndStatus(student.getId(), GradeStatus.PUBLISHED)
                .stream()
                .map(this::mapGrade)
                .toList();
    }

    public GradeResponse getMyPublishedGrade(String username, Integer enrollmentId) {
        Student student = findStudentByUsername(username);
        Enrollment enrollment = findEnrollment(enrollmentId);

        if (!enrollment.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Enrollment does not belong to current student");
        }

        EnrollmentGrade grade = gradeRepository.findByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Grade not found"));

        if (grade.getStatus() != GradeStatus.PUBLISHED) {
            throw new RuntimeException("Grade has not been published");
        }

        return mapGrade(grade);
    }

    @Transactional
    public GradeUnlockRequestResponse requestUnlock(
            String username,
            Integer enrollmentId,
            GradeUnlockReasonRequest request) {
        Lecturer lecturer = findLecturerByUsername(username);
        Enrollment enrollment = findEnrollment(enrollmentId);
        assertLecturerTeachesSection(lecturer, enrollment.getCourseSection().getId());

        EnrollmentGrade grade = gradeRepository.findByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Grade not found"));

        if (grade.getStatus() != GradeStatus.PUBLISHED) {
            throw new RuntimeException("Only published grade can be unlocked");
        }

        if (unlockRequestRepository.existsByGradeIdAndStatus(grade.getId(), GradeUnlockRequestStatus.PENDING)) {
            throw new RuntimeException("A pending unlock request already exists");
        }

        GradeUnlockRequest unlockRequest = new GradeUnlockRequest();
        unlockRequest.setGrade(grade);
        unlockRequest.setLecturer(lecturer);
        unlockRequest.setReason(request.getReason());
        unlockRequest.setStatus(GradeUnlockRequestStatus.PENDING);
        unlockRequestRepository.save(unlockRequest);

        writeAudit(username, "REQUEST_GRADE_UNLOCK", "ENROLLMENT_GRADE", grade.getId(), request.getReason());

        return mapUnlockRequest(unlockRequest);
    }

    public List<GradeUnlockRequestResponse> getUnlockRequests(GradeUnlockRequestStatus status) {
        List<GradeUnlockRequest> requests = status == null
                ? unlockRequestRepository.findAll()
                : unlockRequestRepository.findByStatus(status);

        return requests.stream()
                .map(this::mapUnlockRequest)
                .toList();
    }

    @Transactional
    public GradeUnlockRequestResponse decideUnlockRequest(
            String adminUsername,
            Integer requestId,
            GradeUnlockDecisionRequest request) {
        GradeUnlockRequest unlockRequest = unlockRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Grade unlock request not found"));

        if (unlockRequest.getStatus() != GradeUnlockRequestStatus.PENDING) {
            throw new RuntimeException("Grade unlock request has already been reviewed");
        }

        unlockRequest.setReviewerNote(request.getReviewerNote());
        unlockRequest.setReviewedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(request.getApproved())) {
            unlockRequest.setStatus(GradeUnlockRequestStatus.APPROVED);

            EnrollmentGrade grade = unlockRequest.getGrade();
            grade.setStatus(GradeStatus.DRAFT);
            grade.setPublishedAt(null);
            grade.setUpdatedAt(LocalDateTime.now());
            gradeRepository.save(grade);

            Enrollment enrollment = grade.getEnrollment();
            enrollment.setStatus(EnrollmentStatus.ENROLLED);
            enrollment.setUpdatedAt(LocalDateTime.now());
            enrollmentRepository.save(enrollment);

            writeAudit(adminUsername, "APPROVE_GRADE_UNLOCK", "ENROLLMENT_GRADE", grade.getId(), "Grade moved back to DRAFT");
        } else {
            unlockRequest.setStatus(GradeUnlockRequestStatus.REJECTED);
            writeAudit(adminUsername, "REJECT_GRADE_UNLOCK", "GRADE_UNLOCK_REQUEST", unlockRequest.getId(), request.getReviewerNote());
        }

        unlockRequestRepository.save(unlockRequest);
        return mapUnlockRequest(unlockRequest);
    }

    public List<AuditLogResponse> getAuditLogs() {
        return auditLogRepository.findAll().stream()
                .map(this::mapAuditLog)
                .toList();
    }

    private EnrollmentGrade createDraftGrade(Enrollment enrollment) {
        EnrollmentGrade grade = new EnrollmentGrade();
        grade.setEnrollment(enrollment);
        grade.setStatus(GradeStatus.DRAFT);
        grade.setUpdatedAt(LocalDateTime.now());
        return grade;
    }

    private void applyScores(EnrollmentGrade grade, GradeRequest request) {
        grade.setProcessScore(request.getProcessScore());
        grade.setMidtermScore(request.getMidtermScore());
        grade.setFinalScore(request.getFinalScore());
        grade.setTotalScore(calculateTotal(request));
        grade.setUpdatedAt(LocalDateTime.now());
    }

    private BigDecimal calculateTotal(GradeRequest request) {
        return request.getProcessScore().multiply(BigDecimal.valueOf(0.1))
                .add(request.getMidtermScore().multiply(BigDecimal.valueOf(0.3)))
                .add(request.getFinalScore().multiply(BigDecimal.valueOf(0.6)))
                .setScale(1, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotal(EnrollmentGrade grade) {
        return grade.getProcessScore().multiply(BigDecimal.valueOf(0.1))
                .add(grade.getMidtermScore().multiply(BigDecimal.valueOf(0.3)))
                .add(grade.getFinalScore().multiply(BigDecimal.valueOf(0.6)))
                .setScale(1, RoundingMode.HALF_UP);
    }

    private void ensureCompleteScores(EnrollmentGrade grade) {
        if (grade.getProcessScore() == null || grade.getMidtermScore() == null || grade.getFinalScore() == null) {
            throw new RuntimeException("Grade scores are incomplete");
        }
    }

    private void assertLecturerTeachesSection(Lecturer lecturer, Integer sectionId) {
        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Course section not found"));

        if (!section.getLecturer().getId().equals(lecturer.getId())) {
            throw new RuntimeException("Lecturer does not teach this course section");
        }
    }
    private Enrollment findEnrollment(Integer id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
    }

    private Student findStudentByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private Lecturer findLecturerByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return lecturerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
    }

    private void writeAudit(String actorUsername, String action, String targetType, Integer targetId, String details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setActorUsername(actorUsername);
        auditLog.setAction(action);
        auditLog.setTargetType(targetType);
        auditLog.setTargetId(targetId);
        auditLog.setDetails(details);
        auditLogRepository.save(auditLog);
    }

    private GradeResponse mapGrade(EnrollmentGrade grade) {
        Enrollment enrollment = grade.getEnrollment();
        CourseSection section = enrollment.getCourseSection();

        GradeResponse response = new GradeResponse();
        response.setId(grade.getId());
        response.setEnrollmentId(enrollment.getId());

        response.setStudentId(enrollment.getStudent().getId());
        response.setStudentCode(enrollment.getStudent().getStudentCode());
        response.setStudentName(enrollment.getStudent().getFullName());

        response.setCourseSectionId(section.getId());
        response.setCourseSectionCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());

        response.setProcessScore(grade.getProcessScore());
        response.setMidtermScore(grade.getMidtermScore());
        response.setFinalScore(grade.getFinalScore());
        response.setTotalScore(grade.getTotalScore());
        response.setStatus(grade.getStatus());
        response.setPublishedAt(grade.getPublishedAt());
        response.setUpdatedAt(grade.getUpdatedAt());

        return response;
    }

    private GradeUnlockRequestResponse mapUnlockRequest(GradeUnlockRequest unlockRequest) {
        GradeUnlockRequestResponse response = new GradeUnlockRequestResponse();
        response.setId(unlockRequest.getId());
        response.setGradeId(unlockRequest.getGrade().getId());
        response.setEnrollmentId(unlockRequest.getGrade().getEnrollment().getId());

        response.setLecturerId(unlockRequest.getLecturer().getId());
        response.setLecturerCode(unlockRequest.getLecturer().getLecturerCode());
        response.setLecturerName(unlockRequest.getLecturer().getFullName());

        response.setReason(unlockRequest.getReason());
        response.setStatus(unlockRequest.getStatus());
        response.setReviewerNote(unlockRequest.getReviewerNote());
        response.setCreatedAt(unlockRequest.getCreatedAt());
        response.setReviewedAt(unlockRequest.getReviewedAt());

        return response;
    }

    private AuditLogResponse mapAuditLog(AuditLog auditLog) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(auditLog.getId());
        response.setActorUsername(auditLog.getActorUsername());
        response.setAction(auditLog.getAction());
        response.setTargetType(auditLog.getTargetType());
        response.setTargetId(auditLog.getTargetId());
        response.setDetails(auditLog.getDetails());
        response.setCreatedAt(auditLog.getCreatedAt());
        return response;
    }
}