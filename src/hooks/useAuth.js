// Wrapper over Supabase Auth (email magic link). When Supabase isn't
// configured it reports configured: false with no-op actions, so the UI hides
// the account controls and the app runs offline only.

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: new Error('Sync is not configured.') }
    return supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }, [])

  return {
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    loading,
    signInWithEmail,
    signOut,
  }
}
