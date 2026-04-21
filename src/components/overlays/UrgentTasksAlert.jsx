import { mono } from '../../theme.js'

export function UrgentTasksAlert({ urgentTasks, onDismiss }) {
  if (!urgentTasks.length) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 80,
        right: 24,
        background: '#1a1a1a',
        border: '2px solid #ef4444',
        borderRadius: 12,
        padding: '18px 22px',
        zIndex: 90,
        width: 340,
        maxWidth: 'calc(100vw - 48px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }} aria-hidden="true">⚠️</span>
          <h3 style={{ ...mono, fontSize: 13, fontWeight: 'bold', color: '#ef4444', letterSpacing: '0.03em' }}>
            URGENT: {urgentTasks.length} TASK{urgentTasks.length !== 1 ? 'S' : ''}
          </h3>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss urgent tasks alert"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#bbb',
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
            width: 24,
            height: 24,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: 12, maxHeight: 120, overflowY: 'auto' }}>
        {urgentTasks.slice(0, 3).map((task) => {
          const due = new Date(task.due)
          const hoursLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60))
          return (
            <div key={task.id} style={{ padding: '8px 12px', marginBottom: 6, background: '#222', border: '1px solid #333', borderRadius: 6 }}>
              <p style={{ ...mono, fontSize: 12, color: '#fff', marginBottom: 2 }}>{task.name}</p>
              <p style={{ ...mono, fontSize: 10, color: '#ef4444' }}>{hoursLeft}h left</p>
            </div>
          )
        })}
        {urgentTasks.length > 3 && (
          <p style={{ ...mono, fontSize: 10, color: '#bbb', textAlign: 'center', marginTop: 4 }}>
            +{urgentTasks.length - 3} more
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        style={{
          width: '100%',
          padding: 10,
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          ...mono,
          fontSize: 11,
          fontWeight: 'bold',
          letterSpacing: '0.03em',
        }}
      >
        GOT IT
      </button>
    </div>
  )
}
