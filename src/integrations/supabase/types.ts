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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          date: string
          doctor: string | null
          id: string
          location: string | null
          notes: string | null
          patient_id: string
          reminder_time: number | null
          time: string
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          doctor?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id: string
          reminder_time?: number | null
          time: string
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          doctor?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string
          reminder_time?: number | null
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_alerts: {
        Row: {
          caregiver_notified: boolean | null
          id: string
          location_lat: number | null
          location_lng: number | null
          patient_id: string
          status: string
          timestamp: string
        }
        Insert: {
          caregiver_notified?: boolean | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          patient_id: string
          status?: string
          timestamp?: string
        }
        Update: {
          caregiver_notified?: boolean | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          patient_id?: string
          status?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_reports: {
        Row: {
          category: string | null
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          patient_id: string
          title: string
          upload_date: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          patient_id: string
          title: string
          upload_date?: string
        }
        Update: {
          category?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          patient_id?: string
          title?: string
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          id: string
          medication_id: string
          patient_id: string
          scheduled_time: string
          status: string
          taken_time: string | null
        }
        Insert: {
          id?: string
          medication_id: string
          patient_id: string
          scheduled_time: string
          status?: string
          taken_time?: string | null
        }
        Update: {
          id?: string
          medication_id?: string
          patient_id?: string
          scheduled_time?: string
          status?: string
          taken_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          instructions: string | null
          name: string
          patient_id: string
          start_date: string
          times_array: string[] | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          name: string
          patient_id: string
          start_date?: string
          times_array?: string[] | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          name?: string
          patient_id?: string
          start_date?: string
          times_array?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          caregiver_id: string | null
          created_at: string
          id: string
          name: string
          patient_id_unique: string
          user_id: string | null
        }
        Insert: {
          age?: number | null
          caregiver_id?: string | null
          created_at?: string
          id?: string
          name: string
          patient_id_unique: string
          user_id?: string | null
        }
        Update: {
          age?: number | null
          caregiver_id?: string | null
          created_at?: string
          id?: string
          name?: string
          patient_id_unique?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          daily_goal: number
          date: string
          glasses_count: number
          id: string
          patient_id: string
        }
        Insert: {
          daily_goal?: number
          date?: string
          glasses_count?: number
          id?: string
          patient_id: string
        }
        Update: {
          daily_goal?: number
          date?: string
          glasses_count?: number
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_intake_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_patient_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      link_patient_by_email: {
        Args: { _caregiver_id: string; _patient_email: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "caregiver" | "patient"
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
      app_role: ["caregiver", "patient"],
    },
  },
} as const
