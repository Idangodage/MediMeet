import type { AuthenticatedRole } from "./roles";

export type Profile = {
  id: string;
  role: AuthenticatedRole;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileRow = {
  id: string;
  role: AuthenticatedRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
