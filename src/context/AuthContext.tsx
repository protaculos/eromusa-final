"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  credits: number | null;
  role: string | null;
  isAdmin: boolean;
  loading: boolean;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  credits: null,
  role: null,
  isAdmin: false,
  loading: true,
  refreshCredits: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('credits, role')
      .eq('id', userId)
      .single();
    if (data) {
      setCredits(data.credits);
      setRole(data.role || 'client');
    }
  };

  const refreshCredits = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setSession(session);
      if (currentUser) fetchProfile(currentUser.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setSession(session);
      if (currentUser) fetchProfile(currentUser.id);
      else {
        setCredits(null);
        setRole(null);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, credits, role, isAdmin, loading, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
