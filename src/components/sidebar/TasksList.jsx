// ─── TasksList ────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { mono, selectSt, inputSt, iconBtn } from '../../theme.js'
import { EmptyState } from '../common/EmptyState.jsx'

export function TasksList({
  tasks,
  classes,
  urgentTasks,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}) {
  const [search, setSearch] = useState('')
  const [tierF, setTierF] = useState('all')
  const [statF, setStatF] = useState('all')
  const [showCompleted, setShowCompleted] = useState(false)

  const now = new Date()
  const filtered = [...tasks]
    .sort((a, b) => (a.done === b.done ? new Date(a.due) - new Date(b.due) : a.done ? 1 : -1))
    .filter((t) => {
      const ov = new Date(t.due) < now && !t.done
      return (
        t.name.toLowerCase().includes(search.toLowerCase()) &&
        (tierF === 'all' || String(t.tier) === tierF) &&
        (statF === 'all' ||
          (statF === 'done' && t.done) ||
          (statF === 'open' && !t.done && !ov) ||
          (statF === 'overdue' && ov))
      )
    })

  const pending = filtered.filter((t) => !t.done)
  const completed = filtered.filter((t) => t.done)
  const hiddenCompleted = Math.max(0, 5 - pending.length)
  const tasksToShow = showCompleted ? filtered : [...pending, ...completed.slice(0, hiddenCompleted)]

  return (
    <div style={{ borderTop: '3px solid #444' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '2px solid #333', background: '#222' }}>
        <h2 style={{ ...mono, fontSize: 11, letterSpacing: 4, color: '#ccc', fontWeight: 'bold', margin: 0 }}>TASKS</h2>
        <button
          onClick={onAdd}
          aria-label="Add new task"
          style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#fff', color: '#000', ...mono, fontSize: 18, fontWeight: 'bold', lineHeight: '28px', padding: 0 }}
        >
          +
        </button>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', gap: 6, borderBottom: '2px solid #2a2a2a', background: '#222' }}>
        <label htmlFor="task-search" style={{ position: 'absolute', left: '-9999px' }}>Search tasks</label>
        <input
          id="task-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ ...inputSt, flex: 1, padding: '8px 12px', fontSize: 12 }}
        />
        <select value={tierF} onChange={(e) => setTierF(e.target.value)} aria-label="Filter by priority" style={{ ...selectSt, fontSize: 11 }}>
          <option value="all">All</option><option value="1">Low</option><option value="2">Med</option><option value="3">High</option>
        </select>
        <select value={statF} onChange={(e) => setStatF(e.target.value)} aria-label="Filter by status" style={{ ...selectSt, fontSize: 11 }}>
          <option value="all">All</option><option value="open">Open</option><option value="done">Done</option><option value="overdue">Late</option>
        </select>
      </div>

      <div style={{ background: '#222' }}>
        {tasksToShow.length === 0 ? (
          tasks.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Add your first task"
              description="Tasks are one-off things with a due date — assignments, appointments, errands. Set a priority and get reminded."
              shortcut="Ctrl+T"
              ctaLabel="+ ADD YOUR FIRST TASK"
              onCta={onAdd}
            />
          ) : (
            <p style={{ ...mono, fontSize: 11, color: '#aaa', padding: '16px', textAlign: 'center', lineHeight: 1.6 }}>
              No tasks match your search
            </p>
          )
        ) : (
          tasksToShow.map((t) => {
            const due = new Date(t.due)
            const ov = due < now && !t.done
            const tierCol = [null, '#22c55e', '#eab308', '#ef4444'][t.tier]
            const subtasksDone = (t.subtasks || []).filter((s) => s.done).length
            const subtasksTotal = (t.subtasks || []).length
            const isUrgent = urgentTasks.some((ut) => ut.id === t.id)
            const hoursDiff = Math.abs(Math.floor((due - now) / (1000 * 60 * 60)))
            const hoursText = ov ? `${hoursDiff}h overdue` : hoursDiff < 24 ? `${hoursDiff}h left` : ''
            const linkedClass = t.classId ? classes.find((c) => c.id === t.classId) : null

            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '2px solid #2a2a2a', opacity: t.done ? 0.45 : 1, position: 'relative' }}>
                {isUrgent && !t.done && (
                  <div className="urgent-blink" aria-hidden="true" style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                )}
                <button
                  onClick={() => onToggle(t.id)}
                  aria-label={t.done ? `Mark ${t.name} as not done` : `Mark ${t.name} as done`}
                  aria-pressed={t.done}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${t.done ? '#aaa' : '#666'}`,
                    background: t.done ? '#fff' : 'transparent',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                    marginLeft: isUrgent && !t.done ? 12 : 0,
                  }}
                >
                  {t.done && <span style={{ fontSize: 11, color: '#000', display: 'block', textAlign: 'center', lineHeight: '18px', fontWeight: 'bold' }}>✓</span>}
                </button>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onEdit(t.id)}>
                  <p style={{ ...mono, fontSize: 14, color: t.done ? '#888' : '#fff', textDecoration: t.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                    {t.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <p style={{ ...mono, fontSize: 12, color: ov ? '#ef4444' : isUrgent ? '#eab308' : '#aaa', fontWeight: 500 }}>
                      {t.done
                        ? 'DONE'
                        : ov
                        ? `OVERDUE · ${hoursText}`
                        : hoursText
                        ? `${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${hoursText}`
                        : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {linkedClass && (
                      <span style={{ display: 'inline-block', padding: '2px 6px', background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: 4, ...mono, fontSize: 9, color: '#4ade80', fontWeight: 'bold' }}>
                        {linkedClass.code || linkedClass.name}
                      </span>
                    )}
                    {subtasksTotal > 0 && (
                      <span style={{ ...mono, fontSize: 10, color: subtasksDone === subtasksTotal ? '#22c55e' : '#666', background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>
                        ✓ {subtasksDone}/{subtasksTotal}
                      </span>
                    )}
                  </div>
                </div>
                <div aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: tierCol, flexShrink: 0 }} />
                <button onClick={() => onDelete(t.id)} aria-label={`Delete ${t.name}`} style={iconBtn('#888')}>✕</button>
              </div>
            )
          })
        )}

        {completed.length > hiddenCompleted && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ width: '100%', padding: 10, background: '#222', border: '2px solid #444', borderRadius: 6, color: '#aaa', cursor: 'pointer', ...mono, fontSize: 11, fontWeight: 'bold', transition: 'all 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#222')}
          >
            {showCompleted ? '− SHOW LESS' : `+ SHOW ${completed.length - hiddenCompleted} MORE COMPLETED`}
          </button>
        )}
      </div>
    </div>
  )
}
