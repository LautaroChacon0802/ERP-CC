import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración optimizada para Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Carpeta de salida estándar
    emptyOutDir: true,
  },
});