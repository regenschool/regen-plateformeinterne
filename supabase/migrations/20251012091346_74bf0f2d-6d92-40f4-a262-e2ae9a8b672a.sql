-- Make class_name nullable in public_quiz_links to allow global links
ALTER TABLE public.public_quiz_links 
ALTER COLUMN class_name DROP NOT NULL;