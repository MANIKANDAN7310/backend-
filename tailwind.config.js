/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0f111a',
          card: '#161a29',
          sidebar: '#1a1f33',
        },
        brand: {
          primary: '#7c3aed',
        }
      },
    },
  },
  plugins: [],
}
