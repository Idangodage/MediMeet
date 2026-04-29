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
          avatar_path: string | null;
          clinic_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AuthenticatedRole;
          full_name?: string | null;
          avatar_path?: string | null;
          clinic_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AuthenticatedRole;
          full_name?: string | null;
          avatar_path?: string | null;
          clinic_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AuthenticatedRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
