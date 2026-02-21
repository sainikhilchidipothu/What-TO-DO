import { useState, useEffect, useRef, useCallback } from 'react'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'what-to-do-tracker'
const DAYS_SHORT  = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const DAYS_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CATEGORIES  = { health:'Health 🏃', study:'Study 📚', work:'Work 💼', social:'Social 👥', personal:'Personal 🎯', creative:'Creative 🎨', finance:'Finance 💰', home:'Home 🏠' }
const CAT_COLORS  = { health:'#e53e3e', study:'#805ad5', work:'#dd6b20', social:'#38a169', personal:'#d69e2e', creative:'#d53f8c', finance:'#3182ce', home:'#718096' }
const HOURS_12    = Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'))
const MINUTES     = ['00','05','10','15','20','25','30','35','40','45','50','55']

const DEFAULT_STATE = {
  habits:[], 
  tasks:[], // {id, name, due, tier, done, classId?, subtasks:[], recurring:null, dependsOn:[]}
  history:{}, 
  journal:{},
  targetDate:'2026-08-31',
  semesterStart:'2026-01-06', 
  semesterEnd:'2026-05-01',
  classes:[], // {id, code, name, days, time, location, color}
  timerPresets:{ focus:25, shortBreak:5 },
  vacationMode:{ active:false, startDate:null, endDate:null },
  vacationHistory:[], 
  assignments:[], // {id, classId, name, dueDate, grade, completed, taskId?}
  deletedItems:[], // Undo queue: {type, item, timestamp}
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const dk       = d => { const dt = d instanceof Date ? d : new Date(d+'T00:00:00'); return dt.toLocaleDateString('en-CA') }
const todayKey = () => dk(new Date())
const uid      = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7)
const daysLeft = t => { const [y,m,d]=t.split('-').map(Number); const dt=new Date(y,m-1,d); const n=new Date(); n.setHours(0,0,0,0); return Math.ceil((dt-n)/864e5) }
const fmtDate  = d => new Date(d+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})
const isVacDay = (k, vm) => { if(!vm?.active||!vm.startDate||!vm.endDate) return false; return k>=vm.startDate && k<=vm.endDate }
const vacationDays = (vm) => { 
  if(!vm?.active || !vm.startDate || !vm.endDate) return 0
  const start = new Date(vm.startDate + 'T00:00:00')
  const end = new Date(vm.endDate + 'T00:00:00')
  return Math.ceil((end - start) / 864e5) + 1
}

// Get vacation status (taking/took/scheduled)
const getVacationStatus = (vm) => {
  if (!vm?.active || !vm.startDate || !vm.endDate) return null
  const today = todayKey()
  const isOngoing = today >= vm.startDate && today <= vm.endDate
  const isPast = today > vm.endDate
  const days = vacationDays(vm)
  const durationText = days === 1 ? '1 day' : days === 7 ? 'a week' : days === 14 ? '2 weeks' : `${days} days`
  
  if (isOngoing) return { verb: 'Taking', duration: durationText, isPast: false }
  if (isPast) return { verb: 'Took', duration: durationText, isPast: true }
  return { verb: 'Scheduled', duration: durationText, isPast: false }
}

// Check if date has a class
const hasClassOnDay = (dateKey, classes) => {
  const dayOfWeek = new Date(dateKey + 'T00:00:00').getDay()
  return classes.some(c => c.days?.includes(dayOfWeek))
}

// Get task priority color  
const getTaskPriorityColor = (tier) => {
  return tier === 3 ? '#ef4444' : tier === 2 ? '#eab308' : '#22c55e'
}

// Get day preview data for tooltip
const getDayPreview = (dateKey, state) => {
  const goals = state.habits.filter(h => 
    !h.specificDays?.length || h.specificDays.includes(new Date(dateKey + 'T00:00:00').getDay())
  )
  const tasks = state.tasks.filter(t => t.due?.startsWith(dateKey))
  const hasJournal = !!state.journal[dateKey]
  const hasClass = hasClassOnDay(dateKey, state.classes)
  const isVacation = isVacDay(dateKey, state.vacationMode)
  
  return { goals, tasks, hasJournal, hasClass, isVacation }
}

// ─── COMPLETION COLOR (always red/yellow/green, never purples) ────────────────
const compColor = pct => pct >= 1 ? '#22c55e' : pct >= 0.5 ? '#eab308' : '#ef4444'
const compBg    = pct => pct >= 1 ? '#052e16' : pct >= 0.5 ? '#1c1500' : '#1c0505'

// ═══════════════════════════════════════════════════════════════════════════
// HOVER PREVIEW CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function DayPreviewCard({ dateKey, state, position }) {
  const preview = getDayPreview(dateKey, state)
  const date = new Date(dateKey + 'T00:00:00')
  const dateStr = date.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})
  
  const pendingTasks = preview.tasks.filter(t => !t.done)
  const completedGoals = state.history[dateKey]?.length || 0
  
  // ALWAYS show the card for every date
  const isEmpty = !preview.isVacation && !preview.hasClass && preview.goals.length === 0 && pendingTasks.length === 0 && !preview.hasJournal
  
  return (
    <div style={{
      position:'absolute',
      zIndex:1000,
      left:position.x,
      top:position.y,
      background:'#222',
      border:'4px solid #666',
      borderRadius:12,
      padding:16,
      minWidth:240,
      maxWidth:340,
      boxShadow:'0 12px 32px rgba(0,0,0,0.95)',
      pointerEvents:'none'
    }}>
      <p style={{...mono,fontSize:14,color:'#fff',marginBottom:12,fontWeight:'bold',letterSpacing:1}}>{dateStr}</p>
      
      {isEmpty ? (
        <div style={{padding:'12px 10px',background:'#2a2a2a',borderRadius:8,border:'2px solid #444',textAlign:'center'}}>
          <p style={{...mono,fontSize:12,color:'#888',fontWeight:'500'}}>Nothing scheduled</p>
        </div>
      ) : (
        <>
          {preview.isVacation && (
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,padding:'8px 10px',background:'#2a2a2a',borderRadius:8,border:'2px solid #555'}}>
              <span style={{fontSize:16}}>🏖</span>
              <span style={{...mono,fontSize:12,color:'#ddd',fontWeight:'600'}}>Vacation day</span>
            </div>
          )}
          
          {preview.hasClass && (
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,padding:'8px 10px',background:'#1a2a1a',borderRadius:8,border:'2px solid #2a4a2a'}}>
              <span style={{fontSize:16}}>📚</span>
              <span style={{...mono,fontSize:12,color:'#4ade80',fontWeight:'600'}}>Class scheduled</span>
            </div>
          )}
          
          {preview.goals.length > 0 && (
            <div style={{marginBottom:10}}>
              <p style={{...mono,fontSize:11,color:'#aaa',marginBottom:6,letterSpacing:1,fontWeight:'bold'}}>GOALS ({completedGoals}/{preview.goals.length})</p>
              {preview.goals.slice(0,3).map(g => (
                <div key={g.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,padding:'4px 6px',background:'#2a2a2a',borderRadius:6}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:CAT_COLORS[g.category]||'#888',flexShrink:0}}/>
                  <span style={{...mono,fontSize:11,color:'#eee'}}>{g.name}</span>
                </div>
              ))}
              {preview.goals.length > 3 && <p style={{...mono,fontSize:10,color:'#888',marginTop:4,marginLeft:6}}>+{preview.goals.length - 3} more</p>}
            </div>
          )}
          
          {pendingTasks.length > 0 && (
            <div style={{marginBottom:10}}>
              <p style={{...mono,fontSize:11,color:'#aaa',marginBottom:6,letterSpacing:1,fontWeight:'bold'}}>TASKS ({pendingTasks.length})</p>
              {pendingTasks.slice(0,3).map(t => (
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,padding:'4px 6px',background:'#2a2a2a',borderRadius:6}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:getTaskPriorityColor(t.tier),flexShrink:0}}/>
                  <span style={{...mono,fontSize:11,color:'#eee'}}>{t.name}</span>
                </div>
              ))}
              {pendingTasks.length > 3 && <p style={{...mono,fontSize:10,color:'#888',marginTop:4,marginLeft:6}}>+{pendingTasks.length - 3} more</p>}
            </div>
          )}
          
          {preview.hasJournal && (
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'#2a2a2a',borderRadius:8,border:'2px solid #444'}}>
              <span style={{fontSize:16}}>📝</span>
              <span style={{...mono,fontSize:12,color:'#ddd',fontWeight:'600'}}>Journal entry</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// UNDO TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function UndoToast({ item, onUndo, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState(5)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          onDismiss()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onDismiss])
  
  const itemName = item.type === 'habit' ? 'Goal' : 'Task'
  
  return (
    <div style={{
      position:'fixed',
      bottom:24,
      right:24,
      background:'#1a1a1a',
      border:'4px solid #ef4444',
      borderRadius:12,
      padding:'18px 22px',
      zIndex:300,
      display:'flex',
      alignItems:'center',
      gap:24,
      minWidth:380,
      boxShadow:'0 12px 32px rgba(0,0,0,0.9)'
    }}>
      <div style={{flex:1}}>
        <p style={{...mono,fontSize:15,color:'#fff',fontWeight:'bold',marginBottom:6}}>
          {itemName} deleted
        </p>
        <p style={{...mono,fontSize:12,color:'#aaa'}}>
          "{item.item.name}"
        </p>
      </div>
      <button onClick={onUndo} style={{
        padding:'12px 24px',
        background:'#ef4444',
        color:'#fff',
        border:'none',
        borderRadius:8,
        cursor:'pointer',
        ...mono,
        fontSize:13,
        fontWeight:'bold',
        letterSpacing:1,
        transition:'all 0.15s'
      }}>
        UNDO ({timeLeft}s)
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE ALL DATA WARNING MODAL
// ═══════════════════════════════════════════════════════════════════════════

function DeleteWarningModal({ onClose, onConfirm }) {
  useEffect(() => {
    // Play warning sound - more intense for deletion
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Three descending warning tones
      [900, 700, 500].forEach((freq, i) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = freq
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        }, i * 200)
      })
    } catch (e) {
      console.log('Audio not supported')
    }
  }, [])
  
  return (
    <div onClick={onClose} style={{
      position:'fixed',
      inset:0,
      background:'rgba(0,0,0,0.95)',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      zIndex:999,
      backdropFilter:'blur(6px)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#1a1a1a',
        border:'5px solid #ef4444',
        borderRadius:16,
        padding:40,
        maxWidth:520
      }}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:72,marginBottom:20}}>⚠️</div>
          <h2 style={{...mono,fontSize:26,color:'#ef4444',marginBottom:16,fontWeight:'bold',letterSpacing:3}}>
            DELETE ALL DATA?
          </h2>
          <p style={{...mono,fontSize:16,color:'#fff',lineHeight:1.8,marginBottom:12}}>
            This will <strong style={{color:'#ef4444'}}>permanently delete</strong> all your:
          </p>
          <div style={{textAlign:'left',margin:'20px auto',maxWidth:300}}>
            {['Goals & Habits','Tasks','Journal Entries','Class Schedule','Vacation History','All Progress'].map(item => (
              <div key={item} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <div style={{width:6,height:6,background:'#ef4444',borderRadius:'50%'}}/>
                <span style={{...mono,fontSize:14,color:'#ddd'}}>{item}</span>
              </div>
            ))}
          </div>
          <p style={{...mono,fontSize:14,color:'#ef4444',marginTop:20,fontWeight:'bold'}}>
            This action CANNOT be undone!
          </p>
        </div>
        
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={onClose} style={{
            padding:'16px 32px',
            background:'#fff',
            color:'#000',
            border:'none',
            borderRadius:8,
            cursor:'pointer',
            ...mono,
            fontSize:14,
            fontWeight:'bold',
            letterSpacing:2
          }}>
            CANCEL
          </button>
          <button onClick={onConfirm} style={{
            padding:'16px 32px',
            background:'#ef4444',
            color:'#fff',
            border:'none',
            borderRadius:8,
            cursor:'pointer',
            ...mono,
            fontSize:14,
            fontWeight:'bold',
            letterSpacing:2
          }}>
            DELETE EVERYTHING
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK VACATION WARNING MODAL
// ═══════════════════════════════════════════════════════════════════════════

function TaskVacationWarning({ onClose, onConfirm, taskDate }) {
  useEffect(() => {
    // Play warning sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.value = 600
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + 0.3)
      }, 200)
    } catch (e) {
      console.log('Audio not supported')
    }
  }, [])
  
  return (
    <div onClick={onClose} style={{
      position:'fixed',
      inset:0,
      background:'rgba(0,0,0,0.92)',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      zIndex:999,
      backdropFilter:'blur(4px)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#1a1a1a',
        border:'4px solid #eab308',
        borderRadius:16,
        padding:32,
        maxWidth:480
      }}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:56,marginBottom:16}}>🏖</div>
          <h2 style={{...mono,fontSize:22,color:'#eab308',marginBottom:12,fontWeight:'bold',letterSpacing:2}}>
            VACATION PERIOD
          </h2>
          <p style={{...mono,fontSize:15,color:'#fff',lineHeight:1.6,marginBottom:8}}>
            This task is scheduled for <strong style={{color:'#eab308'}}>{taskDate}</strong>
          </p>
          <p style={{...mono,fontSize:13,color:'#aaa',lineHeight:1.6}}>
            You're on vacation during this time. Are you sure you want to add work?
          </p>
        </div>
        
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={onClose} style={{
            padding:'14px 28px',
            background:'#fff',
            color:'#000',
            border:'none',
            borderRadius:8,
            cursor:'pointer',
            ...mono,
            fontSize:13,
            fontWeight:'bold',
            letterSpacing:2
          }}>
            CANCEL
          </button>
          <button onClick={onConfirm} style={{
            padding:'14px 28px',
            background:'#2a2a2a',
            color:'#eab308',
            border:'2px solid #eab308',
            borderRadius:8,
            cursor:'pointer',
            ...mono,
            fontSize:13,
            fontWeight:'bold',
            letterSpacing:2
          }}>
            ADD ANYWAY
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// WARNING MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function WarningModal({ onClose, onConfirm, taskCount }) {
  useEffect(() => {
    // Play warning sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Create a pleasant warning chime (two notes)
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      // Second note
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        osc2.connect(gain2)
        gain2.connect(audioContext.destination)
        osc2.frequency.value = 600
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + 0.3)
      }, 200)
    } catch (e) {
      console.log('Audio not supported')
    }
  }, [])
  
  return (
    <div onClick={onClose} style={{
      position:'fixed',
      inset:0,
      background:'rgba(0,0,0,0.92)',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      zIndex:999,
      backdropFilter:'blur(4px)'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'#1a1a1a',
        border:'4px solid #ef4444',
        borderRadius:16,
        padding:32,
        maxWidth:480
      }}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:56,marginBottom:16}}>⚠️</div>
          <h2 style={{...mono,fontSize:22,color:'#ef4444',marginBottom:12,fontWeight:'bold',letterSpacing:2}}>
            PENDING WORK DETECTED
          </h2>
          <p style={{...mono,fontSize:15,color:'#fff',lineHeight:1.6,marginBottom:8}}>
            You have <strong style={{color:'#ef4444'}}>{taskCount} pending task{taskCount !== 1 ? 's' : ''}</strong> during this vacation period.
          </p>
          <p style={{...mono,fontSize:13,color:'#aaa',lineHeight:1.6}}>
            Are you sure you want to take a break with work piled up?
          </p>
        </div>
        
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button onClick={onClose} style={{
            padding:'14px 28px',
            background:'#fff',
            color:'#000',
            border:'none',
            borderRadius:8,
            cursor:'pointer',
            ...mono,
            fontSize:13,
            fontWeight:'bold',
            letterSpacing:2
          }}>
            GO BACK
          </button>
          <button onClick={onConfirm} style={{
            padding:'14px 28px',
            background:'#2a2a2a',
            color:'#ef4444',
            border:'2px solid #ef4444',
            borderRadius:8,
            cursor:'pointer',
            ...mono,
            fontSize:13,
            fontWeight:'bold',
            letterSpacing:2
          }}>
            PROCEED ANYWAY
          </button>
        </div>
      </div>
    </div>
  )
}

function CalPicker({ value, onChange, label, minDate }) {
  const init = value ? new Date(value+'T00:00:00') : new Date()
  const [cm, setCm] = useState(init.getMonth())
  const [cy, setCy] = useState(init.getFullYear())

  const nav = delta => {
    let m = cm + delta, y = cy
    if (m > 11) { m = 0; y++ } else if (m < 0) { m = 11; y-- }
    setCm(m); setCy(y)
  }
  const dim = new Date(cy, cm+1, 0).getDate()
  const off = new Date(cy, cm, 1).getDay()
  const todStr = todayKey()

  return (
    <div>
      {label && <p style={mLabel}>{label}</p>}
      <div style={{background:'#111',border:'1px solid #333',borderRadius:8,padding:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <button onClick={()=>nav(-1)} style={navBtn}>◀</button>
          <span style={{...mono,fontSize:11,color:'#ccc',letterSpacing:2}}>{MONTHS[cm].slice(0,3).toUpperCase()} {cy}</span>
          <button onClick={()=>nav(1)} style={navBtn}>▶</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
          {DAYS_SHORT.map(d=><div key={d} style={{textAlign:'center',fontSize:9,color:'#444',...mono}}>{d[0]}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {Array.from({length:off},(_,i)=><div key={'e'+i}/>)}
          {Array.from({length:dim},(_,i)=>{
            const d = i+1
            const k = `${cy}-${String(cm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const isSel = k === value
            const isTod = k === todStr
            const disabled = minDate && k < minDate
            return (
              <button key={d} disabled={disabled} onClick={()=>onChange(k)} style={{
                aspectRatio:'1', border:'none', cursor:disabled?'not-allowed':'pointer', borderRadius:4,
                ...mono, fontSize:11,
                background: isSel ? '#fff' : isTod ? '#222' : 'transparent',
                color: isSel ? '#000' : isTod ? '#fff' : disabled ? '#333' : '#aaa',
                fontWeight: isSel || isTod ? 'bold' : 'normal',
                outline: isSel ? '2px solid #fff' : 'none',
              }}>{d}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const mono    = { fontFamily:'JetBrains Mono,monospace' }
const inputSt = { width:'100%', background:'#111', border:'1px solid #333', color:'#e5e5e5', borderRadius:6, padding:'10px 12px', fontSize:12, outline:'none', ...mono, boxSizing:'border-box' }
const selectSt= { background:'#111', border:'1px solid #333', color:'#999', borderRadius:4, padding:'4px 6px', fontSize:10, outline:'none', ...mono, cursor:'pointer' }
const emptyTxt= { ...mono, fontSize:10, color:'#2a2a2a', padding:'14px 16px', textAlign:'center', letterSpacing:2 }
const mLabel  = { ...mono, fontSize:9, letterSpacing:4, color:'#555', marginBottom:8 }
const navBtn  = { background:'none', border:'1px solid #333', color:'#777', cursor:'pointer', borderRadius:4, padding:'2px 8px', fontSize:11, ...mono }
const iconBtn = (color) => ({ background:'none', border:'none', cursor:'pointer', color, fontSize:11, padding:'2px 4px', borderRadius:3, transition:'color 0.15s', ...mono })

function Btn({ children, onClick, disabled, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'10px 20px', border:'none', borderRadius:6, cursor:disabled?'not-allowed':'pointer',
      ...mono, fontSize:11, letterSpacing:3, fontWeight:'bold', color:'#000',
      background:'#e5e5e5', opacity:disabled?0.25:1, transition:'all 0.15s', ...style
    }}>{children}</button>
  )
}
function MTitle({ children }) { return <h2 style={{...mono,fontWeight:900,fontSize:15,letterSpacing:4,color:'#e5e5e5',marginBottom:20}}>{children}</h2> }
function MLabel({ children, style={} }) { return <p style={{...mLabel,...style}}>{children}</p> }
function MRow({ children, style={} }) { return <div style={{display:'flex',gap:10,justifyContent:'flex-end',...style}}>{children}</div> }

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setStateRaw] = useState(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? {...DEFAULT_STATE,...JSON.parse(s)} : DEFAULT_STATE }
    catch { return DEFAULT_STATE }
  })

  const [intro, setIntro]   = useState(true)
  const [introOut, setOut]  = useState(false)
  const [view, setView]     = useState('macro')   // 'macro' | 'micro'
  const [calM, setCalM]     = useState(new Date().getMonth())
  const [calY, setCalY]     = useState(new Date().getFullYear())
  const [sideTab, setSideTab] = useState('today')
  const [modal, setModal]   = useState(null)
  const [editId, setEditId] = useState(null)
  const [toast, setToast]   = useState(null)
  
  // Hover preview state
  const [hoverDate, setHoverDate] = useState(null)
  const [hoverPos, setHoverPos] = useState({x:0, y:0})
  
  // Warning modal state
  const [showWarning, setShowWarning] = useState(false)
  const [warningTaskCount, setWarningTaskCount] = useState(0)
  
  // Delete all data warning state
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)
  
  // Undo system
  const [undoItem, setUndoItem] = useState(null) // {type, item, timer}
  const undoTimerRef = useRef(null)
  
  // First-time setup state
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(() => {
    const hasData = localStorage.getItem(STORAGE_KEY)
    return !hasData
  })
  const [firstTimeGoalDate, setFirstTimeGoalDate] = useState('')

  // Habit form
  const [hName, setHName] = useState('')
  const [hCat, setHCat]   = useState('')
  const [hDays, setHDays] = useState([])

  // Task form
  const [tName, setTName] = useState('')
  const [tDate, setTDate] = useState('')
  const [tHour, setTHour] = useState('09')
  const [tMin,  setTMin]  = useState('00')
  const [tAmpm, setTAmpm] = useState('AM')
  const [tTier, setTTier] = useState(2)
  const [tSubtasks, setTSubtasks] = useState([]) // {id, text, done}
  const [tSubtaskInput, setTSubtaskInput] = useState('')

  // Target
  const [targetPick, setTargetPick] = useState(state.targetDate)

  // Filters
  const [tSearch, setTSearch] = useState('')
  const [tTierF,  setTTierF]  = useState('all')
  const [tStatF,  setTStatF]  = useState('all')
  const [catF,    setCatF]    = useState('all')

  // Journal
  const [jDate, setJDate] = useState(todayKey())
  const [jText, setJText] = useState('')

  // Class form
  const [cCode, setCCode] = useState('')
  const [cName, setCName] = useState('')
  const [cTime, setCTime] = useState('')
  const [cLoc,  setCLoc]  = useState('')
  const [cDays, setCDays] = useState([])
  const [editCId, setEditCId] = useState(null)

  // Vacation
  const [vacStart, setVacStart] = useState('')
  const [vacEnd,   setVacEnd]   = useState('')

  // ── Persist ────────────────────────────────────────────────────────────────
  const setState = useCallback(upd => {
    setStateRaw(prev => {
      const next = typeof upd === 'function' ? upd(prev) : {...prev,...upd}
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const toast$ = (msg, type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null), 2800) }
  const close  = () => setModal(null)

  // ── Month navigation (stable callbacks) ────────────────────────────────────
  const navM = useCallback(delta => {
    setCalM(prev => {
      let m = prev + delta, y = calY
      if (m > 11) { m = 0; setCalY(cy => cy+1); return 0 }
      if (m < 0)  { m = 11; setCalY(cy => cy-1); return 11 }
      return m
    })
  }, [calY])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => {
      if (e.key === 'Escape') { if (modal) close(); else if (view === 'micro') setView('macro'); return }
      if (modal) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'n') { e.preventDefault(); openHabit() }
      if (mod && e.key === 't') { e.preventDefault(); openTask() }
      if (mod && e.key === 'j') { e.preventDefault(); openJournal(todayKey()) }
      if (view === 'micro') {
        if (e.key === 'ArrowLeft')  navM(-1)
        if (e.key === 'ArrowRight') navM(1)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [modal, view, navM])

  // ── Auto-archive past vacations ────────────────────────────────────────────
  useEffect(() => {
    const status = getVacationStatus(state.vacationMode)
    if (status?.isPast && state.vacationMode.active) {
      // Auto-archive completed vacation
      archiveVacation()
    }
  }, [state.vacationMode])

  // ── Goals ──────────────────────────────────────────────────────────────────
  const openHabit = (id=null) => {
    setEditId(id)
    if (id) { const h = state.habits.find(x=>x.id===id); setHName(h.name); setHCat(h.category||''); setHDays(h.specificDays||[]) }
    else { setHName(''); setHCat(''); setHDays([]) }
    setModal('habit')
  }
  const saveHabit = () => {
    if (!hName.trim() || !hCat) return
    const dup = state.habits.some(h => h.name.toLowerCase()===hName.trim().toLowerCase() && h.id!==editId)
    if (dup) { toast$('Goal already exists!','err'); return }
    setState(prev => editId
      ? {...prev, habits:prev.habits.map(h => h.id===editId ? {...h,name:hName.trim(),category:hCat,specificDays:hDays.length?hDays:null} : h)}
      : {...prev, habits:[...prev.habits, {id:uid(),name:hName.trim(),category:hCat,specificDays:hDays.length?hDays:null,pinned:false}]}
    )
    close(); toast$(editId ? 'Goal updated ✓' : 'Goal added ✓')
  }
  const delHabit = id => {
    const habit = state.habits.find(h => h.id === id)
    if (!habit) return
    
    setState(prev => {
      const h = {...prev.history}
      Object.keys(h).forEach(k => { h[k]=h[k].filter(x=>x!==id); if(!h[k].length) delete h[k] })
      return {...prev, habits:prev.habits.filter(x=>x.id!==id), history:h}
    })
    
    // Show undo toast
    setUndoItem({type: 'habit', item: habit})
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000)
  }
  
  const delTask = id => {
    const task = state.tasks.find(t => t.id === id)
    if (!task) return
    
    setState(prev => ({...prev, tasks:prev.tasks.filter(t=>t.id!==id)}))
    
    // Show undo toast
    setUndoItem({type: 'task', item: task})
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoItem(null), 5000)
  }
  
  const undoDelete = () => {
    if (!undoItem) return
    
    if (undoItem.type === 'habit') {
      setState(prev => ({...prev, habits: [...prev.habits, undoItem.item]}))
    } else if (undoItem.type === 'task') {
      setState(prev => ({...prev, tasks: [...prev.tasks, undoItem.item]}))
    }
    
    clearTimeout(undoTimerRef.current)
    setUndoItem(null)
  }

  const togglePin  = id => setState(prev => ({...prev, habits:prev.habits.map(h => h.id===id ? {...h,pinned:!h.pinned} : h)}))
  const toggleHist = (hid, ds) => setState(prev => {
    const h = {...prev.history}, arr = [...(h[ds]||[])], i = arr.indexOf(hid)
    i>=0 ? arr.splice(i,1) : arr.push(hid)
    if (!arr.length) delete h[ds]; else h[ds]=arr
    return {...prev, history:h}
  })
  const getStreaks = id => {
    let cur=0, best=0, str=0
    const n = new Date(); n.setHours(0,0,0,0)
    for (let i=0; i<365; i++) {
      const d=new Date(n); d.setDate(n.getDate()-i)
      const done = (state.history[dk(d)]||[]).includes(id)
      if (done) { str++; if (i===0||cur>0) cur=str } else { if(i===0) cur=0; best=Math.max(best,str); str=0 }
    }
    return { current:cur, best:Math.max(best,str) }
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const openTask = (id=null) => {
    setEditId(id)
    if (id) {
      const t = state.tasks.find(x=>x.id===id)
      setTName(t.name); setTTier(t.tier)
      setTSubtasks(t.subtasks || [])
      const dt = new Date(t.due)
      setTDate(dk(dt))
      let h = dt.getHours(), ap = h>=12?'PM':'AM'; h = h%12||12
      setTHour(String(h).padStart(2,'0')); setTMin(String(dt.getMinutes()).padStart(2,'0')); setTAmpm(ap)
    } else { 
      setTName(''); setTDate(''); setTHour('09'); setTMin('00'); setTAmpm('AM'); setTTier(2); setTSubtasks([])
    }
    setTSubtaskInput('')
    setModal('task')
  }
  // Task warning modal state
  const [showTaskVacationWarning, setShowTaskVacationWarning] = useState(false)
  const [pendingTaskData, setPendingTaskData] = useState(null)
  
  const saveTask = () => {
    if (!tName.trim() || !tDate) return
    let h = parseInt(tHour); if (tAmpm==='PM'&&h!==12) h+=12; if (tAmpm==='AM'&&h===12) h=0
    const due = `${tDate}T${String(h).padStart(2,'0')}:${tMin}:00`
    
    // Check if task date falls during vacation
    if (isVacDay(tDate, state.vacationMode)) {
      setPendingTaskData({ name: tName.trim(), due, tier: tTier, subtasks: tSubtasks, editId })
      setShowTaskVacationWarning(true)
      return
    }
    
    confirmSaveTask({ name: tName.trim(), due, tier: tTier, subtasks: tSubtasks, editId })
  }
  
  const confirmSaveTask = (taskData) => {
    setState(prev => taskData.editId
      ? {...prev, tasks:prev.tasks.map(t => t.id===taskData.editId ? {...t,name:taskData.name,due:taskData.due,tier:taskData.tier,subtasks:taskData.subtasks} : t)}
      : {...prev, tasks:[...prev.tasks, {id:uid(),name:taskData.name,due:taskData.due,tier:taskData.tier,done:false,subtasks:taskData.subtasks}]}
    )
    setShowTaskVacationWarning(false)
    close()
    toast$(taskData.editId ? 'Task updated ✓' : 'Task added ✓')
  }
  
  // Subtask management
  const addSubtask = () => {
    if (!tSubtaskInput.trim()) return
    setTSubtasks([...tSubtasks, {id:uid(), text:tSubtaskInput.trim(), done:false}])
    setTSubtaskInput('')
  }
  
  const toggleSubtask = id => {
    setTSubtasks(tSubtasks.map(s => s.id===id ? {...s,done:!s.done} : s))
  }
  
  const deleteSubtask = id => {
    setTSubtasks(tSubtasks.filter(s => s.id!==id))
  }
  const togTask = id => setState(prev => ({...prev, tasks:prev.tasks.map(t => t.id===id ? {...t,done:!t.done} : t)}))

  // ── Journal ────────────────────────────────────────────────────────────────
  const openJournal = ds => { setJDate(ds); setJText(state.journal[ds]?.text||''); setModal('journal') }
  const saveJournal = () => {
    setState(prev => { const j={...prev.journal}; if (jText.trim()) j[jDate]={text:jText.trim()}; else delete j[jDate]; return {...prev,journal:j} })
    close(); toast$(jText.trim() ? 'Journal saved ✓' : 'Entry deleted')
  }

  // ── Classes ────────────────────────────────────────────────────────────────
  const openClass = (id=null) => {
    setEditCId(id)
    if (id) { const c=state.classes.find(x=>x.id===id); setCCode(c.code||''); setCName(c.name||''); setCTime(c.time||''); setCLoc(c.location||''); setCDays(c.days||[]) }
    else { setCCode(''); setCName(''); setCTime(''); setCLoc(''); setCDays([]) }
    setModal('class')
  }
  const saveClass = () => {
    if (!cName.trim() || !cDays.length) { toast$('Enter name & select days','err'); return }
    const cls = {id:editCId||uid(), code:cCode, name:cName, time:cTime, location:cLoc, days:[...cDays].sort()}
    setState(prev => editCId
      ? {...prev, classes:prev.classes.map(c => c.id===editCId ? cls : c)}
      : {...prev, classes:[...prev.classes, cls]}
    )
    close(); toast$(editCId ? 'Class updated ✓' : 'Class added ✓')
  }
  const delClass = id => { setState(prev => ({...prev, classes:prev.classes.filter(c=>c.id!==id)})); toast$('Class deleted') }

  // ── Vacation ───────────────────────────────────────────────────────────────
  const saveVacation = () => {
    if (!vacStart||!vacEnd||vacStart>vacEnd) { toast$('Check dates','err'); return }
    
    // Check for tasks during vacation period
    const tasksInPeriod = state.tasks.filter(t => {
      if (!t.due || t.done) return false
      const taskDate = t.due.split('T')[0]
      return taskDate >= vacStart && taskDate <= vacEnd
    })
    
    if (tasksInPeriod.length > 0) {
      setWarningTaskCount(tasksInPeriod.length)
      setShowWarning(true)
      return
    }
    
    confirmVacation()
  }
  
  const confirmVacation = () => {
    setState({vacationMode:{active:true,startDate:vacStart,endDate:vacEnd}})
    setShowWarning(false)
    close()
    toast$('Vacation scheduled 🏖')
  }
  
  // Archive completed vacation to history (called by auto-archive effect)
  const archiveVacation = () => {
    const days = vacationDays(state.vacationMode)
    setState(prev => ({
      vacationMode:{active:false,startDate:null,endDate:null},
      vacationHistory:[...(prev.vacationHistory || []), {
        startDate:prev.vacationMode.startDate,
        endDate:prev.vacationMode.endDate,
        days
      }]
    }))
    toast$('Vacation completed ✓')
  }

  // ── Target ─────────────────────────────────────────────────────────────────
  const saveTarget = () => { setState({targetDate:targetPick}); close(); toast$('Target updated ✓') }
  
  // ── First-time setup ───────────────────────────────────────────────────────
  const completeFirstTimeSetup = () => {
    if (!firstTimeGoalDate) {
      toast$('Please select a goal date', 'err')
      return
    }
    
    setState(prev => ({...prev, targetDate: firstTimeGoalDate}))
    setShowFirstTimeSetup(false)
    toast$('Welcome to What-TO-DO! 🎉')
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const now = new Date()
  const vm = state.vacationMode
  const remaining = daysLeft(state.targetDate)
  const uniqueCats = [...new Set(state.habits.map(h=>h.category).filter(Boolean))]

  const filteredHabits = [...state.habits]
    .sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0))
    .filter(h => catF==='all' || h.category===catF)

  const filteredTasks = [...state.tasks]
    .sort((a,b) => a.done===b.done ? new Date(a.due)-new Date(b.due) : a.done?1:-1)
    .filter(t => {
      const ov = new Date(t.due)<now && !t.done
      return t.name.toLowerCase().includes(tSearch.toLowerCase())
        && (tTierF==='all' || String(t.tier)===tTierF)
        && (tStatF==='all' || (tStatF==='done'&&t.done) || (tStatF==='open'&&!t.done&&!ov) || (tStatF==='overdue'&&ov))
    })

  // ── Export/Import ──────────────────────────────────────────────────────────
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state,null,2)],{type:'application/json'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='what-to-do-backup.json'; a.click()
    toast$('Exported ✓')
  }
  const importData = e => {
    const f = e.target.files[0]; if(!f) return
    const r = new FileReader(); r.onload=ev=>{try{setState({...DEFAULT_STATE,...JSON.parse(ev.target.result)});toast$('Imported ✓')}catch{toast$('Invalid file','err')}}
    r.readAsText(f)
  }
  
  const deleteAllData = () => {
    setState(DEFAULT_STATE)
    localStorage.removeItem(STORAGE_KEY)
    setShowDeleteWarning(false)
    toast$('All data deleted')
  }

  // ── Insights ───────────────────────────────────────────────────────────────
  const buildInsights = () => {
    const res = []
    const dayT=Array(7).fill(0), dayC=Array(7).fill(0)
    Object.keys(state.history).forEach(k => {
      const dw=new Date(k+'T00:00:00').getDay()
      const v=state.history[k].filter(id=>state.habits.some(h=>h.id===id)).length
      dayT[dw]+=v; dayC[dw]++
    })
    const avgs=dayT.map((t,i)=>dayC[i]>0?t/dayC[i]:0)
    const best=avgs.indexOf(Math.max(...avgs))
    if (avgs[best]>0) res.push({icon:'📅',title:'Best Day',text:`You perform best on ${DAYS_FULL[best]}s`})
    const top=state.habits.map(h=>({name:h.name,...getStreaks(h.id)})).filter(s=>s.best>3).sort((a,b)=>b.best-a.best)
    if (top[0]) res.push({icon:'⭐',title:'Top Goal',text:`"${top[0].name}" — ${top[0].best}-day best streak`})
    const perf=Object.keys(state.history).filter(k=>{
      const v=state.history[k].filter(id=>state.habits.some(h=>h.id===id))
      return v.length>0 && v.length===state.habits.length
    }).length
    if (perf>0) res.push({icon:'🔥',title:'Perfect Days',text:`${perf} days with 100% completion`})
    return res
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',height:'100vh',background:'#1a1a1a',color:'#ffffff',fontFamily:'Inter,sans-serif',overflow:'hidden'}}>

      {/* ── FIRST-TIME SETUP ── */}
      {showFirstTimeSetup && (
        <div style={{
          position:'fixed',inset:0,zIndex:200,background:'#1a1a1a',
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          padding:40
        }}>
          <div style={{maxWidth:600,width:'100%',textAlign:'center'}}>
            <div style={{fontSize:64,marginBottom:24}}>🎯</div>
            <h1 style={{...mono,fontSize:32,fontWeight:900,letterSpacing:4,color:'#fff',marginBottom:16}}>
              WELCOME TO WHAT-TO-DO
            </h1>
            <p style={{fontSize:16,color:'#aaa',lineHeight:1.6,marginBottom:40}}>
              Let's get started! First, set your target goal date.<br/>
              This will help you track your progress and stay motivated.
            </p>
            
            <div style={{marginBottom:40}}>
              <p style={{...mono,fontSize:11,letterSpacing:4,color:'#666',marginBottom:12,fontWeight:'bold',textAlign:'left'}}>
                SELECT YOUR GOAL DATE
              </p>
              <CalPicker value={firstTimeGoalDate} onChange={setFirstTimeGoalDate} />
              {firstTimeGoalDate && (
                <p style={{...mono,fontSize:14,color:'#22c55e',marginTop:16,fontWeight:'bold'}}>
                  {daysLeft(firstTimeGoalDate)} days from today
                </p>
              )}
            </div>
            
            <button 
              onClick={completeFirstTimeSetup}
              disabled={!firstTimeGoalDate}
              style={{
                padding:'18px 48px',
                background:firstTimeGoalDate?'#fff':'#333',
                color:firstTimeGoalDate?'#000':'#666',
                border:'none',
                borderRadius:10,
                cursor:firstTimeGoalDate?'pointer':'not-allowed',
                ...mono,
                fontSize:14,
                letterSpacing:4,
                fontWeight:900,
                transition:'all 0.15s'
              }}
            >
              GET STARTED
            </button>
          </div>
        </div>
      )}

      {/* ── INTRO ── */}
      {intro && !showFirstTimeSetup && (
        <div style={{
          position:'fixed',inset:0,zIndex:100,background:'#1a1a1a',
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          transform:introOut?'translateY(-100%)':'translateY(0)',
          transition:'transform 0.55s cubic-bezier(0.7,0,0.3,1)'
        }}>
          <p style={{...mono,fontSize:12,letterSpacing:6,color:'#999',marginBottom:12,fontWeight:'bold'}}>TARGET · {state.targetDate}</p>
          <div style={{...mono,fontWeight:900,fontSize:'clamp(5rem,18vw,12rem)',lineHeight:1,color:'#fff',marginBottom:8}}>
            {String(Math.max(0,remaining)).padStart(3,'0')}
          </div>
          <p style={{...mono,fontSize:12,letterSpacing:8,color:'#999',marginBottom:52,fontWeight:'bold'}}>DAYS REMAINING</p>
          <button onClick={()=>{setOut(true);setTimeout(()=>setIntro(false),560)}} style={{
            padding:'16px 64px',background:'#fff',color:'#000',border:'none',borderRadius:8,cursor:'pointer',
            ...mono,fontSize:14,letterSpacing:6,fontWeight:900,
          }}>START</button>
          <p style={{marginTop:22,...mono,fontSize:11,color:'#777',letterSpacing:3,fontWeight:'bold'}}>
            Ctrl+N Goal · Ctrl+T Task · Ctrl+J Journal · ← → Navigate
          </p>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{width:340,minWidth:340,display:'flex',flexDirection:'column',background:'#222',borderRight:'3px solid #444',overflow:'hidden'}}>

        {/* Days remaining */}
        <div onClick={()=>{setTargetPick(state.targetDate);setModal('target')}}
          style={{padding:'18px 22px',borderBottom:'3px solid #444',cursor:'pointer',background:'#222'}}
          onMouseEnter={e=>e.currentTarget.style.background='#2a2a2a'}
          onMouseLeave={e=>e.currentTarget.style.background='#222'}>
          <p style={{...mono,fontSize:11,letterSpacing:4,color:'#aaa',marginBottom:5,fontWeight:'bold'}}>TIME REMAINING</p>
          <p style={{...mono,fontWeight:900,fontSize:36,color:'#fff'}}>{remaining} DAYS</p>
          <p style={{...mono,fontSize:11,color:'#888',marginTop:3,letterSpacing:2,fontWeight:'500'}}>
            {vm.active ? `🏖 VACATION ACTIVE ${vm.startDate} → ${vm.endDate}` : 'click to change target'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'3px solid #444'}}>
          {['today','year'].map(t=>(
            <button key={t} onClick={()=>setSideTab(t)} style={{
              flex:1,padding:'14px 0',border:'none',cursor:'pointer',
              ...mono,fontSize:12,letterSpacing:4,fontWeight:'bold',
              background:'transparent',
              color:sideTab===t?'#fff':'#888',
              borderBottom:sideTab===t?'4px solid #fff':'4px solid transparent',
              transition:'all 0.15s'
            }}>{t.toUpperCase()}</button>
          ))}
        </div>

        {/* Tab body */}
        <div style={{flex:1,overflowY:'auto',background:'#222'}}>
          {sideTab==='today' ? (
            <div style={{padding:16,display:'flex',flexDirection:'column',gap:14}}>
              <Pomodoro presets={state.timerPresets} setPresets={p=>setState({timerPresets:p})} toast$={toast$}/>
              <ClassToday classes={state.classes} onManage={()=>setModal('classes')}/>
              <VacationWidget vm={vm} vacationHistory={state.vacationHistory} onManage={()=>{setVacStart(vm.startDate||'');setVacEnd(vm.endDate||'');setModal('vacation')}}/>
            </div>
          ) : (
            <div style={{padding:16}}>
              <Heatmap history={state.history} habits={state.habits} year={calY}/>
            </div>
          )}
        </div>

        {/* Goals */}
        <div style={{borderTop:'3px solid #444'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'3px solid #333',background:'#222'}}>
            <span style={{...mono,fontSize:11,letterSpacing:4,color:'#ccc',fontWeight:'bold'}}>GOALS</span>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={catF} onChange={e=>setCatF(e.target.value)} style={{...selectSt,fontSize:11}}>
                <option value="all">All</option>
                {uniqueCats.map(c=><option key={c} value={c}>{CATEGORIES[c]||c}</option>)}
              </select>
              <button onClick={()=>openHabit()} style={{
                width:30,height:30,borderRadius:6,border:'none',cursor:'pointer',
                background:'#fff',color:'#000',...mono,fontSize:18,fontWeight:'bold',lineHeight:'28px',padding:0
              }}>+</button>
            </div>
          </div>
          <div style={{maxHeight:240,overflowY:'auto',background:'#222'}}>
            {filteredHabits.length===0
              ? <p style={emptyTxt}>No goals · Ctrl+N to add</p>
              : filteredHabits.map(h => {
                  const {current,best} = getStreaks(h.id)
                  const isDone = (state.history[todayKey()]||[]).includes(h.id)
                  const col = CAT_COLORS[h.category]||'#888'
                  return (
                    <div key={h.id} style={{borderBottom:'3px solid #2a2a2a',padding:'11px 16px',background:'#222'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <button onClick={()=>toggleHist(h.id,todayKey())} style={{
                          width:18,height:18,borderRadius:4,border:`2px solid ${isDone?col:'#666'}`,
                          background:isDone?col:'transparent',cursor:'pointer',flexShrink:0,transition:'all 0.15s'
                        }}>{isDone&&<span style={{fontSize:11,color:'#000',display:'block',textAlign:'center',lineHeight:'18px',fontWeight:'bold'}}>✓</span>}</button>
                        <button onClick={()=>openHabit(h.id)} style={{
                          flex:1,background:'none',border:'none',cursor:'pointer',
                          color:isDone?'#bbb':'#fff',...mono,fontSize:13,textAlign:'left',transition:'color 0.15s',fontWeight:'600'
                        }}>
                          {h.pinned&&<span style={{color:'#fff',marginRight:5}}>★</span>}
                          {h.name}
                        </button>
                        <button onClick={()=>togglePin(h.id)} style={iconBtn(h.pinned?'#fff':'#888')}>★</button>
                        <button onClick={()=>delHabit(h.id)} style={iconBtn('#888')}>✕</button>
                      </div>
                      <div style={{display:'flex',gap:12,marginLeft:28,marginTop:5,alignItems:'center'}}>
                        <span style={{...mono,fontSize:11,color:'#aaa',fontWeight:'500'}}>🔥 {current} · best {best}</span>
                        {h.category&&<span style={{...mono,fontSize:11,color:col,background:col+'35',padding:'2px 7px',borderRadius:4,fontWeight:'bold'}}>{CATEGORIES[h.category]||h.category}</span>}
                        {h.specificDays?.length>0&&<span style={{...mono,fontSize:10,color:'#aaa',fontWeight:'500'}}>{h.specificDays.map(d=>DAYS_SHORT[d][0]).join('')}</span>}
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Tasks */}
        <div style={{borderTop:'3px solid #444'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'3px solid #333',background:'#222'}}>
            <span style={{...mono,fontSize:11,letterSpacing:4,color:'#ccc',fontWeight:'bold'}}>TASKS</span>
            <button onClick={()=>openTask()} style={{
              width:30,height:30,borderRadius:6,border:'none',cursor:'pointer',
              background:'#fff',color:'#000',...mono,fontSize:18,fontWeight:'bold',lineHeight:'28px',padding:0
            }}>+</button>
          </div>
          <div style={{padding:'10px 12px',display:'flex',gap:6,borderBottom:'3px solid #2a2a2a',background:'#222'}}>
            <input value={tSearch} onChange={e=>setTSearch(e.target.value)} placeholder="Search…"
              style={{...inputSt,flex:1,padding:'8px 12px',fontSize:12}}/>
            <select value={tTierF} onChange={e=>setTTierF(e.target.value)} style={{...selectSt,fontSize:11}}>
              <option value="all">All</option><option value="1">Low</option><option value="2">Med</option><option value="3">High</option>
            </select>
            <select value={tStatF} onChange={e=>setTStatF(e.target.value)} style={{...selectSt,fontSize:11}}>
              <option value="all">All</option><option value="open">Open</option><option value="done">Done</option><option value="overdue">Late</option>
            </select>
          </div>
          <div style={{maxHeight:220,overflowY:'auto',background:'#222'}}>
            {filteredTasks.length===0
              ? <p style={emptyTxt}>No tasks · Ctrl+T to add</p>
              : filteredTasks.map(t => {
                  const due = new Date(t.due), ov = due<now && !t.done
                  const tierCol = [null,'#22c55e','#eab308','#ef4444'][t.tier]
                  const subtasksDone = (t.subtasks||[]).filter(s=>s.done).length
                  const subtasksTotal = (t.subtasks||[]).length
                  return (
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:'3px solid #2a2a2a',opacity:t.done?0.45:1}}>
                      <button onClick={()=>togTask(t.id)} style={{
                        width:18,height:18,borderRadius:4,border:`2px solid ${t.done?'#aaa':'#666'}`,
                        background:t.done?'#fff':'transparent',cursor:'pointer',flexShrink:0,transition:'all 0.15s'
                      }}>{t.done&&<span style={{fontSize:11,color:'#000',display:'block',textAlign:'center',lineHeight:'18px',fontWeight:'bold'}}>✓</span>}</button>
                      <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>openTask(t.id)}>
                        <p style={{...mono,fontSize:13,color:t.done?'#888':'#fff',textDecoration:t.done?'line-through':'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontWeight:'600'}}>{t.name}</p>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
                          <p style={{...mono,fontSize:11,color:ov?'#ef4444':'#aaa',fontWeight:'500'}}>
                            {t.done?'DONE':ov?`OVERDUE · ${due.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`:due.toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
                          </p>
                          {subtasksTotal > 0 && (
                            <span style={{...mono,fontSize:10,color:subtasksDone===subtasksTotal?'#22c55e':'#666',background:'#1a1a1a',padding:'2px 6px',borderRadius:4}}>
                              ✓ {subtasksDone}/{subtasksTotal}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{width:8,height:8,borderRadius:'50%',background:tierCol,flexShrink:0}}/>
                      <button onClick={()=>delTask(t.id)} style={iconBtn('#888')}>✕</button>
                    </div>
                  )
                })}
          </div>
        </div>
      </aside>

      {/* ── MAIN STAGE ── */}
      <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#1a1a1a'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 36px',height:76,borderBottom:'3px solid #444',flexShrink:0,background:'#222'}}>
          <div style={{display:'flex',alignItems:'center',gap:18}}>
            {/* ALWAYS VISIBLE navigation arrows */}
            <button onClick={()=>{ if(view==='micro') navM(-1); else setCalY(y=>y-1) }} style={{
              ...mono,background:'#333',border:'3px solid #555',color:'#fff',cursor:'pointer',
              borderRadius:8,padding:'10px 20px',fontSize:18,transition:'all 0.15s',fontWeight:'bold'
            }}>◀</button>

            <h1 style={{...mono,fontWeight:900,fontSize:26,letterSpacing:6,color:'#fff',minWidth:340,textAlign:'center'}}>
              {view==='macro' ? `${calY} OVERVIEW` : `${MONTHS[calM].toUpperCase()} ${calY}`}
            </h1>

            <button onClick={()=>{ if(view==='micro') navM(1); else setCalY(y=>y+1) }} style={{
              ...mono,background:'#333',border:'3px solid #555',color:'#fff',cursor:'pointer',
              borderRadius:8,padding:'10px 20px',fontSize:18,transition:'all 0.15s',fontWeight:'bold'
            }}>▶</button>
          </div>

          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            {view==='micro' && (
              <button onClick={()=>setView('macro')} style={{
                ...mono,background:'#333',border:'3px solid #555',color:'#eee',cursor:'pointer',
                borderRadius:8,padding:'10px 18px',fontSize:12,letterSpacing:3,fontWeight:'bold'
              }}>← YEAR</button>
            )}
            <button onClick={exportData} title="Export" style={{background:'#333',border:'3px solid #555',color:'#eee',cursor:'pointer',borderRadius:8,padding:'10px 14px',fontSize:16}}>💾</button>
            <label title="Import" style={{background:'#333',border:'3px solid #555',color:'#eee',cursor:'pointer',borderRadius:8,padding:'10px 14px',fontSize:16,display:'inline-block'}}>
              📂<input type="file" accept=".json" onChange={importData} style={{display:'none'}}/>
            </label>
            <button onClick={()=>{ const ins=buildInsights(); setModal(ins.length?'insights':'noinsights') }}
              style={{background:'#333',border:'3px solid #555',color:'#eee',cursor:'pointer',borderRadius:8,padding:'10px 14px',fontSize:16}}>📊</button>
            <button onClick={()=>setShowDeleteWarning(true)} title="Delete All Data" style={{background:'#2a1111',border:'3px solid #ef4444',color:'#ef4444',cursor:'pointer',borderRadius:8,padding:'10px 14px',fontSize:16}}>🗑️</button>
          </div>
        </div>

        {/* Hint bar */}
        <div style={{padding:'8px 36px',background:'#222',borderBottom:'3px solid #333',flexShrink:0}}>
          <span style={{...mono,fontSize:11,color:'#888',letterSpacing:2,fontWeight:'bold'}}>
            {view==='micro'
              ? '◀ ▶ navigate months · Esc back to year · click day for details & journal'
              : '◀ ▶ change year · click month to zoom in'}
          </span>
        </div>

        {/* Calendar */}
        <div style={{flex:1,overflowY:'auto',padding:'32px 36px',background:'#1a1a1a'}}>
          {view==='macro'
            ? <MacroView year={calY} state={state} onMonth={m=>{setCalM(m);setView('micro')}} onHover={(date,pos)=>{setHoverDate(date);setHoverPos(pos)}} onHoverEnd={()=>setHoverDate(null)}/>
            : <MicroView year={calY} month={calM} state={state} onToggle={toggleHist} onJournal={openJournal}/>
          }
        </div>
      </main>

      {/* ── MODALS ── */}
      {modal && (
        <div onClick={e=>e.target===e.currentTarget&&close()} style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',
          alignItems:'center',justifyContent:'center',zIndex:50,backdropFilter:'blur(4px)'
        }}>
          <div style={{
            background:'#0a0a0a',border:'1px solid #222',borderRadius:12,padding:28,
            width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto',
            boxShadow:'0 20px 60px rgba(0,0,0,0.8)'
          }}>

            {/* HABIT */}
            {modal==='habit' && <>
              <MTitle>{editId?'EDIT GOAL':'NEW GOAL'}</MTitle>
              <MLabel>GOAL NAME</MLabel>
              <input autoFocus value={hName} onChange={e=>setHName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveHabit()}
                placeholder="e.g. Exercise daily" style={inputSt}/>
              <MLabel style={{marginTop:16}}>CATEGORY (required)</MLabel>
              <select value={hCat} onChange={e=>setHCat(e.target.value)} style={{...inputSt,marginBottom:16}}>
                <option value="">— select —</option>
                {Object.entries(CATEGORIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
              <MLabel>SPECIFIC DAYS (leave empty = every day)</MLabel>
              <div style={{display:'flex',gap:4,marginBottom:20}}>
                {DAYS_SHORT.map((d,i)=>(
                  <button key={i} onClick={()=>setHDays(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{
                    flex:1,padding:'7px 0',borderRadius:5,border:'none',cursor:'pointer',...mono,fontSize:9,transition:'all 0.15s',
                    background:hDays.includes(i)?'#fff':'#151515',
                    color:hDays.includes(i)?'#000':'#444',
                    fontWeight:hDays.includes(i)?'bold':'normal'
                  }}>{d}</button>
                ))}
              </div>
              <MRow>
                <Btn onClick={close} style={{background:'#1a1a1a',color:'#666'}}>CANCEL</Btn>
                <Btn onClick={saveHabit} disabled={!hName.trim()||!hCat}>{editId?'UPDATE':'ADD GOAL'}</Btn>
              </MRow>
            </>}

            {/* TASK */}
            {modal==='task' && <>
              <MTitle>{editId?'EDIT TASK':'NEW TASK'}</MTitle>
              <MLabel>TASK NAME</MLabel>
              <input autoFocus value={tName} onChange={e=>setTName(e.target.value)} placeholder="e.g. Submit assignment" style={inputSt}/>
              <MLabel style={{marginTop:16}}>DUE DATE</MLabel>
              <CalPicker value={tDate} onChange={setTDate}/>
              <MLabel style={{marginTop:16}}>TIME</MLabel>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                <select value={tHour} onChange={e=>setTHour(e.target.value)} style={{...inputSt,flex:1}}>
                  {HOURS_12.map(h=><option key={h}>{h}</option>)}
                </select>
                <select value={tMin} onChange={e=>setTMin(e.target.value)} style={{...inputSt,flex:1}}>
                  {MINUTES.map(m=><option key={m}>{m}</option>)}
                </select>
                <select value={tAmpm} onChange={e=>setTAmpm(e.target.value)} style={{...inputSt,flex:1}}>
                  <option>AM</option><option>PM</option>
                </select>
              </div>
              <MLabel>PRIORITY</MLabel>
              <div style={{display:'flex',gap:8,marginBottom:20}}>
                {[[1,'LOW','#22c55e'],[2,'MEDIUM','#eab308'],[3,'HIGH','#ef4444']].map(([v,l,c])=>(
                  <button key={v} onClick={()=>setTTier(v)} style={{
                    flex:1,padding:'9px 0',borderRadius:6,border:`1px solid ${tTier===v?c:'#222'}`,cursor:'pointer',
                    ...mono,fontSize:10,fontWeight:tTier===v?'bold':'normal',
                    background:tTier===v?c+'22':'#111',
                    color:tTier===v?c:'#444',transition:'all 0.15s'
                  }}>{l}</button>
                ))}
              </div>
              
              <MLabel>SUBTASKS (OPTIONAL)</MLabel>
              <div style={{marginBottom:16}}>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <input 
                    value={tSubtaskInput} 
                    onChange={e=>setTSubtaskInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSubtask()}}}
                    placeholder="Add a subtask..."
                    style={{...inputSt,flex:1}}
                  />
                  <button onClick={addSubtask} disabled={!tSubtaskInput.trim()} style={{
                    padding:'0 16px',background:'#333',border:'2px solid #555',color:'#fff',
                    cursor:tSubtaskInput.trim()?'pointer':'not-allowed',borderRadius:6,
                    ...mono,fontSize:16,opacity:tSubtaskInput.trim()?1:0.5
                  }}>+</button>
                </div>
                
                {tSubtasks.length > 0 && (
                  <div style={{background:'#0a0a0a',border:'2px solid #222',borderRadius:8,padding:8}}>
                    {tSubtasks.map((sub,idx)=>(
                      <div key={sub.id} style={{
                        display:'flex',alignItems:'center',gap:10,padding:'8px 10px',
                        background:idx%2===0?'#111':'transparent',borderRadius:6,marginBottom:4
                      }}>
                        <input 
                          type="checkbox" 
                          checked={sub.done}
                          onChange={()=>toggleSubtask(sub.id)}
                          style={{width:16,height:16,cursor:'pointer'}}
                        />
                        <span style={{
                          ...mono,fontSize:12,color:sub.done?'#666':'#ccc',
                          flex:1,textDecoration:sub.done?'line-through':'none'
                        }}>{sub.text}</span>
                        <button onClick={()=>deleteSubtask(sub.id)} style={{
                          background:'none',border:'none',color:'#666',cursor:'pointer',
                          fontSize:14,padding:'4px 8px'
                        }}>×</button>
                      </div>
                    ))}
                    <p style={{...mono,fontSize:10,color:'#666',marginTop:8,textAlign:'center'}}>
                      {tSubtasks.filter(s=>s.done).length}/{tSubtasks.length} completed
                    </p>
                  </div>
                )}
              </div>
              
              <MRow>
                <Btn onClick={close} style={{background:'#1a1a1a',color:'#666'}}>CANCEL</Btn>
                <Btn onClick={saveTask} disabled={!tName.trim()||!tDate}>{editId?'UPDATE':'ADD TASK'}</Btn>
              </MRow>
            </>}

            {/* JOURNAL */}
            {modal==='journal' && <>
              <MTitle>DAILY JOURNAL</MTitle>
              <p style={{...mono,fontSize:11,color:'#aaa',marginBottom:16}}>{fmtDate(jDate).toUpperCase()}</p>
              <textarea value={jText} onChange={e=>setJText(e.target.value)} autoFocus
                placeholder="How did today go? What did you learn? What are you grateful for?"
                style={{...inputSt,minHeight:200,resize:'vertical',lineHeight:1.7}}/>
              <MRow style={{marginTop:14}}>
                <Btn onClick={close} style={{background:'#1a1a1a',color:'#666'}}>CANCEL</Btn>
                <Btn onClick={saveJournal}>SAVE</Btn>
              </MRow>
            </>}

            {/* TARGET */}
            {modal==='target' && <>
              <MTitle>CHANGE TARGET DATE</MTitle>
              <CalPicker value={targetPick} onChange={setTargetPick} label="SELECT YOUR TARGET DATE"/>
              {targetPick && <p style={{...mono,fontSize:11,color:'#22c55e',margin:'12px 0'}}>{daysLeft(targetPick)} days from today</p>}
              <MRow style={{marginTop:14}}>
                <Btn onClick={close} style={{background:'#1a1a1a',color:'#666'}}>CANCEL</Btn>
                <Btn onClick={saveTarget}>SAVE</Btn>
              </MRow>
            </>}

            {/* VACATION */}
            {modal==='vacation' && <>
              <MTitle>🏖 VACATION MODE</MTitle>
              <p style={{...mono,fontSize:10,color:'#444',marginBottom:18,lineHeight:1.6,letterSpacing:1}}>
                Streaks are paused during vacation. Days in range show as dimmed with a gray border.
              </p>
              {vm.active && (
                <div style={{background:'#111',border:'1px solid #333',borderRadius:8,padding:12,marginBottom:16}}>
                  <p style={{...mono,fontSize:9,color:'#888',letterSpacing:3}}>CURRENTLY ACTIVE</p>
                  <p style={{...mono,fontSize:12,color:'#ccc',marginTop:4}}>{vm.startDate} → {vm.endDate}</p>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
                <CalPicker value={vacStart} onChange={setVacStart} label="START DATE"/>
                <CalPicker value={vacEnd} onChange={setVacEnd} label="END DATE" minDate={vacStart}/>
              </div>
              <MRow>
                <Btn onClick={close} style={{background:'#1a1a1a',color:'#666'}}>CANCEL</Btn>
                <Btn onClick={saveVacation}>ACTIVATE</Btn>
              </MRow>
            </>}

            {/* CLASSES LIST */}
            {modal==='classes' && <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
                <MTitle style={{marginBottom:0}}>MY CLASSES</MTitle>
                <Btn onClick={()=>openClass()} style={{padding:'7px 14px',fontSize:10}}>+ ADD</Btn>
              </div>
              {state.classes.length===0
                ? <p style={emptyTxt}>No classes yet</p>
                : state.classes.map(c=>(
                    <div key={c.id} style={{background:'#111',border:'1px solid #222',borderRadius:8,padding:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <p style={{...mono,fontSize:12,color:'#e5e5e5',fontWeight:'bold'}}>{c.code} <span style={{color:'#555',fontWeight:'normal'}}>{c.name}</span></p>
                        {c.time&&<p style={{...mono,fontSize:10,color:'#444',marginTop:3}}>🕐 {c.time}</p>}
                        {c.location&&<p style={{...mono,fontSize:10,color:'#444',marginTop:2}}>📍 {c.location}</p>}
                        <p style={{...mono,fontSize:9,color:'#666',marginTop:4}}>{(c.days||[]).map(d=>DAYS_SHORT[d]).join(' · ')}</p>
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>openClass(c.id)} style={iconBtn('#444')}>✎</button>
                        <button onClick={()=>delClass(c.id)} style={iconBtn('#333')}>✕</button>
                      </div>
                    </div>
                  ))}
              <MRow style={{marginTop:14}}><Btn onClick={close} style={{background:'#1a1a1a',color:'#666'}}>CLOSE</Btn></MRow>
            </>}

            {/* ADD/EDIT CLASS */}
            {modal==='class' && <>
              <MTitle>{editCId?'EDIT CLASS':'ADD CLASS'}</MTitle>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginBottom:10}}>
                <div><MLabel>CODE</MLabel><input value={cCode} onChange={e=>setCCode(e.target.value)} placeholder="COP3502" style={inputSt}/></div>
                <div><MLabel>NAME</MLabel><input autoFocus value={cName} onChange={e=>setCName(e.target.value)} placeholder="Data Structures" style={inputSt}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div><MLabel>TIME</MLabel><input value={cTime} onChange={e=>setCTime(e.target.value)} placeholder="9:00 - 10:15 AM" style={inputSt}/></div>
                <div><MLabel>LOCATION</MLabel><input value={cLoc} onChange={e=>setCLoc(e.target.value)} placeholder="HPA1 112" style={inputSt}/></div>
              </div>
              <MLabel>DAYS</MLabel>
              <div style={{display:'flex',gap:4,marginBottom:20}}>
                {DAYS_SHORT.map((d,i)=>(
                  <button key={i} onClick={()=>setCDays(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{
                    flex:1,padding:'8px 0',borderRadius:5,border:'none',cursor:'pointer',...mono,fontSize:9,transition:'all 0.15s',
                    background:cDays.includes(i)?'#fff':'#151515',
                    color:cDays.includes(i)?'#000':'#444',fontWeight:cDays.includes(i)?'bold':'normal'
                  }}>{d}</button>
                ))}
              </div>
              <MRow>
                <Btn onClick={()=>setModal('classes')} style={{background:'#1a1a1a',color:'#666'}}>BACK</Btn>
                <Btn onClick={saveClass}>{editCId?'UPDATE':'ADD CLASS'}</Btn>
              </MRow>
            </>}

            {/* INSIGHTS */}
            {(modal==='insights'||modal==='noinsights') && <>
              <MTitle>📊 INSIGHTS</MTitle>
              {modal==='noinsights'
                ? <p style={{...mono,fontSize:11,color:'#444',marginBottom:20}}>Complete more goals to unlock insights!</p>
                : buildInsights().map((ins,i)=>(
                    <div key={i} style={{background:'#111',border:'1px solid #222',borderRadius:8,padding:14,marginBottom:10}}>
                      <p style={{...mono,fontSize:12,color:'#ccc',marginBottom:6}}>{ins.icon} {ins.title}</p>
                      <p style={{...mono,fontSize:11,color:'#666',lineHeight:1.6}}>{ins.text}</p>
                    </div>
                  ))}
              <MRow><Btn onClick={close} style={{background:'#1a1a1a',color:'#666'}}>CLOSE</Btn></MRow>
            </>}

          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position:'fixed',bottom:24,right:24,padding:'11px 20px',borderRadius:8,zIndex:200,
          ...mono,fontSize:12,fontWeight:'bold',
          background:toast.type==='err'?'#1c0505':'#051c0a',
          color:toast.type==='err'?'#ef4444':'#22c55e',
          border:`1px solid ${toast.type==='err'?'#3d0a0a':'#0a3d1a'}`,
          boxShadow:'0 8px 30px rgba(0,0,0,0.7)',
          animation:'slideUp 0.25s ease'
        }}>{toast.msg}</div>
      )}
      
      {/* ── WARNING MODAL ── */}
      {showWarning && (
        <WarningModal 
          taskCount={warningTaskCount}
          onClose={() => setShowWarning(false)}
          onConfirm={confirmVacation}
        />
      )}
      
      {/* ── DELETE ALL DATA WARNING ── */}
      {showDeleteWarning && (
        <DeleteWarningModal
          onClose={() => setShowDeleteWarning(false)}
          onConfirm={deleteAllData}
        />
      )}
      
      {/* ── TASK VACATION WARNING ── */}
      {showTaskVacationWarning && pendingTaskData && (
        <TaskVacationWarning
          taskDate={tDate}
          onClose={() => setShowTaskVacationWarning(false)}
          onConfirm={() => confirmSaveTask(pendingTaskData)}
        />
      )}
      
      {/* ── HOVER PREVIEW ── */}
      {hoverDate && (
        <DayPreviewCard dateKey={hoverDate} state={state} position={hoverPos} />
      )}
      
      {/* ── UNDO TOAST ── */}
      {undoItem && (
        <UndoToast 
          item={undoItem}
          onUndo={undoDelete}
          onDismiss={() => setUndoItem(null)}
        />
      )}
      
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

// ─── POMODORO ─────────────────────────────────────────────────────────────────
function Pomodoro({ presets, setPresets, toast$ }) {
  const [secs, setSecs] = useState(presets.focus*60)
  const [run, setRun]   = useState(false)
  const [type, setType] = useState('focus')
  const ref = useRef(null)

  useEffect(()=>{
    if (run) {
      ref.current = setInterval(()=>setSecs(s=>{
        if (s<=1) {
          setRun(false)
          const nxt = type==='focus'?'shortBreak':'focus'
          setType(nxt); setSecs(presets[nxt]*60); toast$('⏱ Session complete!')
          try {
            const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain()
            o.connect(g);g.connect(a.destination);o.type='sine';o.frequency.value=880
            g.gain.setValueAtTime(0.3,a.currentTime);g.gain.linearRampToValueAtTime(0,a.currentTime+0.4)
            o.start();o.stop(a.currentTime+0.4)
          } catch {}
          return 0
        }
        return s-1
      }),1000)
    } else clearInterval(ref.current)
    return ()=>clearInterval(ref.current)
  },[run])

  const reset = ()=>{ setRun(false); setSecs(presets[type]*60) }
  const fmt   = s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const total = presets[type]*60
  const pct   = secs/total
  const R=60, C=2*Math.PI*R

  const switchType = t=>{ setRun(false); setType(t); setSecs(presets[t]*60) }
  const adjust = (key,d)=>{
    const v=Math.max(1,presets[key]+d)
    const np={...presets,[key]:v}; setPresets(np)
    if(!run && key===type) setSecs(v*60)
  }

  return (
    <div style={{background:'#2a2a2a',border:'3px solid #444',borderRadius:12,padding:20}}>
      <div style={{display:'flex',gap:8,marginBottom:18}}>
        {[['focus','FOCUS'],['shortBreak','BREAK']].map(([k,l])=>(
          <button key={k} onClick={()=>switchType(k)} style={{
            flex:1,padding:'12px 0',border:'none',cursor:'pointer',borderRadius:8,
            ...mono,fontSize:13,letterSpacing:2,fontWeight:'bold',transition:'all 0.15s',
            background:type===k?'#fff':'#333',color:type===k?'#000':'#888'
          }}>{l}</button>
        ))}
      </div>
      {/* Ring - Much Larger & Better Proportions */}
      <div style={{display:'flex',justifyContent:'center',marginBottom:18}}>
        <div style={{position:'relative',width:140,height:140}}>
          <svg width={140} height={140} style={{transform:'rotate(-90deg)'}}>
            <circle cx={70} cy={70} r={60} fill="none" stroke="#333" strokeWidth={10}/>
            <circle cx={70} cy={70} r={60} fill="none" stroke="#fff" strokeWidth={10}
              strokeDasharray={C} strokeDashoffset={C*(1-pct)} strokeLinecap="round"
              style={{transition:'stroke-dashoffset 1s linear'}}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}}>
            <span style={{...mono,fontWeight:900,fontSize:26,color:'#fff',letterSpacing:1}}>{fmt(secs)}</span>
            <span style={{...mono,fontSize:9,color:'#888',letterSpacing:2,marginTop:6,fontWeight:'bold'}}>{type==='focus'?'FOCUS':'BREAK'}</span>
          </div>
        </div>
      </div>
      {/* Control Buttons */}
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        <button onClick={()=>setRun(!run)} style={{
          flex:1,padding:'14px 0',border:'none',cursor:'pointer',borderRadius:8,
          ...mono,fontSize:13,letterSpacing:2,fontWeight:'bold',
          background:run?'#333':'#fff',color:run?'#aaa':'#000',
          transition:'all 0.15s'
        }}>{run?'⏸ PAUSE':'▶ START'}</button>
        <button onClick={reset} style={{
          padding:'14px 18px',border:'none',background:'#333',color:'#aaa',
          cursor:'pointer',borderRadius:8,fontSize:16,transition:'all 0.15s',
          fontWeight:'bold'
        }}>⟳</button>
      </div>
      {/* Timer Adjustments */}
      <div style={{borderTop:'2px solid #333',paddingTop:14}}>
        {[['focus','FOCUS',5],['shortBreak','BREAK',1]].map(([k,l,s])=>(
          <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{...mono,fontSize:12,color:'#aaa',letterSpacing:2,fontWeight:'600'}}>{l}</span>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <button onClick={()=>adjust(k,-s)} style={{
                background:'#333',border:'2px solid #555',color:'#ccc',cursor:'pointer',
                borderRadius:6,padding:'6px 12px',fontSize:16,...mono,fontWeight:'bold',
                transition:'all 0.15s'
              }}>−</button>
              <span style={{...mono,fontSize:14,color:'#fff',width:36,textAlign:'center',fontWeight:'bold'}}>{presets[k]}m</span>
              <button onClick={()=>adjust(k,s)} style={{
                background:'#333',border:'2px solid #555',color:'#ccc',cursor:'pointer',
                borderRadius:6,padding:'6px 12px',fontSize:16,...mono,fontWeight:'bold',
                transition:'all 0.15s'
              }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CLASS TODAY ──────────────────────────────────────────────────────────────
function ClassToday({ classes, onManage }) {
  const todow = new Date().getDay()
  const tod = (classes||[]).filter(c=>c.days?.includes(todow))
  const oth = (classes||[]).filter(c=>!c.days?.includes(todow))
  return (
    <div style={{background:'#2a2a2a',border:'3px solid #444',borderRadius:12,padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{...mono,fontSize:11,letterSpacing:4,color:'#aaa',fontWeight:'bold'}}>CLASS SCHEDULE</span>
        <button onClick={onManage} style={{background:'none',border:'2px solid #555',color:'#888',cursor:'pointer',borderRadius:6,padding:'5px 10px',fontSize:12}}>⚙</button>
      </div>
      {tod.length===0&&oth.length===0&&<p style={{...mono,fontSize:12,color:'#666',textAlign:'center',padding:'10px 0',fontWeight:'500'}}>No classes · click ⚙</p>}
      {tod.length>0&&<>
        <p style={{...mono,fontSize:10,color:'#22c55e',letterSpacing:3,marginBottom:8,fontWeight:'bold'}}>TODAY</p>
        {tod.map((c,i)=>(
          <div key={i} style={{background:'#1a2a1a',border:'3px solid #2a4a2a',borderRadius:8,padding:12,marginBottom:8}}>
            <p style={{...mono,fontSize:13,color:'#22c55e',fontWeight:'bold'}}>{c.code} <span style={{color:'#4ade80',fontWeight:'normal',fontSize:12}}>{c.name}</span></p>
            {c.time&&<p style={{...mono,fontSize:11,color:'#888',marginTop:3,fontWeight:'500'}}>🕐 {c.time}{c.location?` · ${c.location}`:''}</p>}
          </div>
        ))}
      </>}
      {oth.length>0&&<>
        {tod.length>0&&<p style={{...mono,fontSize:10,color:'#666',letterSpacing:3,margin:'12px 0 8px',fontWeight:'bold'}}>OTHER</p>}
        {oth.map((c,i)=>(
          <div key={i} style={{background:'#333',borderRadius:6,padding:'9px 10px',marginBottom:5,border:'2px solid #444'}}>
            <p style={{...mono,fontSize:12,color:'#aaa',fontWeight:'600'}}>{c.code} <span style={{color:'#888'}}>{c.name}</span></p>
            {c.time&&<p style={{...mono,fontSize:10,color:'#666',marginTop:2,fontWeight:'500'}}>{(c.days||[]).map(d=>DAYS_SHORT[d]).join(' ')} · {c.time}</p>}
          </div>
        ))}
      </>}
    </div>
  )
}

// ─── VACATION WIDGET ──────────────────────────────────────────────────────────
function VacationWidget({ vm, vacationHistory, onManage }) {
  const status = getVacationStatus(vm)
  const totalVacations = (vacationHistory || []).length
  
  return (
    <div style={{background:'#2a2a2a',border:`3px solid ${vm.active?'#555':'#444'}`,borderRadius:12,padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{...mono,fontSize:11,letterSpacing:4,color:vm.active?'#ddd':'#aaa',fontWeight:'bold'}}>🏖 VACATION</span>
        <button onClick={onManage} style={{background:'none',border:'2px solid #555',color:'#888',cursor:'pointer',borderRadius:6,padding:'5px 10px',fontSize:12}}>⚙</button>
      </div>
      {vm.active && status ? (
        <div>
          <p 
            style={{...mono,fontSize:12,color:'#ccc',marginTop:8,fontWeight:'500',cursor:'help'}}
            title={`${vm.startDate} to ${vm.endDate}`}
          >
            {status.verb} a break for {status.duration}
          </p>
          {totalVacations > 0 && (
            <p style={{...mono,fontSize:10,color:'#888',marginTop:4}}>
              Total: {totalVacations} vacation{totalVacations !== 1 ? 's' : ''} taken
            </p>
          )}
        </div>
      ) : (
        <p style={{...mono,fontSize:12,color:'#666',marginTop:8,fontWeight:'500'}}>
          {totalVacations > 0 
            ? `${totalVacations} vacation${totalVacations !== 1 ? 's' : ''} completed · click ⚙ to schedule` 
            : 'No vacations · click ⚙ to schedule'}
        </p>
      )}
    </div>
  )
}

// ─── HEATMAP ──────────────────────────────────────────────────────────────────
function Heatmap({ history, habits, year }) {
  const total = habits.length || 1
  const jan1  = new Date(year,0,1)
  const off   = jan1.getDay()
  const cells = []
  for (let i=0;i<off;i++) cells.push(null)
  for (let d=0;d<365;d++) {
    const dt=new Date(year,0,1+d), k=dk(dt)
    const done=(history[k]||[]).filter(id=>habits.some(h=>h.id===id)).length
    const pct=done/total
    cells.push({k,done,pct})
  }
  const col = p => p>=1?'#22c55e':p>=0.75?'#4ade80':p>=0.5?'#eab308':p>0?'#ef4444':'#333'
  return (
    <div>
      <p style={{...mono,fontSize:11,color:'#888',letterSpacing:4,marginBottom:12,fontWeight:'bold'}}>ACTIVITY {year}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
        {cells.map((c,i)=>c===null
          ? <div key={i} style={{width:12,height:12}}/>
          : <div key={i} title={`${c.k} · ${c.done} done`}
              style={{width:12,height:12,borderRadius:3,background:col(c.pct),border:'1px solid #444'}}/>
        )}
      </div>
      <div style={{display:'flex',gap:16,marginTop:14,flexWrap:'wrap'}}>
        {[['#22c55e','100%'],['#eab308','50%+'],['#ef4444','<50%'],['#333','None']].map(([bg,l])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:10,height:10,borderRadius:3,background:bg,border:'1px solid #444'}}/>
            <span style={{...mono,fontSize:11,color:'#aaa',fontWeight:'500'}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MACRO VIEW ───────────────────────────────────────────────────────────────
function MacroView({ year, state, onMonth, onHover, onHoverEnd }) {
  const todStr = todayKey()
  const vm = state.vacationMode
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,maxWidth:1600,margin:'0 auto'}}>
      {Array.from({length:12},(_,m)=>{
        const dim=new Date(year,m+1,0).getDate(), off=new Date(year,m,1).getDay()
        let mDone=0, mPoss=0
        for(let d=1;d<=dim;d++){
          const k=`${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const ag=state.habits.filter(h=>!h.specificDays?.length||h.specificDays.includes(new Date(year,m,d).getDay()))
          mPoss+=ag.length
          mDone+=(state.history[k]||[]).filter(id=>ag.some(h=>h.id===id)).length
        }
        const mpct = mPoss>0 ? Math.round(mDone/mPoss*100) : 0
        const pColor = mpct>=80?'#22c55e':mpct>=50?'#eab308':'#ef4444'
        return (
          <div key={m} onClick={()=>onMonth(m)} style={{
            background:'#222',border:'3px solid #444',borderRadius:14,padding:24,cursor:'pointer',transition:'all 0.2s'
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#777';e.currentTarget.style.background='#2a2a2a'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#444';e.currentTarget.style.background='#222'}}>
            <p style={{...mono,fontSize:15,fontWeight:'bold',letterSpacing:6,color:'#fff',marginBottom:18,textAlign:'center'}}>
              {MONTHS[m].toUpperCase()}
            </p>
            {/* Mini calendar - MUCH BIGGER for outdoor visibility */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:16}}>
              {DAYS_SHORT.map(d=><div key={d} style={{textAlign:'center',fontSize:12,color:'#999',...mono,fontWeight:'bold',padding:'2px 0'}}>{d[0]}</div>)}
              {Array.from({length:off},(_,i)=><div key={'e'+i}/>)}
              {Array.from({length:dim},(_,i)=>{
                const d=i+1
                const k=`${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const hist=state.history[k]||[]
                const isTod=k===todStr, isTar=k===state.targetDate, isVac=isVacDay(k,vm)
                const ag=state.habits.filter(h=>!h.specificDays?.length||h.specificDays.includes(new Date(year,m,d).getDay()))
                const done=hist.filter(id=>ag.some(h=>h.id===id)).length
                const pct=ag.length>0?done/ag.length:0
                
                // Get day preview for tooltip
                const preview = getDayPreview(k, state)
                const hasClass = preview.hasClass
                const dayTasks = preview.tasks.filter(t => !t.done)
                const highestPriorityTask = dayTasks.length > 0 ? dayTasks.reduce((max, t) => t.tier > max.tier ? t : max, dayTasks[0]) : null
                const hasJournal = preview.hasJournal
                
                // Build tooltip
                const tooltipLines = []
                if (preview.isVacation) tooltipLines.push('🏖 Vacation day')
                if (hasClass) tooltipLines.push('📚 Class scheduled')
                if (preview.goals.length > 0) tooltipLines.push(`${preview.goals.length} goal${preview.goals.length !== 1 ? 's' : ''}`)
                if (dayTasks.length > 0) tooltipLines.push(`${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}`)
                if (hasJournal) tooltipLines.push('📝 Journal entry')
                const tooltip = tooltipLines.length > 0 ? `${k}\n${tooltipLines.join(' · ')}` : k
                
                // Vacation: dimmed + gray border
                if (isVac) return (
                  <div key={d} 
                    onClick={()=>onMonth(m)}
                    onMouseEnter={(e) => onHover?.(k, {x: e.clientX + 15, y: e.clientY + 15})}
                    onMouseLeave={() => onHoverEnd?.()}
                    onMouseMove={(e) => onHover?.(k, {x: e.clientX + 15, y: e.clientY + 15})}
                    style={{
                      borderRadius:5,aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',
                      background:'#1a1a1a',border:'2px solid #555',opacity:0.4,position:'relative',cursor:'pointer'
                    }}>
                    <span style={{...mono,fontSize:13,color:'#999',fontWeight:'bold'}}>{d}</span>
                  </div>
                )
                const bg = done>0 ? compBg(pct) : isTod?'#333':'#1a1a1a'
                const border = isTar?'2px solid #ccc':isTod?'2px solid #888':'2px solid #333'
                return (
                  <div key={d} 
                    onClick={(e) => {onHoverEnd?.(); onMonth(m)}}
                    onMouseEnter={(e) => onHover?.(k, {x: e.clientX + 15, y: e.clientY + 15})}
                    onMouseLeave={() => onHoverEnd?.()}
                    onMouseMove={(e) => onHover?.(k, {x: e.clientX + 15, y: e.clientY + 15})}
                    style={{borderRadius:5,aspectRatio:'1',border,background:bg,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',cursor:'pointer'}}>
                    <span style={{...mono,fontSize:13,color:done>0?compColor(pct):isTod?'#fff':'#888',fontWeight:'bold'}}>{d}</span>
                    <div style={{position:'absolute',top:2,right:2,display:'flex',flexDirection:'column',gap:2,alignItems:'flex-end'}}>
                      {hasClass && <div style={{fontSize:8}}>📚</div>}
                      {highestPriorityTask && <div style={{width:8,height:8,borderRadius:'50%',background:getTaskPriorityColor(highestPriorityTask.tier),border:'2px solid #222'}}/>}
                      {hasJournal && <div style={{width:8,height:8,borderRadius:'50%',background:'#fff',border:'2px solid #222'}}/>}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Progress bar */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{...mono,fontSize:11,color:'#999',letterSpacing:2,fontWeight:'bold'}}>COMPLETION</span>
                <span style={{...mono,fontSize:12,color:mpct>0?pColor:'#666',fontWeight:'bold'}}>{mpct}%</span>
              </div>
              <div style={{height:5,background:'#333',borderRadius:4}}>
                <div style={{height:5,borderRadius:4,width:`${mpct}%`,background:pColor,transition:'width 0.4s'}}/>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── MICRO VIEW ───────────────────────────────────────────────────────────────
function MicroView({ year, month, state, onToggle, onJournal }) {
  const [sel, setSel] = useState(todayKey())
  const todStr = todayKey()
  const vm = state.vacationMode
  const dim = new Date(year,month+1,0).getDate()
  const off = new Date(year,month,1).getDay()

  const selHist  = state.history[sel]||[]
  const selGoals = state.habits.filter(h=>!h.specificDays?.length||h.specificDays.includes(new Date(sel+'T00:00:00').getDay()))
  const selDone  = selGoals.filter(h=>selHist.includes(h.id)).length
  const selPct   = selGoals.length>0 ? Math.round(selDone/selGoals.length*100) : null
  const selTasks = state.tasks.filter(t=>t.due?.startsWith(sel))
  const selVac   = isVacDay(sel,vm)
  const pColor   = selPct!=null ? (selPct>=100?'#22c55e':selPct>=50?'#eab308':'#ef4444') : '#333'

  return (
    <div style={{display:'flex',gap:28,height:'100%'}}>
      {/* Grid */}
      <div style={{flex:1,maxWidth:1000}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8,marginBottom:16}}>
          {DAYS_SHORT.map(d=>(
            <div key={d} style={{textAlign:'center',...mono,fontSize:15,color:'#aaa',padding:'8px 0',letterSpacing:3,fontWeight:'bold'}}>{d}</div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
          {Array.from({length:off},(_,i)=><div key={'e'+i}/>)}
          {Array.from({length:dim},(_,i)=>{
            const d=i+1
            const k=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const hist=state.history[k]||[]
            const isTod=k===todStr, isSel=k===sel, isTar=k===state.targetDate
            const isVac=isVacDay(k,vm)
            const ag=state.habits.filter(h=>!h.specificDays?.length||h.specificDays.includes(new Date(year,month,d).getDay()))
            const done=hist.filter(id=>ag.some(h=>h.id===id)).length
            const pct=ag.length>0?done/ag.length:0
            
            // Get day details
            const preview = getDayPreview(k, state)
            const hasClass = preview.hasClass
            const dayTasks = preview.tasks.filter(t => !t.done)
            const highestPriorityTask = dayTasks.length > 0 ? dayTasks.reduce((max, t) => t.tier > max.tier ? t : max, dayTasks[0]) : null
            const hasJournal = preview.hasJournal

            if (isVac) return (
              <div key={d} 
                onClick={()=>setSel(k)}
                style={{
                  aspectRatio:'1',borderRadius:12,cursor:'pointer',padding:'12px 8px',
                  display:'flex',flexDirection:'column',alignItems:'center',
                  border:isSel?'4px solid #aaa':'4px solid #666',
                  background:isSel?'#333':'#222',opacity:0.5,
                  position:'relative',transition:'all 0.15s'
                }}>
                <span style={{...mono,fontWeight:'bold',fontSize:24,color:'#aaa'}}>{d}</span>
                <span style={{...mono,fontSize:13,color:'#888',marginTop:3}}>🏖</span>
              </div>
            )

            const bg=isSel?'#333':done>0?compBg(pct):'#222'
            return (
              <div key={d} 
                onClick={()=>setSel(k)}
                style={{
                  aspectRatio:'1',borderRadius:12,cursor:'pointer',padding:'12px 8px',
                  display:'flex',flexDirection:'column',alignItems:'center',
                  border: isSel?'4px solid #fff': isTar?'4px solid #ccc': isTod?'4px solid #aaa':'4px solid #444',
                  background:bg, transition:'all 0.15s', position:'relative'
                }}>
                <span style={{...mono,fontWeight:'bold',fontSize:24,
                  color:isSel?'#fff':done>0?compColor(pct):isTod?'#fff':'#aaa'}}>{d}</span>
                {done>0&&ag.length>0&&<span style={{...mono,fontSize:14,color:'#aaa',marginTop:5,fontWeight:'bold'}}>{done}/{ag.length}</span>}
                <div style={{position:'absolute',top:5,right:5,display:'flex',flexDirection:'column',gap:3,alignItems:'flex-end'}}>
                  {hasClass && <div style={{fontSize:10}}>📚</div>}
                  {highestPriorityTask && <div style={{width:10,height:10,borderRadius:'50%',background:getTaskPriorityColor(highestPriorityTask.tier),border:'2px solid #222'}}/>}
                  {hasJournal && <div style={{width:10,height:10,borderRadius:'50%',background:'#fff',border:'2px solid #222'}}/>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div style={{display:'flex',gap:24,marginTop:22,flexWrap:'wrap'}}>
          {[['#22c55e','All done'],['#eab308','50%+ done'],['#ef4444','<50%'],['#fff','Journal 📝'],['📚','Class 📚'],['#ef4444','High priority'],['#eab308','Medium priority'],['#22c55e','Low priority'],['border:#666','Vacation']].map(([c,l])=>{
            const isVacLegend = c.startsWith('border')
            const isClassEmoji = c === '📚'
            const isPriority = ['#ef4444','#eab308','#22c55e'].includes(c) && l.includes('priority')
            return (
              <div key={l} style={{display:'flex',alignItems:'center',gap:8}}>
                {isVacLegend ? (
                  <div style={{width:12,height:12,borderRadius:4,background:'#222',border:'3px solid #666',opacity:0.5}}/>
                ) : isClassEmoji ? (
                  <div style={{fontSize:12}}>📚</div>
                ) : (
                  <div style={{width:12,height:12,borderRadius:'50%',background:c,border:'2px solid #222'}}/>
                )}
                <span style={{...mono,fontSize:13,color:'#aaa',fontWeight:'600'}}>{l}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{width:320,flexShrink:0}}>
        <div style={{background:'#222',border:'3px solid #444',borderRadius:14,padding:22,position:'sticky',top:0}}>
          <p style={{...mono,fontSize:11,color:'#aaa',letterSpacing:4,marginBottom:8,fontWeight:'bold'}}>SELECTED DAY</p>
          <p style={{...mono,fontWeight:'bold',fontSize:19,color:'#fff',marginBottom:8}}>
            {new Date(sel+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}
          </p>
          {selVac && <p style={{...mono,fontSize:14,color:'#ccc',marginBottom:12}}>🏖 Vacation Day</p>}

          {/* Goal progress bar */}
          {selPct!=null && (
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{...mono,fontSize:11,color:'#aaa',letterSpacing:2,fontWeight:'bold'}}>GOALS</span>
                <span style={{...mono,fontSize:13,color:pColor,fontWeight:'bold'}}>{selDone}/{selGoals.length} · {selPct}%</span>
              </div>
              <div style={{height:5,background:'#333',borderRadius:4}}>
                <div style={{height:5,borderRadius:4,width:`${selPct}%`,background:pColor,transition:'width 0.3s'}}/>
              </div>
            </div>
          )}

          {/* Goals checklist */}
          {selGoals.length>0 && (
            <div style={{marginBottom:16}}>
              {selGoals.map(h=>{
                const done=selHist.includes(h.id)
                const col=CAT_COLORS[h.category]||'#888'
                return (
                  <button key={h.id} onClick={()=>onToggle(h.id,sel)} style={{
                    width:'100%',display:'flex',alignItems:'center',gap:12,padding:'11px 12px',
                    borderRadius:10,border:'none',cursor:'pointer',marginBottom:5,textAlign:'left',
                    background:done?'#2a2a2a':'#222',transition:'all 0.15s',
                    borderLeft:done?`4px solid ${col}`:'4px solid transparent'
                  }}>
                    <div style={{
                      width:18,height:18,borderRadius:5,flexShrink:0,
                      border:`3px solid ${done?col:'#666'}`,
                      background:done?col:'transparent',
                      display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'
                    }}>{done&&<span style={{fontSize:11,color:'#000',fontWeight:'bold'}}>✓</span>}</div>
                    <span style={{...mono,fontSize:14,color:done?'#ddd':'#ccc',textDecoration:done?'line-through':'none',fontWeight:'600'}}>{h.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Tasks for this day */}
          {selTasks.length>0 && (
            <div style={{marginBottom:16}}>
              <p style={{...mono,fontSize:11,color:'#aaa',letterSpacing:3,marginBottom:10,fontWeight:'bold'}}>TASKS DUE</p>
              {selTasks.map(t=>{
                const tc=[null,'#22c55e','#eab308','#ef4444'][t.tier]
                return (
                  <div key={t.id} style={{background:'#2a2a2a',borderRadius:8,padding:'10px 12px',marginBottom:5,display:'flex',alignItems:'center',gap:10,border:'3px solid #444'}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:tc,flexShrink:0}}/>
                    <p style={{...mono,fontSize:13,color:t.done?'#888':'#ddd',textDecoration:t.done?'line-through':'none',flex:1,fontWeight:'600'}}>{t.name}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Journal button */}
          <button onClick={()=>onJournal(sel)} style={{
            width:'100%',padding:'13px 0',border:`3px solid ${state.journal[sel]?'#aaa':'#444'}`,
            borderRadius:10,cursor:'pointer',
            background:state.journal[sel]?'#2a2a2a':'transparent',
            ...mono,fontSize:12,letterSpacing:3,fontWeight:'bold',
            color:state.journal[sel]?'#eee':'#888',transition:'all 0.15s'
          }}>
            {state.journal[sel] ? '📝 EDIT JOURNAL' : '📝 WRITE JOURNAL'}
          </button>

          {selGoals.length===0&&selTasks.length===0&&!selVac&&(
            <p style={{...mono,fontSize:13,color:'#555',textAlign:'center',padding:'14px 0',marginTop:10}}>Nothing scheduled</p>
          )}
        </div>
      </div>
    </div>
  )
}
