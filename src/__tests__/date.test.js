import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dk, daysLeft, isVacDay, vacationDays, getVacationStatus } from '../utils/date.js'

describe('dk() — date key coercion', () => {
  it('converts a Date to ISO YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 6) // Jan 6 2026 local
    expect(dk(d)).toBe('2026-01-06')
  })

  it('converts an ISO string to itself (round trip)', () => {
    expect(dk('2026-08-31')).toBe('2026-08-31')
  })

  it('pads single-digit months and days', () => {
    const d = new Date(2026, 2, 5) // Mar 5
    expect(dk(d)).toBe('2026-03-05')
  })
})

describe('daysLeft() — countdown math', () => {
  let fakeNow

  beforeEach(() => {
    vi.useFakeTimers()
    fakeNow = new Date(2026, 3, 19) // Apr 19 2026
    vi.setSystemTime(fakeNow)
  })

  afterEach(() => { vi.useRealTimers() })

  it('returns positive count for future dates', () => {
    expect(daysLeft('2026-04-20')).toBe(1)
    expect(daysLeft('2026-04-26')).toBe(7)
  })

  it('returns 0 for today', () => {
    expect(daysLeft('2026-04-19')).toBe(0)
  })

  it('returns negative for past dates', () => {
    expect(daysLeft('2026-04-18')).toBe(-1)
  })
})

describe('isVacDay()', () => {
  const vm = { active: true, startDate: '2026-06-01', endDate: '2026-06-07' }

  it('returns true for dates inside the range', () => {
    expect(isVacDay('2026-06-03', vm)).toBe(true)
  })

  it('returns true for endpoints (inclusive)', () => {
    expect(isVacDay('2026-06-01', vm)).toBe(true)
    expect(isVacDay('2026-06-07', vm)).toBe(true)
  })

  it('returns false outside the range', () => {
    expect(isVacDay('2026-05-31', vm)).toBe(false)
    expect(isVacDay('2026-06-08', vm)).toBe(false)
  })

  it('returns false when vacation is inactive', () => {
    expect(isVacDay('2026-06-03', { ...vm, active: false })).toBe(false)
  })

  it('returns false when vm is null/undefined', () => {
    expect(isVacDay('2026-06-03', null)).toBe(false)
    expect(isVacDay('2026-06-03', undefined)).toBe(false)
  })
})

describe('vacationDays() — count days in vacation (inclusive)', () => {
  it('returns 1 for a single-day vacation', () => {
    expect(vacationDays({ active: true, startDate: '2026-06-01', endDate: '2026-06-01' })).toBe(1)
  })

  it('returns 7 for a week', () => {
    expect(vacationDays({ active: true, startDate: '2026-06-01', endDate: '2026-06-07' })).toBe(7)
  })

  it('returns 0 when not configured', () => {
    expect(vacationDays({ active: false })).toBe(0)
  })
})

describe('getVacationStatus()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 3)) // Jun 3 2026
  })
  afterEach(() => vi.useRealTimers())

  it('returns "Taking" while ongoing', () => {
    const s = getVacationStatus({ active: true, startDate: '2026-06-01', endDate: '2026-06-07' })
    expect(s.verb).toBe('Taking')
    expect(s.isPast).toBe(false)
  })

  it('returns "Took" when past', () => {
    const s = getVacationStatus({ active: true, startDate: '2026-05-01', endDate: '2026-05-07' })
    expect(s.verb).toBe('Took')
    expect(s.isPast).toBe(true)
  })

  it('returns "Scheduled" when upcoming', () => {
    const s = getVacationStatus({ active: true, startDate: '2026-07-01', endDate: '2026-07-07' })
    expect(s.verb).toBe('Scheduled')
  })

  it('uses "a week" / "2 weeks" for special durations', () => {
    const week = getVacationStatus({ active: true, startDate: '2026-06-01', endDate: '2026-06-07' })
    expect(week.duration).toBe('a week')

    const twoWeeks = getVacationStatus({ active: true, startDate: '2026-06-01', endDate: '2026-06-14' })
    expect(twoWeeks.duration).toBe('2 weeks')
  })
})
