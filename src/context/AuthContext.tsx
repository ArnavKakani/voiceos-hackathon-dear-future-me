import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type AuthError, type User, type Session } from '@supabase/supabase-js';
import supabase from '../supabase/client';

type AuthActionResult = { data: unknown; error: AuthError | null };

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sendMagicLink: (email: string, createAccount?: boolean, name?: string) => Promise<AuthActionResult>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  sendMagicLink: async () => ({ data: null, error: null }),
  resetPassword: async () => ({ data: null, error: null }),
  updatePassword: async () => ({ data: null, error: null }),
  signOut: async () => {},
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMagicLink = async (email: string, createAccount = false, name = '') => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: createAccount,
        emailRedirectTo: `${window.location.origin}/notebook`,
        data: name.trim() ? { name: name.trim() } : undefined,
      },
    });
    return { data, error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    return { data, error };
  };

  const updatePassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // login/logout kept as aliases so Navbar compiles until step 5 replaces them
  const login = () => {};
  const logout = () => { signOut(); };

  return (
    <AuthContext.Provider value={{ user, session, loading, sendMagicLink, resetPassword, updatePassword, signOut, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
