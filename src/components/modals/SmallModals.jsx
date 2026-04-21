// ─── Small modals ─────────────────────────────────────────────────────────────
// HabitModal, JournalModal, TargetModal, VacationModal, ClassesModal,
// ClassFormModal, InsightsModal, FirstTimeSetup.

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { CalPicker } from '../common/CalPicker.jsx'
import { Btn, MTitle, MLabel, MRow } from '../common/Primitives.jsx'
import { mono, inputSt, emptyTxt, iconBtn } from '../../theme.js'
import { CATEGORIES, DAYS_SHORT } from '../../constants.js'
import { daysLeft, fmtDate } from '../../utils/date.js'
import { buildInsights } from '../../utils/helpers.js'

// ─── Habit modal ──────────────────────────────────────────────────────────────
export function HabitModal({ editId, initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [cat, setCat] = useState(initial?.category || '')
  const [days, setDays] = useState(initial?.specificDays || [])

  const canSave = name.trim() && cat
  const handleSave = () => canSave && onSave({ name: name.trim(), category: cat, specificDays: days.length ? days : null })

  return (
    <ModalShell onClose={onClose}>
      <MTitle>{editId ? 'EDIT GOAL' : 'NEW GOAL'}</MTitle>
      <MLabel htmlFor="goal-name">GOAL NAME</MLabel>
      <input
        id="goal-name"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder="e.g. Exercise daily"
        style={inputSt}
      />
      <MLabel htmlFor="goal-cat" style={{ marginTop: 16 }}>CATEGORY (required)</MLabel>
      <select id="goal-cat" value={cat} onChange={(e) => setCat(e.target.value)} style={{ ...inputSt, marginBottom: 16 }}>
        <option value="">— select —</option>
        {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <MLabel>SPECIFIC DAYS (leave empty = every day)</MLabel>
      <div role="group" aria-label="Days of week" style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {DAYS_SHORT.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDays((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
            aria-pressed={days.includes(i)}
            aria-label={d}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 5, border: 'none', cursor: 'pointer', ...mono,
              fontSize: 9, transition: 'all 0.15s',
              background: days.includes(i) ? '#fff' : '#151515',
              color: days.includes(i) ? '#000' : '#aaa',
              fontWeight: days.includes(i) ? 'bold' : 'normal',
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <MRow>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CANCEL</Btn>
        <Btn onClick={handleSave} disabled={!canSave}>{editId ? 'UPDATE' : 'ADD GOAL'}</Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── Journal modal ────────────────────────────────────────────────────────────
export function JournalModal({ date, initial, onClose, onSave }) {
  const [text, setText] = useState(initial || '')
  return (
    <ModalShell onClose={onClose}>
      <MTitle>DAILY JOURNAL</MTitle>
      <p style={{ ...mono, fontSize: 11, color: '#aaa', marginBottom: 16 }}>{fmtDate(date).toUpperCase()}</p>
      <label htmlFor="journal-text" style={{ position: 'absolute', left: '-9999px' }}>Journal text</label>
      <textarea
        id="journal-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        placeholder="How did today go? What did you learn? What are you grateful for?"
        style={{ ...inputSt, minHeight: 200, resize: 'vertical', lineHeight: 1.7 }}
      />
      <MRow style={{ marginTop: 14 }}>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CANCEL</Btn>
        <Btn onClick={() => onSave(text.trim())}>SAVE</Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── Target modal ─────────────────────────────────────────────────────────────
export function TargetModal({ initial, onClose, onSave }) {
  const [pick, setPick] = useState(initial)
  return (
    <ModalShell onClose={onClose}>
      <MTitle>CHANGE TARGET DATE</MTitle>
      <CalPicker value={pick} onChange={setPick} label="SELECT YOUR TARGET DATE" />
      {pick && <p style={{ ...mono, fontSize: 11, color: '#22c55e', margin: '12px 0' }}>{daysLeft(pick)} days from today</p>}
      <MRow style={{ marginTop: 14 }}>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CANCEL</Btn>
        <Btn onClick={() => onSave(pick)}>SAVE</Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── Vacation modal ───────────────────────────────────────────────────────────
export function VacationModal({ vm, initialStart, initialEnd, onClose, onSave, onDelete }) {
  const [start, setStart] = useState(initialStart || '')
  const [end, setEnd] = useState(initialEnd || '')
  return (
    <ModalShell onClose={onClose}>
      <MTitle>🏖 VACATION MODE</MTitle>
      <p style={{ ...mono, fontSize: 10, color: '#999', marginBottom: 18, lineHeight: 1.6, letterSpacing: 1 }}>
        Streaks are paused during vacation. Days in range show as dimmed with a gray border.
      </p>
      {vm.active && (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <p style={{ ...mono, fontSize: 9, color: '#888', letterSpacing: 3 }}>CURRENTLY ACTIVE</p>
          <p style={{ ...mono, fontSize: 12, color: '#ccc', marginTop: 4 }}>{vm.startDate} → {vm.endDate}</p>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <CalPicker value={start} onChange={setStart} label="START DATE" />
        <CalPicker value={end} onChange={setEnd} label="END DATE" minDate={start} />
      </div>
      <MRow>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CANCEL</Btn>
        {vm.active && (
          <Btn onClick={onDelete} style={{ background: '#3a1a1a', color: '#ef4444', border: '2px solid #ef4444' }}>DELETE</Btn>
        )}
        <Btn onClick={() => onSave({ start, end })}>ACTIVATE</Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── Classes list modal ───────────────────────────────────────────────────────
export function ClassesModal({ classes, onClose, onAdd, onEdit, onDelete }) {
  return (
    <ModalShell onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <MTitle style={{ marginBottom: 0 }}>MY CLASSES</MTitle>
        <Btn onClick={onAdd} style={{ padding: '7px 14px', fontSize: 10 }}>+ ADD</Btn>
      </div>
      {classes.length === 0 ? (
        <p style={emptyTxt}>No classes yet</p>
      ) : (
        classes.map((c) => (
          <div key={c.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ ...mono, fontSize: 12, color: '#e5e5e5', fontWeight: 'bold' }}>
                {c.code} <span style={{ color: '#aaa', fontWeight: 'normal' }}>{c.name}</span>
              </p>
              {c.time && <p style={{ ...mono, fontSize: 10, color: '#999', marginTop: 3 }}>🕐 {c.time}</p>}
              {c.location && <p style={{ ...mono, fontSize: 10, color: '#999', marginTop: 2 }}>📍 {c.location}</p>}
              <p style={{ ...mono, fontSize: 9, color: '#bbb', marginTop: 4 }}>
                {(c.days || []).map((d) => DAYS_SHORT[d]).join(' · ')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => onEdit(c.id)} aria-label={`Edit ${c.name}`} style={iconBtn('#aaa')}>✎</button>
              <button onClick={() => onDelete(c.id)} aria-label={`Delete ${c.name}`} style={iconBtn('#aaa')}>✕</button>
            </div>
          </div>
        ))
      )}
      <MRow style={{ marginTop: 14 }}>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CLOSE</Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── Class form modal ─────────────────────────────────────────────────────────
export function ClassFormModal({ editId, initial, onBack, onSave }) {
  const [code, setCode] = useState(initial?.code || '')
  const [name, setName] = useState(initial?.name || '')
  const [time, setTime] = useState(initial?.time || '')
  const [loc, setLoc] = useState(initial?.location || '')
  const [days, setDays] = useState(initial?.days || [])
  const [link, setLink] = useState(initial?.link || '')

  const handleSave = () => {
    if (!name.trim() || !days.length) return
    onSave({ code, name: name.trim(), time, location: loc, days: [...days].sort(), link })
  }

  return (
    <ModalShell onClose={onBack}>
      <MTitle>{editId ? 'EDIT CLASS' : 'ADD CLASS'}</MTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 10 }}>
        <div>
          <MLabel htmlFor="class-code">CODE</MLabel>
          <input id="class-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="COP3502" style={{ ...inputSt, fontSize: 13 }} />
        </div>
        <div>
          <MLabel htmlFor="class-name">NAME</MLabel>
          <input id="class-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Data Structures" style={{ ...inputSt, fontSize: 13 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <MLabel htmlFor="class-time">TIME</MLabel>
          <input id="class-time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="9:00 - 10:15 AM" style={{ ...inputSt, fontSize: 13 }} />
        </div>
        <div>
          <MLabel htmlFor="class-loc">LOCATION</MLabel>
          <input id="class-loc" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="HPA1 112" style={{ ...inputSt, fontSize: 13 }} />
        </div>
      </div>
      <MLabel htmlFor="class-link">COURSE LINK (OPTIONAL)</MLabel>
      <input id="class-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://webcourses.ucf.edu/..." style={{ ...inputSt, marginBottom: 10, fontSize: 13 }} />
      <p style={{ ...mono, fontSize: 10, color: '#bbb', marginBottom: 16 }}>
        🔗 Link to Webcourses, Canvas, Blackboard, or any platform
      </p>
      <MLabel>DAYS</MLabel>
      <div role="group" aria-label="Days of week" style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {DAYS_SHORT.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDays((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
            aria-pressed={days.includes(i)}
            aria-label={d}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 6,
              border: '2px solid ' + (days.includes(i) ? '#fff' : '#222'),
              cursor: 'pointer', ...mono, fontSize: 11, transition: 'all 0.15s',
              background: days.includes(i) ? '#fff' : '#111',
              color: days.includes(i) ? '#000' : '#aaa', fontWeight: 'bold',
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <MRow>
        <Btn onClick={onBack} style={{ background: '#1a1a1a', color: '#bbb' }}>BACK</Btn>
        <Btn onClick={handleSave} disabled={!name.trim() || !days.length}>
          {editId ? 'UPDATE' : 'ADD CLASS'}
        </Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── Insights modal ───────────────────────────────────────────────────────────
export function InsightsModal({ state, onClose }) {
  const insights = buildInsights(state)
  return (
    <ModalShell onClose={onClose}>
      <MTitle>📊 INSIGHTS</MTitle>
      {insights.length === 0 ? (
        <p style={{ ...mono, fontSize: 11, color: '#999', marginBottom: 20 }}>
          Complete more goals to unlock insights!
        </p>
      ) : (
        insights.map((ins, i) => (
          <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 14, marginBottom: 10 }}>
            <p style={{ ...mono, fontSize: 12, color: '#ccc', marginBottom: 6 }}>
              {ins.icon} {ins.title}
            </p>
            <p style={{ ...mono, fontSize: 11, color: '#bbb', lineHeight: 1.6 }}>{ins.text}</p>
          </div>
        ))
      )}
      <MRow>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CLOSE</Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── First-time setup ────────────────────────────────────────────────────────
export function FirstTimeSetup({ onComplete }) {
  const [goalDate, setGoalDate] = useState('')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-time-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: '#1a1a1a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, overflow: 'auto',
      }}
    >
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">🎯</div>
        <h1 id="first-time-title" style={{ ...mono, fontSize: 24, fontWeight: 900, letterSpacing: 2, color: '#fff', marginBottom: 8 }}>
          WELCOME TO WHAT-TO-DO
        </h1>
        <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.5, marginBottom: 20 }}>
          Let's get started! First, set your target goal date.<br />
          This will help you track your progress and stay motivated.
        </p>

        <div style={{ marginBottom: 20 }}>
          <p style={{ ...mono, fontSize: 11, letterSpacing: 3, color: '#aaa', marginBottom: 10, fontWeight: 'bold', textAlign: 'left' }}>
            SELECT YOUR GOAL DATE
          </p>
          <CalPicker value={goalDate} onChange={setGoalDate} />
          {goalDate && (
            <p style={{ ...mono, fontSize: 13, color: '#22c55e', marginTop: 10, fontWeight: 'bold' }}>
              {daysLeft(goalDate)} days from today
            </p>
          )}
        </div>

        <button
          onClick={() => goalDate && onComplete(goalDate)}
          disabled={!goalDate}
          style={{
            padding: '12px 40px',
            background: goalDate ? '#fff' : '#333',
            color: goalDate ? '#000' : '#bbb',
            border: 'none', borderRadius: 8,
            cursor: goalDate ? 'pointer' : 'not-allowed',
            ...mono, fontSize: 13, letterSpacing: 3, fontWeight: 900,
            transition: 'all 0.15s',
          }}
        >
          GET STARTED
        </button>
      </div>
    </div>
  )
}
