// ─── ClassToday ───────────────────────────────────────────────────────────────
// Shows today's classes only if today is inside the active semester.
// Falls back to "no semester set" message when semester feature is off.

import { DAYS_SHORT } from '../../constants.js'
import { isInSemester } from '../../utils/semester.js'
import { todayKey } from '../../utils/date.js'

export function ClassToday({ classes, state, onManage, onManageSemester }) {
  const today = todayKey()
  const todayDow = new Date().getDay()
  const semesterOK = isInSemester(today, state)

  const tod = semesterOK ? (classes || []).filter((c) => c.days?.includes(todayDow)) : []
  const oth = semesterOK ? (classes || []).filter((c) => !c.days?.includes(todayDow)) : (classes || [])

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-sans text-[11px] tracking-wider text-zinc-500 font-bold">
          CLASS SCHEDULE
        </span>
        <button
          onClick={onManage}
          aria-label="Manage classes"
          className="bg-transparent border border-zinc-600 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 cursor-pointer rounded-md px-2.5 py-1 text-xs transition-colors duration-150"
        >
          ⚙
        </button>
      </div>

      {/* Semester inactive but classes exist */}
      {!state.semesterActive && (classes || []).length > 0 && (
        <div className="px-3 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-md mb-2.5">
          <p className="font-sans text-[11px] text-amber-500 font-bold mb-1">
            No semester set
          </p>
          <p className="font-sans text-[11px] text-zinc-300 leading-relaxed mb-2">
            Classes show on every matching weekday across the year until you define a semester window.
          </p>
          <button
            onClick={onManageSemester}
            className="font-sans text-[10px] text-amber-500 bg-transparent border border-amber-500 cursor-pointer px-2 py-1 rounded font-bold"
          >
            SET SEMESTER →
          </button>
        </div>
      )}

      {/* Today is outside the active semester window */}
      {state.semesterActive && !semesterOK && (
        <div className="px-3 py-2.5 bg-zinc-950/60 rounded-md mb-2.5">
          <p className="font-sans text-xs text-zinc-300 font-medium">
            No classes today — outside semester window
          </p>
          <p className="font-sans text-[11px] text-zinc-500 mt-1">
            {state.semesterStart} → {state.semesterEnd}
          </p>
        </div>
      )}

      {semesterOK && tod.length === 0 && oth.length === 0 && (
        <p className="font-sans text-xs text-zinc-400 text-center py-2.5 font-medium">
          No classes · click ⚙ to add one
        </p>
      )}

      {tod.length > 0 && (
        <>
          <p className="font-sans text-[10px] text-emerald-500 tracking-wide mb-2 font-bold">
            TODAY
          </p>
          {tod.map((c, i) => (
            <div key={c.id || i} className="bg-emerald-950/30 border border-emerald-900 rounded-lg p-3 mb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-sans text-sm text-emerald-500 font-bold">
                    {c.code} <span className="text-emerald-400 font-normal text-[13px]">{c.name}</span>
                  </p>
                  {c.time && (
                    <p className="font-sans text-xs text-zinc-500 mt-1 font-medium">
                      🕐 {c.time}{c.location ? ` · ${c.location}` : ''}
                    </p>
                  )}
                </div>
                {c.link && (
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${c.name || c.code} course page`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-lg no-underline cursor-pointer ml-2"
                  >
                    🔗
                  </a>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {oth.length > 0 && semesterOK && (
        <>
          {tod.length > 0 && (
            <p className="font-sans text-[10px] text-zinc-500 tracking-wide font-bold" style={{ margin: '12px 0 8px' }}>
              OTHER
            </p>
          )}
          {oth.map((c, i) => (
            <div key={c.id || i} className="bg-zinc-900/60 rounded-md px-2.5 py-2.5 mb-1.5 border border-zinc-800">
              <p className="font-sans text-xs text-zinc-400 font-semibold">
                {c.code} <span className="text-zinc-500">{c.name}</span>
              </p>
              {c.time && (
                <p className="font-sans text-[10px] text-zinc-500 mt-0.5 font-medium">
                  {(c.days || []).map((d) => DAYS_SHORT[d]).join(' ')} · {c.time}
                </p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
