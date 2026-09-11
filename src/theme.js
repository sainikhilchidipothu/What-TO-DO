// ─── SHARED STYLE TOKENS ──────────────────────────────────────────────────────
// Everything static now lives in Tailwind utility classes on the components
// themselves. What's left here is data-driven color math that can't be
// expressed as static Tailwind classes (colors computed from a percentage
// or a category id at runtime).

// ─── COMPLETION COLORS ────────────────────────────────────────────────────────
export const compColor = (pct) => (pct >= 1 ? '#e4e4e7' : pct >= 0.5 ? '#a1a1aa' : '#71717a')
export const compBg = (pct) => (pct >= 1 ? '#27272a' : pct >= 0.5 ? '#1f1f22' : '#18181b')
export const getTaskPriorityColor = (tier) => (tier === 3 ? '#e4e4e7' : tier === 2 ? '#a1a1aa' : '#71717a')
