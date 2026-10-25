// ─── Avatar ───────────────────────────────────────────────────────────────────
// Initials circle for the header account button and the profile view. Falls
// back to the email's first letter, then a generic person glyph.

const SIZES = {
  sm: 'w-9 h-9 text-[13px]',
  lg: 'w-12 h-12 text-base',
}

export function initials(name = '', email = '') {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return email ? email[0].toUpperCase() : ''
}

export function Avatar({ name, email, size = 'sm' }) {
  const text = initials(name, email)
  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} shrink-0 inline-flex items-center justify-center rounded-full bg-zinc-700 text-white font-sans font-black tracking-wide select-none`}
    >
      {text || (
        <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="currentColor">
          <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
        </svg>
      )}
    </span>
  )
}
