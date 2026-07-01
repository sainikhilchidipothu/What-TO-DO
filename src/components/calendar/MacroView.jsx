// ─── MacroView ────────────────────────────────────────────────────────────────
// Year overview: 12 mini calendars in a grid. Each day shows completion
// color, priority dots for tasks, class/journal indicators. Semester-aware:
// class indicators only appear on dates inside the active semester window.

import { compBg, compColor, getTaskPriorityColor } from '../../theme.js'
import { DAYS_SHORT, MONTHS } from '../../constants.js'
import { isVacDay } from '../../utils/date.js'
import { getDayPreview, hasClassOnDay } from '../../utils/semester.js'
import { habitAppliesOn } from '../../utils/helpers.js'

export function MacroView({ year, state, onMonth, onHover, onHoverEnd }) {
  const todStr = new Date().toLocaleDateString('en-CA')
  const vm = state.vacationMode

  return (
    <div className="macro-grid grid grid-cols-3 gap-6 max-w-[1600px] mx-auto">
      {Array.from({ length: 12 }, (_, m) => {
        const dim = new Date(year, m + 1, 0).getDate()
        const off = new Date(year, m, 1).getDay()
        let mDone = 0
        let mPoss = 0

        for (let d = 1; d <= dim; d++) {
          const k = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const ag = state.habits.filter((h) => habitAppliesOn(h, k))
          mPoss += ag.length
          mDone += (state.history[k] || []).filter((id) => ag.some((h) => h.id === id)).length
        }

        const mpct = mPoss > 0 ? Math.round((mDone / mPoss) * 100) : 0
        const pColor = mpct >= 80 ? '#22c55e' : mpct >= 50 ? '#eab308' : '#ef4444'

        return (
          <button
            key={m}
            onClick={() => onMonth(m)}
            aria-label={`View ${MONTHS[m]} ${year} in detail`}
            className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/70 rounded-2xl p-6 cursor-pointer transition-all duration-200 text-left shadow-panel font-sans"
          >
            <p className="font-sans text-[15px] font-bold tracking-[0.3em] text-white mb-[18px] text-center">
              {MONTHS[m].toUpperCase()}
            </p>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-xs text-zinc-500 font-sans font-bold py-0.5">
                  {d[0]}
                </div>
              ))}
              {Array.from({ length: off }, (_, i) => <div key={'e' + i} />)}
              {Array.from({ length: dim }, (_, i) => {
                const d = i + 1
                const k = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const hist = state.history[k] || []
                const isTod = k === todStr
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
                    <div
                      key={d}
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => { e.stopPropagation(); onHoverEnd?.(); onMonth(m) }}
                      onMouseEnter={(e) => onHover?.(k, { x: e.clientX + 15, y: e.clientY + 15 })}
                      onMouseLeave={() => onHoverEnd?.()}
                      onMouseMove={(e) => onHover?.(k, { x: e.clientX + 15, y: e.clientY + 15 })}
                      className="rounded aspect-square flex items-center justify-center bg-zinc-950 border border-zinc-600 opacity-50 relative cursor-pointer"
                    >
                      <span className="font-sans text-[13px] text-zinc-400 font-bold">{d}</span>
                    </div>
                  )
                }

                const bg = done > 0 ? compBg(pct) : isTod ? '#3f3f46' : '#0f0f11'
                const borderColor = isTar ? '#eab308' : isTod ? '#71717a' : '#27272a'
                const borderWidth = isTar ? 3 : 2

                return (
                  <div
                    key={d}
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); onHoverEnd?.(); onMonth(m) }}
                    onMouseEnter={(e) => onHover?.(k, { x: e.clientX + 15, y: e.clientY + 15 })}
                    onMouseLeave={() => onHoverEnd?.()}
                    onMouseMove={(e) => onHover?.(k, { x: e.clientX + 15, y: e.clientY + 15 })}
                    style={{ borderColor, borderWidth, background: isTar ? '#2a2410' : bg }}
                    className="rounded aspect-square border-solid flex items-center justify-center relative cursor-pointer"
                  >
                    {isTar && <div className="absolute -top-0.5 -right-0.5 text-sm" aria-hidden="true">🎯</div>}
                    <span
                      style={{ color: isTar ? '#eab308' : done > 0 ? compColor(pct) : undefined }}
                      className={`font-sans text-[13px] font-bold ${!isTar && done === 0 ? (isTod ? 'text-white' : 'text-zinc-500') : ''}`}
                    >
                      {d}
                    </span>
                    <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 items-end">
                      {hasClass && <div className="text-[8px]" aria-hidden="true">📚</div>}
                      {highestPriorityTask && <div style={{ background: getTaskPriorityColor(highestPriorityTask.tier) }} className="w-2 h-2 rounded-full border-2 border-zinc-900" />}
                      {hasJournal && <div className="w-2 h-2 rounded-full bg-white border-2 border-zinc-900" />}
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="font-sans text-[11px] text-zinc-500 tracking-wide font-bold">COMPLETION</span>
                <span style={{ color: mpct > 0 ? pColor : '#a1a1aa' }} className="font-sans text-xs font-bold">{mpct}%</span>
              </div>
              <div className="h-[5px] bg-zinc-800 rounded">
                <div style={{ width: `${mpct}%`, background: pColor }} className="h-[5px] rounded transition-[width] duration-500" />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
