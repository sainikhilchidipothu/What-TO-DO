// ─── Heatmap ──────────────────────────────────────────────────────────────────

import { dk } from '../../utils/date.js'
import { habitAppliesOn } from '../../utils/helpers.js'

export function Heatmap({ history, habits, year }) {
  const jan1 = new Date(year, 0, 1)
  const off = jan1.getDay()
  const cells = []

  for (let i = 0; i < off; i++) cells.push(null)
  for (let d = 0; d < 365; d++) {
    const dt = new Date(year, 0, 1 + d)
    const k = dk(dt)
    const applicable = habits.filter((h) => habitAppliesOn(h, k))
    const total = applicable.length || 1
    const done = (history[k] || []).filter((id) => applicable.some((h) => h.id === id)).length
    const pct = done / total
    cells.push({ k, done, pct })
  }

  const col = (p) =>
    p >= 1 ? '#22c55e' :
    p >= 0.75 ? '#4ade80' :
    p >= 0.5 ? '#eab308' :
    p > 0 ? '#ef4444' : '#27272a'

  return (
    <div>
      <p className="font-sans text-[11px] text-zinc-500 tracking-wider mb-3 font-bold">
        ACTIVITY {year}
      </p>
      <div className="flex flex-wrap gap-[3px]">
        {cells.map((c, i) =>
          c === null ? (
            <div key={i} className="w-3 h-3" />
          ) : (
            <div
              key={i}
              title={`${c.k} · ${c.done} done`}
              style={{ background: col(c.pct) }}
              className="w-3 h-3 rounded border border-zinc-800"
            />
          )
        )}
      </div>
      <div className="flex gap-4 mt-3.5 flex-wrap">
        {[['#22c55e', '100%'], ['#eab308', '50%+'], ['#ef4444', '<50%'], ['#27272a', 'None']].map(([bg, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div style={{ background: bg }} className="w-2.5 h-2.5 rounded border border-zinc-800" />
            <span className="font-sans text-[11px] text-zinc-400 font-medium">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
