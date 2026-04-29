import type { AuthenticatedRole } from "./roles";

export type Profile = {
  id: string;
  role: AuthenticatedRole;
  fullName: string | null;
  avatarPath: string | null;
  clinicId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileRow = {
  id: string;
  role: AuthenticatedRole;
  full_name: string | null;
  avatar_path: string | null;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    avatarPath: row.avatar_path,
    clinicId: row.clinic_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
