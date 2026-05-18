/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amethyst: {
          950: "rgb(var(--color-amethyst-950) / <alpha-value>)",
          900: "rgb(var(--color-amethyst-900) / <alpha-value>)",
          800: "rgb(var(--color-amethyst-800) / <alpha-value>)",
          700: "rgb(var(--color-amethyst-700) / <alpha-value>)",
          600: "rgb(var(--color-amethyst-600) / <alpha-value>)",
          500: "rgb(var(--color-amethyst-500) / <alpha-value>)",
          400: "rgb(var(--color-amethyst-400) / <alpha-value>)",
          300: "rgb(var(--color-amethyst-300) / <alpha-value>)",
          200: "rgb(var(--color-amethyst-200) / <alpha-value>)",
        },
        slate: {
          900: "rgb(var(--color-slate-900) / <alpha-value>)",
          800: "rgb(var(--color-slate-800) / <alpha-value>)",
          700: "rgb(var(--color-slate-700) / <alpha-value>)",
          600: "rgb(var(--color-slate-600) / <alpha-value>)",
          500: "rgb(var(--color-slate-500) / <alpha-value>)",
          400: "rgb(var(--color-slate-400) / <alpha-value>)",
          300: "rgb(var(--color-slate-300) / <alpha-value>)",
          200: "rgb(var(--color-slate-200) / <alpha-value>)",
        },
        accent: {
          primary: "rgb(var(--color-accent-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-accent-secondary) / <alpha-value>)",
          aurora: "rgb(var(--color-accent-aurora) / <alpha-value>)",
          indigo: "rgb(var(--color-accent-primary) / <alpha-value>)",
          cyan: "rgb(var(--color-accent-aurora) / <alpha-value>)",
          violet: "rgb(var(--color-accent-secondary) / <alpha-value>)",
        },
        white: "rgb(var(--color-white) / <alpha-value>)",
        black: "rgb(var(--color-black) / <alpha-value>)",
      },
      backgroundImage: {
        "amethyst-gradient": "linear-gradient(135deg, #7c3aed 0%, #e879f9 55%, #22d3ee 100%)",
        "aurora-gradient": "linear-gradient(135deg, #7c3aed 0%, #e879f9 55%, #22d3ee 100%)",
      },
      boxShadow: {
        "amethyst-glow": "0 0 35px rgba(124, 58, 237, 0.25)",
        "aurora-glow": "0 0 35px rgba(232, 121, 249, 0.25)",
        "emerald-glow": "0 0 25px rgba(16, 185, 129, 0.35)",
        "fuchsia-glow": "0 0 20px rgba(232, 121, 249, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
