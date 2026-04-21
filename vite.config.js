import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Set base to /dashboard/ since it will be served from a subfolder
  base: '/dashboard/',
  build: {
    outDir: "dist/dashboard",
    emptyOutDir: true,
  },
})
