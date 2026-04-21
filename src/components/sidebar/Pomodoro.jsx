// ─── Pomodoro ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { mono } from '../../theme.js'

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
    <div style={{ background: '#2a2a2a', border: '2px solid #444', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {[['focus', 'FOCUS'], ['shortBreak', 'BREAK']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => switchType(k)}
            aria-pressed={type === k}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 8,
              ...mono,
              fontSize: 13,
              letterSpacing: 2,
              fontWeight: 'bold',
              transition: 'all 0.15s',
              background: type === k ? '#fff' : '#333',
              color: type === k ? '#000' : '#888',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
            <circle cx={70} cy={70} r={60} fill="none" stroke="#333" strokeWidth={10} />
            <circle
              cx={70}
              cy={70}
              r={60}
              fill="none"
              stroke="#fff"
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
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <span style={{ ...mono, fontWeight: 900, fontSize: 26, color: '#fff', letterSpacing: 1 }}>{fmt(secs)}</span>
            <span style={{ ...mono, fontSize: 10, color: '#ccc', letterSpacing: 2, marginTop: 6, fontWeight: 'bold' }}>
              {type === 'focus' ? 'FOCUS' : 'BREAK'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setRun(!run)}
          aria-label={run ? 'Pause timer' : 'Start timer'}
          style={{
            flex: 1,
            padding: '14px 0',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 8,
            ...mono,
            fontSize: 13,
            letterSpacing: 2,
            fontWeight: 'bold',
            background: run ? '#333' : '#fff',
            color: run ? '#aaa' : '#000',
            transition: 'all 0.15s',
          }}
        >
          {run ? '⏸ PAUSE' : '▶ START'}
        </button>
        <button
          onClick={reset}
          aria-label="Reset timer"
          style={{ padding: '14px 18px', border: 'none', background: '#333', color: '#aaa', cursor: 'pointer', borderRadius: 8, fontSize: 16, transition: 'all 0.15s', fontWeight: 'bold' }}
        >
          ⟳
        </button>
      </div>

      <div style={{ borderTop: '2px solid #333', paddingTop: 14 }}>
        {[['focus', 'FOCUS', 5], ['shortBreak', 'BREAK', 1]].map(([k, l, s]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ ...mono, fontSize: 12, color: '#aaa', letterSpacing: 2, fontWeight: 600 }}>{l}</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => adjust(k, -s)}
                aria-label={`Decrease ${l.toLowerCase()} duration`}
                style={{ background: '#333', border: '2px solid #555', color: '#ccc', cursor: 'pointer', borderRadius: 6, padding: '6px 12px', fontSize: 16, ...mono, fontWeight: 'bold', transition: 'all 0.15s' }}
              >
                −
              </button>
              <span style={{ ...mono, fontSize: 14, color: '#fff', width: 36, textAlign: 'center', fontWeight: 'bold' }}>{presets[k]}m</span>
              <button
                onClick={() => adjust(k, s)}
                aria-label={`Increase ${l.toLowerCase()} duration`}
                style={{ background: '#333', border: '2px solid #555', color: '#ccc', cursor: 'pointer', borderRadius: 6, padding: '6px 12px', fontSize: 16, ...mono, fontWeight: 'bold', transition: 'all 0.15s' }}
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
