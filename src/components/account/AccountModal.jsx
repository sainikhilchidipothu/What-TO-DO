// Sign-in / create-account and the signed-in account view. Only rendered when
// Supabase is configured; the header button that opens it is hidden otherwise.
// Modes: password sign-in, create account, email link, forgot password, and
// "set a new password" after a reset link.

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { friendlyAuthError } from '../../hooks/useAuth.js'

const SYNC_LABEL = {
  idle: '',
  syncing: 'Syncing…',
  synced: 'All changes synced',
  error: 'Offline, changes saved on this device',
}

const INPUT = 'w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-sans text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors'
const PRIMARY = 'w-full py-3 rounded-lg bg-accent text-zinc-950 hover:brightness-110 disabled:opacity-60 cursor-pointer font-sans text-[13px] font-black tracking-wide transition-all duration-150'
const SECONDARY = 'w-full py-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 cursor-pointer font-sans text-[13px] font-bold tracking-wide transition-all duration-150'
const LINK = 'bg-transparent border-none p-0 cursor-pointer font-sans text-xs text-accent hover:underline'
const MIN_PASSWORD = 6

const TABS = [
  { id: 'signin', label: 'Sign in' },
  { id: 'signup', label: 'Create account' },
  { id: 'magic', label: 'Email link' },
]

function Notice({ title, children }) {
  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-5 text-center">
      <p className="font-sans text-sm text-white font-bold mb-1">{title}</p>
      <p className="font-sans text-[13px] text-zinc-400 leading-relaxed break-words">{children}</p>
    </div>
  )
}

function SetPasswordForm({ auth, label, onDone }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (pw.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`)
    if (pw !== pw2) return setError('Passwords do not match.')
    setBusy(true)
    setError('')
    const { error: err } = await auth.updatePassword(pw)
    setBusy(false)
    if (err) return setError(friendlyAuthError(err))
    setDone(true)
    setPw('')
    setPw2('')
    onDone?.()
  }

  if (done) return <p className="font-sans text-xs text-green-400">Password saved. You can sign in with it on any device.</p>

  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" aria-label="New password" className={INPUT} />
      <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm new password" aria-label="Confirm new password" className={INPUT} />
      {error && <p className="font-sans text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={busy} className={PRIMARY}>{busy ? 'Saving…' : label}</button>
    </form>
  )
}

export function AccountModal({ auth, syncStatus, onClose }) {
  const { user } = auth
  const [mode, setMode] = useState('signin') // signin | signup | magic | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState('') // message shown after an email goes out
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(auth.urlError || '')
  const [showSetPw, setShowSetPw] = useState(false)

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setSent('')
    auth.clearUrlError?.()
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Enter your email.')
    if ((mode === 'signin' || mode === 'signup') && !password) return setError('Enter your password.')
    if (mode === 'signup' && password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`)

    setBusy(true)
    setError('')
    auth.clearUrlError?.()
    try {
      if (mode === 'signin') {
        const { error: err } = await auth.signInWithPassword(email, password)
        if (err) throw err
        onClose()
      } else if (mode === 'signup') {
        const { data, error: err } = await auth.signUp(email, password)
        if (err) throw err
        // Supabase returns a user with no identities when the email is already
        // registered (and confirm-email is on), instead of an error.
        if (data?.user && data.user.identities?.length === 0) {
          throw new Error('User already registered')
        }
        if (data?.session) onClose() // confirm-email is off: signed straight in
        else setSent(`We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.`)
      } else if (mode === 'magic') {
        const { error: err } = await auth.signInWithEmail(email)
        if (err) throw err
        setSent(`We sent a sign-in link to ${email.trim()}. Open it in this same browser to finish signing in.`)
      } else if (mode === 'forgot') {
        const { error: err } = await auth.sendPasswordReset(email)
        if (err) throw err
        setSent(`If ${email.trim()} has an account, a reset link is on its way. Open it in this browser to choose a new password.`)
      }
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  // ── Supabase keys missing from this build ───────────────────────────────
  if (!auth.configured) {
    return (
      <ModalShell onClose={onClose} width={440}>
        <h2 id="modal-title" className="font-sans text-xl font-black text-white tracking-wide mb-1">Sign-in isn't set up yet</h2>
        <p className="font-sans text-[13px] text-zinc-400 mb-4 leading-relaxed">
          This build of the app doesn't have its Supabase keys, so accounts are turned off. Your data is still saved on this device.
        </p>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 font-sans text-[12px] text-zinc-300 leading-relaxed space-y-2">
          <p>Add these two variables, then rebuild:</p>
          <p className="font-mono text-accent break-all">VITE_SUPABASE_URL<br />VITE_SUPABASE_ANON_KEY</p>
          <p><span className="text-white font-bold">Running locally:</span> put them in <span className="font-mono">.env.local</span> in the project folder and restart <span className="font-mono">npm run dev</span>.</p>
          <p><span className="text-white font-bold">On Vercel:</span> Settings → Environment Variables, then redeploy.</p>
        </div>
        <button type="button" onClick={onClose} className={`${SECONDARY} mt-4`}>Close</button>
      </ModalShell>
    )
  }

  // ── Arrived from a password-reset link ──────────────────────────────────
  if (user && auth.recovering) {
    return (
      <ModalShell onClose={onClose} width={440}>
        <h2 id="modal-title" className="font-sans text-xl font-black text-white tracking-wide mb-1">Choose a new password</h2>
        <p className="font-sans text-[13px] text-zinc-400 mb-6 leading-relaxed">Signed in as {user.email}. Set a new password to finish.</p>
        <SetPasswordForm auth={auth} label="Save new password" />
      </ModalShell>
    )
  }

  // ── Signed in ───────────────────────────────────────────────────────────
  if (user) {
    return (
      <ModalShell onClose={onClose} width={440}>
        <h2 id="modal-title" className="font-sans text-xl font-black text-white tracking-wide mb-1">Your account</h2>
        <p className="font-sans text-[13px] text-zinc-400 mb-6 leading-relaxed">Your progress syncs across every device you sign in on.</p>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="font-sans text-[10px] uppercase tracking-[0.2em] text-accent font-black mb-1">Signed in as</div>
            <div className="font-sans text-sm text-white font-bold break-all">{user.email}</div>
            {SYNC_LABEL[syncStatus] && (
              <div className={`mt-2 font-sans text-xs ${syncStatus === 'error' ? 'text-amber-400' : 'text-zinc-500'}`}>
                {SYNC_LABEL[syncStatus]}
              </div>
            )}
          </div>

          {showSetPw ? (
            <SetPasswordForm auth={auth} label="Save password" />
          ) : (
            <button type="button" onClick={() => setShowSetPw(true)} className={LINK}>Set or change password</button>
          )}

          <button onClick={async () => { await auth.signOut(); onClose() }} className={SECONDARY}>Sign out</button>
          <p className="font-sans text-[11px] text-zinc-600 leading-relaxed">
            Signing out keeps your data on this device. It just stops syncing until you sign back in.
          </p>
        </div>
      </ModalShell>
    )
  }

  // ── Signed out ──────────────────────────────────────────────────────────
  const usesPassword = mode === 'signin' || mode === 'signup'
  const submitLabel = {
    signin: busy ? 'Signing in…' : 'Sign in',
    signup: busy ? 'Creating account…' : 'Create account',
    magic: busy ? 'Sending…' : 'Send sign-in link',
    forgot: busy ? 'Sending…' : 'Send reset link',
  }[mode]

  return (
    <ModalShell onClose={onClose} width={440}>
      <h2 id="modal-title" className="font-sans text-xl font-black text-white tracking-wide mb-1">
        {mode === 'forgot' ? 'Reset password' : mode === 'signup' ? 'Create your account' : 'Sign in'}
      </h2>
      <p className="font-sans text-[13px] text-zinc-400 mb-5 leading-relaxed">
        Keep your goals, tasks, and journal in sync across devices. Everything keeps working offline either way.
      </p>

      {mode !== 'forgot' && (
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => switchMode(t.id)}
              className={`flex-1 py-2 rounded-md border-none cursor-pointer font-sans text-[11px] font-black tracking-wide transition-colors ${mode === t.id ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {sent ? (
        <div className="space-y-3">
          <Notice title="Check your email">{sent}</Notice>
          <button type="button" onClick={() => switchMode('signin')} className={SECONDARY}>Back to sign in</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className={INPUT}
          />
          {usesPassword && (
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? `Password (min ${MIN_PASSWORD} characters)` : 'Password'}
              aria-label="Password"
              className={INPUT}
            />
          )}
          {error && <p className="font-sans text-xs text-red-400" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className={PRIMARY}>{submitLabel}</button>

          <div className="flex justify-between items-center pt-1">
            {mode === 'signin' && <button type="button" onClick={() => switchMode('forgot')} className={LINK}>Forgot password?</button>}
            {mode === 'forgot' && <button type="button" onClick={() => switchMode('signin')} className={LINK}>Back to sign in</button>}
          </div>
          {mode === 'magic' && (
            <p className="font-sans text-[11px] text-zinc-600 leading-relaxed">
              No password needed. We email you a link; new emails get an account automatically.
            </p>
          )}
        </form>
      )}
    </ModalShell>
  )
}
