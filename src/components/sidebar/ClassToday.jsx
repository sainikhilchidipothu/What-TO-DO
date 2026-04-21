// ─── ClassToday ───────────────────────────────────────────────────────────────
// Shows today's classes only if today is inside the active semester.
// Falls back to "no semester set" message when semester feature is off.

import { mono } from '../../theme.js'
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
    <div style={{ background: '#2a2a2a', border: '2px solid #444', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ ...mono, fontSize: 11, letterSpacing: 4, color: '#aaa', fontWeight: 'bold' }}>
          CLASS SCHEDULE
        </span>
        <button
          onClick={onManage}
          aria-label="Manage classes"
          style={{ background: 'none', border: '2px solid #555', color: '#888', cursor: 'pointer', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}
        >
          ⚙
        </button>
      </div>

      {/* Semester inactive but classes exist */}
      {!state.semesterActive && (classes || []).length > 0 && (
        <div style={{ padding: '10px 12px', background: '#1a1a1a', border: '1px solid #444', borderRadius: 6, marginBottom: 10 }}>
          <p style={{ ...mono, fontSize: 11, color: '#eab308', fontWeight: 'bold', marginBottom: 4 }}>
            No semester set
          </p>
          <p style={{ ...mono, fontSize: 11, color: '#ccc', lineHeight: 1.5, marginBottom: 8 }}>
            Classes show on every matching weekday across the year until you define a semester window.
          </p>
          <button
            onClick={onManageSemester}
            style={{ ...mono, fontSize: 10, color: '#eab308', background: 'none', border: '1px solid #eab308', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, fontWeight: 'bold' }}
          >
            SET SEMESTER →
          </button>
        </div>
      )}

      {/* Today is outside the active semester window */}
      {state.semesterActive && !semesterOK && (
        <div style={{ padding: '10px 12px', background: '#1a1a1a', borderRadius: 6, marginBottom: 10 }}>
          <p style={{ ...mono, fontSize: 12, color: '#ddd', fontWeight: 500 }}>
            No classes today — outside semester window
          </p>
          <p style={{ ...mono, fontSize: 11, color: '#aaa', marginTop: 4 }}>
            {state.semesterStart} → {state.semesterEnd}
          </p>
        </div>
      )}

      {semesterOK && tod.length === 0 && oth.length === 0 && (
        <p style={{ ...mono, fontSize: 12, color: '#bbb', textAlign: 'center', padding: '10px 0', fontWeight: 500 }}>
          No classes · click ⚙ to add one
        </p>
      )}

      {tod.length > 0 && (
        <>
          <p style={{ ...mono, fontSize: 10, color: '#22c55e', letterSpacing: 3, marginBottom: 8, fontWeight: 'bold' }}>
            TODAY
          </p>
          {tod.map((c, i) => (
            <div key={c.id || i} style={{ background: '#1a2a1a', border: '2px solid #2a4a2a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...mono, fontSize: 14, color: '#22c55e', fontWeight: 'bold' }}>
                    {c.code} <span style={{ color: '#4ade80', fontWeight: 'normal', fontSize: 13 }}>{c.name}</span>
                  </p>
                  {c.time && (
                    <p style={{ ...mono, fontSize: 12, color: '#888', marginTop: 3, fontWeight: 500 }}>
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
                    style={{ fontSize: 18, textDecoration: 'none', cursor: 'pointer', marginLeft: 8 }}
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
            <p style={{ ...mono, fontSize: 10, color: '#bbb', letterSpacing: 3, margin: '12px 0 8px', fontWeight: 'bold' }}>
              OTHER
            </p>
          )}
          {oth.map((c, i) => (
            <div key={c.id || i} style={{ background: '#333', borderRadius: 6, padding: '9px 10px', marginBottom: 5, border: '2px solid #444' }}>
              <p style={{ ...mono, fontSize: 12, color: '#aaa', fontWeight: 600 }}>
                {c.code} <span style={{ color: '#888' }}>{c.name}</span>
              </p>
              {c.time && (
                <p style={{ ...mono, fontSize: 10, color: '#bbb', marginTop: 2, fontWeight: 500 }}>
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
