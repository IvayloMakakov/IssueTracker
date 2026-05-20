import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Позволява на Vite да излъчва в локалната мрежа
    port: 5173,
    proxy: {
      '/api': {
        // ЗАМЕНИ localhost с IP-то на Лаптоп А (Сървъра)
        target: 'http://10.108.5.4:3000', 
        changeOrigin: true,
        secure: false
      }
    }
  }
})
