import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// In Docker (docker-compose.dev.yml), VITE_BACKEND_URL is set to
// "http://backend:8080" so the proxy resolves the backend service by name.
// When running locally with `npm run dev`, it falls back to localhost:8080.
const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Dhad Digital CRM — AI Marketing Platform',
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
    // Allows the Cloudflare quick-tunnel demo URL (a random *.trycloudflare.com
    // host that changes every restart) through Vite's Host-header check.
    allowedHosts: ['.trycloudflare.com'],
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
