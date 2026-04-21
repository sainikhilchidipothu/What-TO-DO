import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isInSemester,
  hasClassOnDay,
  semesterDays,
  getSemesterStatus,
  getDayPreview,
} from '../utils/semester.js'
import { DEFAULT_STATE } from '../constants.js'

describe('isInSemester() — the core semester check', () => {
  it('returns TRUE when semester is inactive (legacy behavior)', () => {
    const state = { semesterActive: false, semesterStart: '', semesterEnd: '' }
    expect(isInSemester('2026-07-04', state)).toBe(true)
  })

  it('returns TRUE when active but dates missing (graceful fallback)', () => {
    const state = { semesterActive: true, semesterStart: '', semesterEnd: '' }
    expect(isInSemester('2026-07-04', state)).toBe(true)
  })

  it('returns TRUE for a date inside the window', () => {
    const state = { semesterActive: true, semesterStart: '2026-01-06', semesterEnd: '2026-05-01' }
    expect(isInSemester('2026-03-15', state)).toBe(true)
  })

  it('returns TRUE for inclusive endpoints', () => {
    const state = { semesterActive: true, semesterStart: '2026-01-06', semesterEnd: '2026-05-01' }
    expect(isInSemester('2026-01-06', state)).toBe(true)
    expect(isInSemester('2026-05-01', state)).toBe(true)
  })

  it('returns FALSE for a date outside the window', () => {
    const state = { semesterActive: true, semesterStart: '2026-01-06', semesterEnd: '2026-05-01' }
    expect(isInSemester('2026-06-01', state)).toBe(false)
    expect(isInSemester('2025-12-25', state)).toBe(false)
  })
})

describe('hasClassOnDay() — semester-aware class display', () => {
  const classes = [
    { id: 'c1', name: 'Algo for ML', days: [1, 3] }, // Mon + Wed
    { id: 'c2', name: 'Graphics', days: [2, 4] },    // Tue + Thu
  ]

  it('returns false when no classes at all', () => {
    const state = { semesterActive: false, classes: [] }
    expect(hasClassOnDay('2026-04-20', [], state)).toBe(false) // a Monday
  })

  it('returns true on a matching weekday when semester is inactive', () => {
    const state = { semesterActive: false }
    // 2026-04-20 = Monday
    expect(hasClassOnDay('2026-04-20', classes, state)).toBe(true)
  })

  it('returns false on a non-matching weekday regardless of semester', () => {
    const state = { semesterActive: false }
    // 2026-04-19 = Sunday (day 0) — no class
    expect(hasClassOnDay('2026-04-19', classes, state)).toBe(false)
  })

  it('THE CORE FIX: returns false for matching weekday OUTSIDE semester', () => {
    const state = {
      semesterActive: true,
      semesterStart: '2026-01-06',
      semesterEnd: '2026-05-01',
    }
    // 2026-08-17 is a Monday, but it's outside the semester window
    expect(hasClassOnDay('2026-08-17', classes, state)).toBe(false)
  })

  it('returns true for matching weekday INSIDE semester', () => {
    const state = {
      semesterActive: true,
      semesterStart: '2026-01-06',
      semesterEnd: '2026-05-01',
    }
    // 2026-03-16 is a Monday, inside the window
    expect(hasClassOnDay('2026-03-16', classes, state)).toBe(true)
  })
})

describe('semesterDays() — inclusive count', () => {
  it('returns 0 if dates not set', () => {
    expect(semesterDays({ semesterStart: '', semesterEnd: '' })).toBe(0)
  })

  it('returns 1 for a single-day "semester"', () => {
    expect(semesterDays({ semesterStart: '2026-01-06', semesterEnd: '2026-01-06' })).toBe(1)
  })

  it('returns 116 for a typical spring semester', () => {
    // Jan 6 → May 1 = 116 days inclusive
    expect(semesterDays({ semesterStart: '2026-01-06', semesterEnd: '2026-05-01' })).toBe(116)
  })

  it('returns 0 when end is before start', () => {
    expect(semesterDays({ semesterStart: '2026-05-01', semesterEnd: '2026-01-06' })).toBe(0)
  })
})

describe('getSemesterStatus() — phases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 15)) // Mar 15 2026
  })
  afterEach(() => vi.useRealTimers())

  it('returns null when inactive', () => {
    const state = { semesterActive: false, semesterStart: '2026-01-06', semesterEnd: '2026-05-01' }
    expect(getSemesterStatus(state)).toBeNull()
  })

  it('returns upcoming phase for future semester', () => {
    const state = { semesterActive: true, semesterStart: '2026-08-18', semesterEnd: '2026-12-15' }
    const s = getSemesterStatus(state)
    expect(s.phase).toBe('upcoming')
    expect(s.daysUntil).toBeGreaterThan(0)
  })

  it('returns active phase when today is inside', () => {
    const state = { semesterActive: true, semesterStart: '2026-01-06', semesterEnd: '2026-05-01' }
    const s = getSemesterStatus(state)
    expect(s.phase).toBe('active')
    expect(s.elapsed).toBeGreaterThan(0)
    expect(s.remaining).toBeGreaterThan(0)
  })

  it('returns ended phase for past semester', () => {
    const state = { semesterActive: true, semesterStart: '2025-08-18', semesterEnd: '2025-12-15' }
    const s = getSemesterStatus(state)
    expect(s.phase).toBe('ended')
  })
})

describe('getDayPreview() — aggregated day data', () => {
  it('respects semester for hasClass', () => {
    const state = {
      ...DEFAULT_STATE,
      semesterActive: true,
      semesterStart: '2026-01-06',
      semesterEnd: '2026-05-01',
      classes: [{ id: 'c1', name: 'Test', days: [1] }], // Monday
    }
    // 2026-08-17 Monday, outside semester
    expect(getDayPreview('2026-08-17', state).hasClass).toBe(false)
    // 2026-03-16 Monday, inside semester
    expect(getDayPreview('2026-03-16', state).hasClass).toBe(true)
  })

  it('filters goals to those scheduled for the day', () => {
    const state = {
      ...DEFAULT_STATE,
      habits: [
        { id: 'g1', name: 'Every day', specificDays: null },
        { id: 'g2', name: 'Weekends only', specificDays: [0, 6] },
      ],
    }
    // 2026-04-20 = Monday — weekends-only goal shouldn't appear
    const preview = getDayPreview('2026-04-20', state)
    expect(preview.goals.length).toBe(1)
    expect(preview.goals[0].id).toBe('g1')
  })
})
