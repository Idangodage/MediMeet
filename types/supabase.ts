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
          verification_status:
            | "pending"
            | "approved"
            | "rejected"
            | "needs_review"
            | "suspended";
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
          verification_status?:
            | "pending"
            | "approved"
            | "rejected"
            | "needs_review"
            | "suspended";
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
          verification_status?:
            | "pending"
            | "approved"
            | "rejected"
            | "needs_review"
            | "suspended";
          is_public?: boolean;
          average_rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doctor_profile_views: {
        Row: {
          id: string;
          doctor_id: string;
          viewer_user_id: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          viewer_user_id?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          viewer_user_id?: string | null;
          viewed_at?: string;
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
          status:
            | "pending"
            | "approved"
            | "rejected"
            | "needs_review"
            | "suspended";
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
          status?:
            | "pending"
            | "approved"
            | "rejected"
            | "needs_review"
            | "suspended";
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
          status?:
            | "pending"
            | "approved"
            | "rejected"
            | "needs_review"
            | "suspended";
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
      doctor_clinic_memberships: {
        Row: {
          id: string;
          doctor_id: string;
          clinic_id: string;
          role: "owner" | "admin" | "doctor" | "assistant";
          status: "pending" | "active" | "suspended" | "removed";
          created_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          clinic_id: string;
          role?: "owner" | "admin" | "doctor" | "assistant";
          status?: "pending" | "active" | "suspended" | "removed";
          created_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          clinic_id?: string;
          role?: "owner" | "admin" | "doctor" | "assistant";
          status?: "pending" | "active" | "suspended" | "removed";
          created_at?: string;
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
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          clinic_id: string | null;
          location_id: string;
          slot_id: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          reason_for_visit: string | null;
          status:
            | "requested"
            | "pending"
            | "confirmed"
            | "completed"
            | "cancelled"
            | "cancelled_by_patient"
            | "cancelled_by_doctor"
            | "no_show"
            | "rescheduled";
          cancellation_reason: string | null;
          cancelled_by: string | null;
          rescheduled_from: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          clinic_id?: string | null;
          location_id: string;
          slot_id?: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          reason_for_visit?: string | null;
          status?:
            | "requested"
            | "pending"
            | "confirmed"
            | "completed"
            | "cancelled"
            | "cancelled_by_patient"
            | "cancelled_by_doctor"
            | "no_show"
            | "rescheduled";
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          rescheduled_from?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          clinic_id?: string | null;
          location_id?: string;
          slot_id?: string | null;
          appointment_date?: string;
          start_time?: string;
          end_time?: string;
          reason_for_visit?: string | null;
          status?:
            | "requested"
            | "pending"
            | "confirmed"
            | "completed"
            | "cancelled"
            | "cancelled_by_patient"
            | "cancelled_by_doctor"
            | "no_show"
            | "rescheduled";
          cancellation_reason?: string | null;
          cancelled_by?: string | null;
          rescheduled_from?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      doctor_patient_relationships: {
        Row: {
          id: string;
          doctor_id: string;
          patient_id: string;
          first_visit_date: string | null;
          last_visit_date: string | null;
          total_visits: number;
          relationship_status: "active" | "inactive" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          patient_id: string;
          first_visit_date?: string | null;
          last_visit_date?: string | null;
          total_visits?: number;
          relationship_status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          patient_id?: string;
          first_visit_date?: string | null;
          last_visit_date?: string | null;
          total_visits?: number;
          relationship_status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
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
      patient_favourite_doctors: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          doctor_id: string | null;
          clinic_id: string | null;
          plan_name: string;
          status:
            | "trialing"
            | "active"
            | "past_due"
            | "cancelled"
            | "expired"
            | "suspended";
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doctor_id?: string | null;
          clinic_id?: string | null;
          plan_name: string;
          status?:
            | "trialing"
            | "active"
            | "past_due"
            | "cancelled"
            | "expired"
            | "suspended";
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doctor_id?: string | null;
          clinic_id?: string | null;
          plan_name?: string;
          status?:
            | "trialing"
            | "active"
            | "past_due"
            | "cancelled"
            | "expired"
            | "suspended";
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          payer_user_id: string | null;
          doctor_id: string | null;
          clinic_id: string | null;
          appointment_id: string | null;
          amount: number;
          currency: string;
          payment_type:
            | "subscription"
            | "appointment"
            | "deposit"
            | "cancellation_fee"
            | "platform_fee"
            | "refund"
            | "adjustment";
          provider: "stripe" | "paytrail" | "manual" | "other";
          provider_payment_id: string | null;
          provider_checkout_id: string | null;
          provider_refund_id: string | null;
          status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
          platform_fee_amount: number;
          provider_fee_amount: number;
          payout_amount: number;
          payout_provider_id: string | null;
          refund_reason: string | null;
          cancellation_policy_snapshot: Json;
          metadata: Json;
          paid_at: string | null;
          refunded_at: string | null;
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payer_user_id?: string | null;
          doctor_id?: string | null;
          clinic_id?: string | null;
          appointment_id?: string | null;
          amount: number;
          currency?: string;
          payment_type:
            | "subscription"
            | "appointment"
            | "deposit"
            | "cancellation_fee"
            | "platform_fee"
            | "refund"
            | "adjustment";
          provider?: "stripe" | "paytrail" | "manual" | "other";
          provider_payment_id?: string | null;
          provider_checkout_id?: string | null;
          provider_refund_id?: string | null;
          status?: "pending" | "paid" | "failed" | "refunded" | "cancelled";
          platform_fee_amount?: number;
          provider_fee_amount?: number;
          payout_amount?: number;
          payout_provider_id?: string | null;
          refund_reason?: string | null;
          cancellation_policy_snapshot?: Json;
          metadata?: Json;
          paid_at?: string | null;
          refunded_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          payer_user_id?: string | null;
          doctor_id?: string | null;
          clinic_id?: string | null;
          appointment_id?: string | null;
          amount?: number;
          currency?: string;
          payment_type?:
            | "subscription"
            | "appointment"
            | "deposit"
            | "cancellation_fee"
            | "platform_fee"
            | "refund"
            | "adjustment";
          provider?: "stripe" | "paytrail" | "manual" | "other";
          provider_payment_id?: string | null;
          provider_checkout_id?: string | null;
          provider_refund_id?: string | null;
          status?: "pending" | "paid" | "failed" | "refunded" | "cancelled";
          platform_fee_amount?: number;
          provider_fee_amount?: number;
          payout_amount?: number;
          payout_provider_id?: string | null;
          refund_reason?: string | null;
          cancellation_policy_snapshot?: Json;
          metadata?: Json;
          paid_at?: string | null;
          refunded_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          subscription_id: string | null;
          doctor_id: string | null;
          clinic_id: string | null;
          amount: number;
          currency: string;
          invoice_url: string | null;
          provider_invoice_id: string | null;
          provider_payment_id: string | null;
          period_start: string | null;
          period_end: string | null;
          status: "draft" | "open" | "paid" | "void" | "uncollectible";
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id?: string | null;
          doctor_id?: string | null;
          clinic_id?: string | null;
          amount: number;
          currency?: string;
          invoice_url?: string | null;
          provider_invoice_id?: string | null;
          provider_payment_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          status?: "draft" | "open" | "paid" | "void" | "uncollectible";
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string | null;
          doctor_id?: string | null;
          clinic_id?: string | null;
          amount?: number;
          currency?: string;
          invoice_url?: string | null;
          provider_invoice_id?: string | null;
          provider_payment_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          status?: "draft" | "open" | "paid" | "void" | "uncollectible";
          created_at?: string;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          event_type: string;
          processed_at: string;
          payload: Record<string, unknown>;
        };
        Insert: {
          id: string;
          event_type: string;
          processed_at?: string;
          payload?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          event_type?: string;
          processed_at?: string;
          payload?: Record<string, unknown>;
        };
        Relationships: [];
      };
      user_reports: {
        Row: {
          id: string;
          reporter_user_id: string;
          reported_user_id: string;
          appointment_id: string | null;
          reason: string;
          status: "open" | "under_review" | "resolved" | "dismissed";
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_user_id: string;
          reported_user_id: string;
          appointment_id?: string | null;
          reason: string;
          status?: "open" | "under_review" | "resolved" | "dismissed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_user_id?: string;
          reported_user_id?: string;
          appointment_id?: string | null;
          reason?: string;
          status?: "open" | "under_review" | "resolved" | "dismissed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type:
            | "appointment"
            | "payment"
            | "subscription"
            | "system"
            | "verification";
          event:
            | "patient_appointment_booked"
            | "patient_appointment_confirmed"
            | "patient_appointment_cancelled"
            | "patient_appointment_rescheduled"
            | "patient_appointment_reminder"
            | "patient_review_request"
            | "doctor_new_appointment_booking"
            | "doctor_appointment_cancelled_by_patient"
            | "doctor_appointment_reminder"
            | "doctor_verification_approved"
            | "doctor_verification_rejected"
            | "doctor_subscription_payment_failed"
            | "doctor_subscription_renewal_reminder"
            | "clinic_new_clinic_appointment"
            | "clinic_doctor_added_to_clinic"
            | "clinic_subscription_warning"
            | "admin_new_doctor_verification_request"
            | "admin_reported_profile"
            | "admin_failed_payment_event"
            | null;
          read_status: "unread" | "read";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type?:
            | "appointment"
            | "payment"
            | "subscription"
            | "system"
            | "verification";
          event?:
            | "patient_appointment_booked"
            | "patient_appointment_confirmed"
            | "patient_appointment_cancelled"
            | "patient_appointment_rescheduled"
            | "patient_appointment_reminder"
            | "patient_review_request"
            | "doctor_new_appointment_booking"
            | "doctor_appointment_cancelled_by_patient"
            | "doctor_appointment_reminder"
            | "doctor_verification_approved"
            | "doctor_verification_rejected"
            | "doctor_subscription_payment_failed"
            | "doctor_subscription_renewal_reminder"
            | "clinic_new_clinic_appointment"
            | "clinic_doctor_added_to_clinic"
            | "clinic_subscription_warning"
            | "admin_new_doctor_verification_request"
            | "admin_reported_profile"
            | "admin_failed_payment_event"
            | null;
          read_status?: "unread" | "read";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          type?:
            | "appointment"
            | "payment"
            | "subscription"
            | "system"
            | "verification";
          event?:
            | "patient_appointment_booked"
            | "patient_appointment_confirmed"
            | "patient_appointment_cancelled"
            | "patient_appointment_rescheduled"
            | "patient_appointment_reminder"
            | "patient_review_request"
            | "doctor_new_appointment_booking"
            | "doctor_appointment_cancelled_by_patient"
            | "doctor_appointment_reminder"
            | "doctor_verification_approved"
            | "doctor_verification_rejected"
            | "doctor_subscription_payment_failed"
            | "doctor_subscription_renewal_reminder"
            | "clinic_new_clinic_appointment"
            | "clinic_doctor_added_to_clinic"
            | "clinic_subscription_warning"
            | "admin_new_doctor_verification_request"
            | "admin_reported_profile"
            | "admin_failed_payment_event"
            | null;
          read_status?: "unread" | "read";
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
      create_clinic_profile_for_current_admin: {
        Args: {
          clinic_name: string;
          clinic_email?: string | null;
          clinic_phone?: string | null;
          clinic_website?: string | null;
          clinic_description?: string | null;
        };
        Returns: string;
      };
      clinic_invite_doctor: {
        Args: {
          target_clinic_id: string;
          doctor_email?: string | null;
          doctor_registration_number?: string | null;
          target_role?: "owner" | "admin" | "doctor" | "assistant";
        };
        Returns: string;
      };
      admin_moderate_doctor_profile: {
        Args: {
          target_doctor_id: string;
          target_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null;
          target_is_public?: boolean | null;
          moderation_note?: string | null;
        };
        Returns: void;
      };
      admin_review_user_report: {
        Args: {
          target_report_id: string;
          target_status: Database["public"]["Enums"]["report_status"];
          review_note?: string | null;
        };
        Returns: void;
      };
      create_patient_review: {
        Args: {
          target_appointment_id: string;
          target_rating: number;
          review_comment?: string | null;
          make_comment_public?: boolean;
        };
        Returns: string;
      };
      admin_hide_review: {
        Args: {
          target_review_id: string;
          moderation_note?: string | null;
        };
        Returns: void;
      };
      record_doctor_profile_view: {
        Args: {
          target_doctor_id: string;
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
      cancel_patient_appointment: {
        Args: {
          target_appointment_id: string;
          cancellation_reason?: string | null;
        };
        Returns: void;
      };
      create_doctor_availability_with_slots: {
        Args: {
          target_location_id: string;
          target_date: string;
          target_start_time: string;
          target_end_time: string;
          target_appointment_duration_minutes: number;
          target_break_minutes: number;
          target_max_patients: number;
          target_consultation_type: "in_person" | "video" | "phone";
          target_is_active: boolean;
        };
        Returns: string;
      };
      update_doctor_availability_with_slots: {
        Args: {
          target_availability_id: string;
          target_location_id: string;
          target_date: string;
          target_start_time: string;
          target_end_time: string;
          target_appointment_duration_minutes: number;
          target_break_minutes: number;
          target_max_patients: number;
          target_consultation_type: "in_person" | "video" | "phone";
          target_is_active: boolean;
        };
        Returns: string;
      };
      delete_doctor_availability_if_unbooked: {
        Args: {
          target_availability_id: string;
        };
        Returns: void;
      };
      update_doctor_slot_status: {
        Args: {
          target_slot_id: string;
          target_status: "available" | "held" | "booked" | "blocked" | "cancelled";
        };
        Returns: void;
      };
      get_owned_doctor_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      doctor_confirm_appointment: {
        Args: {
          target_appointment_id: string;
        };
        Returns: void;
      };
      doctor_cancel_appointment: {
        Args: {
          target_appointment_id: string;
          cancellation_reason?: string | null;
        };
        Returns: void;
      };
      doctor_mark_appointment_completed: {
        Args: {
          target_appointment_id: string;
        };
        Returns: void;
      };
      record_completed_doctor_patient_relationship: {
        Args: {
          target_doctor_id: string;
          target_patient_id: string;
          target_visit_date: string;
        };
        Returns: void;
      };
      create_app_notification: {
        Args: {
          target_user_id: string;
          target_event:
            Database["public"]["Enums"]["notification_event"];
          notification_title: string;
          notification_body: string;
          target_type?: Database["public"]["Enums"]["notification_type"] | null;
        };
        Returns: string;
      };
      infer_notification_type: {
        Args: {
          target_event:
            Database["public"]["Enums"]["notification_event"];
        };
        Returns: Database["public"]["Enums"]["notification_type"];
      };
      doctor_mark_patient_no_show: {
        Args: {
          target_appointment_id: string;
        };
        Returns: void;
      };
      doctor_reschedule_appointment: {
        Args: {
          target_appointment_id: string;
          target_slot_id: string;
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
      verification_status:
        | "pending"
        | "approved"
        | "rejected"
        | "needs_review"
        | "suspended";
      report_status: "open" | "under_review" | "resolved" | "dismissed";
      consultation_type: "in_person" | "video" | "phone";
      slot_status: "available" | "held" | "booked" | "blocked" | "cancelled";
      appointment_status:
        | "requested"
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "cancelled_by_patient"
        | "cancelled_by_doctor"
        | "no_show"
        | "rescheduled";
      notification_type:
        | "appointment"
        | "payment"
        | "subscription"
        | "system"
        | "verification";
      notification_event:
        | "patient_appointment_booked"
        | "patient_appointment_confirmed"
        | "patient_appointment_cancelled"
        | "patient_appointment_rescheduled"
        | "patient_appointment_reminder"
        | "patient_review_request"
        | "doctor_new_appointment_booking"
        | "doctor_appointment_cancelled_by_patient"
        | "doctor_appointment_reminder"
        | "doctor_verification_approved"
        | "doctor_verification_rejected"
        | "doctor_subscription_payment_failed"
        | "doctor_subscription_renewal_reminder"
        | "clinic_new_clinic_appointment"
        | "clinic_doctor_added_to_clinic"
        | "clinic_subscription_warning"
        | "admin_new_doctor_verification_request"
        | "admin_reported_profile"
        | "admin_failed_payment_event";
      notification_read_status: "unread" | "read";
      patient_relationship_status: "active" | "inactive" | "archived";
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
        | "suspended";
      payment_type:
        | "subscription"
        | "appointment"
        | "deposit"
        | "cancellation_fee"
        | "platform_fee"
        | "refund"
        | "adjustment";
      payment_provider: "stripe" | "paytrail" | "manual" | "other";
      payment_status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
      invoice_status: "draft" | "open" | "paid" | "void" | "uncollectible";
    };
    CompositeTypes: Record<string, never>;
  };
};
