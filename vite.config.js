import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // Automatically open browser on server start
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}); 