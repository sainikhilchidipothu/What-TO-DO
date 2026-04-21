// ─── Warning modals ───────────────────────────────────────────────────────────
// Three modals with audio chimes on open. The audio work is delegated to
// playChime() so these components are presentation-only.

import { useEffect } from 'react'
import { mono } from '../../theme.js'
import { playChime } from '../../utils/helpers.js'

// ── Vacation-with-pending-tasks warning ────────────────────────────────────
export function VacationTasksWarning({ onClose, onConfirm, taskCount }) {
  useEffect(() => { playChime([800, 600]) }, [])

  return (
    <Backdrop onClose={onClose}>
      <WarningCard borderColor="#ef4444">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }} aria-hidden="true">⚠️</div>
          <h2 id="modal-title" style={{ ...mono, fontSize: 22, color: '#ef4444', marginBottom: 12, fontWeight: 'bold', letterSpacing: 2 }}>
            PENDING WORK DETECTED
          </h2>
          <p style={{ ...mono, fontSize: 15, color: '#fff', lineHeight: 1.6, marginBottom: 8 }}>
            You have <strong style={{ color: '#ef4444' }}>{taskCount} pending task{taskCount !== 1 ? 's' : ''}</strong> during this vacation period.
          </p>
          <p style={{ ...mono, fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
            Are you sure you want to take a break with work piled up?
          </p>
        </div>
        <ActionRow>
          <LightBtn onClick={onClose}>GO BACK</LightBtn>
          <DangerBtn onClick={onConfirm} color="#ef4444">PROCEED ANYWAY</DangerBtn>
        </ActionRow>
      </WarningCard>
    </Backdrop>
  )
}

// ── Adding a task on a vacation day ────────────────────────────────────────
export function TaskVacationWarning({ onClose, onConfirm, taskDate }) {
  useEffect(() => { playChime([800, 600]) }, [])

  return (
    <Backdrop onClose={onClose}>
      <WarningCard borderColor="#eab308">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }} aria-hidden="true">🏖</div>
          <h2 id="modal-title" style={{ ...mono, fontSize: 22, color: '#eab308', marginBottom: 12, fontWeight: 'bold', letterSpacing: 2 }}>
            VACATION PERIOD
          </h2>
          <p style={{ ...mono, fontSize: 15, color: '#fff', lineHeight: 1.6, marginBottom: 8 }}>
            This task is scheduled for <strong style={{ color: '#eab308' }}>{taskDate}</strong>
          </p>
          <p style={{ ...mono, fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
            You're on vacation during this time. Are you sure you want to add work?
          </p>
        </div>
        <ActionRow>
          <LightBtn onClick={onClose}>CANCEL</LightBtn>
          <DangerBtn onClick={onConfirm} color="#eab308">ADD ANYWAY</DangerBtn>
        </ActionRow>
      </WarningCard>
    </Backdrop>
  )
}

// ── Delete everything confirmation ─────────────────────────────────────────
export function DeleteWarningModal({ onClose, onConfirm }) {
  useEffect(() => { playChime([900, 700, 500]) }, [])

  return (
    <Backdrop onClose={onClose} strong>
      <WarningCard borderColor="#ef4444" borderWidth={5} maxWidth={520} padding={40}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }} aria-hidden="true">⚠️</div>
          <h2 id="modal-title" style={{ ...mono, fontSize: 26, color: '#ef4444', marginBottom: 16, fontWeight: 'bold', letterSpacing: 3 }}>
            DELETE ALL DATA?
          </h2>
          <p style={{ ...mono, fontSize: 16, color: '#fff', lineHeight: 1.8, marginBottom: 12 }}>
            This will <strong style={{ color: '#ef4444' }}>permanently delete</strong> all your:
          </p>
          <div style={{ textAlign: 'left', margin: '20px auto', maxWidth: 300 }}>
            {['Goals & Habits', 'Tasks', 'Journal Entries', 'Class Schedule', 'Semester Setup', 'Vacation History', 'All Progress'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />
                <span style={{ ...mono, fontSize: 14, color: '#ddd' }}>{item}</span>
              </div>
            ))}
          </div>
          <p style={{ ...mono, fontSize: 14, color: '#ef4444', marginTop: 20, fontWeight: 'bold' }}>
            This action CANNOT be undone!
          </p>
        </div>
        <ActionRow center>
          <LightBtn onClick={onClose} size="lg">CANCEL</LightBtn>
          <SolidDangerBtn onClick={onConfirm}>DELETE EVERYTHING</SolidDangerBtn>
        </ActionRow>
      </WarningCard>
    </Backdrop>
  )
}

// ─── Local helpers ───────────────────────────────────────────────────────────
function Backdrop({ children, onClose, strong = false }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: strong ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        backdropFilter: strong ? 'blur(6px)' : 'blur(4px)',
        padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520 }}>
        {children}
      </div>
    </div>
  )
}

function WarningCard({ children, borderColor, borderWidth = 2, padding = 32, maxWidth = 480 }) {
  return (
    <div style={{ background: '#1a1a1a', border: `${borderWidth}px solid ${borderColor}`, borderRadius: 16, padding, maxWidth, margin: '0 auto' }}>
      {children}
    </div>
  )
}

function ActionRow({ children, center = false }) {
  return <div style={{ display: 'flex', gap: 12, justifyContent: center ? 'center' : 'center' }}>{children}</div>
}

function LightBtn({ onClick, children, size = 'md' }) {
  const padding = size === 'lg' ? '16px 32px' : '14px 28px'
  const fontSize = size === 'lg' ? 14 : 13
  const letterSpacing = size === 'lg' ? 2 : 2
  return (
    <button onClick={onClick} style={{ padding, background: '#fff', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', ...mono, fontSize, fontWeight: 'bold', letterSpacing }}>
      {children}
    </button>
  )
}

function DangerBtn({ onClick, children, color }) {
  return (
    <button onClick={onClick} style={{ padding: '14px 28px', background: '#2a2a2a', color, border: `2px solid ${color}`, borderRadius: 8, cursor: 'pointer', ...mono, fontSize: 13, fontWeight: 'bold', letterSpacing: 2 }}>
      {children}
    </button>
  )
}

function SolidDangerBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '16px 32px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', ...mono, fontSize: 14, fontWeight: 'bold', letterSpacing: 2 }}>
      {children}
    </button>
  )
}
