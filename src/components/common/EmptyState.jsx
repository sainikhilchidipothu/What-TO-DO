// ─── EmptyState ───────────────────────────────────────────────────────────────
// First-time-user prompts for empty goals/tasks lists.

export function EmptyState({ icon, title, description, shortcut, ctaLabel, onCta }) {
  return (
    <div className="px-4 pt-5 pb-4 text-center bg-zinc-900/60 border-b border-zinc-800">
      <div className="text-[28px] mb-2" aria-hidden="true">
        {icon}
      </div>
      <p className="font-sans text-[13px] text-white font-bold mb-1.5 tracking-wide">
        {title}
      </p>
      <p className="font-sans text-[11px] text-zinc-400 leading-relaxed mb-3">
        {description}
      </p>
      <button
        onClick={onCta}
        className="w-full px-3.5 py-2.5 bg-accent hover:bg-zinc-200 text-zinc-950 border-none rounded-lg cursor-pointer font-sans text-xs font-bold tracking-wider transition-colors duration-150"
      >
        {ctaLabel}
      </button>
      {shortcut && (
        <p className="font-sans text-[10px] text-zinc-500 mt-2 tracking-wide">
          or press{' '}
          <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-px text-[10px] font-mono text-zinc-300 font-bold">
            {shortcut}
          </kbd>
        </p>
      )}
    </div>
  )
}
