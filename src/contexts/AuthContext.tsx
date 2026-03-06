import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  user_id: string;
  role: 'caregiver' | 'patient';
  name: string;
  phone: string;
};

type PatientRecord = {
  id: string;
  patient_id_unique: string;
  name: string;
  age: number | null;
  caregiver_id: string | null;
  user_id: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  patientRecord: PatientRecord | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshPatientRecord: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(data as Profile | null);
    return data as Profile | null;
  };

  const fetchPatientRecord = async (userId: string) => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setPatientRecord(data as PatientRecord | null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshPatientRecord = async () => {
    if (user) await fetchPatientRecord(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        if (p?.role === 'patient') {
          await fetchPatientRecord(session.user.id);
        }
      } else {
        setProfile(null);
        setPatientRecord(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(p => {
          if (p?.role === 'patient') {
            fetchPatientRecord(session.user.id);
          }
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPatientRecord(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, patientRecord, loading, signUp, signIn, signOut, refreshProfile, refreshPatientRecord }}>
      {children}
    </AuthContext.Provider>
  );
};
