import type { AuthenticatedRole } from "./roles";

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
      profiles: {
        Row: {
          id: string;
          role: AuthenticatedRole;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AuthenticatedRole;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AuthenticatedRole;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_profiles: {
        Row: {
          id: string;
          user_id: string;
          date_of_birth: string | null;
          city: string | null;
          preferred_language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date_of_birth?: string | null;
          city?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date_of_birth?: string | null;
          city?: string | null;
          preferred_language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doctor_profiles: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          full_name: string;
          profile_image_url: string | null;
          registration_number: string;
          qualifications: string[];
          specialties: string[];
          subspecialties: string[];
          services: string[];
          years_of_experience: number;
          languages: string[];
          biography: string | null;
          consultation_fee: number;
          verification_status: "pending" | "approved" | "rejected" | "needs_review";
          is_public: boolean;
          average_rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          full_name: string;
          profile_image_url?: string | null;
          registration_number: string;
          qualifications?: string[];
          specialties?: string[];
          subspecialties?: string[];
          services?: string[];
          years_of_experience?: number;
          languages?: string[];
          biography?: string | null;
          consultation_fee?: number;
          verification_status?: "pending" | "approved" | "rejected" | "needs_review";
          is_public?: boolean;
          average_rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          full_name?: string;
          profile_image_url?: string | null;
          registration_number?: string;
          qualifications?: string[];
          specialties?: string[];
          subspecialties?: string[];
          services?: string[];
          years_of_experience?: number;
          languages?: string[];
          biography?: string | null;
          consultation_fee?: number;
          verification_status?: "pending" | "approved" | "rejected" | "needs_review";
          is_public?: boolean;
          average_rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doctor_verification_documents: {
        Row: {
          id: string;
          doctor_id: string;
          document_type:
            | "medical_license"
            | "identity_document"
            | "board_certificate"
            | "insurance"
            | "other"
            | "medical_registration_certificate"
            | "qualification_certificate"
            | "clinic_proof";
          file_url: string;
          storage_path: string;
          file_name: string | null;
          mime_type: string | null;
          file_size: number | null;
          status: "pending" | "approved" | "rejected" | "needs_review";
          verification_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          document_type:
            | "medical_license"
            | "identity_document"
            | "board_certificate"
            | "insurance"
            | "other"
            | "medical_registration_certificate"
            | "qualification_certificate"
            | "clinic_proof";
          file_url: string;
          storage_path?: string;
          file_name?: string | null;
          mime_type?: string | null;
          file_size?: number | null;
          status?: "pending" | "approved" | "rejected" | "needs_review";
          verification_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          document_type?:
            | "medical_license"
            | "identity_document"
            | "board_certificate"
            | "insurance"
            | "other"
            | "medical_registration_certificate"
            | "qualification_certificate"
            | "clinic_proof";
          file_url?: string;
          storage_path?: string;
          file_name?: string | null;
          mime_type?: string | null;
          file_size?: number | null;
          status?: "pending" | "approved" | "rejected" | "needs_review";
          verification_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clinics: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_locations: {
        Row: {
          id: string;
          clinic_id: string;
          address: string;
          city: string;
          latitude: number | null;
          longitude: number | null;
          opening_hours: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          address: string;
          city: string;
          latitude?: number | null;
          longitude?: number | null;
          opening_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          address?: string;
          city?: string;
          latitude?: number | null;
          longitude?: number | null;
          opening_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_admin_memberships: {
        Row: {
          id: string;
          user_id: string;
          clinic_id: string;
          role: "owner" | "admin" | "doctor" | "assistant";
          status: "pending" | "active" | "suspended" | "removed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          clinic_id: string;
          role?: "owner" | "admin" | "doctor" | "assistant";
          status?: "pending" | "active" | "suspended" | "removed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          clinic_id?: string;
          role?: "owner" | "admin" | "doctor" | "assistant";
          status?: "pending" | "active" | "suspended" | "removed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doctor_locations: {
        Row: {
          id: string;
          doctor_id: string;
          clinic_location_id: string | null;
          custom_location_name: string | null;
          address: string | null;
          city: string | null;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          clinic_location_id?: string | null;
          custom_location_name?: string | null;
          address?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          clinic_location_id?: string | null;
          custom_location_name?: string | null;
          address?: string | null;
          city?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      doctor_availability: {
        Row: {
          id: string;
          doctor_id: string;
          location_id: string;
          date: string;
          start_time: string;
          end_time: string;
          appointment_duration_minutes: number;
          break_minutes: number;
          max_patients: number;
          consultation_type: "in_person" | "video" | "phone";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          location_id: string;
          date: string;
          start_time: string;
          end_time: string;
          appointment_duration_minutes?: number;
          break_minutes?: number;
          max_patients?: number;
          consultation_type?: "in_person" | "video" | "phone";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          location_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          appointment_duration_minutes?: number;
          break_minutes?: number;
          max_patients?: number;
          consultation_type?: "in_person" | "video" | "phone";
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      appointment_slots: {
        Row: {
          id: string;
          doctor_id: string;
          availability_id: string;
          start_time: string;
          end_time: string;
          status: "available" | "held" | "booked" | "blocked" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          availability_id: string;
          start_time: string;
          end_time: string;
          status?: "available" | "held" | "booked" | "blocked" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          availability_id?: string;
          start_time?: string;
          end_time?: string;
          status?: "available" | "held" | "booked" | "blocked" | "cancelled";
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          appointment_id: string;
          patient_id: string;
          doctor_id: string;
          rating: number;
          comment: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          patient_id: string;
          doctor_id: string;
          rating: number;
          comment?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          appointment_id?: string;
          patient_id?: string;
          doctor_id?: string;
          rating?: number;
          comment?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_clinic_admin_onboarding: {
        Args: {
          clinic_name: string;
          clinic_email: string;
          clinic_phone: string;
          location_address: string;
          location_city: string;
        };
        Returns: string;
      };
      book_public_appointment: {
        Args: {
          target_slot_id: string;
          reason_for_visit?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: AuthenticatedRole;
      verification_document_type:
        | "medical_license"
        | "identity_document"
        | "board_certificate"
        | "insurance"
        | "other"
        | "medical_registration_certificate"
        | "qualification_certificate"
        | "clinic_proof";
      verification_status: "pending" | "approved" | "rejected" | "needs_review";
    };
    CompositeTypes: Record<string, never>;
  };
};
