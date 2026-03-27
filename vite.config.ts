import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'EasyNote',
        short_name: 'EasyNote',
        description: '极简个人效率管理应用',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        dir: 'ltr',
        orientation: 'portrait',
        id: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        prefer_related_applications: false,
        related_applications: [],
        icons: [
          {
            src: '/assets/appstore-images/android/launchericon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/assets/appstore-images/android/launchericon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/assets/appstore-images/windows/StoreLogo.scale-400.png',
            sizes: '200x200',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: '/assets/mockup1.png',
            sizes: '2367x1443',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
      },
    }),
  ],
})
