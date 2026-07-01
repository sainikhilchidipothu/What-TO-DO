// ─── Common small components ──────────────────────────────────────────────────
// Primitives reused across modals and the rest of the app.

const BTN_BASE =
  'px-5 py-2.5 rounded-lg font-sans text-[11px] tracking-[0.2em] font-bold uppercase transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer'

const BTN_VARIANTS = {
  primary: 'bg-accent text-zinc-950 hover:bg-zinc-200',
  ghost: 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700/70 hover:text-white',
  danger: 'bg-red-950/50 text-red-400 border-2 border-red-500/70 hover:bg-red-950 hover:border-red-500',
}

export function Btn({ children, onClick, disabled, variant = 'primary', className = '', ariaLabel, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function MTitle({ children, className = '' }) {
  return (
    <h2 className={`font-sans font-black text-[15px] tracking-[0.2em] text-zinc-50 mb-5 ${className}`}>
      {children}
    </h2>
  )
}

export function MLabel({ children, className = '', htmlFor }) {
  return (
    <label htmlFor={htmlFor} className={`block font-sans text-[10px] tracking-[0.3em] font-bold text-zinc-500 mb-2 uppercase ${className}`}>
      {children}
    </label>
  )
}

export function MRow({ children, className = '' }) {
  return <div className={`flex gap-2.5 justify-end ${className}`}>{children}</div>
}

export function IconBtn({ children, onClick, ariaLabel, active = false, className = '', title }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      title={title}
      className={`font-sans text-[11px] px-1.5 py-0.5 rounded transition-colors duration-150 cursor-pointer bg-transparent border-none ${
        active ? 'text-accent' : 'text-zinc-500 hover:text-zinc-200'
      } ${className}`}
    >
      {children}
    </button>
  )
}
