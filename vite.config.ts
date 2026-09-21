import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Served at https://utpaldaslabs.github.io/Retailor/ — base must match the repo name.
const BASE = '/Retailor/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        id: BASE,
        name: 'Retailor — tailor your CV with any AI',
        short_name: 'Retailor',
        description:
          'Tailor your CV to any job with the AI you already use, and download a beautifully designed PDF. Everything happens in your browser.',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        theme_color: '#325283',
        background_color: '#eef1f5',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the shell only. The heavy PDF machinery (react-pdf chunk,
        // pdf.js worker, embedded TrueType fonts) is cached on first use
        // instead, so installing the app stays a light download.
        globPatterns: ['**/*.{html,css,js,woff2,png,svg}'],
        globIgnores: ['**/Step4Review*', '**/pdf.worker*', '**/extractText*', '**/mammoth*'],
        navigateFallback: `${BASE}index.html`,
        runtimeCaching: [
          {
            // Lazy chunks + PDF fonts/worker: cache once fetched, then offline.
            urlPattern: /\/assets\/.*\.(?:ttf|mjs)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'retailor-pdf-assets', expiration: { maxEntries: 40 } },
          },
          {
            urlPattern: /\/assets\/(?:Step4Review|pdf\.worker|extractText|mammoth).*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'retailor-pdf-assets', expiration: { maxEntries: 40 } },
          },
        ],
      },
    }),
  ],
})
