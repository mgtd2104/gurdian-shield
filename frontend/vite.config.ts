import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : (process.env.VERCEL ? '/' : '/gurdian-shield/'),
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
}))
