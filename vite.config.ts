import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at https://utpaldaslabs.github.io/Retailor/ — base must match the repo name.
export default defineConfig({
  base: '/Retailor/',
  plugins: [react()],
})
