// ─── useUrgentTasks ───────────────────────────────────────────────────────────
// Polls once a minute for tasks due within 24 hours.

import { useState, useEffect } from 'react'

export function useUrgentTasks(tasks) {
  const [urgent, setUrgent] = useState([])

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const result = tasks.filter((t) => {
        if (t.done || !t.due) return false
        const due = new Date(t.due)
        return due > now && due <= in24
      })
      setUrgent(result)
    }

    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [tasks])

  return urgent
}
