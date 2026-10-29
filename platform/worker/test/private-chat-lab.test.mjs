import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

const workerPath = fileURLToPath(new URL('../src/private-chat-lab.js', import.meta.url))

async function createRuntime() {
  return new Miniflare(convertV4MiniflareOptions({
    modules: [{ type: 'ESModule', path: 'worker/src/private-chat-lab.js', contents: await readFile(workerPath, 'utf8') }],
    compatibilityDate: '2026-10-19',
    durableObjects: { PRIVATE_CHAT_LAB: { className: 'PrivateChatLabRoom', useSQLite: true } },
    port: 0,
  }))
}

async function connect(base, roomId, peerId) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${base}ws/private-chat-lab?roomId=${roomId}`)
    const messages = []
    socket.on('message', data => messages.push(JSON.parse(String(data))))
    socket.once('open', () => {
      socket.send(JSON.stringify({ type: 'lab.join', payload: { peerId } }))
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
  throw new Error('等待 private chat lab event 逾時')
}

test('獨立 Signaling Worker 只處理實驗 WebSocket 路徑，拒絕一般 HTTP 與其他路徑', async () => {
  const mf = await createRuntime()
  try {
    const http = await mf.dispatchFetch('http://localhost/ws/private-chat-lab?roomId=m1-lab')
    assert.equal(http.status, 426)
    const other = await mf.dispatchFetch('http://localhost/ws/chat?roomId=public')
    assert.equal(other.status, 404)
  } finally {
    await mf.dispose()
  }
})

test('同一合成房間可加入兩個 Peer 並雙向轉送 offer 與 ICE candidate', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).toString()
    const first = await connect(base, 'm1-lab', '00000000-0000-4000-8000-000000000001')
    const second = await connect(base, 'm1-lab', '00000000-0000-4000-8000-000000000002')
    const firstJoined = await waitFor(first.messages, event => event.type === 'lab.joined')
    const secondJoined = await waitFor(second.messages, event => event.type === 'lab.joined')
    await waitFor(first.messages, event => event.type === 'lab.peer-joined')
    assert.deepEqual(firstJoined.payload.peers, [])
    assert.deepEqual(secondJoined.payload.peers, [firstJoined.payload.peerId])

    first.socket.send(JSON.stringify({ type: 'lab.signal', payload: {
      to: secondJoined.payload.peerId,
      signal: { kind: 'offer', description: 'synthetic-sdp-offer' },
    } }))
    const offer = await waitFor(second.messages, event => event.type === 'lab.signal')
    assert.equal(offer.payload.from, firstJoined.payload.peerId)
    assert.equal(offer.payload.signal.description, 'synthetic-sdp-offer')

    second.socket.send(JSON.stringify({ type: 'lab.signal', payload: {
      to: firstJoined.payload.peerId,
      signal: { kind: 'candidate', candidate: null },
    } }))
    const candidate = await waitFor(first.messages, event => event.type === 'lab.signal')
    assert.equal(candidate.payload.from, secondJoined.payload.peerId)
    assert.equal(candidate.payload.signal.candidate, null)

    first.socket.close()
    second.socket.close()
  } finally {
    await mf.dispose()
  }
})

test('實驗房間只允許兩個 Peer，其他房間保持隔離', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).toString()
    const first = await connect(base, 'm1-lab', '00000000-0000-4000-8000-000000000011')
    await waitFor(first.messages, event => event.type === 'lab.joined')
    const second = await connect(base, 'm1-lab', '00000000-0000-4000-8000-000000000012')
    await waitFor(second.messages, event => event.type === 'lab.joined')
    const third = await connect(base, 'm1-lab', '00000000-0000-4000-8000-000000000013')
    const rejected = await waitFor(third.messages, event => event.type === 'lab.error')
    assert.equal(rejected.payload.code, 'ROOM_FULL')

    const otherRoom = await connect(base, 'other-lab', '00000000-0000-4000-8000-000000000014')
    await waitFor(otherRoom.messages, event => event.type === 'lab.joined')
    assert.equal(otherRoom.messages.some(event => event.type === 'lab.peer-joined'), false)

    first.socket.close()
    second.socket.close()
    third.socket.close()
    otherRoom.socket.close()
  } finally {
    await mf.dispose()
  }
})
