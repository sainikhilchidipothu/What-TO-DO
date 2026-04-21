// ─── EmptyState ───────────────────────────────────────────────────────────────
// First-time-user prompts for empty goals/tasks lists. Replaces the
// nearly-invisible "No goals · Ctrl+N to add" text that was hiding on the
// sidebar. Bright, contrasty, with a clear call-to-action button.

import { mono } from '../../theme.js'

export function EmptyState({ icon, title, description, shortcut, ctaLabel, onCta }) {
  return (
    <div
      style={{
        padding: '22px 16px 18px',
        textAlign: 'center',
        background: '#1f1f1f',
        borderBottom: '2px solid #2a2a2a',
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden="true">
        {icon}
      </div>
      <p style={{ ...mono, fontSize: 13, color: '#fff', fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 }}>
        {title}
      </p>
      <p style={{ ...mono, fontSize: 11, color: '#bbb', lineHeight: 1.5, marginBottom: 12 }}>
        {description}
      </p>
      <button
        onClick={onCta}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: '#fff',
          color: '#000',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          ...mono,
          fontSize: 12,
          fontWeight: 'bold',
          letterSpacing: 2,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#eee')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        {ctaLabel}
      </button>
      {shortcut && (
        <p style={{ ...mono, fontSize: 10, color: '#888', marginTop: 8, letterSpacing: 1 }}>
          or press <kbd style={kbdStyle}>{shortcut}</kbd>
        </p>
      )}
    </div>
  )
}

const kbdStyle = {
  background: '#2a2a2a',
  border: '1px solid #444',
  borderRadius: 3,
  padding: '1px 6px',
  fontSize: 10,
  fontFamily: "'Epilogue', monospace",
  color: '#ddd',
  fontWeight: 'bold',
}
