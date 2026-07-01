// ─── SemesterModal ────────────────────────────────────────────────────────────
// Lets the user define a semester window — start date, end date, optional
// name. When active, classes only display on dates inside this window.

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { CalPicker } from '../common/CalPicker.jsx'
import { Btn, MTitle, MLabel, MRow } from '../common/Primitives.jsx'
import { semesterDays, getSemesterStatus } from '../../utils/semester.js'
import { fmtShortDate } from '../../utils/date.js'

const INPUT = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors font-sans box-border'

export function SemesterModal({ state, onClose, onSave, onClear }) {
  const [name, setName] = useState(state.semesterName || '')
  const [start, setStart] = useState(state.semesterStart || '')
  const [end, setEnd] = useState(state.semesterEnd || '')
  const [active, setActive] = useState(state.semesterActive)
  const [error, setError] = useState('')

  const classCount = state.classes.length
  const days = semesterDays({ semesterStart: start, semesterEnd: end })
  const status = getSemesterStatus({ ...state, semesterStart: start, semesterEnd: end, semesterActive: true })

  const handleSave = () => {
    setError('')
    if (active) {
      if (!start || !end) {
        setError('Both start and end dates are required when the semester is active.')
        return
      }
      if (end < start) {
        setError('End date must be after start date.')
        return
      }
    }
    onSave({
      semesterName: name.trim(),
      semesterStart: start,
      semesterEnd: end,
      semesterActive: active && !!start && !!end,
    })
  }

  return (
    <ModalShell onClose={onClose} width={560}>
      <MTitle>🎓 SEMESTER SETUP</MTitle>

      <p className="font-sans text-[11px] text-zinc-500 mb-5 leading-relaxed">
        Define a date window for the current semester. When active, class indicators
        only appear on the calendar inside this window — so adding classes{' '}
        <em>before</em> setting up a semester won't flood the whole year with book
        icons.
      </p>

      {/* Active toggle */}
      <div className={`flex items-center gap-3 px-3.5 py-3 bg-zinc-950 border rounded-lg mb-5 ${active ? 'border-emerald-400' : 'border-zinc-800'}`}>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => setActive(!active)}
          aria-label="Toggle semester active"
          className={`w-11 h-6 rounded-full border-none cursor-pointer relative flex-shrink-0 transition-colors duration-200 ${active ? 'bg-emerald-500' : 'bg-zinc-700'}`}
        >
          <div
            className="w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left] duration-200"
            style={{ left: active ? 23 : 3 }}
          />
        </button>
        <div className="flex-1">
          <p className="font-sans text-[13px] text-white font-bold">
            {active ? 'Semester active' : 'Semester inactive'}
          </p>
          <p className="font-sans text-[11px] text-zinc-500 mt-0.5 leading-snug">
            {active
              ? 'Classes are scoped to the date window below.'
              : 'Classes will show on every matching weekday across the year.'}
          </p>
        </div>
      </div>

      <MLabel htmlFor="sem-name">SEMESTER NAME (OPTIONAL)</MLabel>
      <input
        id="sem-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Fall 2026"
        className={`${INPUT} mb-5`}
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <CalPicker value={start} onChange={setStart} label="START DATE" />
        <CalPicker value={end} onChange={setEnd} label="END DATE" minDate={start} />
      </div>

      {/* Live preview card */}
      {start && end && end >= start && (
        <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-lg p-3.5 mb-4">
          <p className="font-sans text-[10px] text-emerald-400 tracking-wide font-bold mb-2">
            PREVIEW
          </p>
          <p className="font-sans text-[13px] text-white font-semibold">
            {fmtShortDate(start)} → {fmtShortDate(end)}
          </p>
          <p className="font-sans text-[11px] text-zinc-500 mt-1">
            {days} day{days !== 1 ? 's' : ''} · ~{Math.ceil(days / 7)} week{Math.ceil(days / 7) !== 1 ? 's' : ''}
          </p>
          {status && status.phase === 'active' && (
            <p className="font-sans text-[11px] text-emerald-400 mt-1.5 font-semibold">
              Currently in week {Math.ceil(status.elapsed / 7)}
            </p>
          )}
          {status && status.phase === 'upcoming' && (
            <p className="font-sans text-[11px] text-emerald-400 mt-1.5 font-semibold">
              Starts in {status.daysUntil} day{status.daysUntil !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Existing classes notice */}
      {classCount > 0 && !state.semesterActive && (
        <div className="bg-amber-950/20 border border-zinc-800 rounded-lg p-3 mb-4">
          <p className="font-sans text-[11px] text-amber-500 font-bold mb-1">
            ℹ You have {classCount} class{classCount !== 1 ? 'es' : ''} already added
          </p>
          <p className="font-sans text-[10px] text-zinc-500 leading-relaxed">
            They will stay in your class list but will only appear on calendar days
            inside the semester window you set here.
          </p>
        </div>
      )}

      {error && (
        <p className="font-sans text-[11px] text-red-500 mb-3 font-bold" role="alert">
          ⚠ {error}
        </p>
      )}

      <MRow>
        <Btn onClick={onClose} variant="ghost">CANCEL</Btn>
        {state.semesterActive && (
          <Btn onClick={onClear} variant="danger">CLEAR</Btn>
        )}
        <Btn onClick={handleSave}>SAVE</Btn>
      </MRow>
    </ModalShell>
  )
}
