import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import viteConfig from '../vite.config.js'

test('game-demo 使用獨立 public，只保留入口實際引用的 favicon', async () => {
  const original = process.env.VITE_PROJECT
  process.env.VITE_PROJECT = 'game-demo'
  try {
    const config = viteConfig({ mode: 'production' })
    assert.equal(path.relative(process.cwd(), config.publicDir), 'projects/game-demo/public')
    assert.deepEqual((await readdir(config.publicDir)).sort(), ['vite.svg'])
    assert.equal(config.build.rollupOptions.output.inlineDynamicImports, false)
    assert.equal(config.build.rollupOptions.output.manualChunks('/repo/node_modules/p5/lib/app.js'), 'p5-engine')
    assert.equal(config.build.rollupOptions.output.manualChunks('/repo/src/main.js'), undefined)
    assert.match(config.resolve.alias['project-config-entry'], /projects\/game-demo\/project\.config\.js$/)
  } finally {
    if (original === undefined) delete process.env.VITE_PROJECT
    else process.env.VITE_PROJECT = original
  }
})

test('其他 Project 繼續使用共用 public，不受瘦身規則影響', () => {
  const original = process.env.VITE_PROJECT
  process.env.VITE_PROJECT = 'dineCore'
  try {
    const config = viteConfig({ mode: 'production' })
    assert.equal(path.relative(process.cwd(), config.publicDir), 'public')
    assert.equal(config.build.rollupOptions.output.inlineDynamicImports, true)
    assert.match(config.resolve.alias['project-config-entry'], /projects\/dineCore\/project\.config\.js$/)
  } finally {
    if (original === undefined) delete process.env.VITE_PROJECT
    else process.env.VITE_PROJECT = original
  }
})

test('game-demo 版本膠囊使用部署 Tag 注入的版本，不寫死舊版字串', async () => {
  const page = await readFile(new URL('../projects/game-demo/modules/playground/pages/index.vue', import.meta.url), 'utf8')
  assert.match(page, /VITE_RELEASE_VERSION/)
  assert.match(page, /\.game-demo-version\([^\n]+\) \{\{ releaseVersion \}\}/)
  assert.doesNotMatch(page, /\.game-demo-version[^\n]*v0\.1\.1/)
})

test('game-demo 以獨立 room namespace 掛載平台 Chat，不複製 Chat 核心', async () => {
  const config = await import('../projects/game-demo/project.config.js')
  assert.equal(config.default.chat.enabled, true)
  assert.equal(config.default.chat.roomId, 'game-demo')
  const page = await readFile(new URL('../projects/game-demo/modules/playground/pages/index.vue', import.meta.url), 'utf8')
  assert.match(page, /new Chat\(\{ url: projectConfig\.chat\.endpoint, roomId: projectConfig\.chat\.roomId \}\)/)
  assert.match(page, /chat\?\.dispose\(\)/)
  assert.doesNotMatch(page, /new Container\(/)
})
