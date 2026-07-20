import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Secured Spring Boot APIs used by Content Studio.
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Existing local Express demo APIs.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/webhook': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
