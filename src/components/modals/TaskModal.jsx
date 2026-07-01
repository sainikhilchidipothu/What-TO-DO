// ─── TaskModal ────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { CalPicker } from '../common/CalPicker.jsx'
import { Btn, MTitle, MLabel, MRow } from '../common/Primitives.jsx'
import { HOURS_12, MINUTES } from '../../constants.js'
import { uid } from '../../utils/date.js'

const INPUT = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors font-sans box-border'

export function TaskModal({ editId, initial, classes, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [date, setDate] = useState(initial?.date || '')
  const [hour, setHour] = useState(initial?.hour || '09')
  const [min, setMin] = useState(initial?.min || '00')
  const [ampm, setAmpm] = useState(initial?.ampm || 'AM')
  const [tier, setTier] = useState(initial?.tier ?? 2)
  const [subtasks, setSubtasks] = useState(initial?.subtasks || [])
  const [subtaskInput, setSubtaskInput] = useState('')
  const [classId, setClassId] = useState(initial?.classId || '')

  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    setSubtasks([...subtasks, { id: uid(), text: subtaskInput.trim(), done: false }])
    setSubtaskInput('')
  }
  const toggleSubtask = (id) => setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)))
  const deleteSubtask = (id) => setSubtasks(subtasks.filter((s) => s.id !== id))

  const handleSave = () => {
    if (!name.trim() || !date) return
    let h = parseInt(hour)
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    const due = `${date}T${String(h).padStart(2, '0')}:${min}:00`
    onSave({ name: name.trim(), due, tier, subtasks, classId: classId || undefined, date })
  }

  return (
    <ModalShell onClose={onClose}>
      <MTitle>{editId ? 'EDIT TASK' : 'NEW TASK'}</MTitle>
      <MLabel htmlFor="task-name">TASK NAME</MLabel>
      <input id="task-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Submit assignment" className={INPUT} />

      <MLabel className="mt-4">DUE DATE</MLabel>
      <CalPicker value={date} onChange={setDate} />

      <MLabel className="mt-4">TIME</MLabel>
      <div className="flex gap-2 mb-4">
        <select value={hour} onChange={(e) => setHour(e.target.value)} aria-label="Hour" className={`${INPUT} flex-1`}>
          {HOURS_12.map((h) => <option key={h}>{h}</option>)}
        </select>
        <select value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minute" className={`${INPUT} flex-1`}>
          {MINUTES.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={ampm} onChange={(e) => setAmpm(e.target.value)} aria-label="AM or PM" className={`${INPUT} flex-1`}>
          <option>AM</option><option>PM</option>
        </select>
      </div>

      <MLabel>PRIORITY</MLabel>
      <div role="radiogroup" aria-label="Priority" className="flex gap-2 mb-5">
        {[[1, 'LOW', '#22c55e'], [2, 'MEDIUM', '#eab308'], [3, 'HIGH', '#ef4444']].map(([v, l, c]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={tier === v}
            onClick={() => setTier(v)}
            style={{
              borderColor: tier === v ? c : '#2b2b2b',
              background: tier === v ? c + '22' : '#252525',
              color: tier === v ? c : '#a1a1aa',
            }}
            className={`flex-1 py-2.5 rounded-md border cursor-pointer font-sans text-[10px] transition-all duration-150 ${tier === v ? 'font-bold' : 'font-normal'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <MLabel>SUBTASKS (OPTIONAL)</MLabel>
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <label htmlFor="subtask-input" className="sr-only">New subtask</label>
          <input
            id="subtask-input"
            value={subtaskInput}
            onChange={(e) => setSubtaskInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
            placeholder="Add a subtask..."
            className={`${INPUT} flex-1`}
          />
          <button
            onClick={addSubtask}
            disabled={!subtaskInput.trim()}
            aria-label="Add subtask"
            className={`px-4 bg-zinc-800 border border-zinc-700 text-white rounded-md font-sans text-base transition-opacity duration-150 ${
              subtaskInput.trim() ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'
            }`}
          >
            +
          </button>
        </div>

        {subtasks.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2">
            {subtasks.map((sub, idx) => (
              <div key={sub.id} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-1 ${idx % 2 === 0 ? 'bg-zinc-900' : ''}`}>
                <input
                  type="checkbox"
                  checked={sub.done}
                  onChange={() => toggleSubtask(sub.id)}
                  aria-label={`Mark subtask "${sub.text}" ${sub.done ? 'not done' : 'done'}`}
                  className="w-4 h-4 cursor-pointer accent-accent"
                />
                <span className={`font-sans text-xs flex-1 ${sub.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                  {sub.text}
                </span>
                <button
                  onClick={() => deleteSubtask(sub.id)}
                  aria-label={`Delete subtask "${sub.text}"`}
                  className="bg-transparent border-none text-zinc-500 hover:text-red-400 cursor-pointer text-sm px-2 py-1"
                >
                  ×
                </button>
              </div>
            ))}
            <p className="font-sans text-[10px] text-zinc-500 mt-2 text-center">
              {subtasks.filter((s) => s.done).length}/{subtasks.length} completed
            </p>
          </div>
        )}
      </div>

      <MLabel htmlFor="task-class">LINK TO CLASS (OPTIONAL)</MLabel>
      <select
        id="task-class"
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className={`${INPUT} mb-4 text-[13px]`}
      >
        <option value="">No class</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code ? `${c.code} - ${c.name}` : c.name}
          </option>
        ))}
      </select>

      <MRow>
        <Btn onClick={onClose} variant="ghost">CANCEL</Btn>
        <Btn onClick={handleSave} disabled={!name.trim() || !date}>
          {editId ? 'UPDATE' : 'ADD TASK'}
        </Btn>
      </MRow>
    </ModalShell>
  )
}
