/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#dbe9ff',
          200: '#b9d4ff',
          300: '#8ab6ff',
          400: '#5590fb',
          500: '#2f6df0',
          600: '#1d4fd6',
          700: '#183fac',
          800: '#17368a',
          900: '#182f6f',
        },
        accent: {
          50: '#fff8ec',
          100: '#ffedc7',
          200: '#ffd889',
          300: '#ffbe4b',
          400: '#ffa41f',
          500: '#f88406',
          600: '#d96502',
          700: '#b44805',
          800: '#92380b',
          900: '#78300c',
        },
      },
    },
  },
  plugins: [],
}
