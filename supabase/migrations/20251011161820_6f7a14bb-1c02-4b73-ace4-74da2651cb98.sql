-- Add unique constraint to user_notes table for proper upsert functionality
ALTER TABLE public.user_notes
ADD CONSTRAINT user_notes_user_student_unique UNIQUE (user_id, student_id);