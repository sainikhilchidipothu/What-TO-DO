export function Toast({ toast }) {
  if (!toast) return null
  const isErr = toast.type === 'err'
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg z-[200] font-sans text-xs font-bold shadow-floating animate-slideUp border ${
        isErr ? 'bg-red-950/80 text-red-400 border-red-900' : 'bg-emerald-950/80 text-emerald-400 border-emerald-900'
      }`}
    >
      {toast.msg}
    </div>
  )
}
