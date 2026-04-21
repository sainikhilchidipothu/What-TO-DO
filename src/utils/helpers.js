// ─── MISC HELPERS ─────────────────────────────────────────────────────────────

import { dk } from './date.js'
import { DAYS_FULL } from '../constants.js'

/**
 * Compute current and best streak for a given habit id.
 * Walks backward up to 365 days from today. Current streak only counts
 * if today is already done OR yesterday's streak is still active.
 */
export const getStreaks = (habitId, history) => {
  let cur = 0, best = 0, str = 0
  const n = new Date()
  n.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const d = new Date(n)
    d.setDate(n.getDate() - i)
    const done = (history[dk(d)] || []).includes(habitId)

    if (done) {
      str++
      if (i === 0 || cur > 0) cur = str
    } else {
      if (i === 0) cur = 0
      best = Math.max(best, str)
      str = 0
    }
  }
  return { current: cur, best: Math.max(best, str) }
}

/**
 * Summary statistics across all history — best day-of-week, top habit, perfect days.
 */
export const buildInsights = (state) => {
  const res = []
  const dayT = Array(7).fill(0)
  const dayC = Array(7).fill(0)

  Object.keys(state.history).forEach((k) => {
    const dw = new Date(k + 'T00:00:00').getDay()
    const v = state.history[k].filter((id) => state.habits.some((h) => h.id === id)).length
    dayT[dw] += v
    dayC[dw]++
  })

  const avgs = dayT.map((t, i) => (dayC[i] > 0 ? t / dayC[i] : 0))
  const best = avgs.indexOf(Math.max(...avgs))
  if (avgs[best] > 0) {
    res.push({ icon: '📅', title: 'Best Day', text: `You perform best on ${DAYS_FULL[best]}s` })
  }

  const top = state.habits
    .map((h) => ({ name: h.name, ...getStreaks(h.id, state.history) }))
    .filter((s) => s.best > 3)
    .sort((a, b) => b.best - a.best)

  if (top[0]) {
    res.push({ icon: '⭐', title: 'Top Goal', text: `"${top[0].name}" — ${top[0].best}-day best streak` })
  }

  const perf = Object.keys(state.history).filter((k) => {
    const v = state.history[k].filter((id) => state.habits.some((h) => h.id === id))
    return v.length > 0 && v.length === state.habits.length
  }).length

  if (perf > 0) {
    res.push({ icon: '🔥', title: 'Perfect Days', text: `${perf} days with 100% completion` })
  }

  return res
}

/**
 * Play a short synthesized warning chime. Used across warning modals.
 * Frequencies is an array of Hz values; each plays sequentially.
 */
export const playChime = (frequencies = [800, 600], gap = 200) => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
      }, i * gap)
    })
  } catch {
    // Audio not supported — silent fail is fine.
  }
}
