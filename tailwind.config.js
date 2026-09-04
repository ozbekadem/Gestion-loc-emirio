/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b7cfff',
          300: '#8bb0ff',
          400: '#5c88ff',
          500: '#3a63f5',
          600: '#2b47db',
          700: '#2437ac',
          800: '#213188',
          900: '#1f2c6b',
        },
      },
    },
  },
  plugins: [],
}
