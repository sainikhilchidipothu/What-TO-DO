// ─── useAppState ──────────────────────────────────────────────────────────────
// Wraps the main React state with localStorage persistence.
// Pulling this out of App.jsx cleans up the root component and makes
// the persistence side effect explicit.

import { useState, useCallback } from 'react'
import { loadState, saveState } from '../utils/storage.js'

export function useAppState() {
  const [state, setStateRaw] = useState(loadState)

  const setState = useCallback((upd) => {
    setStateRaw((prev) => {
      const next = typeof upd === 'function' ? upd(prev) : { ...prev, ...upd }
      saveState(next)
      return next
    })
  }, [])

  return [state, setState]
}
