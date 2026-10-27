import WebSocket from 'ws'

const endpoint = process.argv[2]
if (!endpoint) throw new Error('缺少 WebSocket endpoint')

async function connect() {
  let lastError
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await new Promise((resolve, reject) => {
    const socket = new WebSocket(endpoint)
    socket.chatSmokeQueue = []
    socket.chatSmokeWaiters = []
    socket.on('message', data => {
      const message = JSON.parse(data.toString())
      const waiter = socket.chatSmokeWaiters.shift()
      if (waiter) waiter(message)
      else socket.chatSmokeQueue.push(message)
    })
    const timeout = setTimeout(() => { socket.terminate(); reject(new Error('WebSocket 連線逾時')) }, 10000)
    socket.once('open', () => { clearTimeout(timeout); resolve(socket) })
    socket.once('error', reject)
      })
    } catch (error) {
      lastError = error
      if (attempt < 6) await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
  throw lastError
}

function nextMessage(socket) {
  if (socket.chatSmokeQueue.length > 0) return Promise.resolve(socket.chatSmokeQueue.shift())
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const index = socket.chatSmokeWaiters.indexOf(resolveMessage)
      if (index >= 0) socket.chatSmokeWaiters.splice(index, 1)
      reject(new Error('WebSocket 訊息逾時'))
    }, 10000)
    const resolveMessage = message => { clearTimeout(timeout); resolve(message) }
    socket.chatSmokeWaiters.push(resolveMessage)
  })
}

const [first, second] = await Promise.all([connect(), connect()])
try {
  const firstReady = await nextMessage(first)
  const secondReady = await nextMessage(second)
  if (firstReady.type !== 'chat.ready' || secondReady.type !== 'chat.ready') throw new Error('chat.ready 驗證失敗')
  const requestId = `smoke-${Date.now()}`
  first.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId, payload: { roomId: 'public', content: 'staging-smoke' } }))
  const messages = await Promise.all([nextMessage(first), nextMessage(second)])
  const created = messages.find(message => message.type === 'chat.message.created')
  const ack = messages.find(message => message.type === 'chat.message.ack')
  if (!created || created.payload.content !== 'staging-smoke') throw new Error('廣播訊息驗證失敗')
  if (!ack || ack.requestId !== requestId) throw new Error('訊息確認驗證失敗')
  console.log('Chat WebSocket smoke passed')
} finally {
  first.close()
  second.close()
}
