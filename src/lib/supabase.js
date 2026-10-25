// Supabase client. Stays null when the env vars aren't set, so the app runs
// fully offline with no accounts. The anon key is safe in the frontend (it's
// limited by Row-Level Security); keep it in env vars, not hardcoded.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Without these the Sign in button is hidden entirely. On Vercel, add both
  // vars under Settings → Environment Variables and redeploy.
  console.info('[What-TO-DO] Sign-in disabled: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set at build time.')
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // needed for the magic-link redirect
      },
    })
  : null
