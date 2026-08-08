import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker (docker-compose.dev.yml), VITE_BACKEND_URL is set to
// "http://backend:8080" so the proxy resolves the backend service by name.
// When running locally with `npm run dev`, it falls back to localhost:8080.
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/webhook': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
})
