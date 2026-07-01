/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Epilogue'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      colors: {
        // No purple/indigo — "accent" is white so primary actions read as
        // pure monochrome (white-on-black) rather than a tinted brand color.
        accent: {
          DEFAULT: '#ffffff',
          dim: '#a1a1aa',
          soft: 'rgba(255,255,255,0.12)',
        },
        // Surface palette from colorhunt.co/palette/362222171010423f3e2b2b2b,
        // desaturated to pure gray/black (no brown tint) for a monochrome
        // look. Overrides just these four shades of Tailwind's zinc scale —
        // every existing bg/border-zinc-* class picks these up automatically.
        zinc: {
          950: '#121212', // was #171010
          900: '#252525', // was #362222
          800: '#2b2b2b', // unchanged
          700: '#3f3f3f', // was #423f3e
        },
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.5)',
        floating: '0 20px 60px rgba(0,0,0,0.75)',
        glow: '0 0 0 1px rgba(255,255,255,0.35), 0 0 24px rgba(255,255,255,0.2)',
      },
      keyframes: {
        slideUp: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        slideUp: 'slideUp 0.25s ease',
      },
    },
  },
  plugins: [],
}
