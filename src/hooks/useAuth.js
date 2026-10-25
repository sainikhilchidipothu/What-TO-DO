// Wrapper over Supabase Auth. Supports email + password (sign in / create
// account), email magic links, and password reset. When Supabase isn't
// configured it reports configured: false with no-op actions, so the app runs
// offline only.

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const notConfigured = () => ({ data: null, error: new Error('Sign-in is not set up for this build (missing Supabase keys).') })

// Supabase puts auth failures (expired / already-used link, bad redirect) in
// the URL hash or query after a redirect. Read them once and clean the URL so
// the user sees a real message instead of nothing happening.
function readUrlAuthError() {
  if (typeof window === 'undefined') return ''
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const desc = hash.get('error_description') || query.get('error_description')
  const code = hash.get('error_code') || query.get('error_code')
  if (!desc && !code) return ''
  window.history.replaceState(null, '', window.location.pathname)
  if (code === 'otp_expired') return 'That sign-in link has expired or was already used. Request a new one.'
  return (desc || 'Sign-in failed.').replace(/\+/g, ' ')
}

// Turn Supabase's raw messages into something a person can act on.
export function friendlyAuthError(err) {
  if (!err) return ''
  const msg = err.message || String(err)
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password. If you only ever used email links, use "Forgot password?" to set one.'
  if (/email not confirmed/i.test(msg)) return 'Your email is not confirmed yet. Open the confirmation email Supabase sent you, then sign in.'
  if (/user already registered/i.test(msg)) return 'An account with this email already exists. Sign in instead.'
  if (/rate limit|too many|security purposes/i.test(msg)) return 'Too many emails sent in a short time. Wait a few minutes and try again.'
  if (/password should be at least/i.test(msg)) return msg
  if (/signups not allowed/i.test(msg)) return 'New sign-ups are turned off for this app.'
  if (/failed to fetch|network/i.test(msg)) return 'Could not reach the server. Check your connection.'
  return msg
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [urlError, setUrlError] = useState(() => (isSupabaseConfigured ? readUrlAuthError() : ''))
  // True after the user clicks a password-reset link; the UI then asks for a new password.
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setUrlError(friendlyAuthError(error))
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined

  const signInWithPassword = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return notConfigured()
    return supabase.auth.signInWithPassword({ email: email.trim(), password })
  }, [])

  const signUp = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return notConfigured()
    return supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    })
  }, [redirectTo])

  const signInWithEmail = useCallback(async (email) => {
    if (!isSupabaseConfigured) return notConfigured()
    return supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })
  }, [redirectTo])

  const sendPasswordReset = useCallback(async (email) => {
    if (!isSupabaseConfigured) return notConfigured()
    return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
  }, [redirectTo])

  const updatePassword = useCallback(async (password) => {
    if (!isSupabaseConfigured) return notConfigured()
    const res = await supabase.auth.updateUser({ password })
    if (!res.error) setRecovering(false)
    return res
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
    urlError,
    clearUrlError: () => setUrlError(''),
    recovering,
    signInWithPassword,
    signUp,
    signInWithEmail,
    sendPasswordReset,
    updatePassword,
    signOut,
  }
}
