import assert from 'node:assert/strict'
import WebSocket from 'ws'

const endpoint = process.argv[2]
const endpointUrl = endpoint ? new URL(endpoint) : null
const isSecureEndpoint = endpointUrl?.protocol === 'wss:'
const isLocalEndpoint = endpointUrl?.protocol === 'ws:' && ['localhost', '127.0.0.1'].includes(endpointUrl.hostname)
if (!endpoint || (!isSecureEndpoint && !isLocalEndpoint)) {
  throw new Error('請提供 Staging WSS endpoint，或明確的 localhost WS endpoint')
}

async function connect(roomId, peerId) {
  let socket
  let lastError
  for (let attempt = 0; attempt < 6; attempt += 1) {
    socket = new WebSocket(`${endpoint}?roomId=${roomId}`)
    socket.on('error', () => {})
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('WebSocket handshake timed out')), 5000)
        socket.once('open', () => { clearTimeout(timeout); resolve() })
        socket.once('error', error => { clearTimeout(timeout); reject(error) })
        socket.once('unexpected-response', (_request, response) => {
          clearTimeout(timeout)
          reject(new Error(`WebSocket handshake returned HTTP ${response.statusCode}`))
        })
      })
      break
    } catch (error) {
      lastError = error
      socket.terminate()
      if (attempt === 5) throw lastError
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  const events = []
  socket.on('message', raw => events.push(JSON.parse(String(raw))))
  return { socket, events, peerId }
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
const [first, second, third] = await Promise.all([
  connect(roomId, crypto.randomUUID()),
  connect(roomId, crypto.randomUUID()),
  connect(roomId, crypto.randomUUID()),
])

try {
  first.socket.send(JSON.stringify({ type: 'lab.join', payload: { peerId: first.peerId } }))
  const firstJoined = await waitFor(first.events, event => event.type === 'lab.joined')

  second.socket.send(JSON.stringify({ type: 'lab.join', payload: { peerId: second.peerId } }))
  const secondJoined = await waitFor(second.events, event => event.type === 'lab.joined')

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
    try {
      peer.socket.close()
      const terminateTimer = setTimeout(() => peer.socket.terminate(), 500)
      terminateTimer.unref?.()
    } catch { /* socket 已結束時略過。 */ }
  }
}
