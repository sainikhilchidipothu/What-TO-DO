// ─── IntroScreen ──────────────────────────────────────────────────────────────
// The "DAYS REMAINING" splash that greets the user on app load.

import { useState } from 'react'
import { mono } from '../../theme.js'

export function IntroScreen({ targetDate, remaining, onContinue }) {
  const [out, setOut] = useState(false)

  const go = () => {
    setOut(true)
    setTimeout(onContinue, 560)
  }

  return (
    <div
      role="dialog"
      aria-label="Welcome screen"
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: '#1a1a1a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: out ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.55s cubic-bezier(0.7,0,0.3,1)',
        padding: 20,
      }}
    >
      <p style={{ ...mono, fontSize: 12, letterSpacing: 6, color: '#999', marginBottom: 12, fontWeight: 'bold' }}>
        TARGET · {targetDate}
      </p>
      <div style={{ ...mono, fontWeight: 900, fontSize: 'clamp(5rem,18vw,12rem)', lineHeight: 1, color: '#fff', marginBottom: 8 }}>
        {String(Math.max(0, remaining)).padStart(3, '0')}
      </div>
      <p style={{ ...mono, fontSize: 12, letterSpacing: 8, color: '#999', marginBottom: 52, fontWeight: 'bold' }}>
        DAYS REMAINING
      </p>
      <button
        onClick={go}
        autoFocus
        style={{
          padding: '16px 64px', background: '#fff', color: '#000',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          ...mono, fontSize: 14, letterSpacing: 6, fontWeight: 900,
        }}
      >
        START
      </button>
      <p style={{ marginTop: 22, ...mono, fontSize: 11, color: '#bbb', letterSpacing: 3, fontWeight: 'bold', textAlign: 'center' }}>
        Ctrl+N Goal · Ctrl+T Task · Ctrl+J Journal · ← → Navigate
      </p>
    </div>
  )
}
