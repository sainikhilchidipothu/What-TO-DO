// ─── STORAGE ──────────────────────────────────────────────────────────────────
// Localstorage wrapper with a light migration pass for older saved states.

import { STORAGE_KEY, DEFAULT_STATE, SPRING_2026_SEMESTER } from '../constants.js'

export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return normalizeState(JSON.parse(raw))
  } catch {
    return DEFAULT_STATE
  }
}

/** Fill defaults and migrate an older saved state (local or cloud) to the current shape. */
export const normalizeState = (parsed) => {
  const next = { ...DEFAULT_STATE, ...parsed, pomodoroSessions: parsed.pomodoroSessions || [], grades: parsed.grades || [], weeklyReviews: parsed.weeklyReviews || {} }
  const currentSemesterId = next.currentSemesterId || 'legacy-semester'
  const configuredSemester = {
    id: currentSemesterId,
    name: next.semesterName || 'Current semester',
    startDate: next.semesterStart || '',
    endDate: next.semesterEnd || '',
    active: !!next.semesterActive,
  }
  const semesters = [...(next.semesters || [])]
  if (!semesters.some((s) => s.id === SPRING_2026_SEMESTER.id)) {
    semesters.push(SPRING_2026_SEMESTER)
  }
  if (!semesters.some((s) => s.id === currentSemesterId)) {
    semesters.push(configuredSemester)
  }

  // Classes created before semester ownership existed belong to the
  // currently configured semester and must not be lost during migration.
  next.currentSemesterId = currentSemesterId
  next.semesters = semesters
  next.classes = (next.classes || []).map((c) => ({
    ...c,
    semesterId: c.semesterId || currentSemesterId,
  }))

  // Migration: retroactively compute XP from already-completed tasks
  // for users who loaded pre-XP saves.
  if (next.xp === 0 || next.xp === undefined) {
    const completed = next.tasks.filter((t) => t.done).length
    next.xp = completed * 10
    next.level = Math.floor(next.xp / 100) + 1
  }

  // Migration: anyone with a save from before the onboarded flag has
  // already been through setup.
  if (parsed.onboarded === undefined) next.onboarded = true

  // Migration: old saves had semesterStart/End without semesterActive.
  // If dates existed but no active flag, default to inactive so user
  // explicitly opts in via the new modal.
  if (parsed.semesterActive === undefined) {
    next.semesterActive = false
  }

  return next
}

export const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to persist state:', e)
  }
}

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

/** Export current state as a downloadable JSON file. */
export const exportToFile = (state) => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `what-to-do-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Import state from a file. Returns a promise resolving to parsed state. */
export const importFromFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        const next = { ...DEFAULT_STATE, ...parsed }
        const currentSemesterId = next.currentSemesterId || 'legacy-semester'
        const configuredSemester = {
          id: currentSemesterId,
          name: next.semesterName || 'Current semester',
          startDate: next.semesterStart || '',
          endDate: next.semesterEnd || '',
          active: !!next.semesterActive,
        }
        const semesters = [...(next.semesters || [])]
        if (!semesters.some((s) => s.id === SPRING_2026_SEMESTER.id)) {
          semesters.push(SPRING_2026_SEMESTER)
        }
        if (!semesters.some((s) => s.id === currentSemesterId)) {
          semesters.push(configuredSemester)
        }
        resolve({
          ...next,
          onboarded: parsed.onboarded ?? true,
          pomodoroSessions: next.pomodoroSessions || [],
          grades: next.grades || [],
          weeklyReviews: next.weeklyReviews || {},
          currentSemesterId,
          semesters,
          classes: (next.classes || []).map((c) => ({
            ...c,
            semesterId: c.semesterId || currentSemesterId,
          })),
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })

// ── Sync bookkeeping ─────────────────────────────────────────────────────────
// Remembers which account this device last synced with and a fingerprint of
// the state at that moment, so later sign-ins can tell "same account, maybe
// some offline edits" apart from "someone else's data on this device".
const SYNC_META_KEY = `${STORAGE_KEY}:sync`

export const loadSyncMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY)) || null
  } catch {
    return null
  }
}

export const saveSyncMeta = (userId, fingerprint) => {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify({ userId, fingerprint }))
  } catch {
    /* noop */
  }
}
