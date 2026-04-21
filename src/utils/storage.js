// ─── STORAGE ──────────────────────────────────────────────────────────────────
// Localstorage wrapper with a light migration pass for older saved states.

import { STORAGE_KEY, DEFAULT_STATE } from '../constants.js'

export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE

    const parsed = JSON.parse(raw)
    const next = { ...DEFAULT_STATE, ...parsed }

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
        resolve({ ...DEFAULT_STATE, ...parsed })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
