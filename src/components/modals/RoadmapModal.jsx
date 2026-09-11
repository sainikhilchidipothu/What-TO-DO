import { useMemo, useState } from 'react'
import { ModalShell } from '../common/ModalShell.jsx'
import { Btn, MLabel, MRow, MTitle } from '../common/Primitives.jsx'
import { calculateGpa, reviewSummary, weekStart, weeklyClassMinutes } from '../../utils/roadmap.js'
import { uid } from '../../utils/date.js'
import { getStreaks } from '../../utils/helpers.js'

const INPUT = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-accent'

export function RoadmapModal({ state, onClose, onSaveGrade, onSaveReview }) {
  const [tab, setTab] = useState('review')
  const [wins, setWins] = useState((state.weeklyReviews?.[weekStart()]?.wins || []).join('\n'))
  const [nextWeek, setNextWeek] = useState(state.weeklyReviews?.[weekStart()]?.nextWeek || '')
  const [classId, setClassId] = useState(state.classes[0]?.id || '')
  const [assessment, setAssessment] = useState('')
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState('100')
  const summary = useMemo(() => reviewSummary(state), [state])
  const gpa = useMemo(() => calculateGpa(state.grades, state.classes), [state.grades, state.classes])
  const minutes = useMemo(() => weeklyClassMinutes(state.pomodoroSessions, state.classes), [state.pomodoroSessions, state.classes])
  const streaks = useMemo(() => state.habits.map((habit) => ({ ...habit, ...getStreaks(habit.id, state.history, habit.startDate) })).filter((habit) => habit.best > 0), [state.habits, state.history])
  const saveReview = () => { onSaveReview({ wins: wins.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3), nextWeek }); onClose() }
  const saveGrade = () => {
    if (!classId || !assessment || !score) return
    onSaveGrade({ id: uid(), classId, assessment, score: Number(score), maxScore: Number(maxScore) || 100, weight: 1 })
    setAssessment(''); setScore('')
  }
  return (
    <ModalShell onClose={onClose} width={620}>
      <MTitle>PRODUCTIVITY REVIEW</MTitle>
      <div className="flex gap-2 mb-5" role="tablist">
        {['review', 'grades', 'study'].map((key) => <button key={key} onClick={() => setTab(key)} role="tab" aria-selected={tab === key} className={`px-3 py-2 rounded-lg text-[11px] font-bold ${tab === key ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`}>{key.toUpperCase()}</button>)}
      </div>
      {tab === 'review' && <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div className="bg-zinc-900 rounded-lg p-3"><p className="text-zinc-400 text-[10px]">COMPLETED TASKS</p><b className="text-2xl">{summary.completedTasks}</b></div><div className="bg-zinc-900 rounded-lg p-3"><p className="text-zinc-400 text-[10px]">GOAL CHECK-INS</p><b className="text-2xl">{summary.completedGoals}</b></div></div>
        {streaks.length > 0 && <div className="bg-zinc-900 rounded-lg p-3"><p className="text-zinc-400 text-[10px] mb-2">STREAK HEALTH</p>{streaks.slice(0, 5).map((habit) => <p key={habit.id} className="text-xs mb-1"><span className={habit.current ? 'text-emerald-300' : 'text-red-300'}>{habit.current ? '●' : '○'} {habit.name}</span><span className="float-right text-zinc-400">{habit.current ? `${habit.current} day streak` : 'broken'} · best {habit.best}</span></p>)}</div>}
        <MLabel htmlFor="wins">TOP THREE WINS (ONE PER LINE)</MLabel><textarea id="wins" value={wins} onChange={(e) => setWins(e.target.value)} className={`${INPUT} min-h-20`} />
        <MLabel htmlFor="next-week">NEXT-WEEK PLAN</MLabel><textarea id="next-week" value={nextWeek} onChange={(e) => setNextWeek(e.target.value)} className={`${INPUT} min-h-20`} />
        <MRow><Btn onClick={saveReview}>SAVE REVIEW</Btn></MRow>
      </div>}
      {tab === 'grades' && <div className="space-y-3">
        <p className="text-zinc-300">Current GPA: <strong className="text-accent">{gpa.value.toFixed(2)}</strong></p>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className={INPUT}><option value="">Choose class</option>{state.classes.map((c) => <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.name}</option>)}</select>
        <input value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="Assessment name" className={INPUT} /><div className="flex gap-2"><input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" className={INPUT} /><input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="Out of" className={INPUT} /></div>
        <MRow><Btn onClick={saveGrade} disabled={!classId || !assessment || !score}>ADD GRADE</Btn></MRow>
        {gpa.byClass.filter((x) => x.percent > 0).map((x) => <p key={x.classId} className="text-xs text-zinc-300">{x.name}: {(x.percent * 100).toFixed(0)}% ({x.points.toFixed(1)})</p>)}
      </div>}
      {tab === 'study' && <div className="space-y-3"><p className="text-zinc-400 text-xs">Pomodoro focus time this week</p>{minutes.map((x) => <div key={x.classId} className="flex justify-between bg-zinc-900 rounded-lg px-3 py-2 text-xs"><span>{x.name}</span><strong>{(x.minutes / 60).toFixed(1)}h</strong></div>)}{!minutes.length && <p className="text-zinc-500 text-xs">Link focus sessions to a class to see analytics.</p>}</div>}
    </ModalShell>
  )
}
