package com.example.backend.repository;

import com.example.backend.entity.CourseSectionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseSectionScheduleRepository extends JpaRepository<CourseSectionSchedule, Integer> {
    List<CourseSectionSchedule> findByCourseSectionId(Integer courseSectionId);

    boolean existsByRoomIdAndDayOfWeekAndStartPeriodLessThanEqualAndEndPeriodGreaterThanEqual(
            Integer roomId,
            Integer dayOfWeek,
            Integer endPeriod,
            Integer startPeriod
    );

    boolean existsByCourseSectionLecturerIdAndDayOfWeekAndStartPeriodLessThanEqualAndEndPeriodGreaterThanEqual(
            Integer lecturerId,
            Integer dayOfWeek,
            Integer endPeriod,
            Integer startPeriod
    );
}
