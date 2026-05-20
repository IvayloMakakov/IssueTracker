import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://10.108.5.4:5000', // IP-то на колегата ти от ФМИ
        changeOrigin: true,
        secure: false,
      }
    }
  }
})