import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { signOut as signOutService } from "@/services/auth.service";
import { getProfile } from "@/services/profile.service";
import type { Profile } from "@/types/profile";
import { normalizeRole, type UserRole } from "@/types/roles";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (userId: string) => {
    const nextProfile = await getProfile(userId);
    setProfile(nextProfile);
  }, []);

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      setIsLoading(true);
      setSession(nextSession);

      if (!nextSession?.user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        await loadProfile(nextSession.user.id);
      } catch (error) {
        console.warn("Unable to load profile", error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    },
    [loadProfile]
  );

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn("Unable to restore Supabase session", error);
        setIsLoading(false);
        return;
      }

      void applySession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        void applySession(nextSession);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }

    await loadProfile(session.user.id);
  }, [loadProfile, session?.user.id]);

  const handleSignOut = useCallback(async () => {
    await signOutService();
    setSession(null);
    setProfile(null);
  }, []);

  const role = useMemo<UserRole>(() => {
    if (!session) {
      return "guest";
    }

    return (
      profile?.role ??
      normalizeRole(session.user.user_metadata?.role) ??
      "patient"
    );
  }, [profile?.role, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role,
      isLoading,
      refreshProfile,
      signOut: handleSignOut
    }),
    [handleSignOut, isLoading, profile, refreshProfile, role, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
