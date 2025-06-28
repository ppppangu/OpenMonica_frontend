import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: './index.html',
        login: './src/login/signin.html',
        signup: './src/login/signup.html',
        chat: './src/chat/pages/chat.html',
        knowledge: './src/knowledgebase/knowledgebase.html',
        settings: './src/settings/settings.html',
        help: './src/help/help.html',
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
      }
    }
  }
})