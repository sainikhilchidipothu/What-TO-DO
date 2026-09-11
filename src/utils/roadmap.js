import { DAYS_FULL } from '../constants.js'

export function weekdayIndex(date) {
  return new Date(`${date}T12:00:00`).getDay()
}

export function recurringDates(task, from, through) {
  if (!task?.recurring?.frequency) return []
  const start = new Date(`${from}T12:00:00`)
  const end = new Date(`${through}T12:00:00`)
  const dates = []
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const day = cursor.getDay()
    const r = task.recurring
    const matches = r.frequency === 'daily' ||
      (r.frequency === 'weekly' && day === weekdayIndex(task.due.slice(0, 10))) ||
      (r.frequency === 'weekdays' && (r.weekdays || []).includes(day))
    if (matches) dates.push(cursor.toISOString().slice(0, 10))
  }

  return dates
}

export function tasksOnDate(tasks, dateKey) {
  return (tasks || []).filter((task) => {
    if (task.due?.startsWith(dateKey)) return true
    if (!task.recurring?.frequency || !task.due || dateKey < task.due.slice(0, 10)) return false
    return recurringDates(task, dateKey, dateKey).includes(dateKey)
  }).map((task) => ({
    ...task,
    done: taskDoneOnDate(task, dateKey),
    occurrenceDue: taskDueOnDate(task, dateKey),
    recurringInstance: Boolean(task.recurring?.frequency && !task.due?.startsWith(dateKey)),
  }))
}

export function taskDueOnDate(task, dateKey) {
  return task?.recurring?.frequency && task.due ? `${dateKey}${task.due.slice(10)}` : task?.due
}

export function taskDoneOnDate(task, dateKey) {
  if (!task?.recurring?.frequency) return Boolean(task?.done)
  const originalDate = task.due?.slice(0, 10)
  return Boolean(task.recurringDone?.[dateKey] || (task.done && dateKey === originalDate))
}

export function weekStart(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay() + 1)
  return d.toISOString().slice(0, 10)
}

export function calculateGpa(grades, classes = []) {
  const byClass = classes.map((cls) => {
    const rows = (grades || []).filter((g) => g.classId === cls.id)
    const totalWeight = rows.reduce((sum, g) => sum + Number(g.weight || 1), 0)
    const percent = totalWeight ? rows.reduce((sum, g) => sum + (Number(g.score) / Math.max(1, Number(g.maxScore))) * Number(g.weight || 1), 0) / totalWeight : 0
    const points = percent >= .93 ? 4 : percent >= .9 ? 3.7 : percent >= .87 ? 3.3 : percent >= .83 ? 3 : percent >= .8 ? 2.7 : percent >= .77 ? 2.3 : percent >= .73 ? 2 : percent >= .7 ? 1.7 : percent >= .67 ? 1.3 : percent >= .6 ? 1 : 0
    return { classId: cls.id, name: cls.name, percent, points }
  })
  const active = byClass.filter((x) => x.percent > 0)
  return { byClass, value: active.length ? active.reduce((sum, x) => sum + x.points, 0) / active.length : 0 }
}

export function weeklyClassMinutes(sessions, classes, start = weekStart()) {
  const end = new Date(`${start}T12:00:00`)
  end.setDate(end.getDate() + 7)
  return classes.map((cls) => ({
    classId: cls.id,
    name: cls.name,
    minutes: (sessions || []).filter((s) => s.classId === cls.id && new Date(s.startedAt) >= new Date(`${start}T00:00:00`) && new Date(s.startedAt) < end).reduce((sum, s) => sum + Number(s.minutes || 0), 0),
  }))
}

export function reviewSummary(state, start = weekStart()) {
  const end = new Date(`${start}T12:00:00`)
  end.setDate(end.getDate() + 7)
  const endKey = end.toISOString().slice(0, 10)
  const tasks = (state.tasks || []).filter((t) => t.done && t.due && new Date(t.due) >= new Date(`${start}T00:00:00`) && new Date(t.due) < end)
  const goals = Object.entries(state.history || {}).filter(([date]) => date >= start && date < endKey).reduce((sum, [, ids]) => sum + ids.length, 0)
  return { completedTasks: tasks.length, completedGoals: goals, wins: (state.weeklyReviews?.[start]?.wins || []).slice(0, 3), nextWeek: state.weeklyReviews?.[start]?.nextWeek || '' }
}

export const weekdayOptions = DAYS_FULL.map((label, value) => ({ label, value }))
