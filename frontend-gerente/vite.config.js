import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176, // Puerto específico para gerente
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['zustand', 'axios', 'react', 'react-dom', 'lucide-react'],
    exclude: [],
    esbuildOptions: {
      plugins: [],
    },
  },
})

