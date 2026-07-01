// ─── useToast ─────────────────────────────────────────────────────────────────
// Tiny toast state helper.

import { useState, useCallback, useRef, useEffect } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const show = useCallback((msg, type = 'ok') => {
    clearTimeout(timerRef.current)
    setToast({ msg, type })
    timerRef.current = setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return [toast, show]
}
