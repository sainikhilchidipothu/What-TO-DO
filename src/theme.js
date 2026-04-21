// ─── SHARED STYLE TOKENS ──────────────────────────────────────────────────────
// Central place for the inline style objects that get reused across the app.
// Not a full CSS rewrite — this is the pragmatic middle ground between
// chaotic inline styles and a full Tailwind conversion.

export const mono = { fontFamily: "'Epilogue', sans-serif" }

export const inputSt = {
  width: '100%',
  background: '#111',
  border: '1px solid #333',
  color: '#e5e5e5',
  borderRadius: 6,
  padding: '10px 12px',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
  ...mono,
}

export const selectSt = {
  background: '#111',
  border: '1px solid #333',
  color: '#999',
  borderRadius: 4,
  padding: '4px 6px',
  fontSize: 10,
  outline: 'none',
  cursor: 'pointer',
  ...mono,
}

export const emptyTxt = {
  ...mono,
  fontSize: 11,
  color: '#aaa',
  padding: '16px 16px',
  textAlign: 'center',
  letterSpacing: 1,
  lineHeight: 1.6,
}

export const mLabel = {
  ...mono,
  fontSize: 10,
  letterSpacing: 4,
  color: '#bbb',
  marginBottom: 8,
  fontWeight: 'bold',
}

export const navBtn = {
  background: 'none',
  border: '1px solid #333',
  color: '#bbb',
  cursor: 'pointer',
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: 11,
  ...mono,
}

export const iconBtn = (color) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color,
  fontSize: 11,
  padding: '2px 4px',
  borderRadius: 3,
  transition: 'color 0.15s',
  ...mono,
})

// ─── COMPLETION COLORS ────────────────────────────────────────────────────────
export const compColor = (pct) => (pct >= 1 ? '#22c55e' : pct >= 0.5 ? '#eab308' : '#ef4444')
export const compBg = (pct) => (pct >= 1 ? '#052e16' : pct >= 0.5 ? '#1c1500' : '#1c0505')
export const getTaskPriorityColor = (tier) => (tier === 3 ? '#ef4444' : tier === 2 ? '#eab308' : '#22c55e')
