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
      grades: {
        Row: {
          appreciation: string | null
          assessment_custom_label: string | null
          assessment_name: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          class_name: string
          created_at: string
          grade: number
          id: string
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
          appreciation?: string | null
          assessment_custom_label?: string | null
          assessment_name?: string | null
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          class_name: string
          created_at?: string
          grade: number
          id?: string
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
          appreciation?: string | null
          assessment_custom_label?: string | null
          assessment_name?: string | null
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          class_name?: string
          created_at?: string
          grade?: number
          id?: string
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
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
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
      students: {
        Row: {
          academic_background: string | null
          age: number | null
          birth_date: string | null
          class_name: string
          company: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          photo_url: string | null
          special_needs: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          academic_background?: string | null
          age?: number | null
          birth_date?: string | null
          class_name: string
          company?: string | null
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          photo_url?: string | null
          special_needs?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_background?: string | null
          age?: number | null
          birth_date?: string | null
          class_name?: string
          company?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          photo_url?: string | null
          special_needs?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_name: string
          created_at: string
          id: string
          school_year: string
          semester: string
          subject_name: string
          teacher_id: string
          teacher_name: string
          updated_at: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          school_year: string
          semester: string
          subject_name: string
          teacher_id: string
          teacher_name: string
          updated_at?: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          school_year?: string
          semester?: string
          subject_name?: string
          teacher_id?: string
          teacher_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_invoices: {
        Row: {
          created_at: string
          description: string
          hours: number | null
          id: string
          invoice_date: string
          invoice_number: string
          other_amount: number | null
          pdf_path: string | null
          rate_per_hour: number | null
          status: string | null
          teacher_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          hours?: number | null
          id?: string
          invoice_date: string
          invoice_number: string
          other_amount?: number | null
          pdf_path?: string | null
          rate_per_hour?: number | null
          status?: string | null
          teacher_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          hours?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          other_amount?: number | null
          pdf_path?: string | null
          rate_per_hour?: number | null
          status?: string | null
          teacher_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          address: string | null
          bank_bic: string | null
          bank_iban: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          siret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          siret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          bank_bic?: string | null
          bank_iban?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          siret?: string | null
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
      [_ in never]: never
    }
    Functions: {
      calculate_age: {
        Args: { birth_date: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher"
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
      app_role: ["admin", "teacher"],
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
