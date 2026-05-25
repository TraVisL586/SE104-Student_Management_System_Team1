package com.example.backend.service;

import com.example.backend.constant.AttendanceStatus;
import com.example.backend.constant.EnrollmentStatus;
import com.example.backend.dto.request.AnnouncementRequest;
import com.example.backend.dto.request.AttendanceRequest;
import com.example.backend.dto.response.AnnouncementResponse;
import com.example.backend.dto.response.AttendanceResponse;
import com.example.backend.dto.response.NotificationResponse;
import com.example.backend.entity.Attendance;
import com.example.backend.entity.ClassAnnouncement;
import com.example.backend.entity.CourseSection;
import com.example.backend.entity.Enrollment;
import com.example.backend.entity.Lecturer;
import com.example.backend.entity.Notification;
import com.example.backend.entity.Student;
import com.example.backend.entity.User;
import com.example.backend.repository.AttendanceRepository;
import com.example.backend.repository.ClassAnnouncementRepository;
import com.example.backend.repository.CourseSectionRepository;
import com.example.backend.repository.EnrollmentRepository;
import com.example.backend.repository.LecturerRepository;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceNotificationService {
    private final AttendanceRepository attendanceRepository;
    private final ClassAnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final UserRepository userRepository;

    @Transactional
    public AttendanceResponse.Session recordAttendance(
            String username,
            Integer sectionId,
            AttendanceRequest.Session request) {
        User user = findUserByUsername(username);
        Lecturer lecturer = findLecturerByUserId(user.getId());
        CourseSection section = findCourseSection(sectionId);
        assertLecturerTeachesSection(lecturer, section);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseSectionId(sectionId).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED
                        || e.getStatus() == EnrollmentStatus.PASSED
                        || e.getStatus() == EnrollmentStatus.FAILED)
                .toList();

        Map<Integer, Student> enrolledStudents = enrollments.stream()
                .map(Enrollment::getStudent)
                .collect(Collectors.toMap(Student::getId, Function.identity()));

        Set<Integer> requestedStudentIds = new HashSet<>();

        for (AttendanceRequest.Record recordRequest : request.getRecords()) {
            if (!requestedStudentIds.add(recordRequest.getStudentId())) {
                throw new RuntimeException("Duplicate attendance record for student");
            }

            Student student = enrolledStudents.get(recordRequest.getStudentId());

            if (student == null) {
                throw new RuntimeException("Student is not enrolled in this course section");
            }

            Attendance attendance = attendanceRepository
                    .findByCourseSectionIdAndStudentIdAndAttendanceDate(
                            sectionId,
                            student.getId(),
                            request.getAttendanceDate()
                    )
                    .orElseGet(Attendance::new);

            attendance.setCourseSection(section);
            attendance.setStudent(student);
            attendance.setAttendanceDate(request.getAttendanceDate());
            attendance.setStatus(recordRequest.getStatus());
            attendance.setNote(recordRequest.getNote());
            attendance.setRecordedBy(user);
            attendance.setUpdatedAt(LocalDateTime.now());
            attendanceRepository.save(attendance);
        }

        return buildAttendanceSession(section, request.getAttendanceDate());
    }

    public AttendanceResponse.Session getAttendanceForLecturer(
            String username,
            Integer sectionId,
            LocalDate attendanceDate) {
        Lecturer lecturer = findLecturerByUsername(username);
        CourseSection section = findCourseSection(sectionId);
        assertLecturerTeachesSection(lecturer, section);

        return buildAttendanceSession(section, attendanceDate);
    }

    public AttendanceResponse.Session getAttendanceForAdmin(Integer sectionId, LocalDate attendanceDate) {
        CourseSection section = findCourseSection(sectionId);
        return buildAttendanceSession(section, attendanceDate);
    }

    public List<AttendanceResponse> getMyAttendance(String username, Integer sectionId) {
        Student student = findStudentByUsername(username);

        if (sectionId != null) {
            if (!enrollmentRepository.existsByStudentIdAndCourseSectionIdAndStatusIn(
                    student.getId(),
                    sectionId,
                    List.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.PASSED, EnrollmentStatus.FAILED)
            )) {
                throw new RuntimeException("Student is not enrolled in this course section");
            }

            return attendanceRepository
                    .findByStudentIdAndCourseSectionIdOrderByAttendanceDateDesc(student.getId(), sectionId)
                    .stream()
                    .map(this::mapAttendance)
                    .toList();
        }

        return attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(student.getId()).stream()
                .map(this::mapAttendance)
                .toList();
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(
            String username,
            Integer sectionId,
            AnnouncementRequest request) {
        Lecturer lecturer = findLecturerByUsername(username);
        CourseSection section = findCourseSection(sectionId);
        assertLecturerTeachesSection(lecturer, section);

        ClassAnnouncement announcement = new ClassAnnouncement();
        announcement.setCourseSection(section);
        announcement.setLecturer(lecturer);
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcementRepository.save(announcement);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseSectionIdAndStatus(
                sectionId,
                EnrollmentStatus.ENROLLED
        );

        List<Notification> notifications = enrollments.stream()
                .map(enrollment -> createNotification(announcement, enrollment.getStudent().getUser()))
                .toList();

        notificationRepository.saveAll(notifications);

        return mapAnnouncement(announcement, notifications.size());
    }

    public List<AnnouncementResponse> getAnnouncementsForLecturer(String username, Integer sectionId) {
        Lecturer lecturer = findLecturerByUsername(username);
        CourseSection section = findCourseSection(sectionId);
        assertLecturerTeachesSection(lecturer, section);

        return getAnnouncements(sectionId);
    }

    public List<AnnouncementResponse> getAnnouncementsForAdmin(Integer sectionId) {
        findCourseSection(sectionId);
        return getAnnouncements(sectionId);
    }

    public List<NotificationResponse> getMyNotifications(String username, Boolean isRead) {
        User user = findUserByUsername(username);

        List<Notification> notifications = isRead == null
                ? notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                : notificationRepository.findByRecipientIdAndReadOrderByCreatedAtDesc(user.getId(), isRead);

        return notifications.stream()
                .map(this::mapNotification)
                .toList();
    }

    @Transactional
    public NotificationResponse markNotificationAsRead(String username, Integer notificationId) {
        User user = findUserByUsername(username);

        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        markAsRead(notification);
        notificationRepository.save(notification);

        return mapNotification(notification);
    }

    @Transactional
    public List<NotificationResponse> markAllNotificationsAsRead(String username) {
        User user = findUserByUsername(username);
        List<Notification> unreadNotifications = notificationRepository.findByRecipientIdAndRead(user.getId(), false);

        unreadNotifications.forEach(this::markAsRead);
        notificationRepository.saveAll(unreadNotifications);

        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapNotification)
                .toList();
    }

    private List<AnnouncementResponse> getAnnouncements(Integer sectionId) {
        return announcementRepository.findByCourseSectionIdOrderByCreatedAtDesc(sectionId).stream()
                .map(announcement -> mapAnnouncement(
                        announcement,
                        enrollmentRepository.findByCourseSectionIdAndStatus(
                                sectionId,
                                EnrollmentStatus.ENROLLED
                        ).size()
                ))
                .toList();
    }

    private Notification createNotification(ClassAnnouncement announcement, User recipient) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setAnnouncement(announcement);
        notification.setTitle(announcement.getTitle());
        notification.setContent(announcement.getContent());
        notification.setRead(false);
        return notification;
    }

    private void markAsRead(Notification notification) {
        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
        }
    }

    private AttendanceResponse.Session buildAttendanceSession(CourseSection section, LocalDate attendanceDate) {
        List<Attendance> records = attendanceRepository
                .findByCourseSectionIdAndAttendanceDateOrderByStudentStudentCodeAsc(
                        section.getId(),
                        attendanceDate
                );

        int totalStudents = (int) enrollmentRepository.findByCourseSectionId(section.getId()).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED
                        || e.getStatus() == EnrollmentStatus.PASSED
                        || e.getStatus() == EnrollmentStatus.FAILED)
                .count();

        AttendanceResponse.Session response = new AttendanceResponse.Session();
        response.setCourseSectionId(section.getId());
        response.setCourseSectionCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());

        response.setLecturerId(section.getLecturer().getId());
        response.setLecturerCode(section.getLecturer().getLecturerCode());
        response.setLecturerName(section.getLecturer().getFullName());

        response.setSemesterId(section.getSemester().getId());
        response.setSemesterCode(section.getSemester().getCode());
        response.setSemesterName(section.getSemester().getName());

        response.setAttendanceDate(attendanceDate);
        response.setTotalStudents(totalStudents);
        response.setPresentCount(countStatus(records, AttendanceStatus.PRESENT));
        response.setAbsentCount(countStatus(records, AttendanceStatus.ABSENT));
        response.setLateCount(countStatus(records, AttendanceStatus.LATE));
        response.setExcusedCount(countStatus(records, AttendanceStatus.EXCUSED));
        response.setRecords(records.stream()
                .map(this::mapAttendance)
                .toList());

        return response;
    }

    private int countStatus(List<Attendance> records, AttendanceStatus status) {
        return (int) records.stream()
                .filter(record -> record.getStatus() == status)
                .count();
    }

    private void assertLecturerTeachesSection(Lecturer lecturer, CourseSection section) {
        if (!section.getLecturer().getId().equals(lecturer.getId())) {
            throw new RuntimeException("Lecturer does not teach this course section");
        }
    }

    private CourseSection findCourseSection(Integer id) {
        return courseSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course section not found"));
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Student findStudentByUsername(String username) {
        User user = findUserByUsername(username);

        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private Lecturer findLecturerByUsername(String username) {
        User user = findUserByUsername(username);
        return findLecturerByUserId(user.getId());
    }

    private Lecturer findLecturerByUserId(Integer userId) {
        return lecturerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
    }

    private AttendanceResponse mapAttendance(Attendance attendance) {
        CourseSection section = attendance.getCourseSection();
        Student student = attendance.getStudent();

        AttendanceResponse response = new AttendanceResponse();
        response.setId(attendance.getId());

        response.setCourseSectionId(section.getId());
        response.setCourseSectionCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());

        response.setStudentId(student.getId());
        response.setStudentCode(student.getStudentCode());
        response.setStudentName(student.getFullName());
        response.setStudentEmail(student.getEmail());

        response.setAttendanceDate(attendance.getAttendanceDate());
        response.setStatus(attendance.getStatus());
        response.setNote(attendance.getNote());
        response.setRecordedByUsername(attendance.getRecordedBy() != null
                ? attendance.getRecordedBy().getUsername()
                : null);
        response.setCreatedAt(attendance.getCreatedAt());
        response.setUpdatedAt(attendance.getUpdatedAt());

        return response;
    }

    private AnnouncementResponse mapAnnouncement(ClassAnnouncement announcement, Integer recipientCount) {
        CourseSection section = announcement.getCourseSection();

        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());

        response.setCourseSectionId(section.getId());
        response.setCourseSectionCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());

        response.setLecturerId(announcement.getLecturer().getId());
        response.setLecturerCode(announcement.getLecturer().getLecturerCode());
        response.setLecturerName(announcement.getLecturer().getFullName());

        response.setTitle(announcement.getTitle());
        response.setContent(announcement.getContent());
        response.setRecipientCount(recipientCount);
        response.setCreatedAt(announcement.getCreatedAt());

        return response;
    }

    private NotificationResponse mapNotification(Notification notification) {
        ClassAnnouncement announcement = notification.getAnnouncement();
        CourseSection section = announcement != null ? announcement.getCourseSection() : null;

        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setAnnouncementId(announcement != null ? announcement.getId() : null);

        if (section != null) {
            response.setCourseSectionId(section.getId());
            response.setCourseSectionCode(section.getCode());
            response.setCourseId(section.getCourse().getId());
            response.setCourseCode(section.getCourse().getCode());
            response.setCourseName(section.getCourse().getName());
            response.setLecturerId(section.getLecturer().getId());
            response.setLecturerCode(section.getLecturer().getLecturerCode());
            response.setLecturerName(section.getLecturer().getFullName());
        }

        response.setTitle(notification.getTitle());
        response.setContent(notification.getContent());
        response.setIsRead(notification.getRead());
        response.setReadAt(notification.getReadAt());
        response.setCreatedAt(notification.getCreatedAt());

        return response;
    }
}
