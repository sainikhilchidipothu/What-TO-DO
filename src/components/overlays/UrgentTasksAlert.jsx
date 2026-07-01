export function UrgentTasksAlert({ urgentTasks, onDismiss }) {
  if (!urgentTasks.length) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 right-6 bg-zinc-900 border-2 border-red-500 rounded-xl px-5 py-4 z-[90] w-[340px] max-w-[calc(100vw-48px)] shadow-floating"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <h3 className="font-sans text-[13px] font-bold text-red-500 tracking-wide">
            URGENT: {urgentTasks.length} TASK{urgentTasks.length !== 1 ? 'S' : ''}
          </h3>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss urgent tasks alert"
          className="bg-transparent border-none text-zinc-400 hover:text-zinc-200 cursor-pointer text-lg p-0 w-6 h-6"
        >
          ×
        </button>
      </div>

      <div className="mb-3 max-h-[120px] overflow-y-auto">
        {urgentTasks.slice(0, 3).map((task) => {
          const due = new Date(task.due)
          const hoursLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60))
          return (
            <div key={task.id} className="px-3 py-2 mb-1.5 bg-zinc-950/60 border border-zinc-800 rounded-md">
              <p className="font-sans text-xs text-white mb-0.5">{task.name}</p>
              <p className="font-sans text-[10px] text-red-500">{hoursLeft}h left</p>
            </div>
          )
        })}
        {urgentTasks.length > 3 && (
          <p className="font-sans text-[10px] text-zinc-500 text-center mt-1">
            +{urgentTasks.length - 3} more
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-white border-none rounded-md cursor-pointer font-sans text-[11px] font-bold tracking-wide transition-colors duration-150"
      >
        GOT IT
      </button>
    </div>
  )
}
