import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'Game',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: true,
    port: 5173
  }
});
