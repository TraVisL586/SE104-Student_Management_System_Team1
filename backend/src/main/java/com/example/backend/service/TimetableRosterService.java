package com.example.backend.service;

import com.example.backend.constant.EnrollmentStatus;
import com.example.backend.dto.response.ClassRosterResponse;
import com.example.backend.dto.response.RosterStudentResponse;
import com.example.backend.dto.response.TimetableEntryResponse;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimetableRosterService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionScheduleRepository scheduleRepository;

    public List<TimetableEntryResponse> getStudentTimetableByUsername(String username) {
        Student student = findStudentByUsername(username);
        return getStudentTimetable(student.getId());
    }

    public List<TimetableEntryResponse> getStudentTimetable(Integer studentId) {
        findStudent(studentId);

        List<Enrollment> enrollments = enrollmentRepository
                .findByStudentIdAndStatus(studentId, EnrollmentStatus.ENROLLED);

        List<TimetableEntryResponse> result = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            CourseSection section = enrollment.getCourseSection();
            List<CourseSectionSchedule> schedules = scheduleRepository.findByCourseSectionId(section.getId());

            for (CourseSectionSchedule schedule : schedules) {
                result.add(mapTimetableEntry(section, schedule));
            }
        }

        return result;
    }

    public List<TimetableEntryResponse> getLecturerTimetableByUsername(String username) {
        Lecturer lecturer = findLecturerByUsername(username);
        return getLecturerTimetable(lecturer.getId());
    }

    public List<TimetableEntryResponse> getLecturerTimetable(Integer lecturerId) {
        findLecturer(lecturerId);

        List<CourseSection> sections = courseSectionRepository.findByLecturerId(lecturerId);
        List<TimetableEntryResponse> result = new ArrayList<>();

        for (CourseSection section : sections) {
            List<CourseSectionSchedule> schedules = scheduleRepository.findByCourseSectionId(section.getId());

            for (CourseSectionSchedule schedule : schedules) {
                result.add(mapTimetableEntry(section, schedule));
            }
        }

        return result;
    }

    public ClassRosterResponse getRosterForStudent(String username, Integer sectionId) {
        Student student = findStudentByUsername(username);

        boolean enrolled = enrollmentRepository.existsByStudentIdAndCourseSectionIdAndStatus(
                student.getId(),
                sectionId,
                EnrollmentStatus.ENROLLED
        );

        if (!enrolled) {
            throw new RuntimeException("Student is not enrolled in this course section");
        }

        return getRoster(sectionId);
    }

    public ClassRosterResponse getRosterForLecturer(String username, Integer sectionId) {
        Lecturer lecturer = findLecturerByUsername(username);
        CourseSection section = findCourseSection(sectionId);

        if (!section.getLecturer().getId().equals(lecturer.getId())) {
            throw new RuntimeException("Lecturer does not teach this course section");
        }

        return getRoster(sectionId);
    }

    public ClassRosterResponse getRoster(Integer sectionId) {
        CourseSection section = findCourseSection(sectionId);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseSectionId(sectionId).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED
                        || e.getStatus() == EnrollmentStatus.PASSED
                        || e.getStatus() == EnrollmentStatus.FAILED)
                .toList();

        ClassRosterResponse response = mapRoster(section);
        response.setStudents(enrollments.stream()
                .map(this::mapRosterStudent)
                .toList());

        return response;
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

    private Student findStudent(Integer id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private Lecturer findLecturer(Integer id) {
        return lecturerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
    }

    private CourseSection findCourseSection(Integer id) {
        return courseSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course section not found"));
    }

    private TimetableEntryResponse mapTimetableEntry(CourseSection section, CourseSectionSchedule schedule) {
        TimetableEntryResponse response = new TimetableEntryResponse();

        response.setCourseSectionId(section.getId());
        response.setCourseSectionCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());
        response.setCredits(section.getCourse().getCredits());

        response.setSemesterId(section.getSemester().getId());
        response.setSemesterCode(section.getSemester().getCode());
        response.setSemesterName(section.getSemester().getName());

        response.setEnrolledCount(section.getEnrolledCount());

        response.setLecturerId(section.getLecturer().getId());
        response.setLecturerCode(section.getLecturer().getLecturerCode());
        response.setLecturerName(section.getLecturer().getFullName());

        response.setRoomId(schedule.getRoom().getId());
        response.setRoomCode(schedule.getRoom().getCode());
        response.setRoomName(schedule.getRoom().getName());
        response.setBuilding(schedule.getRoom().getBuilding());

        response.setDayOfWeek(schedule.getDayOfWeek());
        response.setStartTime(schedule.getStartTime());
        response.setEndTime(schedule.getEndTime());

        return response;
    }

    private ClassRosterResponse mapRoster(CourseSection section) {
        ClassRosterResponse response = new ClassRosterResponse();

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

        response.setCapacity(section.getCapacity());
        response.setEnrolledCount(section.getEnrolledCount());
        response.setStatus(section.getStatus());

        return response;
    }

    private RosterStudentResponse mapRosterStudent(Enrollment enrollment) {
        Student student = enrollment.getStudent();

        RosterStudentResponse response = new RosterStudentResponse();
        response.setStudentId(student.getId());
        response.setStudentCode(student.getStudentCode());
        response.setFullName(student.getFullName());
        response.setEmail(student.getEmail());
        response.setPhone(student.getPhone());
        response.setEnrollmentStatus(enrollment.getStatus());

        return response;
    }
}