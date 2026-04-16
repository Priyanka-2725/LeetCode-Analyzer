/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#080C17',
          surface: '#0D1120',
          elevated: '#111827',
        },
        primary: { DEFAULT: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
        secondary: { DEFAULT: '#22D3EE', dark: '#0891B2' },
        accent: { DEFAULT: '#A78BFA', dark: '#7C3AED' },
        success: { DEFAULT: '#4ADE80', dark: '#16A34A' },
        danger: { DEFAULT: '#F87171', dark: '#DC2626' },
        warn: { DEFAULT: '#FBBF24', dark: '#D97706' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      letterSpacing: {
        widest2: '0.2em',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(99,102,241,0.25)',
        'glow':     '0 0 24px rgba(99,102,241,0.35)',
        'glow-lg':  '0 0 48px rgba(99,102,241,0.4)',
        'glow-cyan':    '0 0 24px rgba(34,211,238,0.3)',
        'glow-purple':  '0 0 24px rgba(167,139,250,0.3)',
        'glow-green':   '0 0 24px rgba(74,222,128,0.3)',
        'glow-red':     '0 0 24px rgba(248,113,113,0.3)',
        'card':     '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(99,102,241,0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-shine': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        'indigo-glow': 'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, transparent 70%)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'float':      'floatY 4s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'fade-in':    'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 28px rgba(99,102,241,0.7)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
