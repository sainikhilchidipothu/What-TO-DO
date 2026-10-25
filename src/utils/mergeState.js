// Helpers for reconciling local and cloud data when a device with existing
// data signs into an account that also has data. mergeStates backs the
// "combine both" choice: record arrays are unioned by id, keyed objects
// (journal/history/reviews) are merged by key, and counters take the larger.

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
    onboarded: local.onboarded !== false || cloud.onboarded !== false,
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

/**
 * JSON with object keys sorted, so two equal states always produce the same
 * string. Postgres jsonb reorders keys, which made a plain JSON.stringify
 * comparison report a cloud copy as different from an identical local one.
 */
export function stableStringify(value) {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((acc, k) => { acc[k] = v[k]; return acc }, {})
      : v,
  )
}

/** Short fingerprint of a state, for remembering what was last synced. */
export function stateFingerprint(state) {
  const str = stableStringify(state)
  let h = 0x811c9dc5 // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `${str.length}:${(h >>> 0).toString(36)}`
}

/**
 * Decide what to do when a signed-in device first talks to the cloud. Both
 * states must already be normalized. meta is { userId, fingerprint } from the
 * device's last successful sync, or null.
 *   seed  – account has no cloud row yet: upload this device
 *   adopt – take the cloud copy (nothing local worth keeping, or no local edits)
 *   push  – cloud is unchanged since the last sync: upload this device's edits
 *   merge – same account, both sides changed since the last sync: combine
 *   ask   – this device's data was never synced with this account: let the user choose
 */
export function reconcileAction({ local, cloud, meta, userId }) {
  if (!cloud) return 'seed'
  const localFp = stateFingerprint(local)
  if (isEmptyState(local) || localFp === stateFingerprint(cloud)) return 'adopt'
  if (meta?.userId === userId) {
    if (localFp === meta.fingerprint) return 'adopt'
    if (stateFingerprint(cloud) === meta.fingerprint) return 'push'
    return 'merge'
  }
  return 'ask'
}
