/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        booktheme: {
          primary: '#8B5E3C',
          'primary-content': '#FAF7F2',
          secondary: '#4A7C59',
          'secondary-content': '#FAF7F2',
          accent: '#C4933F',
          'accent-content': '#FAF7F2',
          neutral: '#2C2416',
          'neutral-content': '#FAF7F2',
          'base-100': '#FAF7F2',
          'base-200': '#F0EAE0',
          'base-300': '#E5DDD0',
          'base-content': '#2C2416',
          info: '#4A7C59',
          success: '#4A7C59',
          warning: '#C4933F',
          error: '#B94040',
        },
      },
    ],
    defaultTheme: 'booktheme',
  },
}
