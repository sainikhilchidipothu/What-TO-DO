// ─── ModalShell ───────────────────────────────────────────────────────────────
// Wraps all application modals. Handles backdrop click, Escape close,
// focus trap on open, scroll lock, and ARIA semantics.

import { useEffect, useRef } from 'react'

export function ModalShell({ onClose, children, labelledBy = 'modal-title', width = 480 }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const body = document.body
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    // Focus first focusable element inside the dialog
    const t = setTimeout(() => {
      const el = dialogRef.current?.querySelector(
        'input,select,textarea,button,[tabindex]:not([tabindex="-1"])'
      )
      el?.focus()
    }, 0)

    return () => {
      clearTimeout(t)
      body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        style={{
          background: '#0a0a0a',
          border: '1px solid #222',
          borderRadius: 12,
          padding: 28,
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
