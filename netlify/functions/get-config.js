/**
 * Public configuration endpoint
 * Serves non-sensitive configuration values that are safe for frontend use
 * This allows us to keep the SUPABASE_ANON_KEY in environment variables
 */

export async function handler() {
  // SUPABASE_ANON_KEY is now stored in Netlify env vars only
  // This function serves it safely to the frontend
  const config = {
    supabaseUrl: 'https://tnytkvmfswpupxtlnaad.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(config),
  };
}
