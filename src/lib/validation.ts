import { z } from "zod";

// Validation schemas for student data
export const studentSchema = z.object({
  first_name: z.string()
    .trim()
    .min(1, { message: "Le prénom est requis" })
    .max(100, { message: "Le prénom ne peut pas dépasser 100 caractères" }),
  last_name: z.string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom ne peut pas dépasser 100 caractères" }),
  class_name: z.string()
    .trim()
    .min(1, { message: "La classe est requise" })
    .max(5, { message: "La classe ne peut pas dépasser 5 caractères" }),
  photo_url: z.string().url({ message: "URL invalide" }).optional().or(z.literal("")),
  birth_date: z.string().optional().nullable(),
  academic_background: z.string().max(500, { message: "Maximum 500 caractères" }).optional().or(z.literal("")),
  company: z.string().max(200, { message: "Maximum 200 caractères" }).optional().or(z.literal("")),
  special_needs: z.string().max(500, { message: "Maximum 500 caractères" }).optional().or(z.literal("")),
});

// Validation schema for grades
export const gradeSchema = z.object({
  grade: z.number()
    .min(0, { message: "La note ne peut pas être négative" })
    .max(100, { message: "La note ne peut pas dépasser 100" }),
  max_grade: z.number()
    .min(0.1, { message: "La note maximale doit être supérieure à 0" })
    .max(100, { message: "La note maximale ne peut pas dépasser 100" }),
  assessment_type: z.enum([
    "test",
    "exam",
    "quiz",
    "homework",
    "project",
    "presentation",
    "participation",
    "other"
  ]),
  weighting: z.number()
    .min(0.1, { message: "La pondération doit être supérieure à 0" })
    .max(10, { message: "La pondération ne peut pas dépasser 10" }),
  assessment_name: z.string()
    .trim()
    .min(1, { message: "Le nom de l'épreuve est requis" })
    .max(200, { message: "Maximum 200 caractères" }),
  assessment_custom_label: z.string()
    .max(100, { message: "Maximum 100 caractères" })
    .optional()
    .or(z.literal("")),
  appreciation: z.string()
    .max(1000, { message: "Maximum 1000 caractères" })
    .optional()
    .or(z.literal("")),
});

// Validation for subject creation
export const subjectSchema = z.object({
  teacher_name: z.string()
    .trim()
    .min(1, { message: "Le nom de l'enseignant est requis" })
    .max(200, { message: "Maximum 200 caractères" }),
  school_year: z.string()
    .trim()
    .min(1, { message: "L'année scolaire est requise" })
    .max(50, { message: "Maximum 50 caractères" }),
  semester: z.string()
    .trim()
    .min(1, { message: "Le semestre est requis" })
    .max(50, { message: "Maximum 50 caractères" }),
  subject_name: z.string()
    .trim()
    .min(1, { message: "Le nom de la matière est requis" })
    .max(200, { message: "Maximum 200 caractères" }),
  class_name: z.string()
    .trim()
    .min(1, { message: "La classe est requise" })
    .max(5, { message: "Maximum 5 caractères" }),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type GradeFormData = z.infer<typeof gradeSchema>;
export type SubjectFormData = z.infer<typeof subjectSchema>;
