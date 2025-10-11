-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update subjects table RLS policies
DROP POLICY IF EXISTS "Teachers can view their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can create their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can update their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can delete their own subjects" ON public.subjects;

CREATE POLICY "Teachers can view their own subjects"
ON public.subjects
FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create their own subjects"
ON public.subjects
FOR INSERT
WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own subjects"
ON public.subjects
FOR UPDATE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own subjects"
ON public.subjects
FOR DELETE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

-- Update grades table RLS policies
DROP POLICY IF EXISTS "Teachers can view their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can create grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can update their own grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can delete their own grades" ON public.grades;

CREATE POLICY "Teachers can view their own grades"
ON public.grades
FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can create grades"
ON public.grades
FOR INSERT
WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update their own grades"
ON public.grades
FOR UPDATE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can delete their own grades"
ON public.grades
FOR DELETE
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));