import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Aumentamos el límite de aviso para que no sea tan "quejoso" (de 500kb a 1000kb)
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // 2. Configuración manual para separar las librerías pesadas
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'], // Asumo que usas estas para el PDF
          'vendor-ui': ['lucide-react'], // Iconos
        },
      },
    },
  },
});