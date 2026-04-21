// ─── MicroView ────────────────────────────────────────────────────────────────
// Month detail: full-size day grid + selected-day detail panel on the right.
// Semester-aware: class indicators only appear on in-semester days.

import { useState } from 'react'
import { mono, compBg, compColor, getTaskPriorityColor } from '../../theme.js'
import { DAYS_SHORT } from '../../constants.js'
import { isVacDay, todayKey } from '../../utils/date.js'
import { getDayPreview, hasClassOnDay } from '../../utils/semester.js'

export function MicroView({ year, month, state, onToggle, onJournal }) {
  const [sel, setSel] = useState(todayKey())
  const todStr = todayKey()
  const vm = state.vacationMode
  const dim = new Date(year, month + 1, 0).getDate()
  const off = new Date(year, month, 1).getDay()

  const selHist = state.history[sel] || []
  const selGoals = state.habits.filter(
    (h) => !h.specificDays?.length || h.specificDays.includes(new Date(sel + 'T00:00:00').getDay())
  )
  const selDone = selGoals.filter((h) => selHist.includes(h.id)).length
  const selPct = selGoals.length > 0 ? Math.round((selDone / selGoals.length) * 100) : null
  const selTasks = state.tasks.filter((t) => t.due?.startsWith(sel))
  const selVac = isVacDay(sel, vm)
  const pColor = selPct != null ? (selPct >= 100 ? '#22c55e' : selPct >= 50 ? '#eab308' : '#ef4444') : '#333'

  return (
    <div className="micro-layout" style={{ display: 'flex', gap: 28, height: '100%' }}>
      {/* Grid */}
      <div style={{ flex: 1, maxWidth: 1000 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 16 }}>
          {DAYS_SHORT.map((d) => (
            <div key={d} style={{ textAlign: 'center', ...mono, fontSize: 15, color: '#aaa', padding: '8px 0', letterSpacing: 3, fontWeight: 'bold' }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
          {Array.from({ length: off }, (_, i) => <div key={'e' + i} />)}
          {Array.from({ length: dim }, (_, i) => {
            const d = i + 1
            const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const hist = state.history[k] || []
            const isTod = k === todStr
            const isSel = k === sel
            const isTar = k === state.targetDate
            const isVac = isVacDay(k, vm)
            const ag = state.habits.filter((h) => !h.specificDays?.length || h.specificDays.includes(new Date(year, month, d).getDay()))
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
                  style={{
                    aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: '12px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    border: isSel ? '4px solid #aaa' : '4px solid #666',
                    background: isSel ? '#333' : '#222', opacity: 0.5,
                    position: 'relative', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ ...mono, fontWeight: 'bold', fontSize: 24, color: '#aaa' }}>{d}</span>
                  <span style={{ ...mono, fontSize: 13, color: '#888', marginTop: 3 }} aria-hidden="true">🏖</span>
                </button>
              )
            }

            const bg = isSel ? '#333' : isTar ? '#2a2410' : done > 0 ? compBg(pct) : '#222'
            return (
              <button
                key={d}
                onClick={() => setSel(k)}
                aria-label={`${k}${done > 0 ? `, ${done} of ${ag.length} goals done` : ''}`}
                aria-pressed={isSel}
                style={{
                  aspectRatio: '1', borderRadius: 12, cursor: 'pointer', padding: '12px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  border: isSel ? '4px solid #fff' : isTar ? '4px solid #eab308' : isTod ? '4px solid #aaa' : '4px solid #444',
                  background: bg, transition: 'all 0.15s', position: 'relative',
                }}
              >
                {isTar && <div style={{ position: 'absolute', top: 3, left: 3, fontSize: 16 }} aria-hidden="true">🎯</div>}
                <span style={{ ...mono, fontWeight: 'bold', fontSize: 24, color: isSel ? '#fff' : isTar ? '#eab308' : done > 0 ? compColor(pct) : isTod ? '#fff' : '#aaa' }}>
                  {d}
                </span>
                {done > 0 && ag.length > 0 && (
                  <span style={{ ...mono, fontSize: 14, color: '#aaa', marginTop: 5, fontWeight: 'bold' }}>
                    {done}/{ag.length}
                  </span>
                )}
                <div style={{ position: 'absolute', top: 5, right: 5, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                  {hasClass && <div style={{ fontSize: 10 }} aria-hidden="true">📚</div>}
                  {highestPriorityTask && <div style={{ width: 10, height: 10, borderRadius: '50%', background: getTaskPriorityColor(highestPriorityTask.tier), border: '2px solid #222' }} />}
                  {hasJournal && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', border: '2px solid #222' }} />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 24, marginTop: 22, flexWrap: 'wrap' }}>
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
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isVacLegend ? (
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: '#222', border: '2px solid #666', opacity: 0.5 }} />
                ) : isClassEmoji ? (
                  <div style={{ fontSize: 12 }} aria-hidden="true">📚</div>
                ) : (
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: c, border: '2px solid #222' }} />
                )}
                <span style={{ ...mono, fontSize: 13, color: '#aaa', fontWeight: 600 }}>{l}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="micro-detail" style={{ width: 320, flexShrink: 0 }}>
        <div style={{ background: '#222', border: '2px solid #444', borderRadius: 14, padding: 22, position: 'sticky', top: 0 }}>
          <p style={{ ...mono, fontSize: 11, color: '#aaa', letterSpacing: 4, marginBottom: 8, fontWeight: 'bold' }}>
            SELECTED DAY
          </p>
          <p style={{ ...mono, fontWeight: 'bold', fontSize: 19, color: '#fff', marginBottom: 8 }}>
            {new Date(sel + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          {selVac && <p style={{ ...mono, fontSize: 14, color: '#ccc', marginBottom: 12 }}>🏖 Vacation Day</p>}

          {selPct != null && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ ...mono, fontSize: 11, color: '#aaa', letterSpacing: 2, fontWeight: 'bold' }}>GOALS</span>
                <span style={{ ...mono, fontSize: 13, color: pColor, fontWeight: 'bold' }}>
                  {selDone}/{selGoals.length} · {selPct}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={selPct}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ height: 5, background: '#333', borderRadius: 4 }}
              >
                <div style={{ height: 5, borderRadius: 4, width: `${selPct}%`, background: pColor, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {selGoals.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {selGoals.map((h) => {
                const done = selHist.includes(h.id)
                const col = h.category ? { health: '#e53e3e', study: '#805ad5', work: '#dd6b20', social: '#38a169', personal: '#d69e2e', creative: '#d53f8c', finance: '#3182ce', home: '#718096' }[h.category] || '#888' : '#888'
                return (
                  <button
                    key={h.id}
                    onClick={() => onToggle(h.id, sel)}
                    aria-label={`${done ? 'Mark not done' : 'Mark done'}: ${h.name}`}
                    aria-pressed={done}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                      borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 5, textAlign: 'left',
                      background: done ? '#2a2a2a' : '#222', transition: 'all 0.15s',
                      borderLeft: done ? `4px solid ${col}` : '4px solid transparent',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `3px solid ${done ? col : '#666'}`,
                      background: done ? col : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                    }}>
                      {done && <span style={{ fontSize: 11, color: '#000', fontWeight: 'bold' }}>✓</span>}
                    </div>
                    <span style={{ ...mono, fontSize: 14, color: done ? '#ddd' : '#ccc', textDecoration: done ? 'line-through' : 'none', fontWeight: 600 }}>
                      {h.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {selTasks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ ...mono, fontSize: 11, color: '#aaa', letterSpacing: 3, marginBottom: 10, fontWeight: 'bold' }}>TASKS DUE</p>
              {selTasks.map((t) => {
                const tc = [null, '#22c55e', '#eab308', '#ef4444'][t.tier]
                return (
                  <div key={t.id} style={{ background: '#2a2a2a', borderRadius: 8, padding: '10px 12px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10, border: '2px solid #444' }}>
                    <div aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: tc, flexShrink: 0 }} />
                    <p style={{ ...mono, fontSize: 13, color: t.done ? '#888' : '#ddd', textDecoration: t.done ? 'line-through' : 'none', flex: 1, fontWeight: 600 }}>
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
              style={{
                width: '100%', padding: '13px 0',
                border: `3px solid ${state.journal[sel] ? '#aaa' : '#444'}`,
                borderRadius: 10, cursor: 'pointer',
                background: state.journal[sel] ? '#2a2a2a' : 'transparent',
                ...mono, fontSize: 12, letterSpacing: 3, fontWeight: 'bold',
                color: state.journal[sel] ? '#eee' : '#888', transition: 'all 0.15s',
              }}
            >
              {state.journal[sel] ? '📝 EDIT JOURNAL' : '📝 WRITE JOURNAL'}
            </button>
          ) : (
            <div style={{ width: '100%', padding: '13px 0', border: '3px solid #333', borderRadius: 10, background: '#1a1a1a', ...mono, fontSize: 12, letterSpacing: 3, fontWeight: 'bold', color: '#aaa', textAlign: 'center' }}>
              📝 JOURNAL (FUTURE DATE)
            </div>
          )}

          {selGoals.length === 0 && selTasks.length === 0 && !selVac && (
            <p style={{ ...mono, fontSize: 13, color: '#aaa', textAlign: 'center', padding: '14px 0', marginTop: 10 }}>
              Nothing scheduled
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
