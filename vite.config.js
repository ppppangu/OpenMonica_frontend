import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/user': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/process': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/file': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    },
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'v2fronend.cpolar.cn']
  }
})