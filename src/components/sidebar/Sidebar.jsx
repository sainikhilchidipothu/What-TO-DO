// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Composes the left sidebar: countdown, XP bar, tabs, goals, tasks.

import { useState } from 'react'
import { mono } from '../../theme.js'
import { Pomodoro } from './Pomodoro.jsx'
import { ClassToday } from './ClassToday.jsx'
import { SemesterWidget } from './SemesterWidget.jsx'
import { VacationWidget } from './VacationWidget.jsx'
import { Heatmap } from './Heatmap.jsx'
import { GoalsList } from './GoalsList.jsx'
import { TasksList } from './TasksList.jsx'

export function Sidebar({
  state,
  year,
  remaining,
  uniqueCats,
  catFilter,
  setCatFilter,
  urgentTasks,
  mobileOpen,
  setMobileOpen,
  // actions
  onOpenTarget,
  onOpenSemester,
  onOpenVacation,
  onOpenClasses,
  onSetTimerPresets,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
  onTogglePinHabit,
  onAddHabit,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  onPomodoroComplete,
}) {
  const [sideTab, setSideTab] = useState('today')
  const vm = state.vacationMode

  return (
    <aside
      className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Main navigation and tools"
      style={{
        width: 340,
        minWidth: 340,
        background: '#222',
        borderRight: '2px solid #444',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Countdown */}
      <button
        onClick={onOpenTarget}
        aria-label="Change target date"
        style={{
          padding: '18px 22px',
          borderBottom: '2px solid #444',
          cursor: 'pointer',
          background: '#222',
          width: '100%',
          border: 'none',
          textAlign: 'left',
          color: 'inherit',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a2a')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#222')}
      >
        <p style={{ ...mono, fontSize: 11, letterSpacing: 4, color: '#aaa', marginBottom: 5, fontWeight: 'bold' }}>
          TIME REMAINING
        </p>
        <p style={{ ...mono, fontWeight: 900, fontSize: 36, color: '#fff' }}>{remaining} DAYS</p>
        <p style={{ ...mono, fontSize: 11, color: '#bbb', marginTop: 3, letterSpacing: 2, fontWeight: 500 }}>
          {vm.active ? `🏖 VACATION ACTIVE ${vm.startDate} → ${vm.endDate}` : 'click to change target'}
        </p>
      </button>

      {/* XP & Level */}
      <div style={{ padding: '14px 18px', borderBottom: '2px solid #444', background: '#1a1a1a' }}>
        <div style={{ marginBottom: 8 }}>
          <p style={{ ...mono, fontSize: 11, letterSpacing: 2, color: '#aaa', fontWeight: 'bold' }}>
            LEVEL {state.level}
          </p>
          <p style={{ ...mono, fontSize: 11, color: '#aaa', marginTop: 2, fontWeight: 500 }}>{state.xp % 100} / 100 XP</p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={state.xp % 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${state.level} progress`}
          style={{ height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${state.xp % 100}%`,
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              transition: 'width 0.4s ease-out',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" style={{ display: 'flex', borderBottom: '2px solid #444' }}>
        {['today', 'year'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={sideTab === t}
            onClick={() => setSideTab(t)}
            style={{
              flex: 1,
              padding: '14px 0',
              border: 'none',
              cursor: 'pointer',
              ...mono,
              fontSize: 12,
              letterSpacing: 4,
              fontWeight: 'bold',
              background: 'transparent',
              color: sideTab === t ? '#fff' : '#888',
              borderBottom: sideTab === t ? '4px solid #fff' : '4px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ background: '#222' }}>
        {sideTab === 'today' ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Pomodoro presets={state.timerPresets} setPresets={onSetTimerPresets} onSessionComplete={onPomodoroComplete} />
            <ClassToday classes={state.classes} state={state} onManage={onOpenClasses} onManageSemester={onOpenSemester} />
            <SemesterWidget state={state} onManage={onOpenSemester} />
            <VacationWidget vm={vm} vacationHistory={state.vacationHistory} onManage={onOpenVacation} />
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <Heatmap history={state.history} habits={state.habits} year={year} />
          </div>
        )}
      </div>

      {/* Goals */}
      <GoalsList
        habits={state.habits}
        history={state.history}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        uniqueCats={uniqueCats}
        onToggle={onToggleHabit}
        onEdit={onEditHabit}
        onDelete={onDeleteHabit}
        onTogglePin={onTogglePinHabit}
        onAdd={onAddHabit}
      />

      {/* Tasks */}
      <TasksList
        tasks={state.tasks}
        classes={state.classes}
        urgentTasks={urgentTasks}
        onAdd={onAddTask}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onToggle={onToggleTask}
      />

      {/* Close button (mobile only — hamburger is in header) */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          style={{
            position: 'sticky',
            bottom: 16,
            right: 16,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#333',
            border: '2px solid #555',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 20,
            alignSelf: 'flex-end',
            marginLeft: 'auto',
          }}
        >
          ✕
        </button>
      )}
    </aside>
  )
}
