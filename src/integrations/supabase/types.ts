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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      doctor_profiles: {
        Row: {
          clinic_address: string | null
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string
          crm: string | null
          crm_uf: string | null
          full_name: string
          rqe: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          crm?: string | null
          crm_uf?: string | null
          full_name: string
          rqe?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          crm?: string | null
          crm_uf?: string | null
          full_name?: string
          rqe?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          active_ingredient: string | null
          brand_name: string
          category: string | null
          controlled: boolean
          created_at: string
          default_posology: string | null
          drug_kind: Database["public"]["Enums"]["drug_kind"] | null
          id: string
          presentation: string | null
        }
        Insert: {
          active_ingredient?: string | null
          brand_name: string
          category?: string | null
          controlled?: boolean
          created_at?: string
          default_posology?: string | null
          drug_kind?: Database["public"]["Enums"]["drug_kind"] | null
          id?: string
          presentation?: string | null
        }
        Update: {
          active_ingredient?: string | null
          brand_name?: string
          category?: string | null
          controlled?: boolean
          created_at?: string
          default_posology?: string | null
          drug_kind?: Database["public"]["Enums"]["drug_kind"] | null
          id?: string
          presentation?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[]
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          sex: Database["public"]["Enums"]["patient_sex"] | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          allergies?: string[]
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id?: string
          phone?: string | null
          sex?: Database["public"]["Enums"]["patient_sex"] | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          allergies?: string[]
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          sex?: Database["public"]["Enums"]["patient_sex"] | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          compounded: boolean
          controlled: boolean
          created_at: string
          dosage: string | null
          id: string
          medication_id: string | null
          name: string
          owner_id: string
          posology: string | null
          prescription_id: string
          presentation: string | null
          quantity: string | null
        }
        Insert: {
          compounded?: boolean
          controlled?: boolean
          created_at?: string
          dosage?: string | null
          id?: string
          medication_id?: string | null
          name: string
          owner_id?: string
          posology?: string | null
          prescription_id: string
          presentation?: string | null
          quantity?: string | null
        }
        Update: {
          compounded?: boolean
          controlled?: boolean
          created_at?: string
          dosage?: string | null
          id?: string
          medication_id?: string | null
          name?: string
          owner_id?: string
          posology?: string | null
          prescription_id?: string
          presentation?: string | null
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_templates: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["prescription_doc_type"]
          id: string
          items: Json
          notes: string | null
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["prescription_doc_type"]
          id?: string
          items?: Json
          notes?: string | null
          owner_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["prescription_doc_type"]
          id?: string
          items?: Json
          notes?: string | null
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          clinic_location: string | null
          created_at: string
          doc_type: Database["public"]["Enums"]["prescription_doc_type"]
          id: string
          issued_at: string | null
          notes: string | null
          owner_id: string
          patient_id: string | null
          patient_name: string
          sent_to: string | null
          status: Database["public"]["Enums"]["prescription_status"]
          updated_at: string
          validation_token: string
        }
        Insert: {
          clinic_location?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["prescription_doc_type"]
          id?: string
          issued_at?: string | null
          notes?: string | null
          owner_id?: string
          patient_id?: string | null
          patient_name: string
          sent_to?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          validation_token: string
        }
        Update: {
          clinic_location?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["prescription_doc_type"]
          id?: string
          issued_at?: string | null
          notes?: string | null
          owner_id?: string
          patient_id?: string | null
          patient_name?: string
          sent_to?: string | null
          status?: Database["public"]["Enums"]["prescription_status"]
          updated_at?: string
          validation_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      drug_kind: "generico" | "similar" | "referencia"
      patient_sex: "M" | "F" | "outro"
      prescription_doc_type: "simples" | "controle_especial"
      prescription_status: "rascunho" | "emitida" | "enviada" | "cancelada"
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
      drug_kind: ["generico", "similar", "referencia"],
      patient_sex: ["M", "F", "outro"],
      prescription_doc_type: ["simples", "controle_especial"],
      prescription_status: ["rascunho", "emitida", "enviada", "cancelada"],
    },
  },
} as const
