//- vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { cp, mkdir, rm } from 'node:fs/promises'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const project = env.VITE_PROJECT || 'project-a'
  const apiTarget = env.VITE_API_TARGET || 'http://moducore_platform.test'
  const projectOutDir = path.join('projects', project, 'dist')

  return {
    plugins: [vue(), copyDistToBackend(project)],
    // 方案 A：單一 JS（目前啟用）
    build: {
      outDir: projectOutDir,
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
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

function copyDistToBackend(project) {
  let resolvedOutDir = path.resolve(__dirname, 'projects', project, 'dist')

  return {
    name: 'copy-dist-to-backend',
    apply: 'build',
    configResolved(config) {
      const outDir = config.build?.outDir || resolvedOutDir
      resolvedOutDir = path.isAbsolute(outDir)
        ? outDir
        : path.resolve(config.root || __dirname, outDir)
    },
    async closeBundle() {
      const sourceCandidates = [
        resolvedOutDir,
        path.resolve(__dirname, 'dist')
      ]
      const sourceDir = sourceCandidates.find(candidate => existsSync(candidate))
      const backendPublicDir = path.resolve(__dirname, '..', 'backend', 'public')
      const backendAssetsDir = path.join(backendPublicDir, 'assets')

      if (!sourceDir) {
        throw new Error(`[copy-dist-to-backend] build output not found: ${sourceCandidates.join(', ')}`)
      }

      await mkdir(backendPublicDir, { recursive: true })
      // Clean previous hashed build assets so old JS/CSS files do not accumulate.
      await rm(backendAssetsDir, { recursive: true, force: true })
      await cp(sourceDir, backendPublicDir, { force: true, recursive: true })
    },
  }
}
