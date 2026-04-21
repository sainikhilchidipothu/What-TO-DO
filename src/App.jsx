// ─── App.jsx ──────────────────────────────────────────────────────────────────
// Top-level orchestrator. Holds the modal dispatch state and the handlers that
// mutate app state. Everything else lives in its own component.

import { useState, useEffect, useCallback, useRef } from 'react'
import { mono } from './theme.js'
import { MONTHS, STORAGE_KEY, DEFAULT_STATE } from './constants.js'
import { clearState, exportToFile, importFromFile } from './utils/storage.js'
import { daysLeft, todayKey, isVacDay, vacationDays, getVacationStatus, uid } from './utils/date.js'

import { useAppState } from './hooks/useAppState.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useUrgentTasks } from './hooks/useUrgentTasks.js'
import { useToast } from './hooks/useToast.js'

// Components
import { Sidebar } from './components/sidebar/Sidebar.jsx'
import { MacroView } from './components/calendar/MacroView.jsx'
import { MicroView } from './components/calendar/MicroView.jsx'

import { IntroScreen } from './components/common/IntroScreen.jsx'
import { Toast } from './components/overlays/Toast.jsx'
import { UndoToast } from './components/overlays/UndoToast.jsx'
import { DayPreviewCard } from './components/overlays/DayPreviewCard.jsx'
import { UrgentTasksAlert } from './components/overlays/UrgentTasksAlert.jsx'
import {
  VacationTasksWarning,
  TaskVacationWarning,
  DeleteWarningModal,
} from './components/overlays/WarningModals.jsx'

import {
  HabitModal,
  JournalModal,
  TargetModal,
  VacationModal,
  ClassesModal,
  ClassFormModal,
  InsightsModal,
  FirstTimeSetup,
} from './components/modals/SmallModals.jsx'
import { TaskModal } from './components/modals/TaskModal.jsx'
import { SemesterModal } from './components/modals/SemesterModal.jsx'

export default function App() {
  const [state, setState] = useAppState()
  const [toast, showToast] = useToast()

  // ── UI state ─────────────────────────────────────────────────────────────
  const [intro, setIntro] = useState(true)
  const [view, setView] = useState('macro')
  const [calM, setCalM] = useState(new Date().getMonth())
  const [calY, setCalY] = useState(new Date().getFullYear())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modal dispatch — 'habit', 'task', 'journal', 'target', 'vacation',
  // 'classes', 'class', 'insights', 'noinsights', 'semester', null
  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editCId, setEditCId] = useState(null)
  const [jDate, setJDate] = useState(todayKey())

  // Hover preview state
  const [hoverDate, setHoverDate] = useState(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  // Warnings
  const [vacationWarning, setVacationWarning] = useState({ open: false, taskCount: 0 })
  const [taskVacationWarning, setTaskVacationWarning] = useState(null)
  const [pendingTaskData, setPendingTaskData] = useState(null)
  const [deleteAllWarning, setDeleteAllWarning] = useState(false)

  // Undo
  const [undoItem, setUndoItem] = useState(null)
  const undoTimerRef = useRef(null)

  // First-time setup
  const [firstTimeSetupOpen, setFirstTimeSetupOpen] = useState(() => !localStorage.getItem(STORAGE_KEY))

  // Urgent alert dismiss
  const [urgentDismissed, setUrgentDismissed] = useState(false)

  // Filter for goals
  const [catFilter, setCatFilter] = useState('all')

  // ── Derived values ───────────────────────────────────────────────────────
  const remaining = daysLeft(state.targetDate)
  const uniqueCats = [...new Set(state.habits.map((h) => h.category).filter(Boolean))]
  const urgentTasks = useUrgentTasks(state.tasks)
  const vm = state.vacationMode

  // ── Modal helpers ────────────────────────────────────────────────────────
  const close = useCallback(() => { setModal(null); setEditId(null); setEditCId(null) }, [])

  const openHabit = (id = null) => { setEditId(id); setModal('habit') }
  const openTask = (id = null) => { setEditId(id); setModal('task') }
  const openJournal = (ds) => { setJDate(ds); setModal('journal') }
  const openClass = (id = null) => { setEditCId(id); setModal('class') }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  const navM = useCallback((delta) => {
    setCalM((prev) => {
      let m = prev + delta
      if (m > 11) { setCalY((cy) => cy + 1); return 0 }
      if (m < 0)  { setCalY((cy) => cy - 1); return 11 }
      return m
    })
  }, [])

  useKeyboardShortcuts({
    modal, view, onClose: close,
    onMacro: () => setView('macro'),
    onNewHabit: () => openHabit(),
    onNewTask: () => openTask(),
    onNewJournal: () => openJournal(todayKey()),
    onNavMonth: navM,
  })

  // ── Auto-archive past vacations ──────────────────────────────────────────
  useEffect(() => {
    const status = getVacationStatus(state.vacationMode)
    if (status?.isPast && state.vacationMode.active) {
      const days = vacationDays(state.vacationMode)
      setState((prev) => ({
        ...prev,
        vacationMode: { active: false, startDate: null, endDate: null },
        vacationHistory: [
          ...(prev.vacationHistory || []),
          { startDate: prev.vacationMode.startDate, endDate: prev.vacationMode.endDate, days },
        ],
      }))
      showToast('Vacation completed ✓')
    }
  }, [state.vacationMode, setState, showToast])

  // ── HABIT HANDLERS ───────────────────────────────────────────────────────
  const saveHabit = (data) => {
    const dup = state.habits.some((h) => h.name.toLowerCase() === data.name.toLowerCase() && h.id !== editId)
    if (dup) { showToast('Goal already exists!', 'err'); return }
    setState((prev) =>
      editId
        ? { ...prev, habits: prev.habits.map((h) => (h.id === editId ? { ...h, ...data } : h)) }
        : { ...prev, habits: [...prev.habits, { id: uid(), ...data, pinned: false }] }
    )
    close()
    showToast(editId ? 'Goal updated ✓' : 'Goal added ✓')
  }

  const delHabit = (id) => {
    const habit = state.habits.find((h) => h.id === id)
    if (!habit) return
    setState((prev) => {
      const h = { ...prev.history }
      Object.keys(h).forEach((k) => {
        h[k] = h[k].filter((x) => x !== id)
        if (!h[k].length) delete h[k]
      })
      return { ...prev, habits: prev.habits.filter((x) => x.id !== id), history: h }
    })
    setUndoItem({ type: 'habit', item: habit })
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000)
  }

  const togglePin = (id) =>
    setState((prev) => ({ ...prev, habits: prev.habits.map((h) => (h.id === id ? { ...h, pinned: !h.pinned } : h)) }))

  const toggleHist = (hid, ds) =>
    setState((prev) => {
      const h = { ...prev.history }
      const arr = [...(h[ds] || [])]
      const i = arr.indexOf(hid)
      if (i >= 0) arr.splice(i, 1)
      else arr.push(hid)
      if (!arr.length) delete h[ds]
      else h[ds] = arr
      return { ...prev, history: h }
    })

  // ── TASK HANDLERS ────────────────────────────────────────────────────────
  const saveTask = (data) => {
    if (isVacDay(data.date, state.vacationMode)) {
      setPendingTaskData({ ...data, editId })
      setTaskVacationWarning(data.date)
      return
    }
    confirmSaveTask({ ...data, editId })
  }

  const confirmSaveTask = (data) => {
    setState((prev) =>
      data.editId
        ? { ...prev, tasks: prev.tasks.map((t) => (t.id === data.editId ? { ...t, name: data.name, due: data.due, tier: data.tier, subtasks: data.subtasks, classId: data.classId } : t)) }
        : { ...prev, tasks: [...prev.tasks, { id: uid(), name: data.name, due: data.due, tier: data.tier, done: false, subtasks: data.subtasks, classId: data.classId }] }
    )
    setTaskVacationWarning(null)
    setPendingTaskData(null)
    close()
    showToast(data.editId ? 'Task updated ✓' : 'Task added ✓')
  }

  const delTask = (id) => {
    const task = state.tasks.find((t) => t.id === id)
    if (!task) return
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }))
    setUndoItem({ type: 'task', item: task })
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000)
  }

  const togTask = (id) => {
    const task = state.tasks.find((t) => t.id === id)
    const wasCompleted = task?.done
    setState((prev) => {
      const newXP = !wasCompleted ? prev.xp + 10 : Math.max(0, prev.xp - 10)
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        xp: newXP,
        level: Math.floor(newXP / 100) + 1,
      }
    })
    if (!wasCompleted) showToast('+10 XP! Task completed! 🎉')
  }

  const undoDelete = () => {
    if (!undoItem) return
    if (undoItem.type === 'habit') setState((prev) => ({ ...prev, habits: [...prev.habits, undoItem.item] }))
    if (undoItem.type === 'task')  setState((prev) => ({ ...prev, tasks: [...prev.tasks, undoItem.item] }))
    clearTimeout(undoTimerRef.current)
    setUndoItem(null)
  }

  // ── JOURNAL ──────────────────────────────────────────────────────────────
  const saveJournal = (text) => {
    setState((prev) => {
      const j = { ...prev.journal }
      if (text) j[jDate] = { text }
      else delete j[jDate]
      return { ...prev, journal: j }
    })
    close()
    showToast(text ? 'Journal saved ✓' : 'Entry deleted')
  }

  // ── CLASS ────────────────────────────────────────────────────────────────
  const saveClass = (data) => {
    const cls = { id: editCId || uid(), ...data }
    setState((prev) =>
      editCId
        ? { ...prev, classes: prev.classes.map((c) => (c.id === editCId ? cls : c)) }
        : { ...prev, classes: [...prev.classes, cls] }
    )
    setModal('classes')
    setEditCId(null)
    showToast(editCId ? 'Class updated ✓' : 'Class added ✓')
  }

  const delClass = (id) => {
    setState((prev) => ({ ...prev, classes: prev.classes.filter((c) => c.id !== id) }))
    showToast('Class deleted')
  }

  // ── VACATION ─────────────────────────────────────────────────────────────
  const saveVacation = ({ start, end }) => {
    if (!start || !end || start > end) { showToast('Check dates', 'err'); return }
    const tasksInPeriod = state.tasks.filter((t) => {
      if (!t.due || t.done) return false
      const td = t.due.split('T')[0]
      return td >= start && td <= end
    })
    if (tasksInPeriod.length > 0) {
      setVacationWarning({ open: true, taskCount: tasksInPeriod.length, pending: { start, end } })
      return
    }
    confirmVacation(start, end)
  }

  const confirmVacation = (start, end) => {
    setState({ vacationMode: { active: true, startDate: start, endDate: end } })
    setVacationWarning({ open: false, taskCount: 0 })
    close()
    showToast('Vacation scheduled 🏖')
  }

  const deleteVacation = () => {
    setState((prev) => ({ ...prev, vacationMode: { active: false, startDate: null, endDate: null } }))
    close()
    showToast('Vacation deleted')
  }

  // ── SEMESTER ─────────────────────────────────────────────────────────────
  const saveSemester = (data) => {
    setState((prev) => ({ ...prev, ...data }))
    close()
    showToast(data.semesterActive ? 'Semester saved 🎓' : 'Semester updated')
  }

  const clearSemester = () => {
    setState((prev) => ({
      ...prev,
      semesterName: '', semesterStart: '', semesterEnd: '', semesterActive: false,
    }))
    close()
    showToast('Semester cleared')
  }

  // ── TARGET ───────────────────────────────────────────────────────────────
  const saveTarget = (date) => {
    setState({ targetDate: date })
    close()
    showToast('Target updated ✓')
  }

  // ── EXPORT / IMPORT / DELETE ALL ─────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = await importFromFile(file)
      setState(data)
      showToast('Imported ✓')
    } catch {
      showToast('Invalid file', 'err')
    }
    e.target.value = '' // reset so same file can be selected twice
  }

  const handleDeleteAll = () => {
    setState(DEFAULT_STATE)
    clearState()
    setDeleteAllWarning(false)
    showToast('All data deleted')
  }

  // ── FIRST-TIME SETUP ─────────────────────────────────────────────────────
  const completeFirstTimeSetup = (date) => {
    setState((prev) => ({ ...prev, targetDate: date }))
    setFirstTimeSetupOpen(false)
    showToast('Welcome to What-TO-DO! 🎉')
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  // Close mobile drawer whenever a sidebar action runs — cleanest UX.
  const withDrawerClose = (fn) => (...args) => { setMobileMenuOpen(false); return fn(...args) }

  const editingHabit = editId ? state.habits.find((h) => h.id === editId) : null
  const editingTask = editId ? state.tasks.find((t) => t.id === editId) : null
  const editingClass = editCId ? state.classes.find((c) => c.id === editCId) : null

  // Build the "initial" object for the task modal from the editingTask
  let taskInitial = null
  if (editingTask) {
    const dt = new Date(editingTask.due)
    let h = dt.getHours()
    const ap = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    taskInitial = {
      name: editingTask.name,
      date: new Date(editingTask.due).toLocaleDateString('en-CA'),
      hour: String(h).padStart(2, '0'),
      min: String(dt.getMinutes()).padStart(2, '0'),
      ampm: ap,
      tier: editingTask.tier,
      subtasks: editingTask.subtasks || [],
      classId: editingTask.classId || '',
    }
  }

  const showUrgentAlert = !urgentDismissed && urgentTasks.length > 0

  return (
    <div
      className="app-container"
      style={{
        display: 'flex', flexDirection: 'row', height: '100vh',
        background: '#1a1a1a', color: '#ffffff',
        fontFamily: "'Epilogue', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
      }}
    >
      {firstTimeSetupOpen && <FirstTimeSetup onComplete={completeFirstTimeSetup} />}
      {intro && !firstTimeSetupOpen && (
        <IntroScreen targetDate={state.targetDate} remaining={remaining} onContinue={() => setIntro(false)} />
      )}

      <Sidebar
        state={state}
        year={calY}
        remaining={remaining}
        uniqueCats={uniqueCats}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        urgentTasks={urgentTasks}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onOpenTarget={withDrawerClose(() => setModal('target'))}
        onOpenSemester={withDrawerClose(() => setModal('semester'))}
        onOpenVacation={withDrawerClose(() => setModal('vacation'))}
        onOpenClasses={withDrawerClose(() => setModal('classes'))}
        onSetTimerPresets={(p) => setState({ timerPresets: p })}
        onToggleHabit={toggleHist}
        onEditHabit={openHabit}
        onDeleteHabit={delHabit}
        onTogglePinHabit={togglePin}
        onAddHabit={() => openHabit()}
        onAddTask={() => openTask()}
        onEditTask={openTask}
        onDeleteTask={delTask}
        onToggleTask={togTask}
        onPomodoroComplete={() => showToast('⏱ Session complete!')}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1a1a1a' }}>
        {/* Header */}
        <div className="header-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px', height: 76, borderBottom: '2px solid #444', flexShrink: 0, background: '#222' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 0 }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open navigation menu"
              className="mobile-hamburger"
              style={{ display: 'none', background: '#333', border: '2px solid #555', color: '#fff', cursor: 'pointer', borderRadius: 8, padding: '10px 14px', fontSize: 20, transition: 'all 0.15s' }}
            >
              ☰
            </button>

            <button
              onClick={() => { if (view === 'micro') navM(-1); else setCalY((y) => y - 1) }}
              aria-label={view === 'micro' ? 'Previous month' : 'Previous year'}
              style={{ ...mono, background: '#333', border: '2px solid #555', color: '#fff', cursor: 'pointer', borderRadius: 8, padding: '10px 20px', fontSize: 18, transition: 'all 0.15s', fontWeight: 'bold' }}
            >
              ◀
            </button>

            <h1 className="calendar-title" style={{ ...mono, fontWeight: 900, fontSize: 26, letterSpacing: 6, color: '#fff', minWidth: 340, textAlign: 'center' }}>
              {view === 'macro' ? `${calY} OVERVIEW` : `${MONTHS[calM].toUpperCase()} ${calY}`}
            </h1>

            <button
              onClick={() => { if (view === 'micro') navM(1); else setCalY((y) => y + 1) }}
              aria-label={view === 'micro' ? 'Next month' : 'Next year'}
              style={{ ...mono, background: '#333', border: '2px solid #555', color: '#fff', cursor: 'pointer', borderRadius: 8, padding: '10px 20px', fontSize: 18, transition: 'all 0.15s', fontWeight: 'bold' }}
            >
              ▶
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {view === 'micro' && (
              <button
                onClick={() => setView('macro')}
                aria-label="Back to year view"
                style={{ ...mono, background: '#333', border: '2px solid #555', color: '#eee', cursor: 'pointer', borderRadius: 8, padding: '10px 18px', fontSize: 12, letterSpacing: 3, fontWeight: 'bold' }}
              >
                ← YEAR
              </button>
            )}
            <button onClick={() => exportToFile(state)} aria-label="Export data" title="Export" style={iconBtnHeader}>💾</button>
            <label title="Import" aria-label="Import data" style={{ ...iconBtnHeader, display: 'inline-block' }}>
              📂<input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button onClick={() => setModal('insights')} aria-label="View insights" style={iconBtnHeader}>📊</button>
            <button
              onClick={() => setDeleteAllWarning(true)}
              aria-label="Delete all data"
              title="Delete All Data"
              style={{ background: '#2a1111', border: '2px solid #ef4444', color: '#ef4444', cursor: 'pointer', borderRadius: 8, padding: '10px 14px', fontSize: 16 }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Hint bar */}
        <div style={{ padding: '8px 36px', background: '#222', borderBottom: '2px solid #333', flexShrink: 0 }}>
          <span style={{ ...mono, fontSize: 11, color: '#888', letterSpacing: 2, fontWeight: 'bold' }}>
            {view === 'micro'
              ? '◀ ▶ navigate months · Esc back to year · click day for details & journal'
              : '◀ ▶ change year · click month to zoom in'}
          </span>
        </div>

        {/* Calendar */}
        <div className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#1a1a1a' }}>
          {view === 'macro' ? (
            <MacroView
              year={calY}
              state={state}
              onMonth={(m) => { setCalM(m); setView('micro') }}
              onHover={(date, pos) => { setHoverDate(date); setHoverPos(pos) }}
              onHoverEnd={() => setHoverDate(null)}
            />
          ) : (
            <MicroView year={calY} month={calM} state={state} onToggle={toggleHist} onJournal={openJournal} />
          )}
        </div>
      </main>

      {/* Overlays */}
      {showUrgentAlert && <UrgentTasksAlert urgentTasks={urgentTasks} onDismiss={() => setUrgentDismissed(true)} />}
      {hoverDate && <DayPreviewCard dateKey={hoverDate} state={state} position={hoverPos} />}
      {undoItem && <UndoToast item={undoItem} onUndo={undoDelete} onDismiss={() => setUndoItem(null)} />}
      <Toast toast={toast} />

      {/* Warning modals */}
      {vacationWarning.open && (
        <VacationTasksWarning
          taskCount={vacationWarning.taskCount}
          onClose={() => setVacationWarning({ open: false, taskCount: 0 })}
          onConfirm={() => confirmVacation(vacationWarning.pending.start, vacationWarning.pending.end)}
        />
      )}
      {taskVacationWarning && pendingTaskData && (
        <TaskVacationWarning
          taskDate={taskVacationWarning}
          onClose={() => { setTaskVacationWarning(null); setPendingTaskData(null) }}
          onConfirm={() => confirmSaveTask(pendingTaskData)}
        />
      )}
      {deleteAllWarning && (
        <DeleteWarningModal onClose={() => setDeleteAllWarning(false)} onConfirm={handleDeleteAll} />
      )}

      {/* Main modals */}
      {modal === 'habit' && (
        <HabitModal editId={editId} initial={editingHabit} onClose={close} onSave={saveHabit} />
      )}
      {modal === 'task' && (
        <TaskModal editId={editId} initial={taskInitial} classes={state.classes} onClose={close} onSave={saveTask} />
      )}
      {modal === 'journal' && (
        <JournalModal date={jDate} initial={state.journal[jDate]?.text || ''} onClose={close} onSave={saveJournal} />
      )}
      {modal === 'target' && (
        <TargetModal initial={state.targetDate} onClose={close} onSave={saveTarget} />
      )}
      {modal === 'vacation' && (
        <VacationModal
          vm={vm}
          initialStart={vm.startDate || ''}
          initialEnd={vm.endDate || ''}
          onClose={close}
          onSave={saveVacation}
          onDelete={deleteVacation}
        />
      )}
      {modal === 'classes' && (
        <ClassesModal
          classes={state.classes}
          onClose={close}
          onAdd={() => openClass()}
          onEdit={(id) => openClass(id)}
          onDelete={delClass}
        />
      )}
      {modal === 'class' && (
        <ClassFormModal
          editId={editCId}
          initial={editingClass}
          onBack={() => { setEditCId(null); setModal('classes') }}
          onSave={saveClass}
        />
      )}
      {modal === 'semester' && (
        <SemesterModal state={state} onClose={close} onSave={saveSemester} onClear={clearSemester} />
      )}
      {(modal === 'insights' || modal === 'noinsights') && (
        <InsightsModal state={state} onClose={close} />
      )}
    </div>
  )
}

const iconBtnHeader = {
  background: '#333',
  border: '2px solid #555',
  color: '#eee',
  cursor: 'pointer',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 16,
}
