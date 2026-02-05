import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'rte-vue': path.resolve(__dirname, '../src/index.ts')
    },
    extensions: ['.ts', '.vue', '.js']
  },
  optimizeDeps: {
    include: ['@tiptap/vue-3', '@tiptap/starter-kit', '@tiptap/extension-link', 'markdown-it', 'turndown']
  }
})
