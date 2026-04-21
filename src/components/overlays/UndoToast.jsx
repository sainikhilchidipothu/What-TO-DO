import { useState, useEffect } from 'react'
import { mono } from '../../theme.js'

export function UndoToast({ item, onUndo, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          onDismiss()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onDismiss])

  const itemName = item.type === 'habit' ? 'Goal' : 'Task'

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: '#1a1a1a',
        border: '2px solid #ef4444',
        borderRadius: 12,
        padding: '18px 22px',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        minWidth: 380,
        maxWidth: 'calc(100vw - 48px)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.9)',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ ...mono, fontSize: 15, color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>
          {itemName} deleted
        </p>
        <p style={{ ...mono, fontSize: 12, color: '#aaa' }}>"{item.item.name}"</p>
      </div>
      <button
        onClick={onUndo}
        aria-label={`Undo deletion of ${item.item.name}`}
        style={{
          padding: '12px 24px',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          ...mono,
          fontSize: 13,
          fontWeight: 'bold',
          letterSpacing: 1,
          transition: 'all 0.15s',
        }}
      >
        UNDO ({timeLeft}s)
      </button>
    </div>
  )
}
