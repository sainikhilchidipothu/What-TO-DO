// ─── TaskModal ────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { CalPicker } from '../common/CalPicker.jsx'
import { Btn, MTitle, MLabel, MRow } from '../common/Primitives.jsx'
import { mono, inputSt } from '../../theme.js'
import { HOURS_12, MINUTES } from '../../constants.js'
import { uid } from '../../utils/date.js'

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
      <input id="task-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Submit assignment" style={inputSt} />

      <MLabel style={{ marginTop: 16 }}>DUE DATE</MLabel>
      <CalPicker value={date} onChange={setDate} />

      <MLabel style={{ marginTop: 16 }}>TIME</MLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={hour} onChange={(e) => setHour(e.target.value)} aria-label="Hour" style={{ ...inputSt, flex: 1 }}>
          {HOURS_12.map((h) => <option key={h}>{h}</option>)}
        </select>
        <select value={min} onChange={(e) => setMin(e.target.value)} aria-label="Minute" style={{ ...inputSt, flex: 1 }}>
          {MINUTES.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={ampm} onChange={(e) => setAmpm(e.target.value)} aria-label="AM or PM" style={{ ...inputSt, flex: 1 }}>
          <option>AM</option><option>PM</option>
        </select>
      </div>

      <MLabel>PRIORITY</MLabel>
      <div role="radiogroup" aria-label="Priority" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[[1, 'LOW', '#22c55e'], [2, 'MEDIUM', '#eab308'], [3, 'HIGH', '#ef4444']].map(([v, l, c]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={tier === v}
            onClick={() => setTier(v)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 6,
              border: `1px solid ${tier === v ? c : '#222'}`,
              cursor: 'pointer', ...mono, fontSize: 10,
              fontWeight: tier === v ? 'bold' : 'normal',
              background: tier === v ? c + '22' : '#111',
              color: tier === v ? c : '#aaa',
              transition: 'all 0.15s',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <MLabel>SUBTASKS (OPTIONAL)</MLabel>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <label htmlFor="subtask-input" style={{ position: 'absolute', left: '-9999px' }}>New subtask</label>
          <input
            id="subtask-input"
            value={subtaskInput}
            onChange={(e) => setSubtaskInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
            placeholder="Add a subtask..."
            style={{ ...inputSt, flex: 1 }}
          />
          <button
            onClick={addSubtask}
            disabled={!subtaskInput.trim()}
            aria-label="Add subtask"
            style={{
              padding: '0 16px', background: '#333', border: '2px solid #555', color: '#fff',
              cursor: subtaskInput.trim() ? 'pointer' : 'not-allowed', borderRadius: 6,
              ...mono, fontSize: 16, opacity: subtaskInput.trim() ? 1 : 0.5,
            }}
          >
            +
          </button>
        </div>

        {subtasks.length > 0 && (
          <div style={{ background: '#0a0a0a', border: '2px solid #222', borderRadius: 8, padding: 8 }}>
            {subtasks.map((sub, idx) => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: idx % 2 === 0 ? '#111' : 'transparent', borderRadius: 6, marginBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={sub.done}
                  onChange={() => toggleSubtask(sub.id)}
                  aria-label={`Mark subtask "${sub.text}" ${sub.done ? 'not done' : 'done'}`}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ ...mono, fontSize: 12, color: sub.done ? '#999' : '#ddd', flex: 1, textDecoration: sub.done ? 'line-through' : 'none' }}>
                  {sub.text}
                </span>
                <button
                  onClick={() => deleteSubtask(sub.id)}
                  aria-label={`Delete subtask "${sub.text}"`}
                  style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}
                >
                  ×
                </button>
              </div>
            ))}
            <p style={{ ...mono, fontSize: 10, color: '#bbb', marginTop: 8, textAlign: 'center' }}>
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
        style={{ ...inputSt, marginBottom: 16, fontSize: 13 }}
      >
        <option value="">No class</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.code ? `${c.code} - ${c.name}` : c.name}
          </option>
        ))}
      </select>

      <MRow>
        <Btn onClick={onClose} style={{ background: '#1a1a1a', color: '#bbb' }}>CANCEL</Btn>
        <Btn onClick={handleSave} disabled={!name.trim() || !date}>
          {editId ? 'UPDATE' : 'ADD TASK'}
        </Btn>
      </MRow>
    </ModalShell>
  )
}
