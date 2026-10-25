import { describe, it, expect, beforeEach } from 'vitest'
import { initials } from '../components/common/Avatar.jsx'
import { accountName } from '../hooks/useAuth.js'
import { loadState } from '../utils/storage.js'
import { STORAGE_KEY } from '../constants.js'

describe('initials', () => {
  it('uses first and last word of the name', () => {
    expect(initials('Sai Nikhil Chidipothu')).toBe('SC')
    expect(initials('alex')).toBe('AL')
  })
  it('falls back to the email, then empty', () => {
    expect(initials('', 'pat@example.com')).toBe('P')
    expect(initials('  ', '')).toBe('')
  })
})

describe('accountName', () => {
  it('reads full_name from user metadata', () => {
    expect(accountName({ user_metadata: { full_name: ' Sam ' } })).toBe('Sam')
    expect(accountName({ user_metadata: {} })).toBe('')
    expect(accountName(null)).toBe('')
  })
})

describe('loadState onboarding migration', () => {
  const store = {}
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k]
    globalThis.localStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
    }
  })
  it('a fresh device needs onboarding', () => {
    expect(loadState().onboarded).toBe(false)
  })
  it('saves from before the flag count as onboarded', () => {
    store[STORAGE_KEY] = JSON.stringify({ userName: 'Old user' })
    expect(loadState().onboarded).toBe(true)
  })
  it('keeps an explicit false', () => {
    store[STORAGE_KEY] = JSON.stringify({ onboarded: false })
    expect(loadState().onboarded).toBe(false)
  })
})
