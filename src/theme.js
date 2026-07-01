// ─── SHARED STYLE TOKENS ──────────────────────────────────────────────────────
// Everything static now lives in Tailwind utility classes on the components
// themselves. What's left here is data-driven color math that can't be
// expressed as static Tailwind classes (colors computed from a percentage
// or a category id at runtime).

// ─── COMPLETION COLORS ────────────────────────────────────────────────────────
export const compColor = (pct) => (pct >= 1 ? '#22c55e' : pct >= 0.5 ? '#eab308' : '#ef4444')
export const compBg = (pct) => (pct >= 1 ? '#052e16' : pct >= 0.5 ? '#1c1500' : '#1c0505')
export const getTaskPriorityColor = (tier) => (tier === 3 ? '#ef4444' : tier === 2 ? '#eab308' : '#22c55e')
