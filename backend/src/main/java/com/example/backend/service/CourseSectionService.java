package com.example.backend.service;

import com.example.backend.constant.CourseSectionStatus;
import com.example.backend.dto.request.CourseSectionRequest;
import com.example.backend.dto.request.CourseSectionScheduleRequest;
import com.example.backend.dto.response.CourseSectionResponse;
import com.example.backend.dto.response.CourseSectionScheduleResponse;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseSectionService {
    private static final int MAX_PERIOD = 10;
    private static final LocalTime[] PERIOD_START_TIMES = {
            null,
            LocalTime.of(7, 0),
            LocalTime.of(7, 55),
            LocalTime.of(8, 50),
            LocalTime.of(9, 50),
            LocalTime.of(10, 45),
            LocalTime.of(13, 0),
            LocalTime.of(13, 55),
            LocalTime.of(14, 50),
            LocalTime.of(15, 50),
            LocalTime.of(16, 45)
    };
    private static final LocalTime[] PERIOD_END_TIMES = {
            null,
            LocalTime.of(7, 50),
            LocalTime.of(8, 45),
            LocalTime.of(9, 40),
            LocalTime.of(10, 40),
            LocalTime.of(11, 35),
            LocalTime.of(13, 50),
            LocalTime.of(14, 45),
            LocalTime.of(15, 40),
            LocalTime.of(16, 40),
            LocalTime.of(17, 35)
    };

    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionScheduleRepository scheduleRepository;
    private final CourseRepository courseRepository;
    private final LecturerRepository lecturerRepository;
    private final SemesterRepository semesterRepository;
    private final RoomRepository roomRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional
    public CourseSectionResponse create(CourseSectionRequest request) {
        if (courseSectionRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Course section code already exists");
        }

        CourseSection section = new CourseSection();
        applyRequest(section, request, true);
        validateSectionCanUseStatus(section, true);
        section.setEnrolledCount(0);
        courseSectionRepository.save(section);

        return mapToResponse(section, true);
    }

    public List<CourseSectionResponse> getAll() {
        return courseSectionRepository.findAll().stream()
                .map(section -> mapToResponse(section, true))
                .toList();
    }

    public CourseSectionResponse getById(Integer id) {
        return mapToResponse(findSection(id), true);
    }

    @Transactional
    public CourseSectionResponse update(Integer id, CourseSectionRequest request) {
        CourseSection section = findSection(id);

        if (!section.getCode().equals(request.getCode())
                && courseSectionRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Course section code already exists");
        }

        if (request.getCapacity() < section.getEnrolledCount()) {
            throw new RuntimeException("Capacity cannot be less than enrolled count");
        }

        if (request.getPeriodsPerSession() != null
                && !request.getPeriodsPerSession().equals(section.getPeriodsPerSession())
                && !scheduleRepository.findByCourseSectionId(id).isEmpty()) {
            throw new RuntimeException("Cannot change periods per session after schedules have been assigned");
        }

        applyRequest(section, request, false);
        validateSectionCanUseStatus(section, false);
        courseSectionRepository.save(section);

        return mapToResponse(section, true);
    }

    @Transactional
    public void delete(Integer id) {
        CourseSection section = findSection(id);

        if (!enrollmentRepository.findByCourseSectionId(id).isEmpty()) {
            section.setStatus(CourseSectionStatus.CANCELLED);
            courseSectionRepository.save(section);
            return;
        }

        if (!scheduleRepository.findByCourseSectionId(id).isEmpty()) {
            throw new RuntimeException("Cannot delete course section with schedules");
        }

        courseSectionRepository.delete(section);
    }

    @Transactional
    public CourseSectionResponse addSchedule(Integer sectionId, CourseSectionScheduleRequest request) {
        CourseSection section = findSection(sectionId);
        Room room = findRoom(request.getRoomId());

        int periodsPerSession = section.getPeriodsPerSession();
        int startPeriod = request.getStartPeriod();
        int endPeriod = calculateEndPeriod(startPeriod, periodsPerSession);
        validateSchedulePeriods(startPeriod, endPeriod);

        if (Boolean.FALSE.equals(room.getIsActive())) {
            throw new RuntimeException("Room is inactive");
        }

        if (room.getCapacity() != null && room.getCapacity() < section.getCapacity()) {
            throw new RuntimeException("Room capacity is less than course section capacity");
        }

        validateNoRoomConflict(room.getId(), request.getDayOfWeek(), startPeriod, endPeriod);
        validateNoLecturerConflict(section.getLecturer().getId(), request.getDayOfWeek(), startPeriod, endPeriod);
        validateNoEnrolledStudentConflict(section, request.getDayOfWeek(), startPeriod, endPeriod);

        CourseSectionSchedule schedule = new CourseSectionSchedule();
        schedule.setCourseSection(section);
        schedule.setRoom(room);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartPeriod(startPeriod);
        schedule.setEndPeriod(endPeriod);
        schedule.setStartTime(PERIOD_START_TIMES[startPeriod]);
        schedule.setEndTime(PERIOD_END_TIMES[endPeriod]);
        scheduleRepository.save(schedule);

        return mapToResponse(section, true);
    }

    public List<CourseSectionScheduleResponse> getSchedules(Integer sectionId) {
        findSection(sectionId);
        return scheduleRepository.findByCourseSectionId(sectionId).stream()
                .map(this::mapScheduleToResponse)
                .toList();
    }

    public List<CourseSectionResponse> getOpenCourseSections(Integer semesterId, String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        return courseSectionRepository
                .searchOpenSections(CourseSectionStatus.OPEN, semesterId, normalizedKeyword)
                .stream()
                .map(section -> mapToResponse(section, true))
                .toList();
    }

    @Transactional
    public void removeSchedule(Integer sectionId, Integer scheduleId) {
        CourseSection section = findSection(sectionId);

        CourseSectionSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (!schedule.getCourseSection().getId().equals(sectionId)) {
            throw new RuntimeException("Schedule does not belong to this course section");
        }

        if (section.getStatus() == CourseSectionStatus.OPEN
                && scheduleRepository.findByCourseSectionId(sectionId).size() <= 1) {
            throw new RuntimeException("Cannot remove the last schedule from an open course section");
        }

        scheduleRepository.delete(schedule);
    }

    private void applyRequest(CourseSection section, CourseSectionRequest request, boolean creating) {
        section.setCode(request.getCode());
        Course course = findCourse(request.getCourseId());
        section.setCourse(course);
        section.setLecturer(findLecturer(request.getLecturerId()));
        section.setSemester(findSemester(request.getSemesterId()));
        section.setCapacity(request.getCapacity());
        section.setPeriodsPerSession(request.getPeriodsPerSession() != null
                ? request.getPeriodsPerSession()
                : course.getPeriodsPerSession());
        if (creating) {
            section.setStatus(request.getStatus() != null ? request.getStatus() : CourseSectionStatus.DRAFT);
        } else if (request.getStatus() != null) {
            section.setStatus(request.getStatus());
        }
    }

    private void validateNoRoomConflict(Integer roomId, Integer dayOfWeek, Integer startPeriod, Integer endPeriod) {
        boolean exists = scheduleRepository.existsByRoomIdAndDayOfWeekAndStartPeriodLessThanEqualAndEndPeriodGreaterThanEqual(
                roomId,
                dayOfWeek,
                endPeriod,
                startPeriod
        );

        if (exists) {
            throw new RuntimeException("Room already has a schedule in this time range");
        }
    }

    private void validateNoLecturerConflict(Integer lecturerId, Integer dayOfWeek, Integer startPeriod, Integer endPeriod) {
        boolean exists = scheduleRepository.existsByCourseSectionLecturerIdAndDayOfWeekAndStartPeriodLessThanEqualAndEndPeriodGreaterThanEqual(
                lecturerId,
                dayOfWeek,
                endPeriod,
                startPeriod
        );

        if (exists) {
            throw new RuntimeException("Lecturer already has a schedule in this time range");
        }
    }

    private void validateNoEnrolledStudentConflict(
            CourseSection section,
            Integer dayOfWeek,
            Integer startPeriod,
            Integer endPeriod
    ) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseSectionIdAndStatus(
                section.getId(),
                com.example.backend.constant.EnrollmentStatus.ENROLLED
        );

        for (Enrollment enrollment : enrollments) {
            List<Enrollment> currentEnrollments = enrollmentRepository
                    .findByStudentIdAndCourseSectionSemesterIdAndStatus(
                            enrollment.getStudent().getId(),
                            section.getSemester().getId(),
                            com.example.backend.constant.EnrollmentStatus.ENROLLED
                    );

            for (Enrollment currentEnrollment : currentEnrollments) {
                if (currentEnrollment.getCourseSection().getId().equals(section.getId())) {
                    continue;
                }

                List<CourseSectionSchedule> existingSchedules =
                        scheduleRepository.findByCourseSectionId(currentEnrollment.getCourseSection().getId());

                for (CourseSectionSchedule existing : existingSchedules) {
                    boolean sameDay = existing.getDayOfWeek().equals(dayOfWeek);
                    boolean overlap = existing.getStartPeriod() <= endPeriod
                            && existing.getEndPeriod() >= startPeriod;

                    if (sameDay && overlap) {
                        throw new RuntimeException("Schedule conflicts with enrolled student's existing registration");
                    }
                }
            }
        }
    }

    private void validateSchedulePeriods(Integer startPeriod, Integer endPeriod) {
        if (startPeriod == null || startPeriod < 1 || startPeriod > MAX_PERIOD) {
            throw new RuntimeException("Schedule start period must be between 1 and 10");
        }

        if (endPeriod > MAX_PERIOD) {
            throw new RuntimeException("Course periods exceed available periods in the day");
        }
    }

    private int calculateEndPeriod(Integer startPeriod, Integer periodsPerSession) {
        if (periodsPerSession == null || periodsPerSession < 1 || periodsPerSession > MAX_PERIOD) {
            throw new RuntimeException("Periods per session must be between 1 and 10");
        }
        return startPeriod + periodsPerSession - 1;
    }

    private void validateSectionCanUseStatus(CourseSection section, boolean creating) {
        if (section.getStatus() == CourseSectionStatus.OPEN
                && (creating || scheduleRepository.findByCourseSectionId(section.getId()).isEmpty())) {
            throw new RuntimeException("Course section must have at least one schedule before opening");
        }
    }

    private CourseSection findSection(Integer id) {
        return courseSectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course section not found"));
    }

    private Course findCourse(Integer id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    private Lecturer findLecturer(Integer id) {
        return lecturerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
    }

    private Semester findSemester(Integer id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));
    }

    private Room findRoom(Integer id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private CourseSectionResponse mapToResponse(CourseSection section, boolean includeSchedules) {
        CourseSectionResponse response = new CourseSectionResponse();
        response.setId(section.getId());
        response.setCode(section.getCode());

        response.setCourseId(section.getCourse().getId());
        response.setCourseCode(section.getCourse().getCode());
        response.setCourseName(section.getCourse().getName());
        response.setCredits(section.getCourse().getCredits());
        response.setPeriodsPerSession(section.getPeriodsPerSession());

        response.setLecturerId(section.getLecturer().getId());
        response.setLecturerCode(section.getLecturer().getLecturerCode());
        response.setLecturerName(section.getLecturer().getFullName());

        response.setSemesterId(section.getSemester().getId());
        response.setSemesterCode(section.getSemester().getCode());
        response.setSemesterName(section.getSemester().getName());

        response.setCapacity(section.getCapacity());
        response.setEnrolledCount(section.getEnrolledCount());
        response.setAvailableSeats(section.getCapacity() - section.getEnrolledCount());
        response.setStatus(section.getStatus());
        response.setCreatedAt(section.getCreatedAt());

        if (includeSchedules) {
            response.setSchedules(scheduleRepository.findByCourseSectionId(section.getId()).stream()
                    .map(this::mapScheduleToResponse)
                    .toList());
        }

        return response;
    }

    private CourseSectionScheduleResponse mapScheduleToResponse(CourseSectionSchedule schedule) {
        CourseSectionScheduleResponse response = new CourseSectionScheduleResponse();
        response.setId(schedule.getId());
        response.setRoomId(schedule.getRoom().getId());
        response.setRoomCode(schedule.getRoom().getCode());
        response.setRoomName(schedule.getRoom().getName());
        response.setBuilding(schedule.getRoom().getBuilding());
        response.setDayOfWeek(schedule.getDayOfWeek());
        response.setStartPeriod(schedule.getStartPeriod());
        response.setEndPeriod(schedule.getEndPeriod());
        response.setPeriodsPerSession(schedule.getCourseSection().getPeriodsPerSession());
        response.setStartTime(schedule.getStartTime());
        response.setEndTime(schedule.getEndTime());
        return response;
    }
}
