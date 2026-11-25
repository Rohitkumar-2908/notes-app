import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev proxy keeps the API same-origin, so the httpOnly refresh cookie just works.
// If you change PORT in server/.env, change it here too.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:5050' },
  },
});
