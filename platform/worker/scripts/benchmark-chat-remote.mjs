import WebSocket from 'ws'
import { performance } from 'node:perf_hooks'

const endpoint = process.argv[2]
const count = Number(process.argv[3] || 20)
if (!endpoint) throw new Error('用法：node scripts/benchmark-chat-remote.mjs <wss-url> [count]')

function connect() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(endpoint)
    socket.queue = []
    socket.waiters = []
    socket.on('message', data => {
      const message = JSON.parse(data.toString())
      const waiter = socket.waiters.shift()
      if (waiter) waiter(message)
      else socket.queue.push(message)
    })
    socket.once('open', () => resolve(socket))
    socket.once('error', reject)
  })
}

function next(socket, timeoutMs = 10000) {
  if (socket.queue.length) return Promise.resolve(socket.queue.shift())
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket 訊息逾時')), timeoutMs)
    socket.waiters.push(message => { clearTimeout(timer); resolve(message) })
  })
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)]
}

const [sender, receiver] = await Promise.all([connect(), connect()])
try {
  const [senderReady, receiverReady] = await Promise.all([next(sender), next(receiver)])
  if (senderReady.type !== 'chat.ready' || receiverReady.type !== 'chat.ready') throw new Error('chat.ready 驗證失敗')
  const latencies = []
  for (let index = 0; index < count; index += 1) {
    const requestId = `m4b-${Date.now()}-${index}`
    const start = performance.now()
    sender.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId, payload: { roomId: 'public', content: `m4b-${index}` } }))
    let created
    while (!created) {
      const event = await next(receiver)
      if (event.type === 'chat.message.created' && event.payload?.content === `m4b-${index}`) created = event
    }
    latencies.push(performance.now() - start)
    await next(sender)
  }
  const output = {
    generatedAt: new Date().toISOString(),
    endpoint,
    messages: count,
    sender: senderReady.payload,
    receiver: receiverReady.payload,
    latencyMs: {
      min: Math.min(...latencies),
      median: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      max: Math.max(...latencies),
    },
  }
  console.log(JSON.stringify(output, null, 2))
} finally {
  sender.close()
  receiver.close()
}
