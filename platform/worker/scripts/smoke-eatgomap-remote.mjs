import assert from 'node:assert/strict'
import { deploymentTarget } from './deployment-targets.mjs'

const base = process.argv[2]
const targetName = process.argv[3]
const target = deploymentTarget(targetName)
assert.equal(targetName, 'eatgomap-staging')
assert.equal(base.replace(/\/$/, ''), target.base, '網址與目標必須一致')

const health = await fetch(new URL('/api/health', base))
assert.equal(health.status, 200)
assert.deepEqual(await health.json(), { ok: true, service: target.name, database: 'ok' })

const placeId = `eatgomap-smoke-${crypto.randomUUID()}`
const createResponse = await fetch(new URL('/api/eatgomap/favorites', base), {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ placeId }),
})
assert.equal(createResponse.status, 200)
const { item } = await createResponse.json()
assert.equal(item.id, placeId)
assert.equal(Object.hasOwn(item, 'name'), false)
assert.equal(Object.hasOwn(item, 'address'), false)

const readResponse = await fetch(new URL('/api/eatgomap/favorites', base))
assert.equal(readResponse.status, 200)
const readItems = (await readResponse.json()).items
assert.deepEqual(readItems.find(row => row.id === placeId), { id: placeId })

const deleteResponse = await fetch(new URL(`/api/eatgomap/favorites?placeId=${encodeURIComponent(placeId)}`, base), { method: 'DELETE' })
assert.equal(deleteResponse.status, 200)
assert.equal((await deleteResponse.json()).deleted, true)
console.log('eatGoMap API: D1 place_id-only create/read/delete passed')
