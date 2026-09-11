import { useEffect, useState } from 'react'
export function CommandPalette({ onClose, actions }) {
  const [query, setQuery] = useState('')
  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
  useEffect(() => { const fn = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn) }, [onClose])
  return <div className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center pt-[14vh]" onClick={(e) => e.target === e.currentTarget && onClose()}><div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-3 shadow-2xl"><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks, goals, classes, journal…" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-white outline-none" />{filtered.map((a) => <button key={a.label} onClick={() => { a.run(); onClose() }} className="w-full text-left px-3 py-3 mt-1 rounded-lg hover:bg-zinc-800 text-sm text-zinc-200">{a.label}<span className="float-right text-zinc-500">{a.shortcut || ''}</span></button>)}</div></div>
}
