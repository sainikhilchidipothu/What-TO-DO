// ─── TasksList ────────────────────────────────────────────────────────────────

import { useState } from 'react'
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

  const selectCls = 'bg-zinc-950 border border-zinc-800 text-zinc-400 rounded px-1.5 py-1 text-[11px] outline-none cursor-pointer'

  return (
    <div className="border-t-2 border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
        <h2 className="font-sans text-[11px] tracking-[0.3em] text-zinc-400 font-bold m-0">TASKS</h2>
        <button
          onClick={onAdd}
          aria-label="Add new task"
          className="w-[30px] h-[30px] rounded-md border-none cursor-pointer bg-accent hover:bg-indigo-300 text-zinc-950 font-sans text-lg font-bold leading-[28px] p-0 transition-colors duration-150"
        >
          +
        </button>
      </div>

      <div className="px-3 py-2.5 flex gap-1.5 border-b border-zinc-900 bg-zinc-900/60">
        <label htmlFor="task-search" className="sr-only">Search tasks</label>
        <input
          id="task-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors font-sans"
        />
        <select value={tierF} onChange={(e) => setTierF(e.target.value)} aria-label="Filter by priority" className={selectCls}>
          <option value="all">All</option><option value="1">Low</option><option value="2">Med</option><option value="3">High</option>
        </select>
        <select value={statF} onChange={(e) => setStatF(e.target.value)} aria-label="Filter by status" className={selectCls}>
          <option value="all">All</option><option value="open">Open</option><option value="done">Done</option><option value="overdue">Late</option>
        </select>
      </div>

      <div className="bg-zinc-950/40">
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
            <p className="font-sans text-[11px] text-zinc-500 p-4 text-center leading-relaxed">
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
              <div key={t.id} className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-900 relative ${t.done ? 'opacity-45' : ''}`}>
                {isUrgent && !t.done && (
                  <div className="urgent-blink absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                )}
                <button
                  onClick={() => onToggle(t.id)}
                  aria-label={t.done ? `Mark ${t.name} as not done` : `Mark ${t.name} as done`}
                  aria-pressed={t.done}
                  style={{ marginLeft: isUrgent && !t.done ? 12 : 0 }}
                  className={`w-[18px] h-[18px] rounded flex-shrink-0 transition-all duration-150 border-2 cursor-pointer ${
                    t.done ? 'border-zinc-400 bg-white' : 'border-zinc-600 bg-transparent'
                  }`}
                >
                  {t.done && <span className="text-[11px] text-zinc-950 block text-center leading-[18px] font-bold">✓</span>}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(t.id)}>
                  <p className={`font-sans text-sm truncate font-semibold ${t.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {t.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className={`font-sans text-xs font-medium ${ov ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {t.done
                        ? 'DONE'
                        : ov
                        ? `OVERDUE · ${hoursText}`
                        : hoursText
                        ? `${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${hoursText}`
                        : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {linkedClass && (
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-900 rounded font-sans text-[9px] text-emerald-400 font-bold">
                        {linkedClass.code || linkedClass.name}
                      </span>
                    )}
                    {subtasksTotal > 0 && (
                      <span className={`font-sans text-[10px] rounded px-1.5 py-0.5 bg-zinc-900 ${subtasksDone === subtasksTotal ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        ✓ {subtasksDone}/{subtasksTotal}
                      </span>
                    )}
                  </div>
                </div>
                <div aria-hidden="true" style={{ background: tierCol }} className="w-2 h-2 rounded-full flex-shrink-0" />
                <button onClick={() => onDelete(t.id)} aria-label={`Delete ${t.name}`} className="font-sans text-[11px] px-1 py-0.5 rounded text-zinc-500 hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors">✕</button>
              </div>
            )
          })
        )}

        {completed.length > hiddenCompleted && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full p-2.5 bg-zinc-900/60 hover:bg-zinc-800/70 border-2 border-zinc-800 rounded-lg text-zinc-400 cursor-pointer font-sans text-[11px] font-bold transition-colors duration-150"
          >
            {showCompleted ? '− SHOW LESS' : `+ SHOW ${completed.length - hiddenCompleted} MORE COMPLETED`}
          </button>
        )}
      </div>
    </div>
  )
}
