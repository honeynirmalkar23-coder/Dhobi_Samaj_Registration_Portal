export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      registrations: {
        Row: {
          id: string;
          registration_id: string;
          full_name: string;
          age: number;
          education_level: string;
          education_details: string | null;
          permanent_address: string;
          boys_count: number;
          girls_count: number;
          elders_count: number;
          total_family_members: number;
          applicant_photo_path: string;
          registration_status: Database["public"]["Enums"]["registration_status"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          payment_resubmission_allowed: boolean;
          public_rejection_message: string | null;
          admin_notes: string | null;
          payment_access_token_hash: string;
          payment_access_token_expires_at: string;
          payment_submitted_at: string | null;
          payment_verified_at: string | null;
          reviewed_at: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          archived_at: string | null;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      payment_proofs: {
        Row: {
          id: string;
          registration_record_id: string;
          storage_path: string;
          original_filename: string | null;
          mime_type: string;
          size_bytes: number;
          proof_status: Database["public"]["Enums"]["payment_proof_status"];
          public_rejection_message: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          submitted_at: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      payment_settings: {
        Row: {
          id: number;
          payment_enabled: boolean;
          qr_code_path: string | null;
          upi_id: string | null;
          payee_name: string | null;
          amount: number | null;
          payment_title: string | null;
          instructions: string | null;
          public_contact: string | null;
          payment_deadline: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string;
          registration_record_id: string | null;
          action: string;
          previous_value: Json | null;
          new_value: Json | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_dashboard_metrics: {
        Args: Record<string, never>;
        Returns: Array<{
          total_registrations: number;
          awaiting_payment: number;
          pending_verification: number;
          approved_registrations: number;
          rejected_registrations: number;
          submitted_today: number;
        }>;
      };
      admin_list_registrations: {
        Args: {
          p_search?: string | null;
          p_registration_status?: Database["public"]["Enums"]["registration_status"] | null;
          p_payment_status?: Database["public"]["Enums"]["payment_status"] | null;
          p_created_on?: string | null;
          p_sort?: string | null;
          p_page?: number | null;
          p_page_size?: number | null;
        };
        Returns: Array<{
          registration_id: string;
          full_name: string;
          age: number;
          education_level: string;
          total_family_members: number;
          registration_status: Database["public"]["Enums"]["registration_status"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
          total_count: number;
        }>;
      };
      admin_get_registration_details: {
        Args: { p_registration_id: string };
        Returns: Json | null;
      };
      admin_save_payment_settings: {
        Args: {
          p_payment_enabled: boolean;
          p_qr_code_path: string | null;
          p_upi_id: string | null;
          p_payee_name: string | null;
          p_amount: number | null;
          p_payment_title: string | null;
          p_instructions: string | null;
          p_public_contact: string | null;
          p_payment_deadline: string | null;
        };
        Returns: Array<{
          payment_enabled: boolean;
          qr_code_path: string | null;
          upi_id: string | null;
          payee_name: string | null;
          amount: number | null;
          payment_title: string | null;
          instructions: string | null;
          public_contact: string | null;
          payment_deadline: string | null;
          updated_at: string;
        }>;
      };
      admin_update_registration_state: {
        Args: {
          p_registration_id: string;
          p_expected_version: number;
          p_action:
            | "mark_under_review"
            | "verify_payment"
            | "reject_payment"
            | "approve_registration"
            | "reject_registration"
            | "archive_registration"
            | "enable_payment_resubmission";
          p_public_message: string | null;
        };
        Returns: Json | null;
      };
      admin_update_notes: {
        Args: {
          p_registration_id: string;
          p_expected_version: number;
          p_admin_notes: string | null;
        };
        Returns: Json | null;
      };
      admin_audit_log_entries: {
        Args: {
          p_action?: string | null;
          p_registration_id?: string | null;
          p_from?: string | null;
          p_to?: string | null;
          p_page?: number | null;
          p_page_size?: number | null;
        };
        Returns: Array<{
          id: string;
          admin_user_id: string;
          action: string;
          registration_id: string | null;
          metadata: Json | null;
          created_at: string;
          total_count: number;
        }>;
      };
    };
    Enums: {
      registration_status:
        | "awaiting_payment"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "archived";
      payment_status: "not_submitted" | "pending_verification" | "verified" | "rejected";
      payment_proof_status: "pending_verification" | "verified" | "rejected";
    };
    CompositeTypes: Record<string, never>;
  };
};
