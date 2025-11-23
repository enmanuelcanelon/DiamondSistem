import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176, // Puerto específico para vendedor
    strictPort: false, // Busca otro puerto si 5176 está ocupado
    hmr: {
      overlay: false, // Desactivar overlay de errores para mejor rendimiento
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
    include: ['zustand', 'axios', 'react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    exclude: [],
  },
  // Optimizaciones adicionales para desarrollo rápido
  esbuild: {
    target: 'esnext',
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'date-vendor': ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Optimizaciones de build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console en desarrollo
        drop_debugger: true,
      },
    },
    // Mejorar rendimiento de build
    target: 'esnext',
    cssCodeSplit: true,
  },
  // Optimizaciones adicionales
  css: {
    devSourcemap: false, // Desactivar sourcemaps en desarrollo para mejor rendimiento
  },
})


