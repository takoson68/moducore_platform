//- vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { cp, mkdir, rm } from 'node:fs/promises'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const project = env.VITE_PROJECT || 'project-a'

  return {
    plugins: [vue(), copyDistToBackend(project)],
    // 方案 A：單一 JS（目前啟用）
    build: {
      outDir: path.resolve(__dirname, 'projects', project, 'dist'),
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          manualChunks: undefined,
        },
      },
    },
    // 方案 B：允許拆分，但合併小於 300kb 的 chunk
    // build: {
    //   outDir: path.resolve(__dirname, 'projects', project, 'dist'),
    //   emptyOutDir: true,
    //   // 取消 CSS 拆分，避免產生大量小檔案
    //   cssCodeSplit: false,
    //   // 超過門檻才提示 chunk 過大，目標是讓單檔維持在 300kb 內
    //   chunkSizeWarningLimit: 300,
    //   rollupOptions: {
    //     output: {
    //       // 小於 300kb 的 chunk 會被合併，避免過度切分
    //       experimentalMinChunkSize: 300 * 1024,
    //     },
    //   },
    // },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@app': path.resolve(__dirname, 'src/app'),
        '@project': path.resolve(__dirname, `projects/${project}`),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://moducore_platform.test',
          changeOrigin: true,
        },
      },
    },
  }
})

function copyDistToBackend(project) {
  return {
    name: 'copy-dist-to-backend',
    apply: 'build',
    async closeBundle() {
      const projectDistDir = path.resolve(__dirname, 'projects', project, 'dist')
      const backendPublicDir = path.resolve(__dirname, '..', 'backend', 'public')
      const backendAssetsDir = path.join(backendPublicDir, 'assets')
      await mkdir(backendPublicDir, { recursive: true })
      await rm(backendAssetsDir, { force: true, recursive: true })
      await cp(projectDistDir, backendPublicDir, { force: true, recursive: true })
    },
  }
}
