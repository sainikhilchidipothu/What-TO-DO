// ─── DayPreviewCard ───────────────────────────────────────────────────────────
// Floating card that appears when hovering a day on the macro view.

import { mono, getTaskPriorityColor } from '../../theme.js'
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
      style={{
        position: 'absolute',
        zIndex: 1000,
        left: x,
        top: y,
        background: '#222',
        border: isTargetDay ? '2px solid #eab308' : '2px solid #666',
        borderRadius: 12,
        padding: 16,
        minWidth: 240,
        maxWidth: MAX_W,
        boxShadow: '0 12px 32px rgba(0,0,0,0.95)',
        pointerEvents: 'none',
      }}
    >
      <p style={{ ...mono, fontSize: 14, color: '#fff', marginBottom: 12, fontWeight: 'bold', letterSpacing: 1 }}>{dateStr}</p>

      {isTargetDay && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 12px', background: '#2a2410', borderRadius: 8, border: '2px solid #eab308' }}>
          <span style={{ fontSize: 18 }} aria-hidden="true">🎯</span>
          <span style={{ ...mono, fontSize: 13, color: '#eab308', fontWeight: 'bold', letterSpacing: 1 }}>THE DAY!</span>
        </div>
      )}

      {isEmpty ? (
        <div style={{ padding: '12px 10px', background: '#2a2a2a', borderRadius: 8, border: '2px solid #444', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: 12, color: '#888', fontWeight: 500 }}>Nothing scheduled</p>
        </div>
      ) : (
        <>
          {preview.isVacation && (
            <Row icon="🏖" color="#ddd" label="Vacation day" />
          )}
          {preview.hasClass && (
            <Row icon="📚" color="#4ade80" bg="#1a2a1a" borderColor="#2a4a2a" label="Class scheduled" />
          )}
          {preview.goals.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ ...mono, fontSize: 11, color: '#aaa', marginBottom: 6, letterSpacing: 1, fontWeight: 'bold' }}>
                GOALS ({completedGoals}/{preview.goals.length})
              </p>
              {preview.goals.slice(0, 3).map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '4px 6px', background: '#2a2a2a', borderRadius: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[g.category] || '#888', flexShrink: 0 }} />
                  <span style={{ ...mono, fontSize: 11, color: '#eee' }}>{g.name}</span>
                </div>
              ))}
              {preview.goals.length > 3 && (
                <p style={{ ...mono, fontSize: 10, color: '#888', marginTop: 4, marginLeft: 6 }}>+{preview.goals.length - 3} more</p>
              )}
            </div>
          )}
          {pendingTasks.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ ...mono, fontSize: 11, color: '#aaa', marginBottom: 6, letterSpacing: 1, fontWeight: 'bold' }}>
                TASKS ({pendingTasks.length})
              </p>
              {pendingTasks.slice(0, 3).map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, padding: '4px 6px', background: '#2a2a2a', borderRadius: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: getTaskPriorityColor(t.tier), flexShrink: 0 }} />
                  <span style={{ ...mono, fontSize: 11, color: '#eee' }}>{t.name}</span>
                </div>
              ))}
              {pendingTasks.length > 3 && (
                <p style={{ ...mono, fontSize: 10, color: '#888', marginTop: 4, marginLeft: 6 }}>+{pendingTasks.length - 3} more</p>
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

function Row({ icon, color, label, bg = '#2a2a2a', borderColor = '#444' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', background: bg, borderRadius: 8, border: `2px solid ${borderColor}` }}>
      <span style={{ fontSize: 16 }} aria-hidden="true">{icon}</span>
      <span style={{ ...mono, fontSize: 12, color, fontWeight: 600 }}>{label}</span>
    </div>
  )
}
