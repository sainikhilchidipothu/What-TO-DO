// ─── CalPicker ────────────────────────────────────────────────────────────────
// Inline mini month picker used inside modals.

import { useState } from 'react'
import { DAYS_SHORT, MONTHS } from '../../constants.js'
import { MLabel } from './Primitives.jsx'
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
      {label && <MLabel>{label}</MLabel>}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => nav(-1)}
            className="bg-transparent border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 cursor-pointer rounded px-2 py-0.5 text-[11px] transition-colors"
          >
            ◀
          </button>
          <span className="font-sans text-[11px] text-zinc-300 tracking-wider">
            {MONTHS[cm].slice(0, 3).toUpperCase()} {cy}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => nav(1)}
            className="bg-transparent border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 cursor-pointer rounded px-2 py-0.5 text-[11px] transition-colors"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-[9px] text-zinc-500 font-sans">
              {d[0]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-6 gap-0.5">
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
                className={`aspect-square border-none rounded font-sans text-[11px] transition-colors ${
                  disabled
                    ? 'cursor-not-allowed text-zinc-700'
                    : 'cursor-pointer ' +
                      (isSel
                        ? 'bg-accent text-zinc-950 font-bold'
                        : isTod
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'bg-transparent text-zinc-300 hover:bg-zinc-800')
                }`}
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
