// This file defines the Cross-Origin Resource Sharing (CORS) headers.
// It's a security feature that tells the browser it's okay for your Vercel app 
// to make requests to your Supabase function.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}