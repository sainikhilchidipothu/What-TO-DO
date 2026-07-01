// ─── DayPreviewCard ───────────────────────────────────────────────────────────
// Floating card that appears when hovering a day on the macro view.

import { getTaskPriorityColor } from '../../theme.js'
import { CAT_COLORS } from '../../constants.js'
import { getDayPreview } from '../../utils/semester.js'

export function DayPreviewCard({ dateKey, state, position }) {
  const preview = getDayPreview(dateKey, state)
  const date = new Date(dateKey + 'T00:00:00')
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const pendingTasks = preview.tasks.filter((t) => !t.done)
  const completedGoals = state.history[dateKey]?.length || 0
  const isTargetDay = dateKey === state.targetDate
  const isEmpty = !preview.isVacation && !preview.hasClass && preview.goals.length === 0 && pendingTasks.length === 0 && !preview.hasJournal

  // Keep the card on-screen — clamp to viewport
  const MAX_W = 340
  const x = Math.min(position.x, window.innerWidth - MAX_W - 12)
  const y = Math.min(position.y, window.innerHeight - 200)

  return (
    <div
      style={{ left: x, top: y, maxWidth: MAX_W, borderColor: isTargetDay ? '#eab308' : '#71717a' }}
      className="absolute z-[1000] bg-zinc-900 border-2 rounded-xl p-4 min-w-[240px] shadow-floating pointer-events-none"
    >
      <p className="font-sans text-sm text-white mb-3 font-bold tracking-wide">{dateStr}</p>

      {isTargetDay && (
        <div className="flex items-center gap-2.5 mb-2.5 px-3 py-2.5 bg-[#2a2410] rounded-lg border-2 border-amber-500">
          <span className="text-lg" aria-hidden="true">🎯</span>
          <span className="font-sans text-[13px] text-amber-500 font-bold tracking-wide">THE DAY!</span>
        </div>
      )}

      {isEmpty ? (
        <div className="px-2.5 py-3 bg-zinc-800/60 rounded-lg border-2 border-zinc-700 text-center">
          <p className="font-sans text-xs text-zinc-500 font-medium">Nothing scheduled</p>
        </div>
      ) : (
        <>
          {preview.isVacation && (
            <Row icon="🏖" color="#ddd" label="Vacation day" />
          )}
          {preview.hasClass && (
            <Row icon="📚" color="#4ade80" bg="rgba(34,197,94,0.1)" borderColor="rgba(34,197,94,0.3)" label="Class scheduled" />
          )}
          {preview.goals.length > 0 && (
            <div className="mb-2.5">
              <p className="font-sans text-[11px] text-zinc-400 mb-1.5 tracking-wide font-bold">
                GOALS ({completedGoals}/{preview.goals.length})
              </p>
              {preview.goals.slice(0, 3).map((g) => (
                <div key={g.id} className="flex items-center gap-2 mb-1 px-1.5 py-1 bg-zinc-800/60 rounded-md">
                  <div style={{ background: CAT_COLORS[g.category] || '#888' }} className="w-2 h-2 rounded-full flex-shrink-0" />
                  <span className="font-sans text-[11px] text-zinc-200">{g.name}</span>
                </div>
              ))}
              {preview.goals.length > 3 && (
                <p className="font-sans text-[10px] text-zinc-500 mt-1 ml-1.5">+{preview.goals.length - 3} more</p>
              )}
            </div>
          )}
          {pendingTasks.length > 0 && (
            <div className="mb-2.5">
              <p className="font-sans text-[11px] text-zinc-400 mb-1.5 tracking-wide font-bold">
                TASKS ({pendingTasks.length})
              </p>
              {pendingTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-2 mb-1 px-1.5 py-1 bg-zinc-800/60 rounded-md">
                  <div style={{ background: getTaskPriorityColor(t.tier) }} className="w-2 h-2 rounded-full flex-shrink-0" />
                  <span className="font-sans text-[11px] text-zinc-200">{t.name}</span>
                </div>
              ))}
              {pendingTasks.length > 3 && (
                <p className="font-sans text-[10px] text-zinc-500 mt-1 ml-1.5">+{pendingTasks.length - 3} more</p>
              )}
            </div>
          )}
          {preview.hasJournal && (
            <Row icon="📝" color="#ddd" label="Journal entry" />
          )}
        </>
      )}
    </div>
  )
}

function Row({ icon, color, label, bg = 'rgba(43,43,43,0.6)', borderColor = '#3f3f3f' }) {
  return (
    <div style={{ background: bg, borderColor }} className="flex items-center gap-2.5 mb-2.5 px-2.5 py-2 rounded-lg border-2">
      <span className="text-base" aria-hidden="true">{icon}</span>
      <span style={{ color }} className="font-sans text-xs font-semibold">{label}</span>
    </div>
  )
}
