// ─── SemesterModal ────────────────────────────────────────────────────────────
// NEW FEATURE. Lets the user define a semester window — start date, end
// date, optional name. When active, classes only display on dates inside
// this window, which fixes the issue where classes were showing on every
// matching weekday across the entire year.

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { CalPicker } from '../common/CalPicker.jsx'
import { Btn, MTitle, MLabel, MRow } from '../common/Primitives.jsx'
import { mono, inputSt } from '../../theme.js'
import { semesterDays, getSemesterStatus } from '../../utils/semester.js'
import { fmtShortDate } from '../../utils/date.js'

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

      <p style={{ ...mono, fontSize: 11, color: '#888', marginBottom: 20, lineHeight: 1.6 }}>
        Define a date window for the current semester. When active, class indicators
        only appear on the calendar inside this window — so adding classes{' '}
        <em>before</em> setting up a semester won't flood the whole year with book
        icons.
      </p>

      {/* Active toggle */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: '#111',
          border: `2px solid ${active ? '#4ade80' : '#333'}`,
          borderRadius: 8, marginBottom: 20,
        }}
      >
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => setActive(!active)}
          aria-label="Toggle semester active"
          style={{
            width: 44, height: 24, borderRadius: 12,
            border: 'none', cursor: 'pointer',
            background: active ? '#22c55e' : '#333',
            position: 'relative', transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: active ? 23 : 3,
            transition: 'left 0.2s',
          }} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ ...mono, fontSize: 13, color: '#fff', fontWeight: 'bold' }}>
            {active ? 'Semester active' : 'Semester inactive'}
          </p>
          <p style={{ ...mono, fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.4 }}>
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
        style={{ ...inputSt, marginBottom: 20 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <CalPicker value={start} onChange={setStart} label="START DATE" />
        <CalPicker value={end} onChange={setEnd} label="END DATE" minDate={start} />
      </div>

      {/* Live preview card */}
      {start && end && end >= start && (
        <div style={{ background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <p style={{ ...mono, fontSize: 10, color: '#4ade80', letterSpacing: 2, fontWeight: 'bold', marginBottom: 8 }}>
            PREVIEW
          </p>
          <p style={{ ...mono, fontSize: 13, color: '#fff', fontWeight: 600 }}>
            {fmtShortDate(start)} → {fmtShortDate(end)}
          </p>
          <p style={{ ...mono, fontSize: 11, color: '#888', marginTop: 4 }}>
            {days} day{days !== 1 ? 's' : ''} · ~{Math.ceil(days / 7)} week{Math.ceil(days / 7) !== 1 ? 's' : ''}
          </p>
          {status && status.phase === 'active' && (
            <p style={{ ...mono, fontSize: 11, color: '#4ade80', marginTop: 6, fontWeight: 600 }}>
              Currently in week {Math.ceil(status.elapsed / 7)}
            </p>
          )}
          {status && status.phase === 'upcoming' && (
            <p style={{ ...mono, fontSize: 11, color: '#4ade80', marginTop: 6, fontWeight: 600 }}>
              Starts in {status.daysUntil} day{status.daysUntil !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Existing classes notice */}
      {classCount > 0 && !state.semesterActive && (
        <div style={{ background: '#1a1a0a', border: '1px solid #333', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <p style={{ ...mono, fontSize: 11, color: '#eab308', fontWeight: 'bold', marginBottom: 4 }}>
            ℹ You have {classCount} class{classCount !== 1 ? 'es' : ''} already added
          </p>
          <p style={{ ...mono, fontSize: 10, color: '#999', lineHeight: 1.5 }}>
            They will stay in your class list but will only appear on calendar days
            inside the semester window you set here.
          </p>
        </div>
      )}

      {error && (
        <p style={{ ...mono, fontSize: 11, color: '#ef4444', marginBottom: 12, fontWeight: 'bold' }} role="alert">
          ⚠ {error}
        </p>
      )}

      <MRow>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CANCEL</Btn>
        {state.semesterActive && (
          <Btn onClick={onClear} style={{ background: '#3a1a1a', color: '#ef4444', border: '2px solid #ef4444' }}>
            CLEAR
          </Btn>
        )}
        <Btn onClick={handleSave}>SAVE</Btn>
      </MRow>
    </ModalShell>
  )
}
