// ─── Supabase client ────────────────────────────────────────────────────────
// Env-gated: the app stays fully offline-first and untouched when these two
// variables are absent (local dev without a `.env.local`, or a deploy with no
// Supabase keys set). The anon key is designed to be exposed in frontend code —
// it only grants what Row-Level Security policies allow — but it still lives in
// env vars (never hardcoded) because this repository is public.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // needed for the magic-link redirect
      },
    })
  : null
