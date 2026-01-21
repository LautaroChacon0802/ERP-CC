import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // Collapses everything into one HTML file for GAS
  ],
  build: {
    outDir: 'dist_gas',
    emptyOutDir: true,
    assetsInlineLimit: 100000000, // Force inline everything
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable chunk splitting
      },
    },
  },
});