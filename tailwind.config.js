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
    },
  },
  plugins: [],
}
