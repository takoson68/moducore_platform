import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { cp, mkdir, rm } from 'node:fs/promises'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const project = env.VITE_PROJECT || 'project-a'

  return {
    plugins: [vue(), copyDistToBackend(project)],
    build: {
      outDir: path.resolve(__dirname, 'projects', project, 'dist'),
      emptyOutDir: true,
    },
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
