import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          appwrite: ['appwrite', 'node-appwrite'],
          router: ['react-router-dom'],
          charts: ['qrcode', 'qrcode.react'],
          icons: ['@appwrite.io/pink-icons', 'lucide-react'],
          utils: ['framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext'
  },
  server: {
    port: 5173,
    open: true,
    host: true
  },
  preview: {
    port: 4173,
    open: true,
    host: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'appwrite']
  }
});
