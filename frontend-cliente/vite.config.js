import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Puerto específico para cliente
    strictPort: true, // Falla si el puerto está ocupado en lugar de buscar otro
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['zustand', 'axios', 'react', 'react-dom'],
  },
})

