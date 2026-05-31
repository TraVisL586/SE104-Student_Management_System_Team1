ALTER TABLE public.course_sections
    ADD COLUMN IF NOT EXISTS periods_per_session int4;

UPDATE public.course_sections
SET periods_per_session = 1
WHERE periods_per_session IS NULL;

ALTER TABLE public.course_sections
    ALTER COLUMN periods_per_session SET DEFAULT 1,
    ALTER COLUMN periods_per_session SET NOT NULL;

ALTER TABLE public.course_sections
    DROP CONSTRAINT IF EXISTS course_sections_periods_per_session_check;

ALTER TABLE public.course_sections
    ADD CONSTRAINT course_sections_periods_per_session_check CHECK (
        periods_per_session BETWEEN 1 AND 10
    );
