/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'izzi-yellow': '#FFCD02',
        'izzi-blue': '#019D99',
        'izzi-rose': '#D31772',
        'izzi-orange': '#F47E28'
      }
    },
  },
  plugins: [],
}

