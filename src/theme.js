// ─── SHARED STYLE TOKENS ──────────────────────────────────────────────────────
// Everything static now lives in Tailwind utility classes on the components
// themselves. What's left here is data-driven color math that can't be
// expressed as static Tailwind classes (colors computed from a percentage
// or a category id at runtime).

// ─── COMPLETION COLORS ────────────────────────────────────────────────────────
export const compColor = (pct) => (pct >= 1 ? '#6fa47d' : pct >= 0.5 ? '#b39a58' : '#b56a6a')
export const compBg = (pct) => (pct >= 1 ? '#17251c' : pct >= 0.5 ? '#282316' : '#28191b')
export const getTaskPriorityColor = (tier) => (tier === 3 ? '#b56a6a' : tier === 2 ? '#b39a58' : '#6f9278')
