// ─── Pomodoro ─────────────────────────────────────────────────────────────────
// Countdown runs off an absolute end timestamp instead of decrementing a
// counter each tick. setInterval gets throttled in background tabs, which made
// the old timer drift and look stopped; deriving the remaining time from
// Date.now() avoids that, and persisting to localStorage keeps it running
// across reloads and navigation.

import { useState, useEffect, useRef, useCallback } from 'react'

const TIMER_KEY = 'what-to-do-pomodoro'

const loadTimer = () => {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return null
}
const saveTimer = (t) => {
  try { localStorage.setItem(TIMER_KEY, JSON.stringify(t)) } catch { /* noop */ }
}

const beep = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
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
  } catch { /* noop */ }
}

export function Pomodoro({ presets, setPresets, onSessionComplete }) {
  // timer: { type, running, endsAt (ms when running, else null), remaining (secs when paused) }
  const [timer, setTimer] = useState(() => {
    const saved = loadTimer()
    if (saved && saved.type) return saved
    return { type: 'focus', running: false, endsAt: null, remaining: presets.focus * 60 }
  })
  const { type, running, endsAt, remaining } = timer
  const [, forceTick] = useState(0)
  const firedForRef = useRef(null) // guards one completion per endsAt

  // Persist on every change so a reload/remount restores the exact timer.
  useEffect(() => { saveTimer(timer) }, [timer])

  // While running, re-render ~4×/s so the display stays smooth. Correctness
  // comes from the timestamp math below, not from the tick cadence.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => forceTick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [running])

  // Recompute immediately when the tab is refocused (a throttled background
  // interval may be far behind real time at that moment).
  useEffect(() => {
    const bump = () => forceTick((n) => n + 1)
    document.addEventListener('visibilitychange', bump)
    window.addEventListener('focus', bump)
    return () => {
      document.removeEventListener('visibilitychange', bump)
      window.removeEventListener('focus', bump)
    }
  }, [])

  const secs = running && endsAt != null
    ? Math.max(0, Math.round((endsAt - Date.now()) / 1000))
    : remaining

  // Completion: fires once per session (keyed on endsAt). Runs on every render
  // while running, including the first render after restoring an elapsed timer.
  useEffect(() => {
    if (!running || endsAt == null) return
    if (Date.now() >= endsAt && firedForRef.current !== endsAt) {
      firedForRef.current = endsAt
      const nxt = type === 'focus' ? 'shortBreak' : 'focus'
      setTimer({ type: nxt, running: false, endsAt: null, remaining: presets[nxt] * 60 })
      onSessionComplete?.()
      beep()
    }
  })

  const toggle = () => {
    setTimer((prev) => {
      if (prev.running) {
        const rem = prev.endsAt != null
          ? Math.max(0, Math.round((prev.endsAt - Date.now()) / 1000))
          : prev.remaining
        return { ...prev, running: false, endsAt: null, remaining: rem }
      }
      const rem = prev.remaining > 0 ? prev.remaining : presets[prev.type] * 60
      firedForRef.current = null
      return { ...prev, running: true, endsAt: Date.now() + rem * 1000, remaining: rem }
    })
  }

  const reset = () => {
    firedForRef.current = null
    setTimer({ type, running: false, endsAt: null, remaining: presets[type] * 60 })
  }
  const switchType = (t) => {
    firedForRef.current = null
    setTimer({ type: t, running: false, endsAt: null, remaining: presets[t] * 60 })
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const total = presets[type] * 60
  const pct = secs / total
  const R = 60
  const C = 2 * Math.PI * R

  const adjust = (key, d) => {
    const v = Math.max(1, presets[key] + d)
    const np = { ...presets, [key]: v }
    setPresets(np)
    if (!running && key === type) setTimer((prev) => ({ ...prev, remaining: v * 60 }))
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
          onClick={toggle}
          aria-label={running ? 'Pause timer' : 'Start timer'}
          className={`flex-1 py-3.5 border-none cursor-pointer rounded-lg font-sans text-[13px] tracking-wide font-bold transition-all duration-150 ${
            running ? 'bg-zinc-900 text-zinc-400' : 'bg-accent text-zinc-950'
          }`}
        >
          {running ? '⏸ PAUSE' : '▶ START'}
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
