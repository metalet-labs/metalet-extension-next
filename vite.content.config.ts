import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import baseConfig from './vite.base.config'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  ...baseConfig,
  plugins: [vue(), topLevelAwait()],
  define: {
    'process.env': {},
  },
  build: {
    emptyOutDir: false,
    outDir: resolve(__dirname, 'public'),
    lib: {
      entry: resolve(__dirname, 'src/content-script/main.ts'),
      name: 'Metalet',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.js',
        extend: true,
      },
    },
  },
})
