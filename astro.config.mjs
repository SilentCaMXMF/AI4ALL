import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://freeai4all.duckdns.org',
  base: '/',
  outDir: './dist',
  publicDir: './public',
  srcDir: './src',
  compressHTML: true,
  build: {
    format: 'directory',
  },
  server: {
    port: 4321,
    host: process.env.NODE_ENV === 'production' ? false : true,
  },
  vite: {
    build: {
      sourcemap: false,
      minify: 'esbuild',
    },
  },
});