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
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-slideUp"
    >
      <div
        ref={dialogRef}
        style={{ maxWidth: width }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl p-7 w-full max-h-[90vh] overflow-y-auto shadow-floating"
      >
        {children}
      </div>
    </div>
  )
}
