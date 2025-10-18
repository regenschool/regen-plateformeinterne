export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          label: string
          school_year_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          label: string
          school_year_id?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          label?: string
          school_year_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_periods_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          academic_period_fk_id: string | null
          assessment_custom_label: string | null
          assessment_name: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          class_fk_id: string | null
          class_name: string
          created_at: string
          graded_students: number
          id: string
          is_complete: boolean | null
          is_visible_to_students: boolean
          max_grade: number
          school_year: string
          semester: string
          subject: string
          teacher_id: string
          teacher_name: string | null
          total_students: number
          updated_at: string
          visibility_changed_at: string | null
          visibility_changed_by: string | null
          weighting: number
        }
        Insert: {
          academic_period_fk_id?: string | null
          assessment_custom_label?: string | null
          assessment_name: string
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          class_fk_id?: string | null
          class_name: string
          created_at?: string
          graded_students?: number
          id?: string
          is_complete?: boolean | null
          is_visible_to_students?: boolean
          max_grade?: number
          school_year: string
          semester: string
          subject: string
          teacher_id: string
          teacher_name?: string | null
          total_students?: number
          updated_at?: string
          visibility_changed_at?: string | null
          visibility_changed_by?: string | null
          weighting?: number
        }
        Update: {
          academic_period_fk_id?: string | null
          assessment_custom_label?: string | null
          assessment_name?: string
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          class_fk_id?: string | null
          class_name?: string
          created_at?: string
          graded_students?: number
          id?: string
          is_complete?: boolean | null
          is_visible_to_students?: boolean
          max_grade?: number
          school_year?: string
          semester?: string
          subject?: string
          teacher_id?: string
          teacher_name?: string | null
          total_students?: number
          updated_at?: string
          visibility_changed_at?: string | null
          visibility_changed_by?: string | null
          weighting?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_academic_period_fk_id_fkey"
            columns: ["academic_period_fk_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_class_fk_id_fkey"
            columns: ["class_fk_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          is_active: boolean | null
          level: string | null
          name: string
          program_id: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          level?: string | null
          name: string
          program_id?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          level?: string | null
          name?: string
          program_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_role_overrides: {
        Row: {
          is_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          is_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          is_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          required_for_role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          required_for_role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          required_for_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          category_id: string
          created_at: string | null
          display_order: number | null
          field_label: string
          field_name: string
          field_type: string | null
          help_text: string | null
          id: string
          is_required: boolean | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          display_order?: number | null
          field_label: string
          field_name: string
          field_type?: string | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          display_order?: number | null
          field_label?: string
          field_name?: string
          field_type?: string | null
          help_text?: string | null
          id?: string
          is_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          academic_period_fk_id: string | null
          appreciation: string | null
          assessment_custom_label: string | null
          assessment_name: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          class_fk_id: string | null
          class_name: string
          created_at: string
          grade: number
          id: string
          is_absent: boolean
          max_grade: number
          school_year: string | null
          semester: string | null
          student_id: string
          subject: string
          teacher_id: string
          teacher_name: string | null
          updated_at: string
          weighting: number
        }
        Insert: {
          academic_period_fk_id?: string | null
          appreciation?: string | null
          assessment_custom_label?: string | null
          assessment_name?: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          class_fk_id?: string | null
          class_name: string
          created_at?: string
          grade: number
          id?: string
          is_absent?: boolean
          max_grade?: number
          school_year?: string | null
          semester?: string | null
          student_id: string
          subject: string
          teacher_id: string
          teacher_name?: string | null
          updated_at?: string
          weighting?: number
        }
        Update: {
          academic_period_fk_id?: string | null
          appreciation?: string | null
          assessment_custom_label?: string | null
          assessment_name?: string | null
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          class_fk_id?: string | null
          class_name?: string
          created_at?: string
          grade?: number
          id?: string
          is_absent?: boolean
          max_grade?: number
          school_year?: string | null
          semester?: string | null
          student_id?: string
          subject?: string
          teacher_id?: string
          teacher_name?: string | null
          updated_at?: string
          weighting?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_academic_period_fk_id_fkey"
            columns: ["academic_period_fk_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_class_fk_id_fkey"
            columns: ["class_fk_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_checklist: {
        Row: {
          category_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          item_name: string
          notes: string | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_name: string
          notes?: string | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_name?: string
          notes?: string | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onboarding_checklist_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_profiles_enriched"
            referencedColumns: ["user_id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_quiz_links: {
        Row: {
          access_count: number
          class_name: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
        }
        Insert: {
          access_count?: number
          class_name?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
        }
        Update: {
          access_count?: number
          class_name?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      quiz_scores: {
        Row: {
          class_name: string
          completed_at: string
          id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          class_name: string
          completed_at?: string
          id?: string
          score: number
          total: number
          user_id: string
        }
        Update: {
          class_name?: string
          completed_at?: string
          id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          updated_at: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      report_card_section_elements: {
        Row: {
          created_at: string
          display_order: number
          element_key: string
          element_type: string
          id: string
          is_editable_in_draft: boolean
          label: string
          section_key: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          element_key: string
          element_type?: string
          id?: string
          is_editable_in_draft?: boolean
          label: string
          section_key: string
        }
        Update: {
          created_at?: string
          display_order?: number
          element_key?: string
          element_type?: string
          id?: string
          is_editable_in_draft?: boolean
          label?: string
          section_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_card_section_elements_section_key_fkey"
            columns: ["section_key"]
            isOneToOne: false
            referencedRelation: "report_card_sections"
            referencedColumns: ["section_key"]
          },
        ]
      }
      report_card_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          section_key: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          section_key: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          section_key?: string
        }
        Relationships: []
      }
      report_card_template_config: {
        Row: {
          created_at: string
          default_value: string | null
          element_key: string
          id: string
          is_editable: boolean
          is_visible: boolean
          section_key: string
          style_options: Json | null
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          element_key: string
          id?: string
          is_editable?: boolean
          is_visible?: boolean
          section_key: string
          style_options?: Json | null
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value?: string | null
          element_key?: string
          id?: string
          is_editable?: boolean
          is_visible?: boolean
          section_key?: string
          style_options?: Json | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_card_template_config_section_key_element_key_fkey"
            columns: ["section_key", "element_key"]
            isOneToOne: false
            referencedRelation: "report_card_section_elements"
            referencedColumns: ["section_key", "element_key"]
          },
          {
            foreignKeyName: "report_card_template_config_section_key_fkey"
            columns: ["section_key"]
            isOneToOne: false
            referencedRelation: "report_card_sections"
            referencedColumns: ["section_key"]
          },
          {
            foreignKeyName: "report_card_template_config_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_templates: {
        Row: {
          created_at: string
          css_template: string | null
          footer_text: string | null
          grade_display_format: string | null
          header_color: string | null
          html_template: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          logo_url: string | null
          name: string
          program_name: string | null
          sections_order: Json | null
          show_absences: boolean | null
          show_academic_info: boolean | null
          show_appreciation: boolean | null
          show_assessment_type: boolean | null
          show_average: boolean | null
          show_class_average: boolean | null
          show_footer: boolean | null
          show_general_appreciation: boolean | null
          show_grade_detail: boolean | null
          show_grades_table: boolean | null
          show_header: boolean | null
          show_individual_grades: boolean | null
          show_logo: boolean | null
          show_max_grade: boolean | null
          show_min_max_grades: boolean | null
          show_program_name: boolean | null
          show_signature: boolean | null
          show_student_age: boolean | null
          show_student_birth_date: boolean | null
          show_student_info: boolean | null
          show_student_photo: boolean | null
          show_subject_average: boolean | null
          show_subject_teacher: boolean | null
          show_weighting: boolean | null
          signature_url: string | null
          student_fields: Json | null
          updated_at: string
          use_custom_html: boolean | null
        }
        Insert: {
          created_at?: string
          css_template?: string | null
          footer_text?: string | null
          grade_display_format?: string | null
          header_color?: string | null
          html_template?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          program_name?: string | null
          sections_order?: Json | null
          show_absences?: boolean | null
          show_academic_info?: boolean | null
          show_appreciation?: boolean | null
          show_assessment_type?: boolean | null
          show_average?: boolean | null
          show_class_average?: boolean | null
          show_footer?: boolean | null
          show_general_appreciation?: boolean | null
          show_grade_detail?: boolean | null
          show_grades_table?: boolean | null
          show_header?: boolean | null
          show_individual_grades?: boolean | null
          show_logo?: boolean | null
          show_max_grade?: boolean | null
          show_min_max_grades?: boolean | null
          show_program_name?: boolean | null
          show_signature?: boolean | null
          show_student_age?: boolean | null
          show_student_birth_date?: boolean | null
          show_student_info?: boolean | null
          show_student_photo?: boolean | null
          show_subject_average?: boolean | null
          show_subject_teacher?: boolean | null
          show_weighting?: boolean | null
          signature_url?: string | null
          student_fields?: Json | null
          updated_at?: string
          use_custom_html?: boolean | null
        }
        Update: {
          created_at?: string
          css_template?: string | null
          footer_text?: string | null
          grade_display_format?: string | null
          header_color?: string | null
          html_template?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          program_name?: string | null
          sections_order?: Json | null
          show_absences?: boolean | null
          show_academic_info?: boolean | null
          show_appreciation?: boolean | null
          show_assessment_type?: boolean | null
          show_average?: boolean | null
          show_class_average?: boolean | null
          show_footer?: boolean | null
          show_general_appreciation?: boolean | null
          show_grade_detail?: boolean | null
          show_grades_table?: boolean | null
          show_header?: boolean | null
          show_individual_grades?: boolean | null
          show_logo?: boolean | null
          show_max_grade?: boolean | null
          show_min_max_grades?: boolean | null
          show_program_name?: boolean | null
          show_signature?: boolean | null
          show_student_age?: boolean | null
          show_student_birth_date?: boolean | null
          show_student_info?: boolean | null
          show_student_photo?: boolean | null
          show_subject_average?: boolean | null
          show_subject_teacher?: boolean | null
          show_weighting?: boolean | null
          signature_url?: string | null
          student_fields?: Json | null
          updated_at?: string
          use_custom_html?: boolean | null
        }
        Relationships: []
      }
      school_documents: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_type: string | null
          id: string
          teacher_id: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          teacher_id: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          teacher_id?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      school_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          label: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          label: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          label?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_document_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_documents: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          status: string | null
          student_id: string
          title: string
          updated_at: string | null
          upload_source: string | null
          uploaded_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          student_id: string
          title: string
          updated_at?: string | null
          upload_source?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          student_id?: string
          title?: string
          updated_at?: string | null
          upload_source?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "student_document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_background: string | null
          assigned_teacher_id: string | null
          class_id: string | null
          class_name: string | null
          company: string | null
          created_at: string
          id: string
          level_id: string | null
          program_id: string | null
          school_year_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_background?: string | null
          assigned_teacher_id?: string | null
          class_id?: string | null
          class_name?: string | null
          company?: string | null
          created_at?: string
          id?: string
          level_id?: string | null
          program_id?: string | null
          school_year_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_background?: string | null
          assigned_teacher_id?: string | null
          class_id?: string | null
          class_name?: string | null
          company?: string | null
          created_at?: string
          id?: string
          level_id?: string | null
          program_id?: string | null
          school_year_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      student_onboarding_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_onboarding_checklist: {
        Row: {
          category_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          item_name: string
          notes: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_name: string
          notes?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_name?: string
          notes?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_onboarding_checklist_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "student_onboarding_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_onboarding_checklist_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_onboarding_checklist_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          allergies: string | null
          birth_country: string | null
          birth_place: string | null
          blood_type: string | null
          created_at: string
          doctor_name: string | null
          doctor_phone: string | null
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          id: string
          insurance_company: string | null
          insurance_expiry_date: string | null
          insurance_policy_number: string | null
          medical_conditions: string | null
          medications: string | null
          nationality: string | null
          social_security_number: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          birth_country?: string | null
          birth_place?: string | null
          blood_type?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_phone?: string | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          medical_conditions?: string | null
          medications?: string | null
          nationality?: string | null
          social_security_number?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          birth_country?: string | null
          birth_place?: string | null
          blood_type?: string | null
          created_at?: string
          doctor_name?: string | null
          doctor_phone?: string | null
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          insurance_company?: string | null
          insurance_expiry_date?: string | null
          insurance_policy_number?: string | null
          medical_conditions?: string | null
          medications?: string | null
          nationality?: string | null
          social_security_number?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      student_report_cards: {
        Row: {
          class_name: string
          created_at: string
          created_by: string | null
          edited_data: Json | null
          generated_data: Json
          id: string
          pdf_url: string | null
          school_year: string
          semester: string
          status: string | null
          student_id: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          class_name: string
          created_at?: string
          created_by?: string | null
          edited_data?: Json | null
          generated_data: Json
          id?: string
          pdf_url?: string | null
          school_year: string
          semester: string
          status?: string | null
          student_id: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          created_by?: string | null
          edited_data?: Json | null
          generated_data?: Json
          id?: string
          pdf_url?: string | null
          school_year?: string
          semester?: string
          status?: string | null
          student_id?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_report_cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_background: string | null
          age: number | null
          assigned_teacher_id: string | null
          birth_date: string | null
          class_id: string | null
          class_name: string
          company: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          level_id: string | null
          photo_url: string | null
          school_year_id: string | null
          special_needs: string | null
          teacher_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_background?: string | null
          age?: number | null
          assigned_teacher_id?: string | null
          birth_date?: string | null
          class_id?: string | null
          class_name: string
          company?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          level_id?: string | null
          photo_url?: string | null
          school_year_id?: string | null
          special_needs?: string | null
          teacher_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_background?: string | null
          age?: number | null
          assigned_teacher_id?: string | null
          birth_date?: string | null
          class_id?: string | null
          class_name?: string
          company?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          level_id?: string | null
          photo_url?: string | null
          school_year_id?: string | null
          special_needs?: string | null
          teacher_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subject_weights: {
        Row: {
          class_name: string
          created_at: string
          id: string
          school_year: string
          semester: string
          subject_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          school_year: string
          semester: string
          subject_id: string
          updated_at?: string
          weight?: number
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          school_year?: string
          semester?: string
          subject_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "subject_weights_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          academic_period_id: string | null
          category_id: string | null
          class_fk_id: string | null
          class_name: string
          created_at: string
          id: string
          school_year: string
          school_year_fk_id: string | null
          semester: string
          subject_name: string
          teacher_email: string | null
          teacher_fk_id: string | null
          teacher_id: string
          teacher_name: string
          updated_at: string
        }
        Insert: {
          academic_period_id?: string | null
          category_id?: string | null
          class_fk_id?: string | null
          class_name: string
          created_at?: string
          id?: string
          school_year: string
          school_year_fk_id?: string | null
          semester: string
          subject_name: string
          teacher_email?: string | null
          teacher_fk_id?: string | null
          teacher_id: string
          teacher_name: string
          updated_at?: string
        }
        Update: {
          academic_period_id?: string | null
          category_id?: string | null
          class_fk_id?: string | null
          class_name?: string
          created_at?: string
          id?: string
          school_year?: string
          school_year_fk_id?: string | null
          semester?: string
          subject_name?: string
          teacher_email?: string | null
          teacher_fk_id?: string | null
          teacher_id?: string
          teacher_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_academic_period_id_fkey"
            columns: ["academic_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subject_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_class_fk_id_fkey"
            columns: ["class_fk_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_year_fk_id_fkey"
            columns: ["school_year_fk_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_teacher_fk_id_fkey"
            columns: ["teacher_fk_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teacher_documents: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          status: string | null
          teacher_id: string
          title: string | null
          updated_at: string | null
          upload_source: string | null
          uploaded_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          teacher_id: string
          title?: string | null
          updated_at?: string | null
          upload_source?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          teacher_id?: string
          title?: string | null
          updated_at?: string | null
          upload_source?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teacher_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_profiles_enriched"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teacher_invoices: {
        Row: {
          bank_bic: string | null
          bank_iban: string | null
          created_at: string
          description: string
          hours: number | null
          id: string
          invoice_date: string
          invoice_number: string
          other_amount: number | null
          pdf_path: string | null
          rate_per_hour: number | null
          siret: string | null
          status: string | null
          teacher_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          bank_bic?: string | null
          bank_iban?: string | null
          created_at?: string
          description: string
          hours?: number | null
          id?: string
          invoice_date: string
          invoice_number: string
          other_amount?: number | null
          pdf_path?: string | null
          rate_per_hour?: number | null
          siret?: string | null
          status?: string | null
          teacher_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          bank_bic?: string | null
          bank_iban?: string | null
          created_at?: string
          description?: string
          hours?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          other_amount?: number | null
          pdf_path?: string | null
          rate_per_hour?: number | null
          siret?: string | null
          status?: string | null
          teacher_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      teacher_meeting_notes: {
        Row: {
          action_items: Json | null
          attendees: string[] | null
          created_at: string | null
          created_by: string | null
          id: string
          meeting_date: string
          meeting_type: string | null
          notes: string | null
          teacher_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          attendees?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_date: string
          meeting_type?: string | null
          notes?: string | null
          teacher_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          attendees?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_date?: string
          meeting_type?: string | null
          notes?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_meeting_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teacher_meeting_notes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_profiles_enriched"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          phone: string | null
          secondary_email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name: string
          id?: string
          last_name?: string | null
          phone?: string | null
          secondary_email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          phone?: string | null
          secondary_email?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          subject_name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          subject_name: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          subject_name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_teacher_profiles_enriched"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          created_at: string
          id: string
          note: string | null
          student_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          student_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          student_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_visible_grades: {
        Row: {
          academic_period_fk_id: string | null
          appreciation: string | null
          assessment_custom_label: string | null
          assessment_name: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"] | null
          class_fk_id: string | null
          class_name: string | null
          created_at: string | null
          grade: number | null
          id: string | null
          is_absent: boolean | null
          is_complete: boolean | null
          is_visible_to_students: boolean | null
          max_grade: number | null
          school_year: string | null
          semester: string | null
          student_id: string | null
          subject: string | null
          teacher_id: string | null
          teacher_name: string | null
          updated_at: string | null
          weighting: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_academic_period_fk_id_fkey"
            columns: ["academic_period_fk_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_class_fk_id_fkey"
            columns: ["class_fk_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      v_grades_enriched: {
        Row: {
          academic_period_fk_id: string | null
          academic_period_label: string | null
          appreciation: string | null
          assessment_custom_label: string | null
          assessment_name: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"] | null
          class_fk_id: string | null
          class_name: string | null
          class_name_from_ref: string | null
          created_at: string | null
          grade: number | null
          id: string | null
          is_absent: boolean | null
          max_grade: number | null
          school_year: string | null
          school_year_from_ref: string | null
          semester: string | null
          student_first_name: string | null
          student_id: string | null
          student_last_name: string | null
          subject: string | null
          teacher_email_from_ref: string | null
          teacher_full_name: string | null
          teacher_id: string | null
          teacher_name: string | null
          updated_at: string | null
          weighting: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_academic_period_fk_id_fkey"
            columns: ["academic_period_fk_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_class_fk_id_fkey"
            columns: ["class_fk_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_enrollments_enriched: {
        Row: {
          academic_background: string | null
          age: number | null
          assigned_teacher_email: string | null
          assigned_teacher_id: string | null
          assigned_teacher_name: string | null
          birth_date: string | null
          class_id: string | null
          class_level: string | null
          class_name: string | null
          class_name_from_ref: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          level_id: string | null
          level_name: string | null
          photo_url: string | null
          school_year_id: string | null
          school_year_is_active: boolean | null
          school_year_label: string | null
          special_needs: string | null
          student_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_grades_with_visibility: {
        Row: {
          academic_period_fk_id: string | null
          appreciation: string | null
          assessment_custom_label: string | null
          assessment_name: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"] | null
          class_fk_id: string | null
          class_name: string | null
          created_at: string | null
          grade: number | null
          id: string | null
          is_absent: boolean | null
          is_complete: boolean | null
          is_visible_to_students: boolean | null
          max_grade: number | null
          school_year: string | null
          semester: string | null
          student_id: string | null
          subject: string | null
          teacher_id: string | null
          teacher_name: string | null
          updated_at: string | null
          weighting: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_academic_period_fk_id_fkey"
            columns: ["academic_period_fk_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_class_fk_id_fkey"
            columns: ["class_fk_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_students_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      v_students_enriched: {
        Row: {
          academic_background: string | null
          age: number | null
          assigned_teacher_email: string | null
          assigned_teacher_id: string | null
          assigned_teacher_name: string | null
          birth_date: string | null
          class_id: string | null
          class_level: string | null
          class_name: string | null
          class_name_from_ref: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          level_id: string | null
          level_name: string | null
          photo_url: string | null
          school_year_id: string | null
          school_year_label: string | null
          special_needs: string | null
          teacher_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_assigned_teacher_id_fkey"
            columns: ["assigned_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      v_teacher_profiles_enriched: {
        Row: {
          address: string | null
          checklist_completed: number | null
          checklist_total: number | null
          created_at: string | null
          documents_approved: number | null
          documents_pending: number | null
          documents_rejected: number | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          last_name: string | null
          onboarding_status: string | null
          phone: string | null
          secondary_email: string | null
          subjects: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_age: {
        Args: { birth_date: string }
        Returns: number
      }
      calculate_class_subject_stats: {
        Args: {
          p_class_name: string
          p_school_year: string
          p_semester: string
        }
        Returns: {
          class_avg: number
          max_avg: number
          min_avg: number
          student_count: number
          subject: string
        }[]
      }
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_subject_weights_for_class: {
        Args: {
          p_class_name: string
          p_school_year: string
          p_semester: string
        }
        Returns: {
          subject_name: string
          weight: number
        }[]
      }
      get_user_email: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_id_from_email: {
        Args: { _email: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_confirmed: {
        Args: { _user_id: string }
        Returns: boolean
      }
      link_user_to_student: {
        Args: { p_student_id: string; p_user_id: string }
        Returns: undefined
      }
      refresh_student_visible_grades: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      assessment_type:
        | "participation_individuelle"
        | "oral_groupe"
        | "oral_individuel"
        | "ecrit_groupe"
        | "ecrit_individuel"
        | "memoire"
        | "autre"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student"],
      assessment_type: [
        "participation_individuelle",
        "oral_groupe",
        "oral_individuel",
        "ecrit_groupe",
        "ecrit_individuel",
        "memoire",
        "autre",
      ],
    },
  },
} as const
