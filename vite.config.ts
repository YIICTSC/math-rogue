import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const assetVersion = process.env.VITE_ASSET_VERSION || new Date().toISOString().replace(/\D/g, '').slice(0, 14)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  define: {
    __APP_ASSET_VERSION__: JSON.stringify(assetVersion),
  },
  build: {
    outDir: 'dist',
  },
  base: './', // Ensure relative paths for assets to work on GitHub Pages / Vercel
})
