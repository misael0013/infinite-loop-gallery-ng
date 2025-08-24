// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // 0.0.0.0
    // Sufijos permitidos (Vite los compara con endsWith)
    allowedHosts: ['https://places-meetings-hotels-church.trycloudflare.com', 'localhost', '127.0.0.1', '0.0.0.0', '::1'],
    
    // HMR detrás de túnel HTTPS
    hmr: { clientPort: 443 },
  },
});
