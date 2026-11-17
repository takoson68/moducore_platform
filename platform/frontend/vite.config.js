//- vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, __dirname, '')
  const isDevServer = command === 'serve' && !isPreview
  const projectEnvPath = path.join(__dirname, '.env')
  if (isDevServer && !existsSync(projectEnvPath)) {
    throw new Error('缺少 platform/frontend/.env，請在該檔設定 VITE_PROJECT。')
  }
  // 本機開發只從前端 .env 選擇 Project，發布建置沿用 CI 指定目標。
  const projectSettings = isDevServer ? parseEnv(readFileSync(projectEnvPath, 'utf8')) : env
  const project = isDevServer
    ? projectSettings.VITE_PROJECT?.trim()
    : env.VITE_PROJECT || 'project-a'
  if (isDevServer && (!project || !/^[A-Za-z0-9_-]+$/.test(project) ||
    !existsSync(path.join(__dirname, 'projects', project, 'project.config.js')))) {
    throw new Error('請在 platform/frontend/.env 設定有效的 VITE_PROJECT。')
  }
  const isCloudflareBuild = env.MODUCORE_DEPLOY_TARGET === 'cloudflare'
  const isDevHttps = process.env.VITE_DEV_HTTPS === 'true'
  // 目前專案以前後端同源為主，暫不使用 VITE_API_TARGET 覆寫 proxy 目標。
  // 若未來改回前後端分離部署，再評估是否重新啟用 env 控制。
  const apiTarget = project === 'eatGoMap'
    ? 'http://127.0.0.1:8790'
    : project === 'yi-ly' ? 'http://127.0.0.1:8787' : 'http://moducore_platform.test'
  const projectOutDir = isCloudflareBuild
    ? 'dist'
    : path.join('projects', project, 'dist')
  const projectDir = path.resolve(__dirname, 'projects', project)
  // game-demo 不使用共用後台圖示或 mtk2mad 舊資產；以專用 public
  // 目錄避免 Vite 將整包共用 public 無條件複製到 Release ZIP。
  const publicDir = project === 'game-demo'
    ? path.join(projectDir, 'public')
    : path.resolve(__dirname, 'public')
  const localHttps = isDevHttps
    ? {
        key: readFileSync(path.join(__dirname, '.certs', 'eatgomap-key.pem')),
        cert: readFileSync(path.join(__dirname, '.certs', 'eatgomap-cert.pem')),
      }
    : undefined

  return {
    // Cloudflare 直接由 Worker Static Assets 讀取 dist；既有本機／PHP
    // build 仍保留複製到 backend/public 的流程。
    plugins: [vue(), ...(isCloudflareBuild ? [] : [copyDistToBackend(project)])],
    publicDir,
    ...(isDevServer ? { define: { 'import.meta.env.VITE_PROJECT': JSON.stringify(project) } } : {}),
    build: {
      outDir: projectOutDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // game-demo 的 route 與 p5 都是動態匯入；不可再把它們壓回
          // 單一入口，否則平板首次載入仍需先下載完整遊戲引擎。
          inlineDynamicImports: project !== 'game-demo',
          manualChunks: project === 'game-demo'
            ? (id) => /\/node_modules\/(p5|zod)\//.test(id) ? 'p5-engine' : undefined
            : undefined,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@app': path.resolve(__dirname, 'src/app'),
        '@project': path.resolve(__dirname, `projects/${project}`),
        'project-config-entry': path.resolve(projectDir, 'project.config.js'),
        'project-main-style-entry': path.resolve(projectDir, 'styles', 'sass', 'main.sass'),
        'project-layout-root-entry': path.resolve(projectDir, 'layout', 'LayoutRoot.vue'),
      },
    },
    server: {
      ...(isDevServer && projectSettings.VITE_DEV_HOST ? { host: projectSettings.VITE_DEV_HOST } : {}),
      ...(isDevHttps ? { host: '0.0.0.0', port: 5174, https: localHttps } : {}),
      // Google Maps JavaScript API 金鑰依網站來源授權；eatGoMap 固定 5180。
      ...(project === 'eatGoMap' && !isDevHttps
        ? { port: 5180, strictPort: true }
        : !isDevHttps ? { port: 5181 } : {}),
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
