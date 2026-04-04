/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Amethyst Noir Theme (Dynamic via CSS Vars) ---
        amethyst: {
          950: 'rgb(var(--color-amethyst-950) / <alpha-value>)',
          900: 'rgb(var(--color-amethyst-900) / <alpha-value>)',
          800: 'rgb(var(--color-amethyst-800) / <alpha-value>)',
          700: 'rgb(var(--color-amethyst-700) / <alpha-value>)',
          600: 'rgb(var(--color-amethyst-600) / <alpha-value>)',
          500: 'rgb(var(--color-amethyst-500) / <alpha-value>)',
          400: 'rgb(var(--color-amethyst-400) / <alpha-value>)',
          300: 'rgb(var(--color-amethyst-300) / <alpha-value>)',
          200: 'rgb(var(--color-amethyst-200) / <alpha-value>)',
        },
        slate: {
          900: 'rgb(var(--color-slate-900) / <alpha-value>)',
          800: 'rgb(var(--color-slate-800) / <alpha-value>)',
          700: 'rgb(var(--color-slate-700) / <alpha-value>)',
          600: 'rgb(var(--color-slate-600) / <alpha-value>)',
          500: 'rgb(var(--color-slate-500) / <alpha-value>)',
          400: 'rgb(var(--color-slate-400) / <alpha-value>)',
          300: 'rgb(var(--color-slate-300) / <alpha-value>)',
          200: 'rgb(var(--color-slate-200) / <alpha-value>)',
        },
        accent: {
          primary:   'rgb(var(--color-accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-accent-secondary) / <alpha-value>)',
          aurora:    'rgb(var(--color-accent-aurora) / <alpha-value>)',
          // Legacy Compatibility
          indigo: 'rgb(var(--color-accent-primary) / <alpha-value>)',
          cyan:   'rgb(var(--color-accent-aurora) / <alpha-value>)',
          violet: 'rgb(var(--color-accent-secondary) / <alpha-value>)',
        },
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: 'rgb(var(--color-accent-primary) / <alpha-value>)',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        white: 'rgb(var(--color-white) / <alpha-value>)',
        black: 'rgb(var(--color-black) / <alpha-value>)',
      },
      backgroundImage: {
        'amethyst-gradient': 'linear-gradient(135deg, #7c3aed 0%, #e879f9 55%, #22d3ee 100%)',
        'aurora-gradient': 'linear-gradient(135deg, #7c3aed 0%, #e879f9 55%, #22d3ee 100%)', // Consistency
      },
      boxShadow: {
        'amethyst-glow': '0 0 35px rgba(124, 58, 237, 0.25)',
        'aurora-glow':   '0 0 35px rgba(232, 121, 249, 0.25)',
        'emerald-glow':  '0 0 25px rgba(217, 119, 6, 0.35)',
        'soft':     '0 2px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.07)',
        'elevated': '0 10px 25px -5px rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
