-- Enable realtime for students table
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;

-- Enable realtime for grades table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.grades;

-- Enable realtime for subjects table
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;

-- Enable realtime for quiz_scores table
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_scores;