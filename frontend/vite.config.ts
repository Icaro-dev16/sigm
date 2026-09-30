import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O frontend chama /api/... e o Vite encaminha para o backend (porta 3000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
