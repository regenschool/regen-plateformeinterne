-- Fix teacher profiles and teachers table RLS policies
-- Teachers should only see their OWN profile, not all teachers

-- Drop existing policy on teachers table
DROP POLICY IF EXISTS "Teachers and admins can view all teachers" ON public.teachers;

-- Create new restrictive policy for teachers table
-- Teachers can only view their own profile, admins can view all
CREATE POLICY "Teachers can view their own profile only" 
ON public.teachers 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role)
);