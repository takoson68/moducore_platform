import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

const workerPath = fileURLToPath(new URL('../src/private-chat-lab.js', import.meta.url))
const SESSION_SECRET = 'synthetic-chatcore-session-secret-for-tests'

async function createRuntime(memberNames = 'member1,member2,member3') {
  return new Miniflare(convertV4MiniflareOptions({
    modules: [{ type: 'ESModule', path: 'worker/src/private-chat-lab.js', contents: await readFile(workerPath, 'utf8') }],
    compatibilityDate: '2026-10-19',
    bindings: { CHATCORE_SESSION_SECRET: SESSION_SECRET, CHATCORE_MEMBER_USERNAMES: memberNames },
    serviceBindings: {
      AUTH_SERVICE: async request => {
        const url = new URL(request.url)
        if (url.pathname === '/api/login' && request.method === 'POST') {
          const body = await request.json()
          if (body.password !== 'synthetic-password') return Response.json({ success: false }, { status: 401 })
          const id = Number(body.username.replace('member', ''))
          return Response.json({ success: true, token: 'a'.repeat(64), user: { id, tenant_id: 'dineCore', username: body.username, name: `Member ${id}`, role: 'member' } })
        }
        if (url.pathname === '/api/logout') return Response.json({ success: true })
        return Response.json({ success: false }, { status: 404 })
      },
    },
    durableObjects: {
      PRIVATE_CHAT_LAB: { className: 'PrivateChatLabRoom', useSQLite: true },
      CHATCORE_AUTH: { className: 'ChatCoreAuth', useSQLite: true },
    },
    port: 0,
  }))
}

async function api(base, path, { method = 'GET', body, token, project = 'chatCore' } = {}) {
  const headers = { 'X-Project': project }
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
}
async function login(base, username = 'member1') {
  const response = await api(base, '/api/login', { method: 'POST', body: { username, password: 'synthetic-password' } })
  const data = await response.json()
  assert.equal(response.status, 200)
  return data
}
async function ticket(base, token, roomId = 'm4-room', deviceId = crypto.randomUUID()) {
  const response = await api(base, '/api/private-chat/ticket', { method: 'POST', token, body: { roomId, deviceId } })
  return { response, data: await response.json() }
}
async function connect(base, roomId, value) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${base}/ws/private-chat-lab?roomId=${roomId}&ticket=${value}`)
    const messages = []
    socket.on('message', data => messages.push(JSON.parse(String(data))))
    socket.once('open', () => {
      socket.send(JSON.stringify({ type: 'lab.join', payload: { peerId: crypto.randomUUID() } }))
      resolve({ socket, messages })
    })
    socket.once('error', reject)
  })
}
async function waitFor(messages, predicate) {
  const started = Date.now()
  while (Date.now() - started < 1500) {
    const event = messages.find(predicate)
    if (event) return event
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error(`等待 private chat lab event 逾時：${JSON.stringify(messages)}`)
}

test('ChatCore 僅接受 chatCore Project 標頭；拒絕一般 HTTP 與其他路徑', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).origin
    assert.equal((await fetch(`${base}/ws/private-chat-lab?roomId=m4-room`)).status, 426)
    const anonymousSocket = new WebSocket(`${base}/ws/private-chat-lab?roomId=m4-room`)
    const anonymousStatus = await new Promise(resolve => anonymousSocket.once('unexpected-response', (_request, response) => resolve(response.statusCode)))
    assert.equal(anonymousStatus, 400)
    assert.equal((await fetch(`${base}/ws/other`)).status, 404)
    const mismatch = await api(base, '/api/login', { method: 'POST', body: { username: 'member1', password: 'synthetic-password' }, project: 'dineCore' })
    assert.equal(mismatch.status, 403)
    const dinecoreBearer = await api(base, '/api/session', { token: 'a'.repeat(64) })
    assert.equal((await dinecoreBearer.json()).authenticated, false)
  } finally { await mf.dispose() }
})

test('dineCore 登入只映射實驗名單會員為 ChatCore Session；ticket 可加入並只能使用一次', async () => {
  const mf = await createRuntime('member1,member2')
  try {
    const base = (await mf.ready).origin
    const outside = await api(base, '/api/login', { method: 'POST', body: { username: 'member3', password: 'synthetic-password' } })
    assert.equal((await outside.json()).error.code, 'NOT_IN_CHATCORE_EXPERIMENT')
    const identity = await login(base)
    assert.equal(identity.user.tenant_id, 'chatCore')
    const session = await api(base, '/api/session', { token: identity.token })
    assert.equal((await session.json()).authenticated, true)
    const issued = await ticket(base, identity.token)
    assert.equal(issued.response.status, 200)
    const peer = await connect(base, 'm4-room', issued.data.ticket)
    const joined = await waitFor(peer.messages, event => event.type === 'lab.joined')
    assert.equal(joined.payload.user.id, 1)
    const replay = new WebSocket(`${base}/ws/private-chat-lab?roomId=m4-room&ticket=${issued.data.ticket}`)
    const rejected = await new Promise(resolve => replay.once('unexpected-response', (_request, response) => resolve(response.statusCode)))
    assert.equal(rejected, 401)
    await api(base, '/api/logout', { method: 'POST', token: identity.token })
    const revoked = await api(base, '/api/private-chat/ticket', { method: 'POST', token: identity.token, body: { roomId: 'm4-room', deviceId: crypto.randomUUID() } })
    assert.equal(revoked.status, 401)
    const closeCode = new Promise(resolve => peer.socket.once('close', code => resolve(code)))
    peer.socket.send(JSON.stringify({ type: 'lab.signal', payload: {} }))
    assert.equal(await closeCode, 4003)

  } finally { await mf.dispose() }
})

test('同房 Peer 可互送 Signaling，跨房目標不可解析', async () => {
  const mf = await createRuntime('member1,member2,member3')
  try {
    const base = (await mf.ready).origin
    const firstLogin = await login(base, 'member1')
    const secondLogin = await login(base, 'member2')
    const thirdLogin = await login(base, 'member3')
    const firstTicket = (await ticket(base, firstLogin.token, 'm4-room')).data.ticket
    const secondTicket = (await ticket(base, secondLogin.token, 'm4-room')).data.ticket
    const thirdTicket = (await ticket(base, thirdLogin.token, 'other-room')).data.ticket
    const first = await connect(base, 'm4-room', firstTicket)
    const second = await connect(base, 'm4-room', secondTicket)
    const otherRoom = await connect(base, 'other-room', thirdTicket)
    const firstJoined = await waitFor(first.messages, event => event.type === 'lab.joined')
    const secondJoined = await waitFor(second.messages, event => event.type === 'lab.joined')
    const thirdJoined = await waitFor(otherRoom.messages, event => event.type === 'lab.joined')
    first.socket.send(JSON.stringify({ type: 'lab.signal', payload: { to: secondJoined.payload.peerId, signal: { kind: 'offer', description: 'synthetic-sdp-offer' } } }))
    const offer = await waitFor(second.messages, event => event.type === 'lab.signal')
    assert.equal(offer.payload.from, firstJoined.payload.peerId)
    first.socket.send(JSON.stringify({ type: 'lab.signal', payload: { to: thirdJoined.payload.peerId, signal: { kind: 'candidate', candidate: null } } }))
    assert.equal((await waitFor(first.messages, event => event.type === 'lab.error')).payload.code, 'PEER_NOT_FOUND')
    first.socket.close(); second.socket.close(); otherRoom.socket.close()
  } finally { await mf.dispose() }
})

test('房間拒絕第 21 個在線裝置；同帳號多裝置使用不同 Peer 身分', async () => {
  const mf = await createRuntime('member1')
  try {
    const base = (await mf.ready).origin
    const identity = await login(base)
    const extraTicket = await ticket(base, identity.token, 'full-room')
    const peers = []
    for (let index = 0; index < 20; index += 1) {
      const issued = await ticket(base, identity.token, 'full-room')
      peers.push(await connect(base, 'full-room', issued.data.ticket))
      const joined = await waitFor(peers[index].messages, event => event.type === 'lab.joined')
      assert.ok(joined.payload.peerId)
    }
    const extra = new WebSocket(`${base}/ws/private-chat-lab?roomId=full-room&ticket=${extraTicket.data.ticket}`)
    const rejected = await new Promise(resolve => extra.once('unexpected-response', (_request, response) => resolve(response.statusCode)))
    assert.equal(rejected, 409)
    const ids = peers.map(peer => peer.messages.find(event => event.type === 'lab.joined').payload.peerId)
    assert.equal(new Set(ids).size, 20)
    for (const peer of peers) peer.socket.close()
  } finally { await mf.dispose() }
})
