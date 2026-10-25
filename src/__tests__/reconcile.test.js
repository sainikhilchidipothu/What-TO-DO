import { describe, it, expect } from 'vitest'
import { reconcileAction, stableStringify, stateFingerprint } from '../utils/mergeState.js'

const local = { tasks: [{ id: 'a', name: 'A' }], userName: 'Sai' }
// Same data, keys in a different order, the way Postgres jsonb hands it back.
const reordered = { userName: 'Sai', tasks: [{ name: 'A', id: 'a' }] }
const edited = { tasks: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], userName: 'Sai' }

describe('stableStringify', () => {
  it('ignores object key order but keeps array order', () => {
    expect(stableStringify(local)).toBe(stableStringify(reordered))
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]))
  })
})

describe('reconcileAction', () => {
  const meta = (s, userId = 'u1') => ({ userId, fingerprint: stateFingerprint(s) })

  it('seeds an account with no cloud row', () => {
    expect(reconcileAction({ local, cloud: null, meta: null, userId: 'u1' })).toBe('seed')
  })
  it('adopts the cloud on an empty device', () => {
    expect(reconcileAction({ local: { tasks: [] }, cloud: local, meta: null, userId: 'u1' })).toBe('adopt')
  })
  it('does not ask when the copies only differ in key order', () => {
    expect(reconcileAction({ local, cloud: reordered, meta: null, userId: 'u1' })).toBe('adopt')
  })
  it('adopts cloud changes when this device has no edits since its last sync', () => {
    expect(reconcileAction({ local, cloud: edited, meta: meta(local), userId: 'u1' })).toBe('adopt')
  })
  it('pushes offline edits when the cloud has not changed', () => {
    expect(reconcileAction({ local: edited, cloud: local, meta: meta(local), userId: 'u1' })).toBe('push')
  })
  it('merges quietly when both sides changed for the same account', () => {
    const other = { tasks: [{ id: 'c', name: 'C' }], userName: 'Sai' }
    expect(reconcileAction({ local: edited, cloud: other, meta: meta(local), userId: 'u1' })).toBe('merge')
  })
  it('asks when the device data was synced with a different account or never synced', () => {
    expect(reconcileAction({ local: edited, cloud: local, meta: meta(local, 'someone-else'), userId: 'u1' })).toBe('ask')
    expect(reconcileAction({ local: edited, cloud: local, meta: null, userId: 'u1' })).toBe('ask')
  })
})
