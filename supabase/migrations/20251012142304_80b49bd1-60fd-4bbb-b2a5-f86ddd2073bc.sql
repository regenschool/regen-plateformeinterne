-- Add is_absent flag to grades to support absence handling
ALTER TABLE public.grades
ADD COLUMN IF NOT EXISTS is_absent boolean NOT NULL DEFAULT false;

-- Optional: comment for documentation
COMMENT ON COLUMN public.grades.is_absent IS 'When true, the student was absent: counts as 0 for the student average, excluded from class/subject averages and not considered missing.';