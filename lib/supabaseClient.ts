import { createClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG } from './config';

// Safely access Vercel/production environment variables.
// Fix: Cast `import.meta` to `any` to avoid TypeScript errors when Vite client types are not available.
const supabaseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env.VITE_SUPABASE_URL : undefined;
const supabaseAnonKey = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY : undefined;

let urlToUse: string;
let anonKeyToUse: string;

if (supabaseUrl && supabaseAnonKey) {
  // Use Vercel/production environment variables if they exist.
  urlToUse = supabaseUrl;
  anonKeyToUse = supabaseAnonKey;
} else {
  // Otherwise, fall back to the local config file for development.
  urlToUse = SUPABASE_CONFIG.url;
  anonKeyToUse = SUPABASE_CONFIG.anonKey;
}

// The UI in App.tsx handles the case where credentials are not provided
// by showing a helpful configuration notice. We initialize with empty strings
// to prevent a hard crash here, allowing that notice to render.
export const supabase = createClient(urlToUse || '', anonKeyToUse || '');