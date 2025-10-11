-- Add birth_date column to students table
ALTER TABLE public.students 
ADD COLUMN birth_date date;

-- Migrate existing age data to approximate birth dates (current year - age)
UPDATE public.students 
SET birth_date = make_date(EXTRACT(YEAR FROM CURRENT_DATE)::integer - age, 1, 1)
WHERE age IS NOT NULL;

-- Create a function to calculate age from birth_date
CREATE OR REPLACE FUNCTION calculate_age(birth_date date)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN date_part('year', age(birth_date))::integer;
END;
$$;