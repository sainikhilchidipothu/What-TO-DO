// ─── MicroView ────────────────────────────────────────────────────────────────
// Month detail: full-size day grid + selected-day detail panel on the right.
// Semester-aware: class indicators only appear on in-semester days.

import { useState } from 'react'
import { compBg, compColor, getTaskPriorityColor } from '../../theme.js'
import { CAT_COLORS, DAYS_SHORT } from '../../constants.js'
import { isVacDay, todayKey } from '../../utils/date.js'
import { getDayPreview, hasClassOnDay } from '../../utils/semester.js'
import { habitAppliesOn } from '../../utils/helpers.js'

export function MicroView({ year, month, state, onToggle, onJournal }) {
  const [sel, setSel] = useState(todayKey())
  const todStr = todayKey()
  const vm = state.vacationMode
  const dim = new Date(year, month + 1, 0).getDate()
  const off = new Date(year, month, 1).getDay()

  const selHist = state.history[sel] || []
  const selGoals = state.habits.filter((h) => habitAppliesOn(h, sel))
  const selDone = selGoals.filter((h) => selHist.includes(h.id)).length
  const selPct = selGoals.length > 0 ? Math.round((selDone / selGoals.length) * 100) : null
  const selTasks = state.tasks.filter((t) => t.due?.startsWith(sel))
  const selVac = isVacDay(sel, vm)
  const pColor = selPct != null ? (selPct >= 100 ? '#22c55e' : selPct >= 50 ? '#eab308' : '#ef4444') : '#333'

  return (
    <div className="micro-layout flex gap-7 h-full">
      {/* Grid */}
      <div className="flex-1 max-w-[1000px]">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="text-center font-sans text-[15px] text-zinc-500 py-2 tracking-wider font-bold">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: off }, (_, i) => <div key={'e' + i} />)}
          {Array.from({ length: dim }, (_, i) => {
            const d = i + 1
            const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const hist = state.history[k] || []
            const isTod = k === todStr
            const isSel = k === sel
            const isTar = k === state.targetDate
            const isVac = isVacDay(k, vm)
            const ag = state.habits.filter((h) => habitAppliesOn(h, k))
            const done = hist.filter((id) => ag.some((h) => h.id === id)).length
            const pct = ag.length > 0 ? done / ag.length : 0

            const preview = getDayPreview(k, state)
            const hasClass = hasClassOnDay(k, state.classes, state)
            const dayTasks = preview.tasks.filter((t) => !t.done)
            const highestPriorityTask = dayTasks.length > 0
              ? dayTasks.reduce((max, t) => (t.tier > max.tier ? t : max), dayTasks[0])
              : null
            const hasJournal = preview.hasJournal

            if (isVac) {
              return (
                <button
                  key={d}
                  onClick={() => setSel(k)}
                  aria-label={`${k}, vacation day`}
                  aria-pressed={isSel}
                  style={{ borderColor: isSel ? '#a1a1aa' : '#52525b' }}
                  className={`aspect-square rounded-xl cursor-pointer px-2 py-3 flex flex-col items-center border-4 opacity-50 relative transition-all duration-150 ${isSel ? 'bg-zinc-800' : 'bg-zinc-900'}`}
                >
                  <span className="font-sans font-bold text-2xl text-zinc-400">{d}</span>
                  <span className="font-sans text-[13px] text-zinc-500 mt-0.5" aria-hidden="true">🏖</span>
                </button>
              )
            }

            const bg = isSel ? '#27272a' : isTar ? '#2a2410' : done > 0 ? compBg(pct) : '#18181b'
            const border = isSel ? '#818cf8' : isTar ? '#eab308' : isTod ? '#a1a1aa' : '#3f3f46'
            return (
              <button
                key={d}
                onClick={() => setSel(k)}
                aria-label={`${k}${done > 0 ? `, ${done} of ${ag.length} goals done` : ''}`}
                aria-pressed={isSel}
                style={{ background: bg, borderColor: border }}
                className="aspect-square rounded-xl cursor-pointer px-2 py-3 flex flex-col items-center border-4 relative transition-all duration-150"
              >
                {isTar && <div className="absolute top-0.5 left-0.5 text-base" aria-hidden="true">🎯</div>}
                <span
                  style={{ color: isTar ? '#eab308' : done > 0 ? compColor(pct) : undefined }}
                  className={`font-sans font-bold text-2xl ${!isTar && !(done > 0) ? (isSel ? 'text-white' : isTod ? 'text-white' : 'text-zinc-400') : ''}`}
                >
                  {d}
                </span>
                {done > 0 && ag.length > 0 && (
                  <span className="font-sans text-sm text-zinc-400 mt-1 font-bold">
                    {done}/{ag.length}
                  </span>
                )}
                <div className="absolute top-1 right-1 flex flex-col gap-0.5 items-end">
                  {hasClass && <div className="text-[10px]" aria-hidden="true">📚</div>}
                  {highestPriorityTask && <div style={{ background: getTaskPriorityColor(highestPriorityTask.tier) }} className="w-2.5 h-2.5 rounded-full border-2 border-zinc-900" />}
                  {hasJournal && <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-zinc-900" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-6 flex-wrap">
          {[
            ['#22c55e', 'All done'],
            ['#eab308', '50%+ done'],
            ['#ef4444', '<50%'],
            ['#fff', 'Journal 📝'],
            ['📚', 'Class 📚'],
            ['#ef4444', 'High priority'],
            ['#eab308', 'Medium priority'],
            ['#22c55e', 'Low priority'],
            ['border:#666', 'Vacation'],
          ].map(([c, l]) => {
            const isVacLegend = c.startsWith('border')
            const isClassEmoji = c === '📚'
            return (
              <div key={l} className="flex items-center gap-2">
                {isVacLegend ? (
                  <div className="w-3 h-3 rounded bg-zinc-900 border-2 border-zinc-600 opacity-50" />
                ) : isClassEmoji ? (
                  <div className="text-xs" aria-hidden="true">📚</div>
                ) : (
                  <div style={{ background: c }} className="w-3 h-3 rounded-full border-2 border-zinc-900" />
                )}
                <span className="font-sans text-[13px] text-zinc-400 font-semibold">{l}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="micro-detail w-80 flex-shrink-0">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sticky top-0 shadow-panel">
          <p className="font-sans text-[11px] text-zinc-500 tracking-wider mb-2 font-bold">
            SELECTED DAY
          </p>
          <p className="font-sans font-bold text-[19px] text-white mb-2">
            {new Date(sel + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          {selVac && <p className="font-sans text-sm text-zinc-300 mb-3">🏖 Vacation Day</p>}

          {selPct != null && (
            <div className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="font-sans text-[11px] text-zinc-500 tracking-wide font-bold">GOALS</span>
                <span style={{ color: pColor }} className="font-sans text-[13px] font-bold">
                  {selDone}/{selGoals.length} · {selPct}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={selPct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-[5px] bg-zinc-800 rounded"
              >
                <div style={{ width: `${selPct}%`, background: pColor }} className="h-[5px] rounded transition-[width] duration-300" />
              </div>
            </div>
          )}

          {selGoals.length > 0 && (
            <div className="mb-4">
              {selGoals.map((h) => {
                const done = selHist.includes(h.id)
                const col = h.category ? CAT_COLORS[h.category] || '#888' : '#888'
                return (
                  <button
                    key={h.id}
                    onClick={() => onToggle(h.id, sel)}
                    aria-label={`${done ? 'Mark not done' : 'Mark done'}: ${h.name}`}
                    aria-pressed={done}
                    style={{ borderLeftColor: done ? col : 'transparent' }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-none cursor-pointer mb-1.5 text-left transition-all duration-150 border-l-4 ${done ? 'bg-zinc-800' : 'bg-zinc-900/60'}`}
                  >
                    <div
                      style={{ borderColor: done ? col : '#52525b', background: done ? col : 'transparent' }}
                      className="w-[18px] h-[18px] rounded flex-shrink-0 border-[3px] flex items-center justify-center transition-all duration-150"
                    >
                      {done && <span className="text-[11px] text-zinc-950 font-bold">✓</span>}
                    </div>
                    <span className={`font-sans text-sm font-semibold ${done ? 'text-zinc-300 line-through' : 'text-zinc-300'}`}>
                      {h.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {selTasks.length > 0 && (
            <div className="mb-4">
              <p className="font-sans text-[11px] text-zinc-500 tracking-wide mb-2.5 font-bold">TASKS DUE</p>
              {selTasks.map((t) => {
                const tc = [null, '#22c55e', '#eab308', '#ef4444'][t.tier]
                return (
                  <div key={t.id} className="bg-zinc-800/60 rounded-lg px-3 py-2.5 mb-1.5 flex items-center gap-2.5 border border-zinc-800">
                    <div aria-hidden="true" style={{ background: tc }} className="w-[7px] h-[7px] rounded-full flex-shrink-0" />
                    <p className={`font-sans text-[13px] flex-1 font-semibold ${t.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                      {t.name}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {sel <= todayKey() ? (
            <button
              onClick={() => onJournal(sel)}
              aria-label={state.journal[sel] ? 'Edit journal entry for this day' : 'Write journal entry for this day'}
              className={`w-full py-3 rounded-lg cursor-pointer font-sans text-xs tracking-wider font-bold transition-all duration-150 border-2 ${
                state.journal[sel] ? 'border-zinc-500 bg-zinc-800 text-zinc-200' : 'border-zinc-700 bg-transparent text-zinc-500'
              }`}
            >
              {state.journal[sel] ? '📝 EDIT JOURNAL' : '📝 WRITE JOURNAL'}
            </button>
          ) : (
            <div className="w-full py-3 border-2 border-zinc-800 rounded-lg bg-zinc-950/60 font-sans text-xs tracking-wider font-bold text-zinc-500 text-center">
              📝 JOURNAL (FUTURE DATE)
            </div>
          )}

          {selGoals.length === 0 && selTasks.length === 0 && !selVac && (
            <p className="font-sans text-[13px] text-zinc-500 text-center py-3.5 mt-2.5">
              Nothing scheduled
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
