// ─── Cloud state access ─────────────────────────────────────────────────────
// Reads/writes the single JSONB row that holds a user's entire app state.
// One row per user, keyed by auth user id, guarded by Row-Level Security.

import { supabase } from './supabase.js'

const TABLE = 'user_state'

/** Returns the user's stored state object, or null if they have no row yet. */
export async function fetchCloudState(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.data ?? null
}

/** Upserts the user's full state blob. */
export async function pushCloudState(userId, state) {
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: userId, data: state, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
  if (error) throw error
}
