import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
  },
  build: {
    rollupOptions: {
      // Don't bundle these packages, assume they are provided externally
      // by the importmap injected by the deployment environment.
      external: ['react', 'react-dom', '@google/genai']
    }
  }
});