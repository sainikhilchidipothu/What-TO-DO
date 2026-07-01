import { useState, useEffect } from 'react'

export function UndoToast({ item, onUndo, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
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
    <div
      role="alert"
      className="fixed bottom-6 right-6 bg-zinc-900 border-2 border-red-500 rounded-xl px-5 py-4 z-[300] flex items-center gap-6 min-w-[380px] max-w-[calc(100vw-48px)] shadow-floating"
    >
      <div className="flex-1">
        <p className="font-sans text-[15px] text-white font-bold mb-1.5">
          {itemName} deleted
        </p>
        <p className="font-sans text-xs text-zinc-500">"{item.item.name}"</p>
      </div>
      <button
        onClick={onUndo}
        aria-label={`Undo deletion of ${item.item.name}`}
        className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white border-none rounded-lg cursor-pointer font-sans text-[13px] font-bold tracking-wide transition-colors duration-150"
      >
        UNDO ({timeLeft}s)
      </button>
    </div>
  )
}
