ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS department varchar(255),
    ADD COLUMN IF NOT EXISTS program_code varchar(100),
    ADD COLUMN IF NOT EXISTS address varchar(500),
    ADD COLUMN IF NOT EXISTS enrollment_year int4;

ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS periods_per_session int4;

UPDATE public.courses
SET periods_per_session = 1
WHERE periods_per_session IS NULL;

ALTER TABLE public.courses
    ALTER COLUMN periods_per_session SET DEFAULT 1,
    ALTER COLUMN periods_per_session SET NOT NULL;

ALTER TABLE public.courses
    DROP CONSTRAINT IF EXISTS courses_periods_per_session_check;

ALTER TABLE public.courses
    ADD CONSTRAINT courses_periods_per_session_check CHECK (
        periods_per_session BETWEEN 1 AND 10
    );

ALTER TABLE public.course_section_schedules
    ADD COLUMN IF NOT EXISTS start_period int4,
    ADD COLUMN IF NOT EXISTS end_period int4;

WITH schedule_periods AS (
    SELECT
        schedules.id,
        CASE schedules.start_time
            WHEN TIME '07:00' THEN 1
            WHEN TIME '07:30' THEN 1
            WHEN TIME '07:55' THEN 2
            WHEN TIME '08:50' THEN 3
            WHEN TIME '09:50' THEN 4
            WHEN TIME '10:00' THEN 4
            WHEN TIME '10:45' THEN 5
            WHEN TIME '12:30' THEN 6
            WHEN TIME '13:00' THEN 6
            WHEN TIME '13:55' THEN 7
            WHEN TIME '14:50' THEN 8
            WHEN TIME '15:00' THEN 9
            WHEN TIME '15:30' THEN 9
            WHEN TIME '15:50' THEN 9
            WHEN TIME '16:45' THEN 10
            ELSE 1
        END AS start_period,
        COALESCE(sections.periods_per_session, 1) AS duration
    FROM public.course_section_schedules schedules
    JOIN public.course_sections sections ON sections.id = schedules.course_section_id
)
UPDATE public.course_section_schedules schedules
SET
    start_period = schedule_periods.start_period,
    end_period = LEAST(10, schedule_periods.start_period + schedule_periods.duration - 1)
FROM schedule_periods
WHERE schedules.id = schedule_periods.id
  AND (schedules.start_period IS NULL OR schedules.end_period IS NULL);

ALTER TABLE public.course_section_schedules
    ALTER COLUMN start_period SET NOT NULL,
    ALTER COLUMN end_period SET NOT NULL;

ALTER TABLE public.course_section_schedules
    DROP CONSTRAINT IF EXISTS course_section_schedules_period_check;

ALTER TABLE public.course_section_schedules
    ADD CONSTRAINT course_section_schedules_period_check CHECK (
        start_period BETWEEN 1 AND 10
        AND end_period BETWEEN 1 AND 10
        AND start_period <= end_period
    );

CREATE INDEX IF NOT EXISTS idx_course_section_schedules_room_day_period
    ON public.course_section_schedules (room_id, day_of_week, start_period, end_period);
