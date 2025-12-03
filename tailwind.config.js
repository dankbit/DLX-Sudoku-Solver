/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- IMPORTANT: Scans the src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}