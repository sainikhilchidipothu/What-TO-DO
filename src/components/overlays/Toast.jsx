import { mono } from '../../theme.js'

export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        padding: '11px 20px',
        borderRadius: 8,
        zIndex: 200,
        ...mono,
        fontSize: 12,
        fontWeight: 'bold',
        background: toast.type === 'err' ? '#1c0505' : '#051c0a',
        color: toast.type === 'err' ? '#ef4444' : '#22c55e',
        border: `1px solid ${toast.type === 'err' ? '#3d0a0a' : '#0a3d1a'}`,
        boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
        animation: 'slideUp 0.25s ease',
      }}
    >
      {toast.msg}
    </div>
  )
}
