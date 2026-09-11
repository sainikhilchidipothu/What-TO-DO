// ─── SHARED STYLE TOKENS ──────────────────────────────────────────────────────
// Everything static now lives in Tailwind utility classes on the components
// themselves. What's left here is data-driven color math that can't be
// expressed as static Tailwind classes (colors computed from a percentage
// or a category id at runtime).

// ─── COMPLETION COLORS ────────────────────────────────────────────────────────
export const compColor = (pct) => (pct >= 1 ? '#79a887' : pct >= 0.5 ? '#c0a35e' : '#c27676')
export const compBg = (pct) => (pct >= 1 ? '#1a2c20' : pct >= 0.5 ? '#302817' : '#301d1f')
export const getTaskPriorityColor = (tier) => (tier === 3 ? '#c27676' : tier === 2 ? '#c0a35e' : '#79a887')
