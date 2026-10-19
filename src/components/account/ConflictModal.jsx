// ─── ConflictModal ──────────────────────────────────────────────────────────
// Shown once, when a device that already holds local data signs into an account
// that also has cloud data. Lets the user pick a side (or combine) rather than
// silently overwriting either one. Not dismissable without choosing.

import { ModalShell } from '../common/ModalShell.jsx'

const summarize = (s) => {
  if (!s) return 'no data'
  const parts = []
  if (s.tasks?.length) parts.push(`${s.tasks.length} tasks`)
  if (s.habits?.length) parts.push(`${s.habits.length} goals`)
  if (s.classes?.length) parts.push(`${s.classes.length} classes`)
  const journalCount = s.journal ? Object.keys(s.journal).length : 0
  if (journalCount) parts.push(`${journalCount} journal entries`)
  return parts.length ? parts.join(', ') : 'some data'
}

export function ConflictModal({ local, cloud, onResolve }) {
  return (
    <ModalShell onClose={() => {}} width={480}>
      <h2 id="modal-title" className="font-sans text-xl font-black text-white tracking-wide mb-1">
        Two sets of data
      </h2>
      <p className="font-sans text-[13px] text-zinc-400 mb-5 leading-relaxed">
        This device and your account each have saved progress. Choose how to continue — nothing is deleted until you pick.
      </p>

      <div className="space-y-3">
        <button
          onClick={() => onResolve('merge')}
          className="w-full text-left p-4 rounded-xl border border-accent/50 bg-accent/5 hover:bg-accent/10 cursor-pointer transition-all duration-150"
        >
          <div className="font-sans text-sm text-white font-black mb-0.5">Combine both (recommended)</div>
          <div className="font-sans text-xs text-zinc-400">Keep everything from this device and your account, merged together.</div>
        </button>
        <button
          onClick={() => onResolve('cloud')}
          className="w-full text-left p-4 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer transition-all duration-150"
        >
          <div className="font-sans text-sm text-white font-black mb-0.5">Use my account</div>
          <div className="font-sans text-xs text-zinc-400">Replace this device with the cloud copy ({summarize(cloud)}).</div>
        </button>
        <button
          onClick={() => onResolve('local')}
          className="w-full text-left p-4 rounded-xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer transition-all duration-150"
        >
          <div className="font-sans text-sm text-white font-black mb-0.5">Use this device</div>
          <div className="font-sans text-xs text-zinc-400">Overwrite the cloud with this device's copy ({summarize(local)}).</div>
        </button>
      </div>
    </ModalShell>
  )
}
