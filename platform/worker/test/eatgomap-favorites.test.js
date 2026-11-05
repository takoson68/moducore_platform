import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

const project = 'eatGoMap'
const base = 'https://example.test'
let mf, otherMf, db

const modules = ['index.js', 'auth.js', 'credentials.js', 'employees.js', 'response.js', 'eatgomap-favorites.js'].map(name => ({
  type: 'ESModule', path: fileURLToPath(new URL(`../src/${name}`, import.meta.url)),
}))

before(async () => {
  mf = new Miniflare(convertV4MiniflareOptions({
    modules,
    compatibilityDate: '2026-10-19',
    compatibilityFlags: ['nodejs_compat'],
    bindings: { PROJECT_ID: project },
    d1Databases: ['DB'],
  }))
  otherMf = new Miniflare(convertV4MiniflareOptions({
    modules,
    compatibilityDate: '2026-10-19',
    compatibilityFlags: ['nodejs_compat'],
    bindings: { PROJECT_ID: 'dineCore' },
  }))
  db = await mf.getD1Database('DB')
  const dir = new URL('../migrations/eatgomap/', import.meta.url)
  for (const file of (await readdir(dir)).filter(name => name.endsWith('.sql')).sort()) {
    const statements = (await readFile(new URL(file, dir), 'utf8')).split(';').map(value => value.trim()).filter(Boolean)
    await db.batch(statements.map(statement => db.prepare(statement)))
  }
})

after(async () => { await Promise.all([mf?.dispose(), otherMf?.dispose()]) })

function request(path, { method = 'GET', body } = {}) {
  return mf.dispatchFetch(`${base}${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

test('收藏 API 只接收並保存 Place ID', async () => {
  const placeId = `test-${crypto.randomUUID()}`
  const rejected = await request('/api/eatgomap/favorites', {
    method: 'POST', body: { placeId, customName: '不應保存的名稱' },
  })
  assert.equal(rejected.status, 400)
  const response = await request('/api/eatgomap/favorites', {
    method: 'POST', body: { placeId },
  })
  assert.equal(response.status, 200)
  const saved = (await response.json()).item
  assert.equal(saved.id, placeId)
  assert.deepEqual(await db.prepare('PRAGMA table_info(eatgomap_favorites)').all().then(({ results }) => results.map(row => row.name)),
    ['place_id'])
  const read = await request('/api/eatgomap/favorites')
  assert.deepEqual((await read.json()).items, [{ id: placeId }])
  assert.equal((await request('/api/eatgomap/favorites', { method: 'PATCH', body: { placeId } })).status, 405)
})

test('刪除 API 會移除收藏事實', async () => {
  const placeId = `delete-${crypto.randomUUID()}`
  await request('/api/eatgomap/favorites', { method: 'POST', body: { placeId } })
  const response = await request(`/api/eatgomap/favorites?placeId=${encodeURIComponent(placeId)}`, { method: 'DELETE' })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).deleted, true)
  const remaining = (await (await request('/api/eatgomap/favorites')).json()).items
  assert.equal(remaining.some(item => item.id === placeId), false)
})

test('未知 Project 看不到 eatGoMap 收藏路由', async () => {
  const other = await otherMf.dispatchFetch(`${base}/api/eatgomap/favorites`)
  assert.equal(other.status, 404)
})
