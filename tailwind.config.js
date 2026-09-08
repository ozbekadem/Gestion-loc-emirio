/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — sophisticated indigo-navy: trust and stability for a
        // property-management context, calmer and less "electric" than a
        // stock SaaS blue.
        brand: {
          50: '#f0f4fc',
          100: '#dfe8f8',
          200: '#bfd1f2',
          300: '#93b0e8',
          400: '#6789d9',
          500: '#4569c7',
          600: '#3151ab',
          700: '#28408a',
          800: '#23366f',
          900: '#202e5c',
        },
        // Accent — warm brass/gold, used sparingly for brand marks and
        // highlights (never for status — that's the semantic set below).
        accent: {
          50: '#fdf8ec',
          100: '#faedc9',
          200: '#f5d98d',
          300: '#eebd52',
          400: '#e2a02e',
          500: '#cc841c',
          600: '#a86615',
          700: '#854f14',
          800: '#6b3f14',
          900: '#583414',
        },
        // Semantic status colors — the single source of truth for
        // paid/partial/late and similar states, so every page renders the
        // same shade for the same meaning.
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3f61bd 0%, #28408a 55%, #1c2a52 100%)',
        'gradient-accent': 'linear-gradient(135deg, #eebd52 0%, #cc841c 60%, #a86615 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #1c2545 0%, #161d38 45%, #10152a 100%)',
        'gradient-mesh': 'radial-gradient(60rem 30rem at 100% -10%, rgba(69,105,199,0.10), transparent 60%), radial-gradient(50rem 26rem at -10% 0%, rgba(204,132,28,0.08), transparent 55%)',
        'gradient-card-brand': 'linear-gradient(135deg, rgba(69,105,199,0.10), rgba(69,105,199,0.02))',
        'gradient-card-accent': 'linear-gradient(135deg, rgba(204,132,28,0.12), rgba(204,132,28,0.02))',
        'gradient-card-success': 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.02))',
        'gradient-card-danger': 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.02))',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 10px 30px -14px rgba(15,23,42,0.14)',
        'soft-lg': '0 2px 4px rgba(15,23,42,0.05), 0 24px 48px -20px rgba(15,23,42,0.22)',
        'glow-brand': '0 10px 30px -8px rgba(49,81,171,0.45)',
        'glow-accent': '0 10px 26px -8px rgba(204,132,28,0.45)',
        'inner-line': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .35s ease-out both',
      },
    },
  },
  plugins: [],
}
