// ─── App.jsx ──────────────────────────────────────────────────────────────────
// Top-level orchestrator. Holds the modal dispatch state and the handlers that
// mutate app state. Everything else lives in its own component.

import { useState, useEffect, useCallback, useRef } from 'react'
import { MONTHS, STORAGE_KEY, DEFAULT_STATE } from './constants.js'
import { clearState, exportToFile, importFromFile } from './utils/storage.js'
import { daysLeft, todayKey, isVacDay, vacationDays, getVacationStatus, uid } from './utils/date.js'

import { useAppState } from './hooks/useAppState.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useUrgentTasks } from './hooks/useUrgentTasks.js'
import { useToast } from './hooks/useToast.js'
import { taskDoneOnDate, taskDueOnDate, tasksOnDate, weekStart } from './utils/roadmap.js'

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
  NameModal,
} from './components/modals/SmallModals.jsx'
import { TaskModal } from './components/modals/TaskModal.jsx'
import { SemesterModal } from './components/modals/SemesterModal.jsx'
import { RoadmapModal } from './components/modals/RoadmapModal.jsx'
import { CommandPalette } from './components/overlays/CommandPalette.jsx'

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
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Filter for goals
  const [catFilter, setCatFilter] = useState('all')

  // ── Derived values ───────────────────────────────────────────────────────
  const remaining = daysLeft(state.targetDate)
  const uniqueCats = [...new Set(state.habits.map((h) => h.category).filter(Boolean))]
  const urgentTasks = useUrgentTasks(state.tasks)
  const vm = state.vacationMode
  const activeClasses = state.classes.filter((c) => c.semesterId === state.currentSemesterId)
  const viewState = { ...state, classes: activeClasses }
  const semesters = state.semesters || []

  useEffect(() => {
    const notify = (title, body) => {
      if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body })
    }
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
    const tick = () => {
      const now = Date.now()
      const today = todayKey()
      const tomorrowDate = new Date(`${today}T12:00:00`)
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrow = tomorrowDate.toISOString().slice(0, 10)
      const todayTasks = tasksOnDate(state.tasks, today)
      const occurrences = [
        ...todayTasks,
        ...tasksOnDate(state.tasks, tomorrow).filter((task) => !todayTasks.some((current) => current.id === task.id && current.occurrenceDue === task.occurrenceDue)),
        ...state.tasks.filter((task) => !task.recurring?.frequency && task.due && new Date(task.due).getTime() <= now && !todayTasks.some((current) => current.id === task.id)),
      ]
      occurrences.forEach((task) => {
        const occurrenceDate = task.recurring?.frequency && task.occurrenceDue ? task.occurrenceDue.slice(0, 10) : task.due?.slice(0, 10)
        if (!occurrenceDate || taskDoneOnDate(task, occurrenceDate)) return
        const due = new Date(taskDueOnDate(task, occurrenceDate)).getTime()
        const keyBase = `task:${task.id}:${occurrenceDate}`
        if (due > now && due - now <= 24 * 60 * 60 * 1000 && !sessionStorage.getItem(`${keyBase}:24h`)) {
          notify('Task due within 24 hours', task.name)
          sessionStorage.setItem(`${keyBase}:24h`, '1')
        }
        if (due <= now && !sessionStorage.getItem(`${keyBase}:overdue`)) {
          notify('Task overdue', `${task.name} needs your attention.`)
          sessionStorage.setItem(`${keyBase}:overdue`, '1')
        }
      })
      state.classes.forEach((c) => {
        if (!c.time || !c.days?.includes(new Date().getDay())) return
        const [hour, minute] = c.time.split(':').map(Number)
        const start = new Date(); start.setHours(hour, minute, 0, 0)
        if (start.getTime() - now > 9.5 * 60000 && start.getTime() - now < 10.5 * 60000 && !sessionStorage.getItem(`class:${c.id}:${start.toISOString().slice(0, 10)}`)) { notify('Class starting in 10 minutes', c.name); sessionStorage.setItem(`class:${c.id}:${start.toISOString().slice(0, 10)}`, '1') }
      })
    }
    const id = setInterval(tick, 30000); tick()
    return () => clearInterval(id)
  }, [state.tasks, state.classes])

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
    onPalette: () => setPaletteOpen(true),
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
        ? { ...prev, tasks: prev.tasks.map((t) => (t.id === data.editId ? { ...t, name: data.name, due: data.due, tier: data.tier, subtasks: data.subtasks, classId: data.classId, recurring: data.recurring || null } : t)) }
        : { ...prev, tasks: [...prev.tasks, { id: uid(), name: data.name, due: data.due, tier: data.tier, done: false, subtasks: data.subtasks, classId: data.classId, recurring: data.recurring || null }] }
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

  const togTask = (id, occurrenceDate = todayKey()) => {
    const task = state.tasks.find((t) => t.id === id)
    const wasCompleted = taskDoneOnDate(task, occurrenceDate)
    setState((prev) => {
      const newXP = !wasCompleted ? prev.xp + 10 : Math.max(0, prev.xp - 10)
      return {
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== id) return t
          if (!t.recurring?.frequency) return { ...t, done: !t.done }
          const recurringDone = { ...(t.recurringDone || {}) }
          if (wasCompleted) delete recurringDone[occurrenceDate]
          else recurringDone[occurrenceDate] = true
          return { ...t, recurringDone }
        }),
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
    const cls = { id: editCId || uid(), semesterId: data.semesterId || state.currentSemesterId, ...data }
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
    setState((prev) => {
      const currentSemesterId = prev.currentSemesterId || 'legacy-semester'
      const isNewSemester =
        data.semesterActive &&
        (!prev.semesterActive ||
          prev.semesterName !== data.semesterName ||
          prev.semesterStart !== data.semesterStart ||
          prev.semesterEnd !== data.semesterEnd)
      const nextId = isNewSemester ? uid() : currentSemesterId
      const record = {
        id: nextId,
        name: data.semesterName || 'Unnamed semester',
        startDate: data.semesterStart,
        endDate: data.semesterEnd,
        active: data.semesterActive,
      }
      const existing = (prev.semesters || []).filter((s) => s.id !== nextId)
      return {
        ...prev,
        ...data,
        currentSemesterId: nextId,
        semesters: [...existing, record],
      }
    })
    close()
    showToast(data.semesterActive ? 'Semester saved 🎓' : 'Semester updated')
  }

  const clearSemester = () => {
    setState((prev) => ({
      ...prev,
      semesterName: '', semesterStart: '', semesterEnd: '', semesterActive: false,
      // Start a fresh class scope after clearing, while retaining the old
      // semester's classes in storage for historical backups.
      currentSemesterId: uid(),
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

  const saveGrade = (grade) => setState((prev) => ({ ...prev, grades: [...(prev.grades || []), grade] }))
  const saveReview = (review) => setState((prev) => ({ ...prev, weeklyReviews: { ...(prev.weeklyReviews || {}), [weekStart()]: review } }))

  // ── FIRST-TIME SETUP ─────────────────────────────────────────────────────
  const completeFirstTimeSetup = (date) => {
    setState((prev) => ({ ...prev, targetDate: date }))
    setFirstTimeSetupOpen(false)
    showToast('Welcome to What-TO-DO! 🎉')
  }

  const saveUserName = (name) => {
    setState({ userName: name.trim() })
    close()
    showToast(name.trim() ? 'Name updated ✓' : 'Name cleared')
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
      recurring: editingTask.recurring || null,
    }
  }

  const showUrgentAlert = !urgentDismissed && urgentTasks.length > 0
  const jumpToToday = () => {
    const now = new Date()
    setCalY(now.getFullYear())
    setCalM(now.getMonth())
    setView('micro')
  }

  return (
    <div className="app-container flex flex-row h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {firstTimeSetupOpen && <FirstTimeSetup initialName={state.userName} onComplete={(date, name) => {
        setState((prev) => ({ ...prev, targetDate: date, userName: name.trim() }))
        setFirstTimeSetupOpen(false)
        showToast('Welcome to What-TO-DO! 🎉')
      }} />}
      {intro && !firstTimeSetupOpen && (
        <IntroScreen targetDate={state.targetDate} remaining={remaining} onContinue={() => setIntro(false)} />
      )}

      <Sidebar
        state={viewState}
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
        onPomodoroComplete={() => {
          setState((prev) => ({ ...prev, pomodoroSessions: [...(prev.pomodoroSessions || []), { id: uid(), startedAt: new Date().toISOString(), minutes: prev.timerPresets.focus, type: 'focus' }] }))
          if ('Notification' in window && Notification.permission === 'granted') new Notification('Pomodoro complete', { body: 'Great work. Time for a break.' })
          showToast('⏱ Session complete!')
        }}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {/* Header */}
        <div className="header-nav flex items-center justify-between px-9 h-[76px] border-b border-zinc-800 flex-shrink-0 bg-zinc-900">
          <div className="flex items-center gap-[18px] flex-1 min-w-0 basis-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open navigation menu"
              className="mobile-hamburger hidden bg-zinc-800 border border-zinc-600 text-white cursor-pointer rounded-lg px-3.5 py-2.5 text-xl transition-all duration-150"
            >
              ☰
            </button>

            <button
              onClick={() => { if (view === 'micro') navM(-1); else setCalY((y) => y - 1) }}
              aria-label={view === 'micro' ? 'Previous month' : 'Previous year'}
              className="font-sans bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white cursor-pointer rounded-lg px-5 py-2.5 text-lg transition-all duration-150 font-bold"
            >
              ◀
            </button>

            <div className="calendar-heading flex-1 min-w-0 text-center">
              <h1 className="calendar-title font-sans font-black text-2xl tracking-[0.3em] text-white truncate">
                {view === 'macro' ? `${calY} OVERVIEW` : `${MONTHS[calM].toUpperCase()} ${calY}`}
              </h1>
              <p className="calendar-subtitle hidden sm:block font-sans text-[10px] text-zinc-500 tracking-[0.18em] uppercase mt-1">
                {view === 'macro' ? 'Year at a glance' : 'Monthly focus'}
              </p>
            </div>

            <button
              onClick={() => { if (view === 'micro') navM(1); else setCalY((y) => y + 1) }}
              aria-label={view === 'micro' ? 'Next month' : 'Next year'}
              className="font-sans bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white cursor-pointer rounded-lg px-5 py-2.5 text-lg transition-all duration-150 font-bold"
            >
              ▶
            </button>
          </div>

          <button
            onClick={() => setModal('name')}
            aria-label="Edit your name"
            className="greeting-button hidden lg:flex flex-col items-start justify-center shrink-0 w-[clamp(130px,16vw,230px)] min-w-0 mr-4 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-950/70 hover:bg-zinc-800 hover:border-accent cursor-pointer text-left transition-all duration-150"
          >
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-accent font-black">HELLO</span>
            <span className="greeting-name block w-full min-w-0 truncate font-sans text-lg font-black text-white leading-tight" title={state.userName || 'there'}>{state.userName || 'there'} <span aria-hidden="true">👋</span></span>
          </button>

          <div className="flex gap-3 items-center shrink-0">
            <button
              onClick={jumpToToday}
              aria-label="Jump to today"
              title="Jump to today"
              className="today-button hidden sm:inline-flex font-sans bg-accent text-zinc-950 border border-accent cursor-pointer rounded-lg px-3.5 py-2.5 text-xs tracking-wide font-black transition-all duration-150"
            >
              TODAY
            </button>
            <div className="view-switch hidden md:flex items-center p-1 rounded-lg border border-zinc-700 bg-zinc-950/70" role="group" aria-label="Calendar view">
              <button
                onClick={() => setView('macro')}
                aria-pressed={view === 'macro'}
                className={`px-3 py-1.5 rounded-md border-none cursor-pointer font-sans text-[11px] font-black tracking-wide transition-colors ${view === 'macro' ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}
              >
                YEAR
              </button>
              <button
                onClick={() => setView('micro')}
                aria-pressed={view === 'micro'}
                className={`px-3 py-1.5 rounded-md border-none cursor-pointer font-sans text-[11px] font-black tracking-wide transition-colors ${view === 'micro' ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-200'}`}
              >
                MONTH
              </button>
            </div>
            {view === 'micro' && (
              <button
                onClick={() => setView('macro')}
                aria-label="Back to year view"
                title="Back to year view"
                className="font-sans bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 cursor-pointer rounded-lg px-[18px] py-2.5 text-xs tracking-wide font-bold transition-all duration-150"
              >
                ← YEAR
              </button>
            )}
            <button onClick={() => exportToFile(state)} aria-label="Export data" title="Export" className={ICON_BTN}>💾</button>
            <label title="Import" aria-label="Import data" className={`${ICON_BTN} inline-block`}>
              📂<input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={() => setModal('roadmap')} aria-label="Weekly review and analytics" className={ICON_BTN}>📊</button>
            <button onClick={() => setPaletteOpen(true)} aria-label="Open command palette" className={ICON_BTN}>⌘K</button>
            <button
              onClick={() => setDeleteAllWarning(true)}
              aria-label="Delete all data"
              title="Delete All Data"
              className="bg-red-950/50 border border-red-500 text-red-500 hover:bg-red-950 cursor-pointer rounded-lg px-3.5 py-2.5 text-base transition-all duration-150"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Hint bar */}
        <div className="hint-bar px-9 py-2 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
          <span className="font-sans text-[11px] text-zinc-500 tracking-wide font-bold">
            {view === 'micro'
              ? '◀ ▶ navigate months · Esc back to year · click day for details & journal'
              : '◀ ▶ change year · click month to zoom in'}
          </span>
        </div>

        {/* Calendar */}
        <div className="main-content flex-1 overflow-y-auto px-9 py-8 bg-zinc-950">
          {view === 'macro' ? (
            <MacroView
              year={calY}
              state={viewState}
              onMonth={(m) => { setCalM(m); setView('micro') }}
              onHover={(date, pos) => { setHoverDate(date); setHoverPos(pos) }}
              onHoverEnd={() => setHoverDate(null)}
            />
          ) : (
            <MicroView year={calY} month={calM} state={viewState} onToggle={toggleHist} onJournal={openJournal} />
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
          semesters={semesters}
          currentSemesterId={state.currentSemesterId}
          onBack={() => { setEditCId(null); setModal('classes') }}
          onSave={saveClass}
        />
      )}
      {modal === 'semester' && (
        <SemesterModal state={viewState} onClose={close} onSave={saveSemester} onClear={clearSemester} />
      )}
      {(modal === 'insights' || modal === 'noinsights') && (
        <InsightsModal state={state} onClose={close} />
      )}
      {modal === 'name' && (
        <NameModal initial={state.userName} onClose={close} onSave={saveUserName} />
      )}
      {modal === 'roadmap' && <RoadmapModal state={state} onClose={close} onSaveGrade={saveGrade} onSaveReview={saveReview} />}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} actions={[
        { label: 'New task', shortcut: 'Ctrl+T', run: () => openTask() },
        { label: 'New goal', shortcut: 'Ctrl+N', run: () => openHabit() },
        { label: 'New journal entry', shortcut: 'Ctrl+J', run: () => openJournal(todayKey()) },
        { label: 'Manage classes', run: () => setModal('classes') },
        { label: 'Weekly review and analytics', run: () => setModal('roadmap') },
      ]} />}
    </div>
  )
}

const ICON_BTN = 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 cursor-pointer rounded-lg px-3.5 py-2.5 text-base transition-all duration-150'
