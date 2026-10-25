// ─── AppHeader ────────────────────────────────────────────────────────────────
// Top bar over the calendar: period navigation on the left, view switch,
// search, and a single account button on the right. Everything that isn't
// used every day (profile, review, backups, sign out, clear all) lives in the
// account menu so the bar never overflows.

import { useRef } from 'react'
import { MONTHS } from '../../constants.js'
import { AccountMenu } from './AccountMenu.jsx'

const ICON_BTN = 'inline-flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border border-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors duration-150'
const PILL_BTN = 'inline-flex items-center h-9 px-3.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer font-sans text-xs font-bold transition-colors duration-150'

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'} />
    </svg>
  )
}

export function AppHeader({
  view, setView, calM, calY,
  onPrev, onNext, onToday,
  onToggleMenu, onSearch,
  account, // { configured, user, name, email, syncStatus }
  onOpenAccount, onSignIn, onSignOut, onReview, onExport, onImport, onClearAll,
}) {
  const importRef = useRef(null)
  const isMonth = view === 'micro'
  const unit = isMonth ? 'month' : 'year'

  return (
    <header className="header-nav flex items-center gap-3 px-6 h-16 border-b border-zinc-800 flex-shrink-0 bg-zinc-900">
      <button onClick={onToggleMenu} aria-label="Open navigation menu" className={`mobile-hamburger hidden ${ICON_BTN}`}>
        <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
        </svg>
      </button>

      {/* Period navigation */}
      <div className="flex items-center gap-1 min-w-0">
        <button onClick={onPrev} aria-label={`Previous ${unit}`} title={`Previous ${unit}`} className={ICON_BTN}><Chevron dir="left" /></button>
        <h1 className="calendar-title font-sans font-black text-xl text-white truncate px-1 min-w-0">
          {isMonth ? <>{MONTHS[calM]} <span className="text-zinc-400">{calY}</span></> : <>{calY} <span className="hidden sm:inline text-zinc-400 font-bold text-base">Overview</span></>}
        </h1>
        <button onClick={onNext} aria-label={`Next ${unit}`} title={`Next ${unit}`} className={ICON_BTN}><Chevron dir="right" /></button>
      </div>

      <button onClick={onToday} title="Jump to today" className={`today-button hidden sm:inline-flex ${PILL_BTN}`}>Today</button>

      <div className="flex-1" />

      <div className="view-switch flex items-center p-0.5 rounded-lg border border-zinc-700 bg-zinc-950/70" role="group" aria-label="Calendar view">
        {[['macro', 'Year'], ['micro', 'Month']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            aria-pressed={view === id}
            className={`h-8 px-3 rounded-md border-none cursor-pointer font-sans text-xs font-bold transition-colors ${view === id ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <button onClick={onSearch} title="Search (⌘K)" className={`search-button hidden md:inline-flex gap-2 ${PILL_BTN} text-zinc-400`}>
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 3.5 3.5" />
        </svg>
        Search
        <kbd className="font-sans text-[10px] text-zinc-500 border border-zinc-700 rounded px-1 py-px">⌘K</kbd>
      </button>

      {account.configured && !account.user && (
        <button onClick={onSignIn} className="sign-in-button hidden sm:inline-flex items-center h-9 px-4 rounded-lg bg-accent text-zinc-950 hover:brightness-90 border-none cursor-pointer font-sans text-xs font-black transition-all duration-150">
          Sign in
        </button>
      )}

      <AccountMenu
        account={account}
        onOpenAccount={onOpenAccount}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onToday={onToday}
        onSearch={onSearch}
        onReview={onReview}
        onExport={onExport}
        onImport={() => importRef.current?.click()}
        onClearAll={onClearAll}
      />
      {/* Kept outside the menu so the picker survives the menu closing. */}
      <input ref={importRef} type="file" accept=".json" onChange={onImport} className="hidden" aria-hidden="true" tabIndex={-1} />
    </header>
  )
}
