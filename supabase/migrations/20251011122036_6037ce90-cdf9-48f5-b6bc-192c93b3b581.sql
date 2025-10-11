-- Add special_needs column to students table for medical situations and extra time needs
ALTER TABLE public.students
ADD COLUMN special_needs TEXT;