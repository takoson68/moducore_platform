import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

const project = process.env.VITE_PROJECT || 'project-a'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@project': path.resolve(__dirname, `projects/${project}`),
    },
  },
})
