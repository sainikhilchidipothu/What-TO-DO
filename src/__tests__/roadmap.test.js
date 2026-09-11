import { describe, expect, it } from 'vitest'
import { calculateGpa, recurringDates, tasksOnDate, reviewSummary, weeklyClassMinutes } from '../utils/roadmap.js'

describe('roadmap helpers', () => {
  it('expands selected weekday recurrence', () => {
    expect(recurringDates({ due: '2026-09-07T09:00:00', recurring: { frequency: 'weekdays', weekdays: [1, 3, 5] } }, '2026-09-07', '2026-09-13')).toEqual(['2026-09-07', '2026-09-09', '2026-09-11'])
  })
  it('returns recurring tasks on matching calendar dates', () => {
    const task = { id: 't1', name: 'Study', due: '2026-09-07T09:00:00', recurring: { frequency: 'weekdays', weekdays: [1, 3, 5] } }
    expect(tasksOnDate([task], '2026-09-09')).toEqual([{ ...task, recurringInstance: true }])
    expect(tasksOnDate([task], '2026-09-08')).toEqual([])
    expect(tasksOnDate([task], '2026-09-06')).toEqual([])
  })
  it('calculates weighted GPA by class', () => {
    const result = calculateGpa([{ classId: 'a', score: 90, maxScore: 100, weight: 1 }], [{ id: 'a', name: 'Math' }])
    expect(result.value).toBe(3.7)
  })
  it('summarizes a review week', () => {
    const result = reviewSummary({ tasks: [{ done: true, due: '2026-09-08T12:00:00' }], history: { '2026-09-09': ['g'] }, weeklyReviews: {} }, '2026-09-07')
    expect(result).toMatchObject({ completedTasks: 1, completedGoals: 1 })
  })
  it('groups study minutes by class', () => {
    expect(weeklyClassMinutes([{ classId: 'a', startedAt: '2026-09-08T10:00:00Z', minutes: 25 }], [{ id: 'a', name: 'Math' }], '2026-09-07')[0].minutes).toBe(25)
  })
})
