// ─── useUrgentTasks ───────────────────────────────────────────────────────────
// Polls once a minute for tasks due within 24 hours.

import { useState, useEffect } from 'react'
import { taskDoneOnDate, tasksOnDate } from '../utils/roadmap.js'
import { todayKey } from '../utils/date.js'

export function useUrgentTasks(tasks) {
  const [urgent, setUrgent] = useState([])

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const today = todayKey()
      const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const recurringToday = tasksOnDate(tasks, today)
      const result = tasks.map((task) => {
        const occurrence = recurringToday.find((item) => item.id === task.id) || task
        if (!task.due || taskDoneOnDate(occurrence, today)) return null
        const due = new Date(occurrence.occurrenceDue || occurrence.due)
        return due <= in24 ? occurrence : null
      }).filter(Boolean)
      setUrgent(result)
    }

    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [tasks])

  return urgent
}
