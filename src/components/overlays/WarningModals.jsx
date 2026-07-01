// ─── Warning modals ───────────────────────────────────────────────────────────
// Three modals with audio chimes on open. The audio work is delegated to
// playChime() so these components are presentation-only.

import { useEffect } from 'react'
import { playChime } from '../../utils/helpers.js'

// ── Vacation-with-pending-tasks warning ────────────────────────────────────
export function VacationTasksWarning({ onClose, onConfirm, taskCount }) {
  useEffect(() => { playChime([800, 600]) }, [])

  return (
    <Backdrop onClose={onClose}>
      <WarningCard borderColor="border-red-500">
        <div className="text-center mb-6">
          <div className="text-[56px] mb-4" aria-hidden="true">⚠️</div>
          <h2 id="modal-title" className="font-sans text-2xl text-red-500 mb-3 font-bold tracking-wide">
            PENDING WORK DETECTED
          </h2>
          <p className="font-sans text-[15px] text-white leading-relaxed mb-2">
            You have <strong className="text-red-500">{taskCount} pending task{taskCount !== 1 ? 's' : ''}</strong> during this vacation period.
          </p>
          <p className="font-sans text-[13px] text-zinc-400 leading-relaxed">
            Are you sure you want to take a break with work piled up?
          </p>
        </div>
        <ActionRow>
          <LightBtn onClick={onClose}>GO BACK</LightBtn>
          <DangerBtn onClick={onConfirm} color="text-red-500 border-red-500">PROCEED ANYWAY</DangerBtn>
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
      <WarningCard borderColor="border-amber-500">
        <div className="text-center mb-6">
          <div className="text-[56px] mb-4" aria-hidden="true">🏖</div>
          <h2 id="modal-title" className="font-sans text-2xl text-amber-500 mb-3 font-bold tracking-wide">
            VACATION PERIOD
          </h2>
          <p className="font-sans text-[15px] text-white leading-relaxed mb-2">
            This task is scheduled for <strong className="text-amber-500">{taskDate}</strong>
          </p>
          <p className="font-sans text-[13px] text-zinc-400 leading-relaxed">
            You're on vacation during this time. Are you sure you want to add work?
          </p>
        </div>
        <ActionRow>
          <LightBtn onClick={onClose}>CANCEL</LightBtn>
          <DangerBtn onClick={onConfirm} color="text-amber-500 border-amber-500">ADD ANYWAY</DangerBtn>
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
      <WarningCard borderColor="border-red-500" borderWidth="border-[5px]" maxWidth="max-w-[520px]" padding="p-10">
        <div className="text-center mb-7">
          <div className="text-7xl mb-5" aria-hidden="true">⚠️</div>
          <h2 id="modal-title" className="font-sans text-[26px] text-red-500 mb-4 font-bold tracking-wide">
            DELETE ALL DATA?
          </h2>
          <p className="font-sans text-base text-white leading-loose mb-3">
            This will <strong className="text-red-500">permanently delete</strong> all your:
          </p>
          <div className="text-left mx-auto my-5 max-w-[300px]">
            {['Goals & Habits', 'Tasks', 'Journal Entries', 'Class Schedule', 'Semester Setup', 'Vacation History', 'All Progress'].map((item) => (
              <div key={item} className="flex items-center gap-2.5 mb-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span className="font-sans text-sm text-zinc-200">{item}</span>
              </div>
            ))}
          </div>
          <p className="font-sans text-sm text-red-500 mt-5 font-bold">
            This action CANNOT be undone!
          </p>
        </div>
        <ActionRow>
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
      className={`fixed inset-0 flex items-center justify-center z-[999] p-4 backdrop-blur-md ${strong ? 'bg-black/95' : 'bg-black/90'}`}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px]">
        {children}
      </div>
    </div>
  )
}

function WarningCard({ children, borderColor, borderWidth = 'border-2', padding = 'p-8', maxWidth = 'max-w-[480px]' }) {
  return (
    <div className={`bg-zinc-950 rounded-2xl mx-auto ${borderWidth} ${borderColor} ${padding} ${maxWidth}`}>
      {children}
    </div>
  )
}

function ActionRow({ children }) {
  return <div className="flex gap-3 justify-center">{children}</div>
}

function LightBtn({ onClick, children, size = 'md' }) {
  const sizing = size === 'lg' ? 'px-8 py-4 text-sm tracking-wide' : 'px-7 py-3.5 text-[13px] tracking-wide'
  return (
    <button onClick={onClick} className={`${sizing} bg-white hover:bg-zinc-200 text-black border-none rounded-lg cursor-pointer font-sans font-bold transition-colors duration-150`}>
      {children}
    </button>
  )
}

function DangerBtn({ onClick, children, color }) {
  return (
    <button onClick={onClick} className={`px-7 py-3.5 bg-zinc-900 border-2 rounded-lg cursor-pointer font-sans text-[13px] font-bold tracking-wide transition-colors duration-150 ${color}`}>
      {children}
    </button>
  )
}

function SolidDangerBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="px-8 py-4 bg-red-500 hover:bg-red-400 text-white border-none rounded-lg cursor-pointer font-sans text-sm font-bold tracking-wide transition-colors duration-150">
      {children}
    </button>
  )
}
