// ─── State merge helpers ────────────────────────────────────────────────────
// Used only when a device that already has local data signs into an account
// that also has cloud data. The user is asked how to reconcile; `mergeStates`
// backs the "combine both" choice. Arrays of records are unioned by id (later
// value wins on overlap); keyed objects (journal/history/reviews) are merged by
// key; progress counters take the larger value.

const unionById = (a = [], b = []) => {
  const map = new Map()
  for (const item of [...a, ...b]) {
    if (item && item.id != null) map.set(item.id, { ...map.get(item.id), ...item })
  }
  return [...map.values()]
}

const mergeByKey = (a = {}, b = {}) => ({ ...a, ...b })

export function mergeStates(local, cloud) {
  if (!cloud) return local
  if (!local) return cloud
  return {
    ...local,
    ...cloud,
    habits: unionById(local.habits, cloud.habits),
    tasks: unionById(local.tasks, cloud.tasks),
    classes: unionById(local.classes, cloud.classes),
    grades: unionById(local.grades, cloud.grades),
    semesters: unionById(local.semesters, cloud.semesters),
    pomodoroSessions: unionById(local.pomodoroSessions, cloud.pomodoroSessions),
    journal: mergeByKey(local.journal, cloud.journal),
    history: mergeByKey(local.history, cloud.history),
    weeklyReviews: mergeByKey(local.weeklyReviews, cloud.weeklyReviews),
    xp: Math.max(local.xp || 0, cloud.xp || 0),
    level: Math.max(local.level || 1, cloud.level || 1),
    userName: local.userName || cloud.userName || '',
  }
}

/** True when a state carries no user-created content worth preserving. */
export function isEmptyState(s) {
  if (!s) return true
  const arrays = ['habits', 'tasks', 'classes', 'grades', 'pomodoroSessions']
  const objects = ['journal', 'history', 'weeklyReviews']
  const hasArray = arrays.some((k) => Array.isArray(s[k]) && s[k].length > 0)
  const hasObject = objects.some((k) => s[k] && Object.keys(s[k]).length > 0)
  return !hasArray && !hasObject && !s.userName
}
