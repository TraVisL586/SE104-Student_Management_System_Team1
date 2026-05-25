ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS periods_per_session int4 NOT NULL DEFAULT 1;

ALTER TABLE public.courses
    DROP CONSTRAINT IF EXISTS courses_periods_per_session_check;

ALTER TABLE public.courses
    ADD CONSTRAINT courses_periods_per_session_check CHECK (
        periods_per_session BETWEEN 1 AND 10
    );

ALTER TABLE public.course_section_schedules
    ADD COLUMN IF NOT EXISTS start_period int4,
    ADD COLUMN IF NOT EXISTS end_period int4;

UPDATE public.course_section_schedules
SET start_period = CASE
        WHEN start_time = TIME '07:00:00' THEN 1
        WHEN start_time = TIME '07:55:00' THEN 2
        WHEN start_time = TIME '08:50:00' THEN 3
        WHEN start_time = TIME '09:50:00' THEN 4
        WHEN start_time = TIME '10:45:00' THEN 5
        WHEN start_time = TIME '13:00:00' THEN 6
        WHEN start_time = TIME '13:55:00' THEN 7
        WHEN start_time = TIME '14:50:00' THEN 8
        WHEN start_time = TIME '15:50:00' THEN 9
        WHEN start_time = TIME '16:45:00' THEN 10
        ELSE 1
    END,
    end_period = CASE
        WHEN end_time = TIME '07:50:00' THEN 1
        WHEN end_time = TIME '08:45:00' THEN 2
        WHEN end_time = TIME '09:40:00' THEN 3
        WHEN end_time = TIME '10:40:00' THEN 4
        WHEN end_time = TIME '11:35:00' THEN 5
        WHEN end_time = TIME '13:50:00' THEN 6
        WHEN end_time = TIME '14:45:00' THEN 7
        WHEN end_time = TIME '15:40:00' THEN 8
        WHEN end_time = TIME '16:40:00' THEN 9
        WHEN end_time = TIME '17:35:00' THEN 10
        ELSE CASE
            WHEN start_time = TIME '07:00:00' THEN 1
            WHEN start_time = TIME '07:55:00' THEN 2
            WHEN start_time = TIME '08:50:00' THEN 3
            WHEN start_time = TIME '09:50:00' THEN 4
            WHEN start_time = TIME '10:45:00' THEN 5
            WHEN start_time = TIME '13:00:00' THEN 6
            WHEN start_time = TIME '13:55:00' THEN 7
            WHEN start_time = TIME '14:50:00' THEN 8
            WHEN start_time = TIME '15:50:00' THEN 9
            WHEN start_time = TIME '16:45:00' THEN 10
            ELSE 1
        END
    END
WHERE start_period IS NULL OR end_period IS NULL;

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
    ON public.course_section_schedules(room_id, day_of_week, start_period, end_period);
