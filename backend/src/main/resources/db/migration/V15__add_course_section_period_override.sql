ALTER TABLE public.course_sections
    ADD COLUMN IF NOT EXISTS periods_per_session int4;

UPDATE public.course_sections cs
SET periods_per_session = c.periods_per_session
FROM public.courses c
WHERE cs.course_id = c.id
  AND cs.periods_per_session IS NULL;

ALTER TABLE public.course_sections
    ALTER COLUMN periods_per_session SET DEFAULT 1,
    ALTER COLUMN periods_per_session SET NOT NULL;

ALTER TABLE public.course_sections
    DROP CONSTRAINT IF EXISTS course_sections_periods_per_session_check;

ALTER TABLE public.course_sections
    ADD CONSTRAINT course_sections_periods_per_session_check CHECK (
        periods_per_session BETWEEN 1 AND 10
    );
