// Keeps localStorage (via useAppState) in step with the user's cloud row.
// localStorage is always the working copy; the cloud only engages when signed
// in. lastSyncedJson holds the state we last pushed or pulled (as key-sorted
// JSON) so we only push real changes and don't bounce a pulled update straight
// back up. The device also remembers which account it last synced with, so
// reopening the app reconciles quietly; we only ask the user how to combine
// data when a device's existing data has never been synced with this account.

import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchCloudState, pushCloudState } from '../lib/cloud.js'
import { mergeStates, reconcileAction, stableStringify, stateFingerprint } from '../utils/mergeState.js'
import { normalizeState, loadSyncMeta, saveSyncMeta } from '../utils/storage.js'

const PUSH_DEBOUNCE_MS = 1500

export function useCloudSync({ configured, user, state, setState }) {
  const [status, setStatus] = useState('idle') // idle | syncing | synced | error
  const [conflict, setConflict] = useState(null) // { cloud } awaiting user choice
  const lastSyncedJson = useRef(null)
  const ready = useRef(false) // true once the initial reconcile has settled
  const [reconciled, setReconciled] = useState(false) // render-visible mirror of ready
  const pushTimer = useRef(null)

  // Record that this device and the cloud now hold `synced` for this user.
  const markSynced = useCallback((userId, synced) => {
    lastSyncedJson.current = stableStringify(synced)
    saveSyncMeta(userId, stateFingerprint(synced))
  }, [])

  // Replace local state with a cloud snapshot without triggering a push back.
  const applyRemote = useCallback((userId, remote) => {
    const next = normalizeState(remote)
    markSynced(userId, next)
    setState(() => next)
  }, [setState, markSynced])

  // ── Initial reconcile when a user signs in ───────────────────────────────
  useEffect(() => {
    if (!configured || !user) {
      ready.current = false
      setReconciled(false)
      lastSyncedJson.current = null
      setStatus('idle')
      return
    }
    let cancelled = false
    ready.current = false
    setReconciled(false)
    setStatus('syncing')
    ;(async () => {
      try {
        const raw = await fetchCloudState(user.id)
        if (cancelled) return
        const cloud = raw && normalizeState(raw)
        const action = reconcileAction({ local: state, cloud, meta: loadSyncMeta(), userId: user.id })
        if (action === 'ask') {
          // This device's data never synced with this account — let the user decide.
          setConflict({ cloud })
        } else {
          if (action === 'adopt') applyRemote(user.id, cloud)
          else {
            const next = action === 'merge' ? mergeStates(state, cloud) : state // seed | push
            await pushCloudState(user.id, next)
            if (cancelled) return
            if (next !== state) setState(() => next)
            markSynced(user.id, next)
          }
          ready.current = true
          setReconciled(true)
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
    // Reconcile is tied to the identity change, not to every edit. Keyed on the
    // user id: Supabase hands back a new user object on every token refresh,
    // which would otherwise re-run this and can pop the conflict dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, user?.id])

  // ── Push local edits (debounced) ─────────────────────────────────────────
  useEffect(() => {
    if (!configured || !user || !ready.current || conflict) return
    if (stableStringify(state) === lastSyncedJson.current) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      try {
        setStatus('syncing')
        await pushCloudState(user.id, state)
        markSynced(user.id, state)
        setStatus('synced')
      } catch (e) {
        console.warn('Cloud push failed:', e)
        setStatus('error')
      }
    }, PUSH_DEBOUNCE_MS)
    return () => clearTimeout(pushTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, configured, user?.id, conflict])

  // ── Pull on focus to pick up edits made on another device ────────────────
  useEffect(() => {
    if (!configured || !user) return
    const onFocus = async () => {
      if (!ready.current || conflict) return
      try {
        const raw = await fetchCloudState(user.id)
        if (!raw) return
        const cloud = normalizeState(raw)
        const cloudJson = stableStringify(cloud)
        if (cloudJson !== lastSyncedJson.current && cloudJson !== stableStringify(state)) {
          applyRemote(user.id, cloud)
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
      if (choice !== 'cloud') await pushCloudState(user.id, resolved)
      applyRemote(user.id, resolved)
      ready.current = true
      setReconciled(true)
      setStatus('synced')
    } catch (e) {
      console.warn('Conflict resolution failed:', e)
      setStatus('error')
    }
  }, [conflict, state, user, applyRemote])

  return { status, conflict, resolveConflict, reconciled }
}
