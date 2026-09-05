// ─── STORAGE ──────────────────────────────────────────────────────────────────
// Localstorage wrapper with a light migration pass for older saved states.

import { STORAGE_KEY, DEFAULT_STATE, SPRING_2026_SEMESTER } from '../constants.js'

export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE

    const parsed = JSON.parse(raw)
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

    // Migration: old saves had semesterStart/End without semesterActive.
    // If dates existed but no active flag, default to inactive so user
    // explicitly opts in via the new modal.
    if (parsed.semesterActive === undefined) {
      next.semesterActive = false
    }

    return next
  } catch {
    return DEFAULT_STATE
  }
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
