import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getStreaks, buildInsights } from '../utils/helpers.js'
import { dk } from '../utils/date.js'

describe('getStreaks() — habit streak calculation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 19)) // Apr 19 2026
  })
  afterEach(() => vi.useRealTimers())

  it('returns 0/0 when never done', () => {
    const { current, best } = getStreaks('g1', {})
    expect(current).toBe(0)
    expect(best).toBe(0)
  })

  it('counts a single consecutive streak including today', () => {
    const history = {}
    const today = new Date(2026, 3, 19)
    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      history[dk(d)] = ['g1']
    }
    const { current, best } = getStreaks('g1', history)
    expect(current).toBe(5)
    expect(best).toBe(5)
  })

  it('current resets to 0 if today is missed', () => {
    const history = {}
    const today = new Date(2026, 3, 19)
    // Miss today, hit the previous 5 days
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      history[dk(d)] = ['g1']
    }
    const { current, best } = getStreaks('g1', history)
    expect(current).toBe(0)
    expect(best).toBe(5)
  })

  it('best tracks the longest broken streak', () => {
    const history = {}
    const today = new Date(2026, 3, 19)
    // streak of 3 today, gap, streak of 7 before that
    for (let i = 0; i < 3; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      history[dk(d)] = ['g1']
    }
    for (let i = 5; i < 12; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      history[dk(d)] = ['g1']
    }
    const { current, best } = getStreaks('g1', history)
    expect(current).toBe(3)
    expect(best).toBe(7)
  })

  it('ignores other habit ids in the history', () => {
    const history = {}
    const today = new Date(2026, 3, 19)
    for (let i = 0; i < 5; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      history[dk(d)] = ['g2'] // different habit
    }
    const { current, best } = getStreaks('g1', history)
    expect(current).toBe(0)
    expect(best).toBe(0)
  })

  it('does not count days before startDate as missed', () => {
    const history = {}
    const today = new Date(2026, 3, 19)
    // Done today and yesterday only — habit "started" yesterday.
    for (let i = 0; i < 2; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      history[dk(d)] = ['g1']
    }
    const startDate = dk(new Date(2026, 3, 18))
    const { current, best } = getStreaks('g1', history, startDate)
    expect(current).toBe(2)
    expect(best).toBe(2)
  })
})

describe('buildInsights()', () => {
  it('returns empty array when there is nothing to report', () => {
    const state = { habits: [], history: {}, tasks: [] }
    expect(buildInsights(state)).toEqual([])
  })

  it('surfaces a top-goal insight when a streak exceeds 3', () => {
    const state = {
      habits: [{ id: 'g1', name: 'Read' }],
      history: {},
      tasks: [],
    }
    // Build a 5-day streak
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 19))
    const today = new Date(2026, 3, 19)
    for (let i = 0; i < 5; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      state.history[dk(d)] = ['g1']
    }
    const insights = buildInsights(state)
    expect(insights.find((i) => i.title === 'Top Goal')).toBeTruthy()
    vi.useRealTimers()
  })
})
