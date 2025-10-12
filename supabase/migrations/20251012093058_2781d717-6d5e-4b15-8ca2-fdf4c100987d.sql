-- Step 1: Delete duplicate students, keeping the most recent one per (first_name, last_name, class_name)
WITH ranked_students AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(first_name), lower(last_name), lower(class_name) 
      ORDER BY created_at DESC
    ) AS rn
  FROM students
)
DELETE FROM students
WHERE id IN (
  SELECT id FROM ranked_students WHERE rn > 1
);

-- Step 2: Update RLS policies to allow all authenticated users to manage students
DROP POLICY IF EXISTS "Teachers can view their own students" ON students;
DROP POLICY IF EXISTS "Teachers can create students for their classes" ON students;
DROP POLICY IF EXISTS "Teachers can update their own students" ON students;
DROP POLICY IF EXISTS "Teachers can delete their own students" ON students;

-- Allow all authenticated users to view, create, update, and delete students
CREATE POLICY "Authenticated users can view all students" 
ON students 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create students" 
ON students 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update students" 
ON students 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete students" 
ON students 
FOR DELETE 
TO authenticated
USING (true);

-- Step 3: Add unique constraint on (lower(first_name), lower(last_name), lower(class_name))
-- First create a unique index with case-insensitive comparison
CREATE UNIQUE INDEX students_unique_name_class_idx 
ON students (lower(first_name), lower(last_name), lower(class_name));