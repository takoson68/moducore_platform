import assert from 'node:assert/strict'
import WebSocket from 'ws'

const endpoint = process.argv[2]
const endpointUrl = endpoint ? new URL(endpoint) : null
const isSecureEndpoint = endpointUrl?.protocol === 'wss:'
const isLocalEndpoint = endpointUrl?.protocol === 'ws:' && ['localhost', '127.0.0.1'].includes(endpointUrl.hostname)
if (!endpoint || (!isSecureEndpoint && !isLocalEndpoint)) {
  throw new Error('請提供 Staging WSS endpoint，或明確的 localhost WS endpoint')
}

function connect(roomId, peerId) {
  const socket = new WebSocket(`${endpoint}?roomId=${roomId}`)
  const events = []
  socket.on('message', raw => events.push(JSON.parse(String(raw))))
  const opened = new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })
  return { socket, events, opened, peerId }
}

async function waitFor(events, predicate, timeoutMs = 8000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const event = events.find(predicate)
    if (event) return event
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error('Staging Private Chat Lab Signaling event 逾時')
}

const roomId = `smoke-${crypto.randomUUID()}`
const first = connect(roomId, crypto.randomUUID())
const second = connect(roomId, crypto.randomUUID())
const third = connect(roomId, crypto.randomUUID())

try {
  await first.opened
  first.socket.send(JSON.stringify({ type: 'lab.join', payload: { peerId: first.peerId } }))
  const firstJoined = await waitFor(first.events, event => event.type === 'lab.joined')

  await second.opened
  second.socket.send(JSON.stringify({ type: 'lab.join', payload: { peerId: second.peerId } }))
  const secondJoined = await waitFor(second.events, event => event.type === 'lab.joined')

  await third.opened
  third.socket.send(JSON.stringify({ type: 'lab.join', payload: { peerId: third.peerId } }))
  const rejection = await waitFor(third.events, event => event.type === 'lab.error')
  assert.equal(rejection.payload.code, 'ROOM_FULL')

  first.socket.send(JSON.stringify({ type: 'lab.signal', payload: {
    to: secondJoined.payload.peerId,
    signal: { kind: 'offer', description: 'synthetic-staging-smoke-sdp' },
  } }))
  const forwarded = await waitFor(second.events, event => event.type === 'lab.signal')
  assert.equal(forwarded.payload.from, firstJoined.payload.peerId)
  assert.equal(forwarded.payload.signal.description, 'synthetic-staging-smoke-sdp')
  console.log('Private Chat Lab Staging Signaling passed: two peers joined, offer relayed, third peer rejected.')
} finally {
  for (const peer of [first, second, third]) {
    try { peer.socket.close() } catch { /* socket 尚未開啟時略過。 */ }
  }
}
