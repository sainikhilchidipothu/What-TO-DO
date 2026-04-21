// ─── CalPicker ────────────────────────────────────────────────────────────────
// Inline mini month picker used inside modals.

import { useState } from 'react'
import { DAYS_SHORT, MONTHS } from '../../constants.js'
import { mono, navBtn, mLabel } from '../../theme.js'
import { todayKey } from '../../utils/date.js'

export function CalPicker({ value, onChange, label, minDate }) {
  const init = value ? new Date(value + 'T00:00:00') : new Date()
  const [cm, setCm] = useState(init.getMonth())
  const [cy, setCy] = useState(init.getFullYear())

  const nav = (delta) => {
    let m = cm + delta
    let y = cy
    if (m > 11) { m = 0; y++ }
    else if (m < 0) { m = 11; y-- }
    setCm(m)
    setCy(y)
  }

  const dim = new Date(cy, cm + 1, 0).getDate()
  const off = new Date(cy, cm, 1).getDay()
  const todStr = todayKey()

  return (
    <div>
      {label && <p style={mLabel}>{label}</p>}
      <div
        style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: 8,
          padding: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button type="button" aria-label="Previous month" onClick={() => nav(-1)} style={navBtn}>◀</button>
          <span style={{ ...mono, fontSize: 11, color: '#ccc', letterSpacing: 2 }}>
            {MONTHS[cm].slice(0, 3).toUpperCase()} {cy}
          </span>
          <button type="button" aria-label="Next month" onClick={() => nav(1)} style={navBtn}>▶</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
          {DAYS_SHORT.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, color: '#999', ...mono }}>
              {d[0]}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, gridTemplateRows: 'repeat(6,1fr)' }}>
          {Array.from({ length: off }, (_, i) => <div key={'e' + i} />)}
          {Array.from({ length: dim }, (_, i) => {
            const d = i + 1
            const k = `${cy}-${String(cm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const isSel = k === value
            const isTod = k === todStr
            const disabled = minDate && k < minDate

            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => onChange(k)}
                aria-label={`Select ${k}`}
                aria-pressed={isSel}
                style={{
                  aspectRatio: '1',
                  border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  borderRadius: 4,
                  ...mono,
                  fontSize: 11,
                  background: isSel ? '#fff' : isTod ? '#222' : 'transparent',
                  color: isSel ? '#000' : isTod ? '#fff' : disabled ? '#555' : '#ccc',
                  fontWeight: isSel || isTod ? 'bold' : 'normal',
                }}
              >
                {d}
              </button>
            )
          })}
          {Array.from({ length: 42 - off - dim }, (_, i) => <div key={'f' + i} />)}
        </div>
      </div>
    </div>
  )
}
