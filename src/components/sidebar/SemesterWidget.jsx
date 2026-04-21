// ─── SemesterWidget ───────────────────────────────────────────────────────────
// NEW FEATURE: sidebar card showing current semester state.
// Pulls its status from getSemesterStatus — different UI for upcoming,
// active-in-progress, and ended phases.

import { mono } from '../../theme.js'
import { getSemesterStatus } from '../../utils/semester.js'
import { fmtShortDate } from '../../utils/date.js'

export function SemesterWidget({ state, onManage }) {
  const status = getSemesterStatus(state)
  const inactive = !state.semesterActive

  return (
    <div
      style={{
        background: '#2a2a2a',
        border: `3px solid ${state.semesterActive ? '#555' : '#444'}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: 4,
            color: state.semesterActive ? '#ddd' : '#aaa',
            fontWeight: 'bold',
          }}
        >
          🎓 SEMESTER
        </span>
        <button
          onClick={onManage}
          aria-label="Manage semester"
          style={{ background: 'none', border: '2px solid #555', color: '#888', cursor: 'pointer', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}
        >
          ⚙
        </button>
      </div>

      {inactive && (
        <p style={{ ...mono, fontSize: 12, color: '#bbb', marginTop: 8, fontWeight: 500 }}>
          Not set · click ⚙ to define a semester window
        </p>
      )}

      {state.semesterActive && status && (
        <div style={{ marginTop: 8 }}>
          {state.semesterName && (
            <p style={{ ...mono, fontSize: 12, color: '#ddd', fontWeight: 'bold', marginBottom: 4 }}>
              {state.semesterName}
            </p>
          )}

          {status.phase === 'upcoming' && (
            <>
              <p style={{ ...mono, fontSize: 12, color: '#4ade80', fontWeight: 500 }}>
                Starts in {status.daysUntil} day{status.daysUntil !== 1 ? 's' : ''}
              </p>
              <p style={{ ...mono, fontSize: 10, color: '#888', marginTop: 3 }}>
                {fmtShortDate(state.semesterStart)} → {fmtShortDate(state.semesterEnd)}
              </p>
            </>
          )}

          {status.phase === 'active' && (
            <>
              <p style={{ ...mono, fontSize: 12, color: '#ccc', fontWeight: 500 }}>
                Week {Math.ceil(status.elapsed / 7)} of {Math.ceil(status.total / 7)}
              </p>
              <p style={{ ...mono, fontSize: 10, color: '#888', marginTop: 3 }}>
                {status.remaining} day{status.remaining !== 1 ? 's' : ''} remaining
              </p>
              <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round((status.elapsed / status.total) * 100))}%`,
                    background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                    transition: 'width 0.4s',
                  }}
                />
              </div>
            </>
          )}

          {status.phase === 'ended' && (
            <>
              <p style={{ ...mono, fontSize: 12, color: '#888', fontWeight: 500 }}>
                Semester ended
              </p>
              <p style={{ ...mono, fontSize: 10, color: '#bbb', marginTop: 3 }}>
                {fmtShortDate(state.semesterStart)} → {fmtShortDate(state.semesterEnd)}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
