// ─── Small modals ─────────────────────────────────────────────────────────────
// HabitModal, JournalModal, TargetModal, VacationModal, ClassesModal,
// ClassFormModal, InsightsModal, FirstTimeSetup.

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { CalPicker } from '../common/CalPicker.jsx'
import { Btn, MTitle, MLabel, MRow } from '../common/Primitives.jsx'
import { CATEGORIES, DAYS_SHORT } from '../../constants.js'
import { daysLeft, fmtDate, todayKey } from '../../utils/date.js'
import { buildInsights } from '../../utils/helpers.js'

const INPUT = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors font-sans box-border'

// ─── Habit modal ──────────────────────────────────────────────────────────────
export function HabitModal({ editId, initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [cat, setCat] = useState(initial?.category || '')
  const [days, setDays] = useState(initial?.specificDays || [])
  const [scheduleLater, setScheduleLater] = useState(!!initial?.startDate)
  const [startDate, setStartDate] = useState(initial?.startDate || '')

  const canSave = name.trim() && cat && (!scheduleLater || startDate)
  const handleSave = () =>
    canSave &&
    onSave({
      name: name.trim(),
      category: cat,
      specificDays: days.length ? days : null,
      startDate: scheduleLater ? startDate : null,
    })

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
        className={INPUT}
      />
      <MLabel htmlFor="goal-cat" className="mt-4">CATEGORY (required)</MLabel>
      <select id="goal-cat" value={cat} onChange={(e) => setCat(e.target.value)} className={`${INPUT} mb-4`}>
        <option value="">— select —</option>
        {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <MLabel>SPECIFIC DAYS (leave empty = every day)</MLabel>
      <div role="group" aria-label="Days of week" className="flex gap-1 mb-5">
        {DAYS_SHORT.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDays((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
            aria-pressed={days.includes(i)}
            aria-label={d}
            className={`flex-1 py-1.5 rounded font-sans text-[9px] transition-colors duration-150 cursor-pointer border-none ${
              days.includes(i) ? 'bg-accent text-zinc-950 font-bold' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 px-3.5 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg mb-5">
        <button
          type="button"
          role="switch"
          aria-checked={scheduleLater}
          onClick={() => setScheduleLater((v) => !v)}
          aria-label="Toggle mid-year start date"
          className={`w-11 h-6 rounded-full border-none cursor-pointer relative flex-shrink-0 transition-colors duration-200 ${scheduleLater ? 'bg-accent' : 'bg-zinc-700'}`}
        >
          <div
            className="w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left] duration-200"
            style={{ left: scheduleLater ? 23 : 3 }}
          />
        </button>
        <div className="flex-1">
          <p className="font-sans text-[13px] text-white font-bold">
            {scheduleLater ? 'Starts on a later date' : 'Starts today'}
          </p>
          <p className="font-sans text-[11px] text-zinc-500 mt-0.5 leading-snug">
            {scheduleLater
              ? "For mid-year goals — it won't count against your streak until then."
              : 'Track it starting right away.'}
          </p>
        </div>
      </div>

      {scheduleLater && (
        <div className="mb-5">
          <CalPicker value={startDate} onChange={setStartDate} label="START DATE" minDate={todayKey()} />
          {startDate && startDate > todayKey() && (
            <p className="font-sans text-[11px] text-accent mt-2 font-bold">
              Starts in {daysLeft(startDate)} day{daysLeft(startDate) !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      <MRow>
        <Btn onClick={onClose} variant="ghost">CANCEL</Btn>
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
      <p className="font-sans text-[11px] text-zinc-500 mb-4">{fmtDate(date).toUpperCase()}</p>
      <label htmlFor="journal-text" className="sr-only">Journal text</label>
      <textarea
        id="journal-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        placeholder="How did today go? What did you learn? What are you grateful for?"
        className={`${INPUT} min-h-[200px] resize-y leading-relaxed`}
      />
      <MRow className="mt-3.5">
        <Btn onClick={onClose} variant="ghost">CANCEL</Btn>
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
      {pick && <p className="font-sans text-[11px] text-emerald-500 my-3">{daysLeft(pick)} days from today</p>}
      <MRow className="mt-3.5">
        <Btn onClick={onClose} variant="ghost">CANCEL</Btn>
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
      <p className="font-sans text-[10px] text-zinc-500 mb-4 leading-relaxed">
        Streaks are paused during vacation. Days in range show as dimmed with a gray border.
      </p>
      {vm.active && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 mb-4">
          <p className="font-sans text-[9px] text-zinc-500 tracking-wide">CURRENTLY ACTIVE</p>
          <p className="font-sans text-xs text-zinc-300 mt-1">{vm.startDate} → {vm.endDate}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <CalPicker value={start} onChange={setStart} label="START DATE" />
        <CalPicker value={end} onChange={setEnd} label="END DATE" minDate={start} />
      </div>
      <MRow>
        <Btn onClick={onClose} variant="ghost">CANCEL</Btn>
        {vm.active && <Btn onClick={onDelete} variant="danger">DELETE</Btn>}
        <Btn onClick={() => onSave({ start, end })}>ACTIVATE</Btn>
      </MRow>
    </ModalShell>
  )
}

// ─── Classes list modal ───────────────────────────────────────────────────────
export function ClassesModal({ classes, onClose, onAdd, onEdit, onDelete }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between mb-[18px]">
        <MTitle className="mb-0">MY CLASSES</MTitle>
        <Btn onClick={onAdd} className="!px-3.5 !py-1.5 !text-[10px]">+ ADD</Btn>
      </div>
      {classes.length === 0 ? (
        <p className="font-sans text-[11px] text-zinc-500 text-center py-4 leading-relaxed tracking-wide">No classes yet</p>
      ) : (
        classes.map((c) => (
          <div key={c.id} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 mb-2 flex justify-between items-start">
            <div>
              <p className="font-sans text-xs text-zinc-200 font-bold">
                {c.code} <span className="text-zinc-400 font-normal">{c.name}</span>
              </p>
              {c.time && <p className="font-sans text-[10px] text-zinc-500 mt-0.5">🕐 {c.time}</p>}
              {c.location && <p className="font-sans text-[10px] text-zinc-500 mt-0.5">📍 {c.location}</p>}
              <p className="font-sans text-[9px] text-zinc-500 mt-1">
                {(c.days || []).map((d) => DAYS_SHORT[d]).join(' · ')}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => onEdit(c.id)} aria-label={`Edit ${c.name}`} className="font-sans text-[11px] px-1 py-0.5 rounded text-zinc-500 hover:text-zinc-200 bg-transparent border-none cursor-pointer">✎</button>
              <button onClick={() => onDelete(c.id)} aria-label={`Delete ${c.name}`} className="font-sans text-[11px] px-1 py-0.5 rounded text-zinc-500 hover:text-red-400 bg-transparent border-none cursor-pointer">✕</button>
            </div>
          </div>
        ))
      )}
      <MRow className="mt-3.5">
        <Btn onClick={onClose} variant="ghost">CLOSE</Btn>
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
      <div className="grid gap-2.5 mb-2.5" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div>
          <MLabel htmlFor="class-code">CODE</MLabel>
          <input id="class-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="COP3502" className={`${INPUT} text-[13px]`} />
        </div>
        <div>
          <MLabel htmlFor="class-name">NAME</MLabel>
          <input id="class-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Data Structures" className={`${INPUT} text-[13px]`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div>
          <MLabel htmlFor="class-time">TIME</MLabel>
          <input id="class-time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="9:00 - 10:15 AM" className={`${INPUT} text-[13px]`} />
        </div>
        <div>
          <MLabel htmlFor="class-loc">LOCATION</MLabel>
          <input id="class-loc" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="HPA1 112" className={`${INPUT} text-[13px]`} />
        </div>
      </div>
      <MLabel htmlFor="class-link">COURSE LINK (OPTIONAL)</MLabel>
      <input id="class-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://webcourses.ucf.edu/..." className={`${INPUT} mb-2.5 text-[13px]`} />
      <p className="font-sans text-[10px] text-zinc-500 mb-4">
        🔗 Link to Webcourses, Canvas, Blackboard, or any platform
      </p>
      <MLabel>DAYS</MLabel>
      <div role="group" aria-label="Days of week" className="flex gap-1.5 mb-5">
        {DAYS_SHORT.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDays((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))}
            aria-pressed={days.includes(i)}
            aria-label={d}
            className={`flex-1 py-2.5 rounded-md font-sans text-[11px] font-bold transition-colors duration-150 cursor-pointer border-2 ${
              days.includes(i) ? 'border-accent bg-accent text-zinc-950' : 'border-zinc-800 bg-zinc-900 text-zinc-400'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <MRow>
        <Btn onClick={onBack} variant="ghost">BACK</Btn>
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
        <p className="font-sans text-[11px] text-zinc-500 mb-5">
          Complete more goals to unlock insights!
        </p>
      ) : (
        insights.map((ins, i) => (
          <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 mb-2.5">
            <p className="font-sans text-xs text-zinc-300 mb-1.5">
              {ins.icon} {ins.title}
            </p>
            <p className="font-sans text-[11px] text-zinc-400 leading-relaxed">{ins.text}</p>
          </div>
        ))
      )}
      <MRow>
        <Btn onClick={onClose} variant="ghost">CLOSE</Btn>
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
      className="fixed inset-0 z-[200] bg-gradient-to-b from-zinc-950 to-black flex flex-col items-center justify-center p-5 overflow-auto"
    >
      <div className="max-w-[520px] w-full text-center">
        <div className="text-[40px] mb-3" aria-hidden="true">🎯</div>
        <h1 id="first-time-title" className="font-sans text-2xl font-black tracking-wide text-white mb-2">
          WELCOME TO WHAT-TO-DO
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-5">
          Let's get started! First, set your target goal date.<br />
          This will help you track your progress and stay motivated.
        </p>

        <div className="mb-5">
          <p className="font-sans text-[11px] tracking-wider text-zinc-500 mb-2.5 font-bold text-left">
            SELECT YOUR GOAL DATE
          </p>
          <CalPicker value={goalDate} onChange={setGoalDate} />
          {goalDate && (
            <p className="font-sans text-[13px] text-emerald-500 mt-2.5 font-bold">
              {daysLeft(goalDate)} days from today
            </p>
          )}
        </div>

        <button
          onClick={() => goalDate && onComplete(goalDate)}
          disabled={!goalDate}
          className={`px-10 py-3 border-none rounded-lg font-sans text-[13px] tracking-wider font-black transition-colors duration-150 ${
            goalDate ? 'bg-accent hover:bg-zinc-200 text-zinc-950 cursor-pointer' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          GET STARTED
        </button>
      </div>
    </div>
  )
}
