//- vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const project = env.VITE_PROJECT || 'project-a'
  const isCloudflareBuild = env.MODUCORE_DEPLOY_TARGET === 'cloudflare'
  // 目前專案以前後端同源為主，暫不使用 VITE_API_TARGET 覆寫 proxy 目標。
  // 若未來改回前後端分離部署，再評估是否重新啟用 env 控制。
  const apiTarget = 'http://moducore_platform.test'
  const projectOutDir = isCloudflareBuild
    ? 'dist'
    : path.join('projects', project, 'dist')
  const projectDir = path.resolve(__dirname, 'projects', project)
  // game-demo 不使用共用後台圖示或 mtk2mad 舊資產；以專用 public
  // 目錄避免 Vite 將整包共用 public 無條件複製到 Release ZIP。
  const publicDir = project === 'game-demo'
    ? path.join(projectDir, 'public')
    : path.resolve(__dirname, 'public')

  return {
    // Cloudflare 直接由 Worker Static Assets 讀取 dist；既有本機／PHP
    // build 仍保留複製到 backend/public 的流程。
    plugins: [vue(), ...(isCloudflareBuild ? [] : [copyDistToBackend(project)])],
    publicDir,
    build: {
      outDir: projectOutDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@app': path.resolve(__dirname, 'src/app'),
        '@project': path.resolve(__dirname, `projects/${project}`),
        'project-main-style-entry': path.resolve(projectDir, 'styles', 'sass', 'main.sass'),
        'project-layout-root-entry': path.resolve(projectDir, 'layout', 'LayoutRoot.vue'),
      },
    },
    server: {
      proxy: {
        '/assets/QRC': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/assets/QRC': {
          target: apiTarget,
          changeOrigin: true,
        },
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
      const preservedAssetDirNames = new Set(['QRC'])

      if (!sourceDir) {
        throw new Error(`[copy-dist-to-backend] build output not found: ${sourceCandidates.join(', ')}`)
      }

      await mkdir(backendPublicDir, { recursive: true })
      // 保留後端產生的 QRC 圖片，避免前端 build 時把桌號 QR 一起刪掉。
      if (existsSync(backendAssetsDir)) {
        const assetEntries = await readdir(backendAssetsDir, { withFileTypes: true })
        await Promise.all(
          assetEntries
            .filter(entry => !preservedAssetDirNames.has(entry.name))
            .map(entry =>
              rm(path.join(backendAssetsDir, entry.name), {
                recursive: true,
                force: true
              })
            )
        )
      }
      await cp(sourceDir, backendPublicDir, { force: true, recursive: true })
    },
  }
}
