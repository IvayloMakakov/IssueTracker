import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    if (networkInterface) {
      for (const auth of networkInterface) {
        if (auth.family === 'IPv4' && !auth.internal) {
          return auth.address;
        }
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIPv4();

export default defineConfig({
  plugins: [react()],
  server: {
    host: localIP, 
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});