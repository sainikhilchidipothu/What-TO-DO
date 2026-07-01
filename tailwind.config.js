/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Epilogue'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#818cf8',
          dim: '#6366f1',
          soft: 'rgba(129,140,248,0.15)',
        },
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.5)',
        floating: '0 20px 60px rgba(0,0,0,0.75)',
        glow: '0 0 0 1px rgba(129,140,248,0.4), 0 0 24px rgba(129,140,248,0.25)',
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
