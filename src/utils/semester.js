// ─── SEMESTER HELPERS ─────────────────────────────────────────────────────────
// The semester feature constrains class display to a date range.
// A class's day-of-week match is only meaningful when the date also falls
// inside an active semester; otherwise the calendar shows class indicators
// on every matching weekday across the entire year, which is what the
// user wanted to fix.

import { todayKey } from './date.js'
import { habitAppliesOn } from './helpers.js'

/**
 * Is the given ISO date key inside the active semester?
 * When no semester is active, returns true (legacy behavior — don't
 * constrain anything until the user explicitly sets up a semester).
 */
export const isInSemester = (dateKey, state) => {
  if (!state.semesterActive) return true
  if (!state.semesterStart || !state.semesterEnd) return true
  return dateKey >= state.semesterStart && dateKey <= state.semesterEnd
}

/**
 * Does the given date have a class scheduled?
 * - Must match a class's day-of-week array.
 * - When semester is active, must also fall within the semester window.
 */
export const hasClassOnDay = (dateKey, classes, state) => {
  if (!classes?.length) return false
  if (!isInSemester(dateKey, state)) return false
  const dayOfWeek = new Date(dateKey + 'T00:00:00').getDay()
  return classes.some((c) => c.days?.includes(dayOfWeek))
}

/**
 * Number of days in the semester (inclusive of endpoints).
 * Returns 0 if semester isn't fully configured.
 */
export const semesterDays = (state) => {
  if (!state.semesterStart || !state.semesterEnd) return 0
  const start = new Date(state.semesterStart + 'T00:00:00')
  const end = new Date(state.semesterEnd + 'T00:00:00')
  if (end < start) return 0
  return Math.ceil((end - start) / 864e5) + 1
}

/**
 * A status summary for display — analogous to getVacationStatus.
 * Tells the UI whether the semester is upcoming, in progress, or finished.
 */
export const getSemesterStatus = (state) => {
  if (!state.semesterActive || !state.semesterStart || !state.semesterEnd) return null
  const today = todayKey()
  const total = semesterDays(state)

  if (today < state.semesterStart) {
    const start = new Date(state.semesterStart + 'T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((start - now) / 864e5)
    return { phase: 'upcoming', daysUntil, total }
  }

  if (today > state.semesterEnd) {
    return { phase: 'ended', total }
  }

  // in progress
  const start = new Date(state.semesterStart + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const elapsed = Math.ceil((now - start) / 864e5) + 1
  const end = new Date(state.semesterEnd + 'T00:00:00')
  const remaining = Math.ceil((end - now) / 864e5)
  return { phase: 'active', elapsed, remaining, total }
}

// ─── DAY PREVIEW ──────────────────────────────────────────────────────────────
// Aggregates everything scheduled for a given day — used by the hover card
// and calendar cell indicators.

export const getDayPreview = (dateKey, state) => {
  const goals = state.habits.filter((h) => habitAppliesOn(h, dateKey))
  const tasks = state.tasks.filter((t) => t.due?.startsWith(dateKey))
  const hasJournal = !!state.journal[dateKey]
  const hasClass = hasClassOnDay(dateKey, state.classes, state)
  const isVacation = (() => {
    const vm = state.vacationMode
    if (!vm?.active || !vm.startDate || !vm.endDate) return false
    return dateKey >= vm.startDate && dateKey <= vm.endDate
  })()

  return { goals, tasks, hasJournal, hasClass, isVacation }
}
