// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
// Pure functions, no React, no side effects — easy to test in isolation.

/**
 * Coerce a Date or ISO date string to an ISO "YYYY-MM-DD" key.
 * Uses local time (en-CA locale gives ISO format).
 */
export const dk = (d) => {
  const dt = d instanceof Date ? d : new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-CA')
}

/** Today's date as an ISO "YYYY-MM-DD" key, in local time. */
export const todayKey = () => dk(new Date())

/** Random-ish unique id. Fine for single-user localStorage; use UUIDs if syncing. */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

/**
 * Days between today (local midnight) and target date.
 * Positive if target is in the future, 0 if today, negative if past.
 */
export const daysLeft = (target) => {
  const [y, m, d] = target.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const n = new Date()
  n.setHours(0, 0, 0, 0)
  return Math.ceil((dt - n) / 864e5)
}

/** Human-readable date format ("Mon, Jan 6, 2026"). */
export const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

/** Short date format ("Jan 6"). */
export const fmtShortDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

// ─── VACATION HELPERS ─────────────────────────────────────────────────────────

export const isVacDay = (k, vm) => {
  if (!vm?.active || !vm.startDate || !vm.endDate) return false
  return k >= vm.startDate && k <= vm.endDate
}

export const vacationDays = (vm) => {
  if (!vm?.active || !vm.startDate || !vm.endDate) return 0
  const start = new Date(vm.startDate + 'T00:00:00')
  const end = new Date(vm.endDate + 'T00:00:00')
  return Math.ceil((end - start) / 864e5) + 1
}

export const getVacationStatus = (vm) => {
  if (!vm?.active || !vm.startDate || !vm.endDate) return null
  const today = todayKey()
  const isOngoing = today >= vm.startDate && today <= vm.endDate
  const isPast = today > vm.endDate
  const days = vacationDays(vm)
  const durationText =
    days === 1 ? '1 day' : days === 7 ? 'a week' : days === 14 ? '2 weeks' : `${days} days`

  if (isOngoing) return { verb: 'Taking', duration: durationText, isPast: false }
  if (isPast) return { verb: 'Took', duration: durationText, isPast: true }
  return { verb: 'Scheduled', duration: durationText, isPast: false }
}
