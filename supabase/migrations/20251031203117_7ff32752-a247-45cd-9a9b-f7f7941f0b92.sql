-- Phase 4B Étape 5: Création Foreign Keys manquantes (partie 1/3)

-- FK students -> levels
ALTER TABLE students
ADD CONSTRAINT fk_students_level 
FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL;

-- FK students -> auth.users
ALTER TABLE students
ADD CONSTRAINT fk_students_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- FK student_enrollments -> students
ALTER TABLE student_enrollments
ADD CONSTRAINT fk_enrollments_student
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- FK student_enrollments -> school_years
ALTER TABLE student_enrollments
ADD CONSTRAINT fk_enrollments_school_year
FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE CASCADE;

-- FK student_enrollments -> classes
ALTER TABLE student_enrollments
ADD CONSTRAINT fk_enrollments_class
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- FK student_enrollments -> levels
ALTER TABLE student_enrollments
ADD CONSTRAINT fk_enrollments_level
FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL;