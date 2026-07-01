// ─── GoalsList ────────────────────────────────────────────────────────────────

import { CATEGORIES, CAT_COLORS, DAYS_SHORT } from '../../constants.js'
import { todayKey, daysLeft } from '../../utils/date.js'
import { getStreaks, isHabitUpcoming } from '../../utils/helpers.js'
import { EmptyState } from '../common/EmptyState.jsx'

export function GoalsList({
  habits,
  history,
  catFilter,
  setCatFilter,
  uniqueCats,
  onToggle,
  onEdit,
  onDelete,
  onTogglePin,
  onAdd,
}) {
  const today = todayKey()
  const filtered = [...habits]
    .sort((a, b) => (isHabitUpcoming(a, today) ? 1 : 0) - (isHabitUpcoming(b, today) ? 1 : 0))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .filter((h) => catFilter === 'all' || h.category === catFilter)

  return (
    <div className="border-t-2 border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
        <h2 className="font-sans text-[11px] tracking-[0.3em] text-zinc-400 font-bold m-0">GOALS</h2>
        <div className="flex gap-2 items-center">
          <label className="sr-only" htmlFor="goal-cat-filter">
            Filter goals by category
          </label>
          <select
            id="goal-cat-filter"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-400 rounded px-1.5 py-1 text-[11px] outline-none cursor-pointer"
          >
            <option value="all">All</option>
            {uniqueCats.map((c) => <option key={c} value={c}>{CATEGORIES[c] || c}</option>)}
          </select>
          <button
            onClick={onAdd}
            aria-label="Add new goal"
            className="w-[30px] h-[30px] rounded-md border-none cursor-pointer bg-accent hover:bg-zinc-200 text-zinc-950 font-sans text-lg font-bold leading-[28px] p-0 transition-colors duration-150"
          >
            +
          </button>
        </div>
      </div>

      <div className="bg-zinc-950/40">
        {filtered.length === 0 ? (
          habits.length === 0 ? (
            <EmptyState
              icon="🎯"
              title="Start tracking a habit"
              description="Goals are things you want to do regularly — exercise, read, study. Track them daily and build streaks."
              shortcut="Ctrl+N"
              ctaLabel="+ ADD YOUR FIRST GOAL"
              onCta={onAdd}
            />
          ) : (
            <p className="font-sans text-[11px] text-zinc-500 p-4 text-center leading-relaxed">
              No goals match this filter
            </p>
          )
        ) : (
          filtered.map((h) => {
            const upcoming = isHabitUpcoming(h, today)
            const { current, best } = getStreaks(h.id, history, h.startDate)
            const isDone = (history[today] || []).includes(h.id)
            const col = CAT_COLORS[h.category] || '#888'
            return (
              <div
                key={h.id}
                className={`border-b border-zinc-900 px-4 py-2.5 transition-colors ${upcoming ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => !upcoming && onToggle(h.id, today)}
                    disabled={upcoming}
                    aria-label={upcoming ? `${h.name} hasn't started yet` : isDone ? `Mark ${h.name} as not done` : `Mark ${h.name} as done`}
                    aria-pressed={isDone}
                    style={{ borderColor: isDone ? col : undefined, background: isDone ? col : undefined }}
                    className={`w-[18px] h-[18px] rounded flex-shrink-0 transition-all duration-150 border-2 ${
                      upcoming ? 'border-zinc-700 cursor-not-allowed' : isDone ? '' : 'border-zinc-600 bg-transparent cursor-pointer'
                    }`}
                  >
                    {isDone && <span className="text-[11px] text-zinc-950 block text-center leading-[18px] font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => onEdit(h.id)}
                    aria-label={`Edit ${h.name}`}
                    className={`flex-1 bg-transparent border-none cursor-pointer font-sans text-sm text-left transition-colors font-semibold truncate ${isDone ? 'text-zinc-400' : 'text-white'}`}
                  >
                    {h.pinned && <span className="text-accent mr-1" aria-hidden="true">★</span>}
                    {h.name}
                  </button>
                  <button
                    onClick={() => onTogglePin(h.id)}
                    aria-label={h.pinned ? `Unpin ${h.name}` : `Pin ${h.name}`}
                    aria-pressed={!!h.pinned}
                    className={`font-sans text-[11px] px-1 py-0.5 rounded transition-colors bg-transparent border-none cursor-pointer ${h.pinned ? 'text-accent' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => onDelete(h.id)}
                    aria-label={`Delete ${h.name}`}
                    className="font-sans text-[11px] px-1 py-0.5 rounded transition-colors bg-transparent border-none cursor-pointer text-zinc-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-3 ml-7 mt-1.5 items-center flex-wrap">
                  {upcoming ? (
                    <span className="font-sans text-[11px] text-accent font-bold">
                      🔒 starts in {daysLeft(h.startDate)}d · {h.startDate}
                    </span>
                  ) : (
                    <span className="font-sans text-[11px] text-zinc-400 font-medium">
                      🔥 {current} · best {best}
                    </span>
                  )}
                  {h.category && (
                    <span
                      style={{ color: col, background: col + '2a' }}
                      className="font-sans text-[11px] px-1.5 py-0.5 rounded font-bold"
                    >
                      {CATEGORIES[h.category] || h.category}
                    </span>
                  )}
                  {h.specificDays?.length > 0 && (
                    <span className="font-sans text-[10px] text-zinc-500 font-medium">
                      {h.specificDays.map((d) => DAYS_SHORT[d][0]).join('')}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
