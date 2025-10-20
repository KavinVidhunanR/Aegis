import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AegisIcon } from './Icons';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'psychiatrist'>('student');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        // The database trigger 'on_auth_user_created' now handles profile creation automatically.
        // We pass the 'role' in user metadata so the trigger can create the correct profile type.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            },
          },
        });
        if (error) throw error;
        setMessage('Check your email for the verification link!');
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
            <div className="flex items-center justify-center gap-3">
                <AegisIcon className="w-12 h-12" />
                <div>
                    <h1 className="text-4xl font-bold" style={{ color: 'var(--text-heading)' }}>AEGIS</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Welcome to your safe space</p>
                </div>
            </div>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {isSignUp && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-center text-gray-700">I am a...</label>
              <div className="relative flex justify-center rounded-md" role="group">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`w-full px-4 py-2 text-sm font-medium border rounded-l-md focus:z-10 focus:ring-2 focus:ring-offset-0 focus:ring-red-500 focus:outline-none transition-colors duration-150 ${
                    role === 'student'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('psychiatrist')}
                  className={`w-full px-4 py-2 text-sm font-medium border -ml-px rounded-r-md focus:z-10 focus:ring-2 focus:ring-offset-0 focus:ring-red-500 focus:outline-none transition-colors duration-150 ${
                    role === 'psychiatrist'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Psychiatrist
                </button>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-t-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                className="relative block w-full appearance-none rounded-b-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white disabled:bg-red-300"
              style={{ backgroundColor: 'var(--bg-accent)'}}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign up' : 'Sign in')}
            </button>
          </div>
        </form>
        {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
        {message && <p className="mt-2 text-center text-sm text-green-600">{message}</p>}
        <div className="text-center text-sm">
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} className="font-medium text-red-600 hover:text-red-500">
            {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;