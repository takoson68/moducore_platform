import assert from 'node:assert/strict'
import test from 'node:test'
import { readdir } from 'node:fs/promises'
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
