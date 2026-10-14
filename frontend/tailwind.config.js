/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#202a37',
        muted: '#7d8793',
        line: '#e9edf1',
        brand: '#466c5d',
        canvas: '#f7f8f7',
      },
      boxShadow: {
        card: '0 2px 12px rgba(31, 45, 39, 0.045)',
      },
    },
  },
  plugins: [],
};
