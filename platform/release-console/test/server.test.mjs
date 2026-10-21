import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { request } from 'node:http'
import { assertSafeSnapshot, createReleaseConsoleServer } from '../server.mjs'

async function withServer(snapshotLoader, run) {
  const server = createReleaseConsoleServer({ snapshotLoader })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try { await run(`http://127.0.0.1:${server.address().port}`) }
  finally { server.close(); await once(server, 'close') }
}

function requestWithHost(base, host) {
  const target = new URL('/api/release-console', base)
  return new Promise((resolve, reject) => {
    const call = request(target, { headers: { host } }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(Buffer.concat(chunks)) }))
    })
    call.on('error', reject)
    call.end()
  })
}

test('控制台只接受回環 Host，非操作路由沒有寫入旁路', async () => {
  await withServer(async () => ({ status: 'healthy' }), async (base) => {
    const write = await fetch(`${base}/api/release-console`, { method: 'POST' })
    assert.equal(write.status, 405)
    assert.equal((await write.json()).error, 'METHOD_NOT_ALLOWED')

    const foreignHost = await requestWithHost(base, 'console.example.com')
    assert.equal(foreignHost.status, 403)
    assert.equal(foreignHost.body.error, 'LOOPBACK_ONLY')
  })
})

test('操作路由要求 same-origin JSON 並只呼叫受控服務', async () => {
  const calls = []
  const controlled = { mode: 'simulation', session: async () => ({}), refreshAll: async () => [], start: async (body) => { calls.push(body); return { status: 'queued' } }, cancel: async () => ({ status: 'cancelled' }) }
  const server = createReleaseConsoleServer({ snapshotLoader: async () => ({ status: 'healthy' }), operations: controlled })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    assert.equal((await fetch(`${base}/api/operations`, { method: 'POST' })).status, 403)
    const response = await fetch(`${base}/api/operations`, { method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'deploy' }) })
    assert.equal(response.status, 202)
    assert.equal(calls[0].action, 'deploy')
  } finally { server.close(); await once(server, 'close') }
})

test('Snapshot 不得把憑證或敏感欄位送到瀏覽器', () => {
  assert.doesNotThrow(() => assertSafeSnapshot({ projects: [{ tag: 'dep_game-demo_v0.1.0' }] }))
  assert.throws(() => assertSafeSnapshot({ githubToken: 'value' }), /敏感欄位/)
  assert.throws(() => assertSafeSnapshot({ message: 'Authorization: Bearer abc' }), /敏感內容/)
})

test('伺服器裁切內部錯誤並加上瀏覽器安全標頭', async () => {
  await withServer(async () => { throw new Error('ghp_private_value /Users/name') }, async (base) => {
    const response = await fetch(`${base}/api/release-console`)
    const body = await response.json()
    assert.equal(response.status, 503)
    assert.equal(body.message, '版本證據暫時無法查詢')
    assert.equal(JSON.stringify(body).includes('ghp_private_value'), false)
    assert.match(response.headers.get('content-security-policy'), /form-action 'none'/)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('x-frame-options'), 'DENY')
  })
})
