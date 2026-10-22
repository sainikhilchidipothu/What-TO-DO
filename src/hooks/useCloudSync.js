// Keeps localStorage (via useAppState) in step with the user's cloud row.
// localStorage is always the working copy; the cloud only engages when signed
// in. lastSyncedJson holds the state we last pushed or pulled so we only push
// real changes and don't bounce a pulled update straight back up. If a device
// with data signs into an account that also has data, we ask the user how to
// reconcile instead of overwriting either side.

import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchCloudState, pushCloudState } from '../lib/cloud.js'
import { isEmptyState, mergeStates } from '../utils/mergeState.js'

const PUSH_DEBOUNCE_MS = 1500

export function useCloudSync({ configured, user, state, setState }) {
  const [status, setStatus] = useState('idle') // idle | syncing | synced | error
  const [conflict, setConflict] = useState(null) // { cloud } awaiting user choice
  const lastSyncedJson = useRef(null)
  const ready = useRef(false) // true once the initial reconcile has settled
  const pushTimer = useRef(null)

  // Replace local state with a cloud snapshot without triggering a push back.
  const applyRemote = useCallback((remote) => {
    lastSyncedJson.current = JSON.stringify(remote)
    setState(() => remote)
  }, [setState])

  // ── Initial reconcile when a user signs in ───────────────────────────────
  useEffect(() => {
    if (!configured || !user) {
      ready.current = false
      lastSyncedJson.current = null
      setStatus('idle')
      return
    }
    let cancelled = false
    setStatus('syncing')
    ;(async () => {
      try {
        const cloud = await fetchCloudState(user.id)
        if (cancelled) return
        if (!cloud) {
          // No cloud row yet — seed it from this device.
          await pushCloudState(user.id, state)
          lastSyncedJson.current = JSON.stringify(state)
          ready.current = true
        } else if (isEmptyState(state) || JSON.stringify(state) === JSON.stringify(cloud)) {
          // Nothing local worth keeping (or already identical): adopt cloud.
          applyRemote(cloud)
          ready.current = true
        } else {
          // Both sides have distinct data — let the user decide.
          setConflict({ cloud })
        }
        if (!cancelled) setStatus('synced')
      } catch (e) {
        if (!cancelled) {
          console.warn('Cloud sync (initial) failed:', e)
          setStatus('error')
        }
      }
    })()
    return () => { cancelled = true }
    // Reconcile is tied to the identity change, not to every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, user])

  // ── Push local edits (debounced) ─────────────────────────────────────────
  useEffect(() => {
    if (!configured || !user || !ready.current || conflict) return
    const json = JSON.stringify(state)
    if (json === lastSyncedJson.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      try {
        setStatus('syncing')
        await pushCloudState(user.id, state)
        lastSyncedJson.current = json
        setStatus('synced')
      } catch (e) {
        console.warn('Cloud push failed:', e)
        setStatus('error')
      }
    }, PUSH_DEBOUNCE_MS)
    return () => clearTimeout(pushTimer.current)
  }, [state, configured, user, conflict])

  // ── Pull on focus to pick up edits made on another device ────────────────
  useEffect(() => {
    if (!configured || !user) return
    const onFocus = async () => {
      if (!ready.current || conflict) return
      try {
        const cloud = await fetchCloudState(user.id)
        if (!cloud) return
        const cloudJson = JSON.stringify(cloud)
        if (cloudJson !== lastSyncedJson.current && cloudJson !== JSON.stringify(state)) {
          applyRemote(cloud)
        }
      } catch {
        /* offline or transient — keep working locally */
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [configured, user, conflict, state, applyRemote])

  // ── Resolve the login-time conflict ──────────────────────────────────────
  const resolveConflict = useCallback(async (choice) => {
    if (!conflict || !user) return
    const resolved =
      choice === 'cloud' ? conflict.cloud
      : choice === 'merge' ? mergeStates(state, conflict.cloud)
      : state // 'local'
    setConflict(null)
    try {
      setStatus('syncing')
      applyRemote(resolved)
      if (choice !== 'cloud') {
        await pushCloudState(user.id, resolved)
        lastSyncedJson.current = JSON.stringify(resolved)
      }
      ready.current = true
      setStatus('synced')
    } catch (e) {
      console.warn('Conflict resolution failed:', e)
      setStatus('error')
    }
  }, [conflict, state, user, applyRemote])

  return { status, conflict, resolveConflict }
}
