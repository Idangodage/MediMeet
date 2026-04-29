import { getSupabase } from "@/lib/supabase";
import { mapProfileRow, type Profile } from "@/types/profile";
import type { AuthenticatedRole } from "@/types/roles";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data) : null;
}

export async function updateOwnProfile(values: {
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
}): Promise<void> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to update your profile.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName,
      phone: values.phone,
      avatar_url: values.avatarUrl
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }
}

export async function getOnboardingStatus(
  userId: string,
  role: AuthenticatedRole
): Promise<boolean> {
  const supabase = getSupabase();

  if (role === "platform_admin") {
    return true;
  }

  if (role === "patient") {
    const { data, error } = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  }

  if (role === "doctor") {
    const { data, error } = await supabase
      .from("doctor_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  }

  const { data, error } = await supabase
    .from("clinic_admin_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (error) {
    throw error;
  }

  return data.length > 0;
}
