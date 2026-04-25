import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }

  useEffect(() => {
    let cancelled = false;

    // Safety net: if getSession() hangs (rare network edge case), unblock the
    // UI after 5s. We do NOT sign out here — the session may still be valid;
    // we just stop showing the loading screen so the user can interact.
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.warn('[auth] getSession timed out — unblocking UI');
        setLoading(false);
      }
    }, 5000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).catch((e) =>
            console.warn('[auth] fetchProfile failed', e)
          );
        }
      })
      .catch((e) => console.warn('[auth] getSession failed', e))
      .finally(() => {
        clearTimeout(timeoutId);
        if (!cancelled) setLoading(false);
      });

    // IMPORTANT: do NOT await Supabase queries inside this callback. The auth
    // library holds an internal lock for the duration of the callback, and
    // any `supabase.from(...)` call needs that same lock to attach the auth
    // header — awaiting here deadlocks on tab refresh / new tab where the
    // INITIAL_SESSION event fires synchronously with a persisted session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userId = session.user.id;
        setTimeout(() => {
          fetchProfile(userId).catch((e) =>
            console.warn('[auth] fetchProfile failed', e)
          );
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(phone: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.role === 'admin',
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
