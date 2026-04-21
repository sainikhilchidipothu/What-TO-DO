// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const STORAGE_KEY = 'what-to-do-tracker'

export const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
export const DAYS_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTHS     = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const CATEGORIES = {
  health:   'Health 🏃',
  study:    'Study 📚',
  work:     'Work 💼',
  social:   'Social 👥',
  personal: 'Personal 🎯',
  creative: 'Creative 🎨',
  finance:  'Finance 💰',
  home:     'Home 🏠',
}

export const CAT_COLORS = {
  health:   '#e53e3e',
  study:    '#805ad5',
  work:     '#dd6b20',
  social:   '#38a169',
  personal: '#d69e2e',
  creative: '#d53f8c',
  finance:  '#3182ce',
  home:     '#718096',
}

export const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
export const MINUTES  = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

export const DEFAULT_STATE = {
  habits: [],
  tasks: [],      // { id, name, due, tier, done, classId?, subtasks:[], recurring:null, dependsOn:[] }
  history: {},
  journal: {},
  targetDate: '2026-08-31',
  // ── Semester feature ───────────────────────────────────────────────────
  // When `semesterActive` is true, classes are only shown on dates between
  // `semesterStart` and `semesterEnd` (inclusive). When false, classes
  // display on every matching day-of-week (legacy behavior, preserves
  // backward compatibility for users who haven't set up a semester yet).
  semesterStart: '',
  semesterEnd: '',
  semesterName: '',
  semesterActive: false,
  // ───────────────────────────────────────────────────────────────────────
  classes: [],    // { id, code, name, days, time, location, color, link }
  timerPresets: { focus: 25, shortBreak: 5 },
  vacationMode: { active: false, startDate: null, endDate: null },
  vacationHistory: [],
  assignments: [], // reserved for future use
  deletedItems: [], // reserved
  xp: 0,
  level: 1,
}
