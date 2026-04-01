import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  // --- THE CRITICAL FIX FOR GEMINI API ---
  // This allows the AI SDK to communicate properly in a Vite environment
  define: {
    'process.env': {}
  }
})
