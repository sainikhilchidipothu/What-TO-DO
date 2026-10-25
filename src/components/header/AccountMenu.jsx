// ─── AccountMenu ──────────────────────────────────────────────────────────────
// Avatar button + dropdown. Shows who you are and whether you're syncing, and
// holds the less frequent actions. Closes on outside click, Escape, or after
// any item runs.

import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../common/Avatar.jsx'

const SYNC = {
  syncing: { dot: 'bg-zinc-400 animate-pulse', label: 'Syncing…' },
  synced: { dot: 'bg-green-500', label: 'Synced' },
  error: { dot: 'bg-amber-400', label: 'Offline · saved on this device' },
  idle: { dot: 'bg-green-500', label: 'Sync on' },
}

const ITEM = 'w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-transparent border-none text-left cursor-pointer font-sans text-[13px] text-zinc-200 hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:outline-none transition-colors'

export function AccountMenu({ account, onOpenAccount, onSignIn, onSignOut, onToday, onSearch, onReview, onExport, onImport, onClearAll }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const { configured, user, name, email, syncStatus } = account
  const sync = user ? SYNC[syncStatus] || SYNC.idle : null

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    wrapRef.current?.querySelector('[role="menuitem"]')?.focus()
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const onKeyDown = (e) => {
    if (!open) return
    if (e.key === 'Escape') {
      // Keep the global Escape handler from also leaving month view.
      e.stopPropagation()
      setOpen(false)
      wrapRef.current?.querySelector('button')?.focus()
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const items = [...wrapRef.current.querySelectorAll('[role="menuitem"]')]
      const i = items.indexOf(document.activeElement)
      const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
      items[next]?.focus()
    }
  }

  const run = (fn) => () => { setOpen(false); fn() }

  return (
    <div ref={wrapRef} className="relative shrink-0" onKeyDown={onKeyDown}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? `Account menu, signed in as ${email}` : 'Account menu'}
        title={user ? `${name || email} · ${sync.label}` : name || 'Menu'}
        className={`account-button relative flex items-center rounded-full p-0.5 border-2 bg-transparent cursor-pointer transition-colors ${open ? 'border-zinc-400' : 'border-transparent hover:border-zinc-600'}`}
      >
        <Avatar name={name} email={user ? email : ''} />
        {sync && <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${sync.dot}`} aria-hidden="true" />}
      </button>

      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 top-full mt-2 w-72 z-40 rounded-xl border border-zinc-700 bg-zinc-900 shadow-floating p-1.5 animate-slideUp">
          {/* Identity */}
          <div className="flex items-center gap-3 px-3 pt-2.5 pb-3">
            <Avatar name={name} email={user ? email : ''} size="lg" />
            <div className="min-w-0">
              <p className="font-sans text-sm font-black text-white truncate">{name || 'Hello there'}</p>
              {user ? (
                <>
                  <p className="font-sans text-xs text-zinc-400 truncate">{email}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 font-sans text-[11px] text-zinc-500">
                    <span className={`w-1.5 h-1.5 rounded-full ${sync.dot}`} aria-hidden="true" />{sync.label}
                  </p>
                </>
              ) : (
                <p className="font-sans text-xs text-zinc-500">Saved on this device only</p>
              )}
            </div>
          </div>

          {configured && !user && (
            <div className="px-1.5 pb-2">
              <button role="menuitem" onClick={run(onSignIn)} className="w-full py-2.5 rounded-lg bg-accent text-zinc-950 hover:brightness-90 border-none cursor-pointer font-sans text-xs font-black transition-all focus:outline-none focus:ring-2 focus:ring-zinc-400">
                Sign in to sync across devices
              </button>
            </div>
          )}

          <div className="border-t border-zinc-800 my-1" />
          <button role="menuitem" onClick={run(onOpenAccount)} className={ITEM}>{user ? 'Profile & account' : 'Edit your name'}</button>
          <button role="menuitem" onClick={run(onToday)} className={`${ITEM} sm:hidden`}>Go to today</button>
          <button role="menuitem" onClick={run(onSearch)} className={`${ITEM} md:hidden`}>Search</button>
          <button role="menuitem" onClick={run(onReview)} className={ITEM}>Weekly review</button>

          <div className="border-t border-zinc-800 my-1" />
          <button role="menuitem" onClick={run(onExport)} className={ITEM}>Export backup</button>
          <button role="menuitem" onClick={run(onImport)} className={ITEM}>Import backup</button>

          <div className="border-t border-zinc-800 my-1" />
          {user && <button role="menuitem" onClick={run(onSignOut)} className={ITEM}>Sign out</button>}
          <button role="menuitem" onClick={run(onClearAll)} className={`${ITEM} text-red-400 hover:text-red-300 hover:bg-red-950/40 focus:bg-red-950/40`}>Clear all data</button>
        </div>
      )}
    </div>
  )
}
