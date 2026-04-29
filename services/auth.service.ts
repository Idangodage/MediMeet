import { getSupabase } from "@/lib/supabase";
import type { AuthenticatedRole } from "@/types/roles";

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = SignInCredentials & {
  fullName: string;
  role: Exclude<AuthenticatedRole, "platform_admin">;
};

export async function signInWithEmail({
  email,
  password
}: SignInCredentials): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }
}

export type SignUpResult = {
  needsEmailConfirmation: boolean;
};

export async function signUpWithEmail({
  email,
  password,
  fullName,
  role
}: SignUpCredentials): Promise<SignUpResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role
      }
    }
  });

  if (error) {
    throw error;
  }

  return {
    needsEmailConfirmation: !data.session
  };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
