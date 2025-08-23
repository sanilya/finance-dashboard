/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'finance-green': '#38b2ac',
        'finance-blue': '#4299e1',
        'finance-red': '#e53e3e',
        'finance-amber': '#d69e2e',
      },
    },
  },
  plugins: [],
}
