// ─── MacroView ────────────────────────────────────────────────────────────────
// Year overview: 12 mini calendars in a grid. Each day shows completion
// color, priority dots for tasks, class/journal indicators. Semester-aware:
// class indicators only appear on dates inside the active semester window.

import { mono, compBg, compColor, getTaskPriorityColor } from '../../theme.js'
import { DAYS_SHORT, MONTHS } from '../../constants.js'
import { isVacDay } from '../../utils/date.js'
import { getDayPreview, hasClassOnDay } from '../../utils/semester.js'

export function MacroView({ year, state, onMonth, onHover, onHoverEnd }) {
  const todStr = new Date().toLocaleDateString('en-CA')
  const vm = state.vacationMode

  return (
    <div className="macro-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, maxWidth: 1600, margin: '0 auto' }}>
      {Array.from({ length: 12 }, (_, m) => {
        const dim = new Date(year, m + 1, 0).getDate()
        const off = new Date(year, m, 1).getDay()
        let mDone = 0
        let mPoss = 0

        for (let d = 1; d <= dim; d++) {
          const k = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const ag = state.habits.filter((h) => !h.specificDays?.length || h.specificDays.includes(new Date(year, m, d).getDay()))
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
            style={{
              background: '#222',
              border: '2px solid #444',
              borderRadius: 14,
              padding: 24,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              color: 'inherit',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#777'; e.currentTarget.style.background = '#2a2a2a' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.background = '#222' }}
          >
            <p style={{ ...mono, fontSize: 15, fontWeight: 'bold', letterSpacing: 6, color: '#fff', marginBottom: 18, textAlign: 'center' }}>
              {MONTHS[m].toUpperCase()}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 16 }}>
              {DAYS_SHORT.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, color: '#999', ...mono, fontWeight: 'bold', padding: '2px 0' }}>
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
                const ag = state.habits.filter((h) => !h.specificDays?.length || h.specificDays.includes(new Date(year, m, d).getDay()))
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
                      style={{
                        borderRadius: 5, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#1a1a1a', border: '1px solid #555', opacity: 0.5, position: 'relative', cursor: 'pointer',
                      }}
                    >
                      <span style={{ ...mono, fontSize: 13, color: '#999', fontWeight: 'bold' }}>{d}</span>
                    </div>
                  )
                }

                const bg = done > 0 ? compBg(pct) : isTod ? '#333' : '#1a1a1a'
                const border = isTar ? '3px solid #eab308' : isTod ? '2px solid #888' : '2px solid #333'

                return (
                  <div
                    key={d}
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); onHoverEnd?.(); onMonth(m) }}
                    onMouseEnter={(e) => onHover?.(k, { x: e.clientX + 15, y: e.clientY + 15 })}
                    onMouseLeave={() => onHoverEnd?.()}
                    onMouseMove={(e) => onHover?.(k, { x: e.clientX + 15, y: e.clientY + 15 })}
                    style={{
                      borderRadius: 5, aspectRatio: '1', border, background: isTar ? '#2a2410' : bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer',
                    }}
                  >
                    {isTar && <div style={{ position: 'absolute', top: -2, right: -2, fontSize: 14 }} aria-hidden="true">🎯</div>}
                    <span style={{ ...mono, fontSize: 13, color: isTar ? '#eab308' : done > 0 ? compColor(pct) : isTod ? '#fff' : '#888', fontWeight: 'bold' }}>
                      {d}
                    </span>
                    <div style={{ position: 'absolute', top: 2, right: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                      {hasClass && <div style={{ fontSize: 8 }} aria-hidden="true">📚</div>}
                      {highestPriorityTask && <div style={{ width: 8, height: 8, borderRadius: '50%', background: getTaskPriorityColor(highestPriorityTask.tier), border: '2px solid #222' }} />}
                      {hasJournal && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', border: '2px solid #222' }} />}
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ ...mono, fontSize: 11, color: '#999', letterSpacing: 2, fontWeight: 'bold' }}>COMPLETION</span>
                <span style={{ ...mono, fontSize: 12, color: mpct > 0 ? pColor : '#aaa', fontWeight: 'bold' }}>{mpct}%</span>
              </div>
              <div style={{ height: 5, background: '#333', borderRadius: 4 }}>
                <div style={{ height: 5, borderRadius: 4, width: `${mpct}%`, background: pColor, transition: 'width 0.4s' }} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
