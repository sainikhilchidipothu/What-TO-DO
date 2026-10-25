// Sign-in / create-account and the signed-in profile view. The header menu
// opens it; it also opens on its own after a password-reset or failed email
// link. Modes: password sign-in, create account (asks for a name), email link,
// forgot password, and "set a new password" after a reset link.

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { Avatar } from '../common/Avatar.jsx'
import { friendlyAuthError, accountName } from '../../hooks/useAuth.js'

const SYNC_LABEL = {
  idle: '',
  syncing: 'Syncing…',
  synced: 'All changes synced',
  error: 'Offline, changes saved on this device',
}

const INPUT = 'w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-sans text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors'
const LABEL = 'block font-sans text-[11px] font-bold text-zinc-400 mb-1.5'
const PRIMARY = 'w-full py-3 rounded-lg bg-accent text-zinc-950 hover:brightness-90 disabled:opacity-60 cursor-pointer font-sans text-[13px] font-black tracking-wide transition-all duration-150'
const SECONDARY = 'w-full py-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 cursor-pointer font-sans text-[13px] font-bold tracking-wide transition-all duration-150'
const LINK = 'bg-transparent border-none p-0 cursor-pointer font-sans text-xs text-zinc-300 underline-offset-2 hover:text-white hover:underline'
const MIN_PASSWORD = 6
const MAX_NAME = 40

const TABS = [
  { id: 'signin', label: 'Sign in' },
  { id: 'signup', label: 'Create account' },
]

function Notice({ title, children }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5 text-center">
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

// ── Signed-in profile: name, email, sync, password, sign out ───────────────
function ProfileView({ auth, syncStatus, userName, onSaveName, onClose }) {
  const { user } = auth
  const savedName = accountName(user) || userName
  const [name, setName] = useState(savedName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showSetPw, setShowSetPw] = useState(false)
  const dirty = name.trim() !== savedName

  const saveName = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter your name.')
    setBusy(true)
    setError('')
    const res = await onSaveName(name)
    setBusy(false)
    if (res?.error) return setError(friendlyAuthError(res.error))
    setSaved(true)
  }

  return (
    <ModalShell onClose={onClose} width={440}>
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={savedName} email={user.email} size="lg" />
        <div className="min-w-0">
          <h2 id="modal-title" className="font-sans text-xl font-black text-white truncate">{savedName || 'Your account'}</h2>
          <p className="font-sans text-[13px] text-zinc-400 truncate">{user.email}</p>
        </div>
      </div>

      <div className="space-y-5">
        <form onSubmit={saveName}>
          <label htmlFor="profile-name" className={LABEL}>Name</label>
          <div className="flex gap-2">
            <input
              id="profile-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false) }}
              placeholder="What should we call you?"
              maxLength={MAX_NAME}
              autoComplete="name"
              className={INPUT}
            />
            <button
              type="submit"
              disabled={busy || !dirty}
              className="shrink-0 px-4 rounded-lg bg-accent text-zinc-950 hover:brightness-90 disabled:opacity-40 disabled:cursor-default cursor-pointer font-sans text-xs font-black transition-all"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
          {error && <p className="mt-2 font-sans text-xs text-red-400" role="alert">{error}</p>}
          {saved && !dirty && <p className="mt-2 font-sans text-xs text-green-400">Name saved to your account.</p>}
        </form>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-center gap-3">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${syncStatus === 'error' ? 'bg-amber-400' : syncStatus === 'syncing' ? 'bg-zinc-400 animate-pulse' : 'bg-green-500'}`}
            aria-hidden="true"
          />
          <p className={`font-sans text-xs ${syncStatus === 'error' ? 'text-amber-400' : 'text-zinc-300'}`}>
            {SYNC_LABEL[syncStatus] || 'Sync is on for this device'}
          </p>
        </div>

        <div>
          {showSetPw ? (
            <SetPasswordForm auth={auth} label="Save password" />
          ) : (
            <button type="button" onClick={() => setShowSetPw(true)} className={LINK}>Set or change password</button>
          )}
        </div>

        <div className="pt-1 border-t border-zinc-800">
          <button onClick={async () => { await auth.signOut(); onClose() }} className={`${SECONDARY} mt-4`}>Sign out</button>
          <p className="mt-2 font-sans text-[11px] text-zinc-500 leading-relaxed">
            Signing out keeps your data on this device. It just stops syncing until you sign back in.
          </p>
        </div>
      </div>
    </ModalShell>
  )
}

export function AccountModal({ auth, syncStatus, userName = '', onSaveName, onClose, initialMode = 'signin' }) {
  const { user } = auth
  const [mode, setMode] = useState(initialMode) // signin | signup | magic | forgot
  const [name, setName] = useState(userName)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState('') // message shown after an email goes out
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(auth.urlError || '')

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setSent('')
    auth.clearUrlError?.()
  }

  const submit = async (e) => {
    e.preventDefault()
    if (mode === 'signup' && !name.trim()) return setError('Enter your name.')
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
        const { data, error: err } = await auth.signUp(email, password, name)
        if (err) throw err
        // Supabase returns a user with no identities when the email is already
        // registered (and confirm-email is on), instead of an error.
        if (data?.user && data.user.identities?.length === 0) {
          throw new Error('User already registered')
        }
        if (data?.session) onClose() // confirm-email is off: signed straight in
        else setSent(`We sent a confirmation link to ${email.trim()}. Open it in this browser and you'll be signed in.`)
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
    return <ProfileView auth={auth} syncStatus={syncStatus} userName={userName} onSaveName={onSaveName} onClose={onClose} />
  }

  // ── Signed out ──────────────────────────────────────────────────────────
  const usesPassword = mode === 'signin' || mode === 'signup'
  const submitLabel = {
    signin: busy ? 'Signing in…' : 'Sign in',
    signup: busy ? 'Creating account…' : 'Create account',
    magic: busy ? 'Sending…' : 'Email me a sign-in link',
    forgot: busy ? 'Sending…' : 'Send reset link',
  }[mode]
  const heading = {
    signin: 'Welcome back',
    signup: 'Create your account',
    magic: 'Sign in with an email link',
    forgot: 'Reset your password',
  }[mode]
  const blurb = {
    signin: 'Sign in to sync your goals, tasks, and journal across devices.',
    signup: 'Your progress will sync to every device you sign in on. Everything still works offline.',
    magic: 'No password needed. We email you a link; a new email gets an account automatically.',
    forgot: "Enter your account email and we'll send you a link to choose a new password.",
  }[mode]

  return (
    <ModalShell onClose={onClose} width={420}>
      <h2 id="modal-title" className="font-sans text-xl font-black text-white tracking-wide mb-1">{heading}</h2>
      <p className="font-sans text-[13px] text-zinc-400 mb-5 leading-relaxed">{blurb}</p>

      {usesPassword && !sent && (
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => switchMode(t.id)}
              className={`flex-1 py-2 rounded-md border-none cursor-pointer font-sans text-xs font-bold transition-colors ${mode === t.id ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}
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
        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className={LABEL}>Name</label>
              <input
                id="auth-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                maxLength={MAX_NAME}
                className={INPUT}
              />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className={LABEL}>Email</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={INPUT}
            />
          </div>
          {usesPassword && (
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="auth-password" className={LABEL}>Password</label>
                {mode === 'signin' && <button type="button" onClick={() => switchMode('forgot')} className={LINK}>Forgot?</button>}
              </div>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? `At least ${MIN_PASSWORD} characters` : ''}
                className={INPUT}
              />
            </div>
          )}
          {error && <p className="font-sans text-xs text-red-400" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className={PRIMARY}>{submitLabel}</button>

          <div className="flex justify-center pt-1">
            {usesPassword
              ? <button type="button" onClick={() => switchMode('magic')} className={LINK}>Email me a sign-in link instead</button>
              : <button type="button" onClick={() => switchMode('signin')} className={LINK}>Back to sign in</button>}
          </div>
        </form>
      )}
    </ModalShell>
  )
}
