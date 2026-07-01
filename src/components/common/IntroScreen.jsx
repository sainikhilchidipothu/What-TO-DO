// ─── IntroScreen ──────────────────────────────────────────────────────────────
// The "DAYS REMAINING" splash that greets the user on app load.

import { useState } from 'react'

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
      style={{ transform: out ? 'translateY(-100%)' : 'translateY(0)' }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-zinc-950 to-black flex flex-col items-center justify-center p-5 transition-transform duration-[550ms] ease-[cubic-bezier(0.7,0,0.3,1)]"
    >
      <p className="font-sans text-xs tracking-[0.5em] text-zinc-500 mb-3 font-bold">
        TARGET · {targetDate}
      </p>
      <div className="font-sans font-black leading-none text-white mb-2 text-[clamp(5rem,18vw,12rem)] bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
        {String(Math.max(0, remaining)).padStart(3, '0')}
      </div>
      <p className="font-sans text-xs tracking-[0.6em] text-zinc-500 mb-12 font-bold">
        DAYS REMAINING
      </p>
      <button
        onClick={go}
        autoFocus
        className="px-16 py-4 bg-accent hover:bg-indigo-300 text-zinc-950 border-none rounded-lg cursor-pointer font-sans text-sm tracking-[0.4em] font-black transition-colors duration-150"
      >
        START
      </button>
      <p className="mt-6 font-sans text-[11px] text-zinc-500 tracking-wider font-bold text-center">
        Ctrl+N Goal · Ctrl+T Task · Ctrl+J Journal · ← → Navigate
      </p>
    </div>
  )
}
