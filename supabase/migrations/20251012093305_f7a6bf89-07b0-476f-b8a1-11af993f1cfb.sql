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

-- Step 2: Add unique constraint on (lower(first_name), lower(last_name), lower(class_name))
CREATE UNIQUE INDEX IF NOT EXISTS students_unique_name_class_idx 
ON students (lower(first_name), lower(last_name), lower(class_name));