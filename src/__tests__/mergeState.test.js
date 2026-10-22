import { describe, it, expect } from 'vitest'
import { mergeStates, isEmptyState } from '../utils/mergeState.js'

describe('isEmptyState', () => {
  it('treats a blank/default state as empty', () => {
    expect(isEmptyState({ habits: [], tasks: [], journal: {}, userName: '' })).toBe(true)
    expect(isEmptyState(null)).toBe(true)
  })
  it('treats any user content as non-empty', () => {
    expect(isEmptyState({ tasks: [{ id: 1 }] })).toBe(false)
    expect(isEmptyState({ journal: { '2026-01-01': { text: 'hi' } } })).toBe(false)
    expect(isEmptyState({ userName: 'Sai' })).toBe(false)
  })
})

describe('mergeStates', () => {
  it('unions record arrays by id without dropping either side', () => {
    const local = { tasks: [{ id: 'a', name: 'A' }], habits: [] }
    const cloud = { tasks: [{ id: 'b', name: 'B' }], habits: [] }
    const merged = mergeStates(local, cloud)
    expect(merged.tasks.map((t) => t.id).sort()).toEqual(['a', 'b'])
  })

  it('merges overlapping ids field-by-field (later source wins)', () => {
    const local = { tasks: [{ id: 'a', name: 'old', done: false }] }
    const cloud = { tasks: [{ id: 'a', name: 'new' }] }
    const merged = mergeStates(local, cloud)
    expect(merged.tasks).toHaveLength(1)
    expect(merged.tasks[0]).toMatchObject({ id: 'a', name: 'new', done: false })
  })

  it('merges keyed objects and keeps the higher progress counters', () => {
    const local = { journal: { d1: { text: 'x' } }, xp: 120, level: 2 }
    const cloud = { journal: { d2: { text: 'y' } }, xp: 80, level: 1 }
    const merged = mergeStates(local, cloud)
    expect(Object.keys(merged.journal).sort()).toEqual(['d1', 'd2'])
    expect(merged.xp).toBe(120)
    expect(merged.level).toBe(2)
  })

  it('returns the other side when one is missing', () => {
    const only = { tasks: [{ id: 'a' }] }
    expect(mergeStates(only, null)).toBe(only)
    expect(mergeStates(null, only)).toBe(only)
  })
})
