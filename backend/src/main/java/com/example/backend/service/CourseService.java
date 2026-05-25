package com.example.backend.service;

import com.example.backend.dto.request.CoursePrerequisiteRequest;
import com.example.backend.dto.request.CourseRequest;
import com.example.backend.dto.response.CourseResponse;
import com.example.backend.entity.Course;
import com.example.backend.entity.CoursePrerequisite;
import com.example.backend.entity.Department;
import com.example.backend.repository.CoursePrerequisiteRepository;
import com.example.backend.repository.CourseRepository;
import com.example.backend.repository.CourseSectionRepository;
import com.example.backend.repository.CourseSectionScheduleRepository;
import com.example.backend.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final CoursePrerequisiteRepository prerequisiteRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionScheduleRepository scheduleRepository;

    @Transactional
    public CourseResponse create(CourseRequest request) {
        if (courseRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Course code already exists");
        }

        Department department = findDepartment(request.getDepartmentId());

        Course course = new Course();
        course.setDepartment(department);
        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setCredits(request.getCredits());
        course.setPeriodsPerSession(request.getPeriodsPerSession());
        course.setDescription(request.getDescription());
        course.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        courseRepository.save(course);

        return mapToResponse(course, true);
    }

    public List<CourseResponse> getAll() {
        return courseRepository.findAll().stream()
                .map(course -> mapToResponse(course, false))
                .toList();
    }

    public CourseResponse getById(Integer id) {
        return mapToResponse(findCourse(id), true);
    }

    @Transactional
    public CourseResponse update(Integer id, CourseRequest request) {
        Course course = findCourse(id);

        if (!course.getCode().equals(request.getCode())
                && courseRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Course code already exists");
        }

        Department department = findDepartment(request.getDepartmentId());

        if (!course.getPeriodsPerSession().equals(request.getPeriodsPerSession())
                && hasScheduledSection(course.getId())) {
            throw new RuntimeException("Cannot change periods per session after course sections have schedules");
        }

        course.setDepartment(department);
        course.setCode(request.getCode());
        course.setName(request.getName());
        course.setCredits(request.getCredits());
        course.setPeriodsPerSession(request.getPeriodsPerSession());
        course.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            course.setIsActive(request.getIsActive());
        }
        courseRepository.save(course);

        return mapToResponse(course, true);
    }

    @Transactional
    public void delete(Integer id) {
        courseRepository.delete(findCourse(id));
    }

    @Transactional
    public CourseResponse addPrerequisite(Integer courseId, CoursePrerequisiteRequest request) {
        if (courseId.equals(request.getPrerequisiteCourseId())) {
            throw new RuntimeException("Course cannot be prerequisite of itself");
        }

        Course course = findCourse(courseId);
        Course prerequisite = findCourse(request.getPrerequisiteCourseId());

        if (prerequisiteRepository.existsByCourseIdAndPrerequisiteCourseId(courseId, prerequisite.getId())) {
            throw new RuntimeException("Prerequisite already exists");
        }

        CoursePrerequisite relation = new CoursePrerequisite();
        relation.setCourse(course);
        relation.setPrerequisiteCourse(prerequisite);
        prerequisiteRepository.save(relation);

        return mapToResponse(course, true);
    }

    public List<CourseResponse> getPrerequisites(Integer courseId) {
        findCourse(courseId);
        return prerequisiteRepository.findByCourseId(courseId).stream()
                .map(relation -> mapToResponse(relation.getPrerequisiteCourse(), false))
                .toList();
    }

    @Transactional
    public void removePrerequisite(Integer courseId, Integer prerequisiteId) {
        findCourse(courseId);
        findCourse(prerequisiteId);
        prerequisiteRepository.deleteByCourseIdAndPrerequisiteCourseId(courseId, prerequisiteId);
    }

    private Course findCourse(Integer id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    private Department findDepartment(Integer id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
    }

    private CourseResponse mapToResponse(Course course, boolean includePrerequisites) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setCode(course.getCode());
        response.setName(course.getName());
        response.setCredits(course.getCredits());
        response.setPeriodsPerSession(course.getPeriodsPerSession());
        response.setDescription(course.getDescription());
        response.setIsActive(course.getIsActive());
        response.setCreatedAt(course.getCreatedAt());

        Department department = course.getDepartment();
        response.setDepartmentId(department.getId());
        response.setDepartmentCode(department.getCode());
        response.setDepartmentName(department.getName());

        if (includePrerequisites) {
            response.setPrerequisites(getPrerequisiteResponses(course.getId()));
        }

        return response;
    }

    private List<CourseResponse> getPrerequisiteResponses(Integer courseId) {
        return prerequisiteRepository.findByCourseId(courseId).stream()
                .map(relation -> mapToResponse(relation.getPrerequisiteCourse(), false))
                .toList();
    }

    private boolean hasScheduledSection(Integer courseId) {
        return courseSectionRepository.findByCourseId(courseId).stream()
                .anyMatch(section -> !scheduleRepository.findByCourseSectionId(section.getId()).isEmpty());
    }
}
