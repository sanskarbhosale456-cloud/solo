import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#0B0B10',
          surface: '#14141C',
          panel: '#1A1A28',
        },
        glow: {
          DEFAULT: '#3B82F6',
          sky: '#7DD3FC',
          violet: '#8B5CF6',
        },
        gold: '#FBBF24',
        danger: '#EF4444',
        rank: {
          e: '#9CA3AF',
          d: '#6EE7B7',
          c: '#93C5FD',
          b: '#C084FC',
          a: '#FCD34D',
          s: '#F97316',
        },
      },
      fontFamily: {
        display: ['var(--font-orbitron)', 'var(--font-rajdhani)', 'Chakra Petch', 'sans-serif'],
        body: ['var(--font-ibm-plex)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'void-gradient': 'linear-gradient(135deg, #0B0B10 0%, #14141C 50%, #0B0B10 100%)',
        'glow-gradient': 'linear-gradient(90deg, #2563EB, #7DD3FC)',
        'gold-gradient': 'linear-gradient(90deg, #D97706, #FBBF24, #D97706)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px rgba(59,130,246,0.6)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 24px rgba(59,130,246,0.9)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.4' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.6' },
          '97%': { opacity: '1' },
        },
        'stamp': {
          '0%': { transform: 'scale(1.4) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(0.95) rotate(2deg)', opacity: '1' },
          '80%': { transform: 'scale(1.02) rotate(-1deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'tick-up': {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scan-h': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'flicker': 'flicker 8s linear infinite',
        'stamp': 'stamp 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'tick-up': 'tick-up 300ms ease-out',
        'scan-h': 'scan-h 3s linear infinite',
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(59, 130, 246, 0.4)',
        'glow-md': '0 0 16px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 32px rgba(59, 130, 246, 0.4)',
        'glow-gold': '0 0 16px rgba(251, 191, 36, 0.5)',
      },
    },
  },
  plugins: [],
}

export default config
