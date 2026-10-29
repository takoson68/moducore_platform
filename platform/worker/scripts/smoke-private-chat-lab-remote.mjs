import assert from 'node:assert/strict'
import WebSocket from 'ws'

const endpoint = process.argv[2]
const endpointUrl = endpoint ? new URL(endpoint) : null
const isSecureEndpoint = endpointUrl?.protocol === 'wss:'
const isLocalEndpoint = endpointUrl?.protocol === 'ws:' && ['localhost', '127.0.0.1'].includes(endpointUrl.hostname)
if (!endpoint || (!isSecureEndpoint && !isLocalEndpoint)) {
  throw new Error('請提供 Staging WSS endpoint，或明確的 localhost WS endpoint')
}

const roomId = `smoke-${crypto.randomUUID()}`
const socket = new WebSocket(`${endpoint}?roomId=${roomId}`)
socket.on('error', () => {})
const status = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('WebSocket handshake timed out')), 8000)
  socket.once('open', () => { clearTimeout(timeout); reject(new Error('未帶 Ticket 的匿名 WebSocket 不應連線成功')) })
  socket.once('error', error => { clearTimeout(timeout); reject(error) })
  socket.once('unexpected-response', (_request, response) => {
    clearTimeout(timeout)
    resolve(response.statusCode)
    response.resume()
    socket.terminate()
  })
})
assert.equal(status, 400)
console.log('Private Chat Lab Staging gate passed: WebSocket requests without a short-lived one-time ticket are rejected.')
