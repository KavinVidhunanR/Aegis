// IMPORTANT: EDIT THIS FILE WITH YOUR SUPABASE CREDENTIALS
// This file is used for your LOCAL DEVELOPMENT.
// Your LIVE DEPLOYMENT on Vercel will use Environment Variables.
// This file is ALREADY in .gitignore, so your keys will not be exposed on GitHub.

export const SUPABASE_CONFIG = {
  // 1. Replace "YOUR_SUPABASE_URL_HERE" with your actual Supabase Project URL
  url: "",

  // 2. Replace "YOUR_SUPABASE_ANON_KEY_HERE" with your Supabase Project "anon" key
  anonKey: "",
};

// This logic checks if you have replaced the placeholder values.
// If you have, the app will load. Otherwise, it will show the setup guide.
export const isConfigured = 
  SUPABASE_CONFIG.url && 
  SUPABASE_CONFIG.anonKey &&
  !SUPABASE_CONFIG.url.includes("YOUR_SUPABASE_URL_HERE") && 
  !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE_ANON_KEY_HERE");
