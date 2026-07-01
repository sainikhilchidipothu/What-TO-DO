// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Composes the left sidebar: countdown, XP bar, tabs, goals, tasks.

import { useState } from 'react'
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
      className={`sidebar w-[340px] min-w-[340px] bg-zinc-900 border-r border-zinc-800 overflow-y-auto relative ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Main navigation and tools"
    >
      {/* Countdown */}
      <button
        onClick={onOpenTarget}
        aria-label="Change target date"
        className="px-[22px] py-[18px] border-b border-zinc-800 cursor-pointer bg-zinc-900 hover:bg-zinc-800/70 w-full border-x-0 border-t-0 text-left transition-colors duration-150"
      >
        <p className="font-sans text-[11px] tracking-wider text-zinc-500 mb-1 font-bold">
          TIME REMAINING
        </p>
        <p className="font-sans font-black text-4xl text-white">{remaining} DAYS</p>
        <p className="font-sans text-[11px] text-zinc-400 mt-0.5 tracking-wide font-medium">
          {vm.active ? `🏖 VACATION ACTIVE ${vm.startDate} → ${vm.endDate}` : 'click to change target'}
        </p>
      </button>

      {/* XP & Level */}
      <div className="px-[18px] py-3.5 border-b border-zinc-800 bg-zinc-950/50">
        <div className="mb-2">
          <p className="font-sans text-[11px] tracking-wide text-zinc-500 font-bold">
            LEVEL {state.level}
          </p>
          <p className="font-sans text-[11px] text-zinc-400 mt-0.5 font-medium">{state.xp % 100} / 100 XP</p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={state.xp % 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${state.level} progress`}
          className="h-1.5 bg-zinc-900 rounded-full overflow-hidden"
        >
          <div
            style={{ width: `${state.xp % 100}%` }}
            className="h-full bg-gradient-to-r from-accent to-indigo-500 transition-[width] duration-500 ease-out"
          />
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="flex border-b border-zinc-800">
        {['today', 'year'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={sideTab === t}
            onClick={() => setSideTab(t)}
            className={`flex-1 py-3.5 border-none border-b-4 cursor-pointer font-sans text-xs tracking-wider font-bold bg-transparent transition-all duration-150 ${
              sideTab === t ? 'text-white border-accent' : 'text-zinc-500 border-transparent'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="bg-zinc-900">
        {sideTab === 'today' ? (
          <div className="p-4 flex flex-col gap-3.5">
            <Pomodoro presets={state.timerPresets} setPresets={onSetTimerPresets} onSessionComplete={onPomodoroComplete} />
            <ClassToday classes={state.classes} state={state} onManage={onOpenClasses} onManageSemester={onOpenSemester} />
            <SemesterWidget state={state} onManage={onOpenSemester} />
            <VacationWidget vm={vm} vacationHistory={state.vacationHistory} onManage={onOpenVacation} />
          </div>
        ) : (
          <div className="p-4">
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
          className="sticky bottom-4 right-4 ml-auto flex w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-600 text-white cursor-pointer text-xl items-center justify-center"
        >
          ✕
        </button>
      )}
    </aside>
  )
}
