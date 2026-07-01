// ─── Pomodoro ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

export function Pomodoro({ presets, setPresets, onSessionComplete }) {
  const [secs, setSecs] = useState(presets.focus * 60)
  const [run, setRun] = useState(false)
  const [type, setType] = useState('focus')
  const ref = useRef(null)

  useEffect(() => {
    if (run) {
      ref.current = setInterval(() => {
        setSecs((s) => {
          if (s <= 1) {
            setRun(false)
            const nxt = type === 'focus' ? 'shortBreak' : 'focus'
            setType(nxt)
            setSecs(presets[nxt] * 60)
            onSessionComplete?.()
            try {
              const AC = window.AudioContext || window.webkitAudioContext
              if (AC) {
                const a = new AC()
                const o = a.createOscillator()
                const g = a.createGain()
                o.connect(g)
                g.connect(a.destination)
                o.type = 'sine'
                o.frequency.value = 880
                g.gain.setValueAtTime(0.3, a.currentTime)
                g.gain.linearRampToValueAtTime(0, a.currentTime + 0.4)
                o.start()
                o.stop(a.currentTime + 0.4)
              }
            } catch { /* noop */ }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(ref.current)
    }
    return () => clearInterval(ref.current)
  }, [run, type, presets, onSessionComplete])

  const reset = () => { setRun(false); setSecs(presets[type] * 60) }
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const total = presets[type] * 60
  const pct = secs / total
  const R = 60
  const C = 2 * Math.PI * R

  const switchType = (t) => { setRun(false); setType(t); setSecs(presets[t] * 60) }
  const adjust = (key, d) => {
    const v = Math.max(1, presets[key] + d)
    const np = { ...presets, [key]: v }
    setPresets(np)
    if (!run && key === type) setSecs(v * 60)
  }

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
      <div className="flex gap-2 mb-[18px]">
        {[['focus', 'FOCUS'], ['shortBreak', 'BREAK']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => switchType(k)}
            aria-pressed={type === k}
            className={`flex-1 py-3 border-none cursor-pointer rounded-lg font-sans text-[13px] tracking-wide font-bold transition-all duration-150 ${
              type === k ? 'bg-accent text-zinc-950' : 'bg-zinc-900 text-zinc-500'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex justify-center mb-[18px]">
        <div className="relative w-[140px] h-[140px]">
          <svg width={140} height={140} className="-rotate-90" aria-hidden="true">
            <circle cx={70} cy={70} r={60} fill="none" stroke="#3f3f3f" strokeWidth={10} />
            <circle
              cx={70}
              cy={70}
              r={60}
              fill="none"
              stroke="#ffffff"
              strokeWidth={10}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div
            role="timer"
            aria-label={`${type === 'focus' ? 'Focus' : 'Break'} timer: ${fmt(secs)}`}
            className="absolute inset-0 flex flex-col items-center justify-center p-5"
          >
            <span className="font-sans font-black text-[26px] text-white tracking-wide">{fmt(secs)}</span>
            <span className="font-sans text-[10px] text-zinc-400 tracking-wide mt-1.5 font-bold">
              {type === 'focus' ? 'FOCUS' : 'BREAK'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 mb-4">
        <button
          onClick={() => setRun(!run)}
          aria-label={run ? 'Pause timer' : 'Start timer'}
          className={`flex-1 py-3.5 border-none cursor-pointer rounded-lg font-sans text-[13px] tracking-wide font-bold transition-all duration-150 ${
            run ? 'bg-zinc-900 text-zinc-400' : 'bg-accent text-zinc-950'
          }`}
        >
          {run ? '⏸ PAUSE' : '▶ START'}
        </button>
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="px-[18px] py-3.5 border-none bg-zinc-900 text-zinc-400 cursor-pointer rounded-lg text-base transition-all duration-150 font-bold"
        >
          ⟳
        </button>
      </div>

      <div className="border-t border-zinc-700 pt-3.5">
        {[['focus', 'FOCUS', 5], ['shortBreak', 'BREAK', 1]].map(([k, l, s]) => (
          <div key={k} className="flex justify-between items-center mb-2.5">
            <span className="font-sans text-xs text-zinc-400 tracking-wide font-semibold">{l}</span>
            <div className="flex gap-2.5 items-center">
              <button
                onClick={() => adjust(k, -s)}
                aria-label={`Decrease ${l.toLowerCase()} duration`}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 cursor-pointer rounded-md px-3 py-1.5 text-base font-sans font-bold transition-all duration-150"
              >
                −
              </button>
              <span className="font-sans text-sm text-white w-9 text-center font-bold">{presets[k]}m</span>
              <button
                onClick={() => adjust(k, s)}
                aria-label={`Increase ${l.toLowerCase()} duration`}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 cursor-pointer rounded-md px-3 py-1.5 text-base font-sans font-bold transition-all duration-150"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
