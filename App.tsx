import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { isConfigured as isLocalConfigured } from './lib/config';
import { UserProfile, TeenProfile } from './types';
import Auth from './components/Auth';
import ChatPage from './components/ChatPage';
import TherapistDashboard from './components/TherapistDashboard';
import ConfigurationNotice from './components/ConfigurationNotice';
import { AegisIcon } from './components/Icons';

type UserRole = 'student' | 'psychiatrist' | null;

const App: React.FC = () => {
  const isVercelConfigured = 
    (typeof import.meta !== 'undefined' && (import.meta as any).env) &&
    (import.meta as any).env.VITE_SUPABASE_URL && 
    (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  
  const isAppConfigured = isVercelConfigured || isLocalConfigured;

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setRole(session?.user?.user_metadata?.role ?? null);
      // We set loading to false here initially, the next effect will handle profile loading
      if (!session) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setProfile(null); // Reset profile on auth change
      const newRole = session?.user?.user_metadata?.role ?? null;
      setRole(newRole);
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user && !profile && role) {
      setIsLoading(true);
      setError(null);

      const fetchProfile = async () => {
        try {
          const tableName = role === 'student' ? 'teens' : 'therapists';
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          setProfile(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load profile.');
          // Log out user if profile doesn't exist, could be a DB inconsistency
          await supabase.auth.signOut();
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    }
  }, [session, profile, role]);

  if (!isAppConfigured) {
    return <ConfigurationNotice />;
  }

  if (!session) {
    return <Auth />;
  }

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
        <AegisIcon className="w-16 h-16 animate-pulse" />
        <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>
          {error ? error : 'Loading your session...'}
        </p>
      </div>
    );
  }

  return (
    <Routes>
      {role === 'student' && (
        <Route path="/chat" element={<ChatPage session={session} initialProfile={profile as TeenProfile} />} />
      )}
      {role === 'psychiatrist' && (
        <Route path="/dashboard" element={<TherapistDashboard />} />
      )}
      <Route
        path="*"
        element={<Navigate to={role === 'psychiatrist' ? '/dashboard' : '/chat'} replace />}
      />
    </Routes>
  );
};

export default App;