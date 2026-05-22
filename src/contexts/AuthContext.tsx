import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserType, UserProfile } from "@/types/subscription";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signUp: (phone: string, password: string, name: string, userType: UserType) => Promise<{ error: Error | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getUserProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Compose a UserProfile from the existing tables:
   *  - profiles (name/email)
   *  - user_account_types (buyer | business + trial dates)
   *  - subscriptions (active plan, if any)
   */
  const getUserProfileInternal = useCallback(async (
    userId: string,
    metadataAccountType?: UserType
  ): Promise<UserProfile | null> => {
    try {
      let [{ data: acct }, { data: sub }] = await Promise.all([
        supabase
          .from("user_account_types")
          .select("account_type, trial_end_date")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("plan, status, end_date")
          .eq("user_id", userId)
          .in("status", ["active", "trial"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const inferredUserType: UserType = metadataAccountType === "buyer" ? "buyer" : "business";
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 30 * 86400000);

      if (!acct) {
        const { data: createdAcct } = await supabase
          .from("user_account_types")
          .upsert({
            user_id: userId,
            account_type: inferredUserType,
            trial_start_date: inferredUserType === "business" ? trialStart.toISOString() : null,
            trial_end_date: inferredUserType === "business" ? trialEnd.toISOString() : null,
          }, { onConflict: "user_id" })
          .select("account_type, trial_end_date")
          .maybeSingle();
        acct = createdAcct || {
          account_type: inferredUserType,
          trial_end_date: inferredUserType === "business" ? trialEnd.toISOString() : null,
        };
      } else if (acct.account_type === "business" && !acct.trial_end_date && !sub) {
        const { data: updatedAcct } = await supabase
          .from("user_account_types")
          .update({
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
          })
          .eq("user_id", userId)
          .select("account_type, trial_end_date")
          .maybeSingle();
        acct = updatedAcct || { ...acct, trial_end_date: trialEnd.toISOString() };
      }

      const userType: UserType = (acct?.account_type as UserType) || "business";
      const subscription_tier = sub?.plan === "yearly"
        ? "premium_yearly"
        : sub?.plan === "monthly"
          ? "premium_monthly"
          : (sub?.plan as any) || "free";

      let subscription_status: any = "inactive";
      if (sub?.status === "active") {
        const subEnd = sub.end_date ? new Date(sub.end_date) : null;
        subscription_status = !subEnd || subEnd > new Date() ? "active" : "inactive";
      } else if (sub?.status === "trial") {
        const subEnd = sub.end_date ? new Date(sub.end_date) : null;
        subscription_status = subEnd && subEnd > new Date() ? "trial" : "inactive";
      } else if (acct?.trial_end_date) {
        subscription_status = new Date(acct.trial_end_date) > new Date() ? "trial" : "inactive";
      }

      return {
        id: userId,
        user_type: userType,
        subscription_tier,
        subscription_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (e) {
      console.warn("getUserProfileInternal failed", e);
      return {
        id: userId,
        user_type: "business",
        subscription_tier: "free",
        subscription_status: "inactive",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }, []);

  const refreshUserProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setUserProfile(null);
      return;
    }

    const profile = await getUserProfileInternal(
      nextUser.id,
      nextUser.user_metadata?.account_type as UserType | undefined
    );
    setUserProfile(profile);
  }, [getUserProfileInternal]);

  useEffect(() => {
    let isMounted = true;

    // Safety net: never let the UI stay in "loading" longer than 4s,
    // even if the network or a stale token stalls getSession().
    const failsafe = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000);

    const bootstrapAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const nextUser = session?.user ?? null;
        setSession(session);
        setUser(nextUser);
        // Fetch profile in the background — don't block the UI on it.
        void refreshUserProfile(nextUser);
      } catch (e) {
        console.warn("bootstrapAuth failed", e);
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(failsafe);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;

      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);
      setUser(nextUser);
      setLoading(false);

      void refreshUserProfile(nextUser);
    });

    void bootstrapAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUserProfile]);

  const signUp = async (phone: string, password: string, name: string, userType: UserType) => {
    try {
      const { phoneToEmail, normalizePhone } = await import("@/lib/phone-auth");
      const norm = normalizePhone(phone);
      if (!norm) return { error: new Error("Tafadhali weka namba sahihi ya simu / Please enter a valid phone number") };
      const email = phoneToEmail(phone);
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, account_type: userType, phone: norm },
          emailRedirectTo: window.location.origin,
        },
      });
      if (authError) return { error: authError as Error };
      // With auto-confirm enabled the session is created immediately,
      // so no email verification step is required.
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (phone: string, password: string) => {
    const { phoneToEmail, normalizePhone } = await import("@/lib/phone-auth");
    const norm = normalizePhone(phone);
    if (!norm) return { error: new Error("Tafadhali weka namba sahihi ya simu / Please enter a valid phone number") };
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem("zeetop.activeBranchId");
    setUser(null);
    setSession(null);
    setUserProfile(null);
    window.location.replace("/welcome");
  };

  const getUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;
    const profile = await getUserProfileInternal(user.id, user.user_metadata?.account_type as UserType | undefined);
    setUserProfile(profile);
    return profile;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userProfile, signUp, signIn, signOut, getUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
