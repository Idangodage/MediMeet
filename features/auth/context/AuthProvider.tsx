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
import {
  getOnboardingStatus,
  getProfile
} from "@/services/profile.service";
import type { Profile } from "@/types/profile";
import { normalizeRole, type UserRole } from "@/types/roles";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isOnboardingComplete: boolean;
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
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  const loadAccountState = useCallback(async (user: User) => {
    const nextProfile = await getProfile(user.id);
    setProfile(nextProfile);
    const nextRole =
      nextProfile?.role ??
      normalizeRole(user.user_metadata?.role) ??
      "patient";
    const nextOnboardingStatus = await getOnboardingStatus(user.id, nextRole);
    setIsOnboardingComplete(nextOnboardingStatus);
  }, []);

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      setIsLoading(true);
      setSession(nextSession);

      if (!nextSession?.user) {
        setProfile(null);
        setIsOnboardingComplete(false);
        setIsLoading(false);
        return;
      }

      try {
        await loadAccountState(nextSession.user);
      } catch (error) {
        console.warn("Unable to load account state", error);
        setProfile(null);
        setIsOnboardingComplete(false);
      } finally {
        setIsLoading(false);
      }
    },
    [loadAccountState]
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

    await loadAccountState(session.user);
  }, [loadAccountState, session]);

  const handleSignOut = useCallback(async () => {
    await signOutService();
    setSession(null);
    setProfile(null);
    setIsOnboardingComplete(false);
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
      isOnboardingComplete,
      isLoading,
      refreshProfile,
      signOut: handleSignOut
    }),
    [
      handleSignOut,
      isLoading,
      isOnboardingComplete,
      profile,
      refreshProfile,
      role,
      session
    ]
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
