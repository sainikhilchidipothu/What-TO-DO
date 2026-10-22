// Sign-in (email magic link) and the signed-in account view. Only rendered
// when Supabase is configured — the header button that opens it is hidden
// otherwise.

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'

const SYNC_LABEL = {
  idle: '',
  syncing: 'Syncing…',
  synced: 'All changes synced',
  error: 'Offline — changes saved on this device',
}

export function AccountModal({ auth, syncStatus, onClose }) {
  const { user, signInWithEmail, signOut } = auth
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError('')
    const { error: err } = await signInWithEmail(email)
    setBusy(false)
    if (err) setError(err.message || 'Could not send the sign-in link.')
    else setSent(true)
  }

  return (
    <ModalShell onClose={onClose} width={440}>
      <h2 id="modal-title" className="font-sans text-xl font-black text-white tracking-wide mb-1">
        {user ? 'Your account' : 'Sign in'}
      </h2>
      <p className="font-sans text-[13px] text-zinc-400 mb-6 leading-relaxed">
        {user
          ? 'Your progress syncs across every device you sign in on.'
          : 'Sign in to keep your goals, tasks, and journal in sync across devices. Everything keeps working offline either way.'}
      </p>

      {user ? (
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
          <button
            onClick={async () => { await signOut(); onClose() }}
            className="w-full py-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 cursor-pointer font-sans text-[13px] font-bold tracking-wide transition-all duration-150"
          >
            Sign out
          </button>
          <p className="font-sans text-[11px] text-zinc-600 leading-relaxed">
            Signing out keeps your data on this device — it just stops syncing until you sign back in.
          </p>
        </div>
      ) : sent ? (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-5 text-center">
          <p className="font-sans text-sm text-white font-bold mb-1">Check your email</p>
          <p className="font-sans text-[13px] text-zinc-400 leading-relaxed break-all">
            We sent a sign-in link to {email}. Open it on this device to finish signing in.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-sans text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
          />
          {error && <p className="font-sans text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg bg-accent text-zinc-950 hover:brightness-110 disabled:opacity-60 cursor-pointer font-sans text-[13px] font-black tracking-wide transition-all duration-150"
          >
            {busy ? 'Sending…' : 'Send sign-in link'}
          </button>
          <p className="font-sans text-[11px] text-zinc-600 leading-relaxed">
            No password needed — we email you a secure link. New here? The same link creates your account.
          </p>
        </form>
      )}
    </ModalShell>
  )
}
