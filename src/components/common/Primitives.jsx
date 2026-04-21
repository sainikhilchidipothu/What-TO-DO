// ─── Common small components ──────────────────────────────────────────────────
// Primitives reused across modals and the rest of the app.

import { mono, mLabel } from '../../theme.js'

export function Btn({ children, onClick, disabled, style = {}, ariaLabel, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        padding: '10px 20px',
        border: 'none',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...mono,
        fontSize: 11,
        letterSpacing: 3,
        fontWeight: 'bold',
        color: '#000',
        background: '#e5e5e5',
        opacity: disabled ? 0.25 : 1,
        transition: 'all 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function MTitle({ children, style = {} }) {
  return (
    <h2
      style={{
        ...mono,
        fontWeight: 900,
        fontSize: 15,
        letterSpacing: 4,
        color: '#e5e5e5',
        marginBottom: 20,
        ...style,
      }}
    >
      {children}
    </h2>
  )
}

export function MLabel({ children, style = {}, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ ...mLabel, display: 'block', ...style }}>
      {children}
    </label>
  )
}

export function MRow({ children, style = {} }) {
  return <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', ...style }}>{children}</div>
}
