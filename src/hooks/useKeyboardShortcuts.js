// ─── useKeyboardShortcuts ─────────────────────────────────────────────────────
// Binds global key listeners. Returns nothing — purely side effects.

import { useEffect } from 'react'

export function useKeyboardShortcuts({ modal, view, onClose, onMacro, onNewHabit, onNewTask, onNewJournal, onNavMonth }) {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') {
        if (modal) onClose()
        else if (view === 'micro') onMacro()
        return
      }
      if (modal) return

      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'n') { e.preventDefault(); onNewHabit() }
      if (mod && e.key === 't') { e.preventDefault(); onNewTask() }
      if (mod && e.key === 'j') { e.preventDefault(); onNewJournal() }

      if (view === 'micro') {
        if (e.key === 'ArrowLeft')  onNavMonth(-1)
        if (e.key === 'ArrowRight') onNavMonth(1)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [modal, view, onClose, onMacro, onNewHabit, onNewTask, onNewJournal, onNavMonth])
}
