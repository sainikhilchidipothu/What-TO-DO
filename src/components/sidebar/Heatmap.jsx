// ─── Heatmap ──────────────────────────────────────────────────────────────────

import { mono } from '../../theme.js'
import { dk } from '../../utils/date.js'

export function Heatmap({ history, habits, year }) {
  const total = habits.length || 1
  const jan1 = new Date(year, 0, 1)
  const off = jan1.getDay()
  const cells = []

  for (let i = 0; i < off; i++) cells.push(null)
  for (let d = 0; d < 365; d++) {
    const dt = new Date(year, 0, 1 + d)
    const k = dk(dt)
    const done = (history[k] || []).filter((id) => habits.some((h) => h.id === id)).length
    const pct = done / total
    cells.push({ k, done, pct })
  }

  const col = (p) =>
    p >= 1 ? '#22c55e' :
    p >= 0.75 ? '#4ade80' :
    p >= 0.5 ? '#eab308' :
    p > 0 ? '#ef4444' : '#333'

  return (
    <div>
      <p style={{ ...mono, fontSize: 11, color: '#888', letterSpacing: 4, marginBottom: 12, fontWeight: 'bold' }}>
        ACTIVITY {year}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {cells.map((c, i) =>
          c === null ? (
            <div key={i} style={{ width: 12, height: 12 }} />
          ) : (
            <div
              key={i}
              title={`${c.k} · ${c.done} done`}
              style={{ width: 12, height: 12, borderRadius: 3, background: col(c.pct), border: '1px solid #444' }}
            />
          )
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
        {[['#22c55e', '100%'], ['#eab308', '50%+'], ['#ef4444', '<50%'], ['#333', 'None']].map(([bg, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: '1px solid #444' }} />
            <span style={{ ...mono, fontSize: 11, color: '#aaa', fontWeight: 500 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
