package com.example.backend.service;

import com.example.backend.constant.CourseSectionStatus;
import com.example.backend.constant.EnrollmentStatus;
import com.example.backend.constant.StudentAcademicStatus;
import com.example.backend.constant.TuitionStatus;
import com.example.backend.dto.request.RegistrationRequest;
import com.example.backend.dto.response.EnrollmentResponse;
import com.example.backend.entity.CoursePrerequisite;
import com.example.backend.entity.CourseSection;
import com.example.backend.entity.CourseSectionSchedule;
import com.example.backend.entity.Enrollment;
import com.example.backend.entity.Student;
import com.example.backend.entity.User;
import com.example.backend.repository.CoursePrerequisiteRepository;
import com.example.backend.repository.CourseSectionRepository;
import com.example.backend.repository.CourseSectionScheduleRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.TuitionRecordRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CourseRegistrationService {

    private static final int MAX_CREDITS_PER_SEMESTER = 24;

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionScheduleRepository scheduleRepository;
    private final CoursePrerequisiteRepository prerequisiteRepository;
    private final TuitionRecordRepository tuitionRecordRepository;
    private final RedisLockService redisLockService;
    private final PlatformTransactionManager transactionManager;

    public EnrollmentResponse register(String username, RegistrationRequest request) {
        String lockKey = "registration:course-section:" + request.getCourseSectionId();

        return redisLockService.executeWithLock(lockKey, () -> {
            EnrollmentResponse response = new TransactionTemplate(transactionManager)
                    .execute(status -> registerWithTransaction(username, request));

            if (response == null) {
                throw new RuntimeException("Registration failed");
            }

            return response;
        });
    }

    private EnrollmentResponse registerWithTransaction(String username, RegistrationRequest request) {
        Student student = findStudentByUsername(username);
        CourseSection section = findCourseSection(request.getCourseSectionId());

        validateStudentCanRegister(student);
        validateSectionCanRegister(section);
        validateTuitionStatus(student, section);
        validateNotAlreadyRegistered(student, section);
        validateCourseNotAlreadyRegisteredInSemester(student, section);
        validateCapacity(section);
        validateCreditLimit(student, section);
        validateScheduleConflict(student, section);
        validatePrerequisites(student, section);

        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCourseSectionId(student.getId(), section.getId())
                .orElseGet(Enrollment::new);

        if (enrollment.getId() != null && enrollment.getStatus() != EnrollmentStatus.DROPPED) {
            throw new RuntimeException("Student cannot register this course section again");
        }

        enrollment.setStudent(student);
        enrollment.setCourseSection(section);
        enrollment.setStatus(EnrollmentStatus.ENROLLED);
        enrollment.setUpdatedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);

        section.setEnrolledCount(section.getEnrolledCount() + 1);
        courseSectionRepository.save(section);

        return mapToResponse(enrollment);
    }

    public List<EnrollmentResponse> getMyRegistrations(String username) {
        Student student = findStudentByUsername(username);

        return enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void cancelRegistration(String username, Integer enrollmentId) {
        Student student = findStudentByUsername(username);

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (!enrollment.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Enrollment does not belong to current student");
        }

        if (enrollment.getStatus() != EnrollmentStatus.ENROLLED) {
            throw new RuntimeException("Only enrolled registration can be cancelled");
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollment.setUpdatedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);

        CourseSection section = enrollment.getCourseSection();
        section.setEnrolledCount(Math.max(0, section.getEnrolledCount() - 1));
        courseSectionRepository.save(section);
    }

    public List<EnrollmentResponse> getAllEnrollments() {
        return enrollmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<EnrollmentResponse> getEnrollmentsBySection(Integer sectionId) {
        findCourseSection(sectionId);

        return enrollmentRepository.findByCourseSectionId(sectionId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<EnrollmentResponse> getEnrollmentsByStudent(Integer studentId) {
        findStudent(studentId);

        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void validateStudentCanRegister(Student student) {
        if (student.getAcademicStatus() != StudentAcademicStatus.STUDYING) {
            throw new RuntimeException("Student is not allowed to register courses");
        }
    }

    private void validateSectionCanRegister(CourseSection section) {
        if (section.getStatus() != CourseSectionStatus.OPEN) {
            throw new RuntimeException("Course section is not open for registration");
        }
    }

    private void validateTuitionStatus(Student student, CourseSection section) {
        tuitionRecordRepository.findByStudentIdAndSemesterId(
                student.getId(),
                section.getSemester().getId()
        ).ifPresent(record -> {
            if (record.getStatus() == TuitionStatus.OWED || record.getStatus() == TuitionStatus.PARTIAL) {
                throw new RuntimeException("Student has outstanding tuition for this semester");
            }
        });
    }

    private void validateNotAlreadyRegistered(Student student, CourseSection section) {
        boolean exists = enrollmentRepository.existsByStudentIdAndCourseSectionIdAndStatusIn(
                student.getId(),
                section.getId(),
                Set.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.WAITLISTED)
        );

        if (exists) {
            throw new RuntimeException("Student already registered this course section");
        }
    }

    private void validateCourseNotAlreadyRegisteredInSemester(Student student, CourseSection section) {
        boolean exists = enrollmentRepository.existsByStudentIdAndCourseSectionCourseIdAndCourseSectionSemesterIdAndStatusIn(
                student.getId(),
                section.getCourse().getId(),
                section.getSemester().getId(),
                Set.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.WAITLISTED)
        );

        if (exists) {
            throw new RuntimeException("Student already registered this course in this semester");
        }
    }

    private void validateCapacity(CourseSection section) {
        if (section.getEnrolledCount() >= section.getCapacity()) {
            throw new RuntimeException("Course section is full");
        }
    }

    private void validateCreditLimit(Student student, CourseSection newSection) {
        int currentCredits = enrollmentRepository
                .findByStudentIdAndCourseSectionSemesterIdAndStatus(
                        student.getId(),
                        newSection.getSemester().getId(),
                        EnrollmentStatus.ENROLLED
                )
                .stream()
                .mapToInt(enrollment -> enrollment.getCourseSection().getCourse().getCredits())
                .sum();

        int totalCredits = currentCredits + newSection.getCourse().getCredits();

        if (totalCredits > MAX_CREDITS_PER_SEMESTER) {
            throw new RuntimeException("Student cannot register more than 24 credits per semester");
        }
    }

    private void validateScheduleConflict(Student student, CourseSection newSection) {
        List<CourseSectionSchedule> newSchedules = scheduleRepository.findByCourseSectionId(newSection.getId());
        if (newSchedules.isEmpty()) {
            throw new RuntimeException("Course section has no schedule");
        }

        List<Enrollment> currentEnrollments = enrollmentRepository
                .findByStudentIdAndCourseSectionSemesterIdAndStatus(
                        student.getId(),
                        newSection.getSemester().getId(),
                        EnrollmentStatus.ENROLLED
                );

        for (Enrollment currentEnrollment : currentEnrollments) {
            List<CourseSectionSchedule> existingSchedules =
                    scheduleRepository.findByCourseSectionId(currentEnrollment.getCourseSection().getId());

            for (CourseSectionSchedule existing : existingSchedules) {
                for (CourseSectionSchedule incoming : newSchedules) {
                    boolean sameDay = existing.getDayOfWeek().equals(incoming.getDayOfWeek());
                    boolean overlap = existing.getStartPeriod() <= incoming.getEndPeriod()
                            && existing.getEndPeriod() >= incoming.getStartPeriod();

                    if (sameDay && overlap) {
                        throw new RuntimeException("Course section schedule conflicts with existing registration");
                    }
                }
            }
        }
    }

    private void validatePrerequisites(Student student, CourseSection section) {
        List<CoursePrerequisite> prerequisites = prerequisiteRepository.findByCourseId(section.getCourse().getId());

        for (CoursePrerequisite prerequisite : prerequisites) {
            boolean passed = enrollmentRepository.existsByStudentIdAndCourseSectionCourseIdAndStatus(
                    student.getId(),
                    prerequisite.getPrerequisiteCourse().getId(),
                    EnrollmentStatus.PASSED
            );

            if (!passed) {
                throw new RuntimeException("Student has not completed prerequisite course: "
                        + prerequisite.getPrerequisiteCourse().getCode());
            }
        }
    }

    private Student findStudentByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private Student findStudent(Integer id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private CourseSection findCourseSection(Integer id) {
        return courseSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course section not found"));
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        CourseSection section = enrollment.getCourseSection();
        Student student = enrollment.getStudent();

        EnrollmentResponse response = new EnrollmentResponse();
        response.setId(enrollment.getId());

        response.setStudentId(student.getId());
        response.setStudentCode(student.getStudentCode());
        response.setStudentName(student.getFullName());

        response.setCourseSectionId(section.getId());
        response.setCourseSectionCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());
        response.setCredits(section.getCourse().getCredits());

        response.setSemesterId(section.getSemester().getId());
        response.setSemesterCode(section.getSemester().getCode());
        response.setSemesterName(section.getSemester().getName());

        response.setStatus(enrollment.getStatus());
        response.setEnrolledAt(enrollment.getEnrolledAt());
        response.setUpdatedAt(enrollment.getUpdatedAt());

        return response;
    }
}
