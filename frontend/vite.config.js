import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // lắng nghe mọi IP — cho phép truy cập qua LAN/tunnel
    allowedHosts: ['routine.hoanguyendev.id.vn'],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
