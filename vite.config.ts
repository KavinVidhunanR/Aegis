import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Aegis/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
  },
  resolve: {
    alias: {
      // FIX: `__dirname` is not available in ES modules. Use `import.meta.url` to get an ESM-compatible equivalent.
      '@': path.dirname(fileURLToPath(import.meta.url)),
    }
  }
});