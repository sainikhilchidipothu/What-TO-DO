// ─── SemesterWidget ───────────────────────────────────────────────────────────
// Sidebar card showing current semester state. Pulls its status from
// getSemesterStatus — different UI for upcoming, active-in-progress, and
// ended phases.

import { getSemesterStatus } from '../../utils/semester.js'
import { fmtShortDate } from '../../utils/date.js'

export function SemesterWidget({ state, onManage }) {
  const status = getSemesterStatus(state)
  const inactive = !state.semesterActive

  return (
    <div className={`bg-zinc-800/50 border rounded-xl p-4 ${state.semesterActive ? 'border-zinc-600' : 'border-zinc-700'}`}>
      <div className="flex justify-between items-center">
        <span className={`font-sans text-[11px] tracking-wider font-bold ${state.semesterActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
          🎓 SEMESTER
        </span>
        <button
          onClick={onManage}
          aria-label="Manage semester"
          className="bg-transparent border border-zinc-600 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 cursor-pointer rounded-md px-2.5 py-1 text-xs transition-colors duration-150"
        >
          ⚙
        </button>
      </div>

      {inactive && (
        <p className="font-sans text-xs text-zinc-400 mt-2 font-medium">
          Not set · click ⚙ to define a semester window
        </p>
      )}

      {state.semesterActive && status && (
        <div className="mt-2">
          {state.semesterName && (
            <p className="font-sans text-xs text-zinc-200 font-bold mb-1">
              {state.semesterName}
            </p>
          )}

          {status.phase === 'upcoming' && (
            <>
              <p className="font-sans text-xs text-emerald-400 font-medium">
                Starts in {status.daysUntil} day{status.daysUntil !== 1 ? 's' : ''}
              </p>
              <p className="font-sans text-[10px] text-zinc-500 mt-0.5">
                {fmtShortDate(state.semesterStart)} → {fmtShortDate(state.semesterEnd)}
              </p>
            </>
          )}

          {status.phase === 'active' && (
            <>
              <p className="font-sans text-xs text-zinc-300 font-medium">
                Week {Math.ceil(status.elapsed / 7)} of {Math.ceil(status.total / 7)}
              </p>
              <p className="font-sans text-[10px] text-zinc-500 mt-0.5">
                {status.remaining} day{status.remaining !== 1 ? 's' : ''} remaining
              </p>
              <div className="h-1 bg-zinc-950 rounded-full mt-2 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, Math.round((status.elapsed / status.total) * 100))}%` }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500"
                />
              </div>
            </>
          )}

          {status.phase === 'ended' && (
            <>
              <p className="font-sans text-xs text-zinc-500 font-medium">
                Semester ended
              </p>
              <p className="font-sans text-[10px] text-zinc-400 mt-0.5">
                {fmtShortDate(state.semesterStart)} → {fmtShortDate(state.semesterEnd)}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
