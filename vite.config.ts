
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    legacy({
      targets: ['chrome >= 60', 'android >= 9'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  build: {
    cssCodeSplit: false,
    target: ['es2015', 'chrome60'],
    minify: 'terser',
    outDir: 'dist',
    emptyOutDir: true,
    cssTarget: 'chrome60',
  }
});
