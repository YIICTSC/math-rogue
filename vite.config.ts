import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { startupProgressPlugin } from './build-tools/startupProgressPlugin'

const assetVersion = process.env.VITE_ASSET_VERSION || new Date().toISOString().replace(/\D/g, '').slice(0, 14)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), startupProgressPlugin()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  define: {
    __APP_ASSET_VERSION__: JSON.stringify(assetVersion),
  },
  build: {
    outDir: 'dist',
    manifest: true,
  },
  base: './', // Ensure relative paths for assets to work on GitHub Pages / Vercel
})
