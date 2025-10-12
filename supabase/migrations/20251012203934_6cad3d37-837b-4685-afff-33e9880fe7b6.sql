-- Migration v5: Harmonize teachers and users with proper role management
-- This migration ensures teachers table uses user_id as primary key and integrates with user_roles

-- Step 1: Add 'teacher' to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'teacher') THEN
    ALTER TYPE app_role ADD VALUE 'teacher';
  END IF;
END $$;

-- Step 2: Drop existing triggers FIRST, then functions
DROP TRIGGER IF EXISTS sync_teacher_role_trigger ON teachers;
DROP TRIGGER IF EXISTS sync_teacher_email_trigger ON teachers;
DROP TRIGGER IF EXISTS on_teacher_change ON teachers;
DROP TRIGGER IF EXISTS on_teacher_insert_update ON teachers;

DROP FUNCTION IF EXISTS sync_teacher_role() CASCADE;
DROP FUNCTION IF EXISTS sync_teacher_email() CASCADE;

-- Step 3: Modify teachers table structure
-- First, drop foreign keys that reference teachers.id
ALTER TABLE IF EXISTS students DROP CONSTRAINT IF EXISTS students_teacher_id_fkey;
ALTER TABLE IF EXISTS students DROP CONSTRAINT IF EXISTS students_assigned_teacher_id_fkey;
ALTER TABLE IF EXISTS subjects DROP CONSTRAINT IF EXISTS subjects_teacher_fk_id_fkey;

-- Drop the old primary key
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_pkey;

-- Set user_id as the new primary key
ALTER TABLE teachers ADD PRIMARY KEY (user_id);

-- Recreate foreign keys to reference teachers.user_id instead
ALTER TABLE students 
  ADD CONSTRAINT students_assigned_teacher_id_fkey 
  FOREIGN KEY (assigned_teacher_id) 
  REFERENCES teachers(user_id) 
  ON DELETE SET NULL;

ALTER TABLE subjects 
  ADD CONSTRAINT subjects_teacher_fk_id_fkey 
  FOREIGN KEY (teacher_fk_id) 
  REFERENCES teachers(user_id) 
  ON DELETE SET NULL;

-- Step 4: Create trigger function to sync teacher role
CREATE OR REPLACE FUNCTION public.sync_teacher_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'teacher'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM user_roles 
    WHERE user_id = OLD.user_id 
    AND role = 'teacher'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger function to sync email from auth.users
CREATE OR REPLACE FUNCTION public.sync_teacher_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$;

-- Step 6: Create triggers
CREATE TRIGGER sync_teacher_role_trigger
  AFTER INSERT OR DELETE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_role();

CREATE TRIGGER sync_teacher_email_trigger
  BEFORE INSERT OR UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION sync_teacher_email();

-- Step 7: Migrate existing teachers to user_roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'teacher'::app_role
FROM teachers
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 8: Update RLS policies for teachers table
DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
DROP POLICY IF EXISTS "Admins can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can insert teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can update teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can delete teachers" ON teachers;
DROP POLICY IF EXISTS "Users can update their own teacher profile" ON teachers;
DROP POLICY IF EXISTS "Teachers and admins can view all teachers" ON teachers;

-- Create new RLS policies
CREATE POLICY "Teachers and admins can view all teachers"
  ON teachers FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own teacher profile"
  ON teachers FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete teachers"
  ON teachers FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 9: Add helpful comments
COMMENT ON TABLE teachers IS 'Teacher profiles linked to auth.users via user_id (primary key)';
COMMENT ON COLUMN teachers.user_id IS 'Primary key - references auth.users(id)';
COMMENT ON TRIGGER sync_teacher_role_trigger ON teachers IS 'Automatically syncs teacher role to user_roles table';
COMMENT ON TRIGGER sync_teacher_email_trigger ON teachers IS 'Automatically syncs email from auth.users';