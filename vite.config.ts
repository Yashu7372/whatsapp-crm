import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Jeeva CRM — AI Marketing Platform',
        short_name: 'Jeeva CRM',
        description: 'Multi-platform AI marketing and lead intelligence platform',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/v1\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxAgeSeconds: 300 } },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      // Phase 2-6 routes → Spring Boot (port 8080)
      '/api/v1': { target: 'http://localhost:8080', changeOrigin: true },
      // Legacy demo routes (workspace, contacts, messages) → Express (port 3001)
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/webhook': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
