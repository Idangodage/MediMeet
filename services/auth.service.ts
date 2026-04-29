import { getSupabase } from "@/lib/supabase";

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = SignInCredentials & {
  fullName: string;
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

export async function signUpPatient({
  email,
  password,
  fullName
}: SignUpCredentials): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "patient"
      }
    }
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
