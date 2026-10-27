import WebSocket from 'ws'

const endpoint = process.argv[2]
if (!endpoint) throw new Error('缺少 WebSocket endpoint')

function connect() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(endpoint)
    const timeout = setTimeout(() => { socket.terminate(); reject(new Error('WebSocket 連線逾時')) }, 10000)
    socket.once('open', () => { clearTimeout(timeout); resolve(socket) })
    socket.once('error', reject)
  })
}

function nextMessage(socket) {
  return new Promise((resolve, reject) => {
    const onMessage = data => { cleanup(); resolve(JSON.parse(data.toString())) }
    const onError = error => { cleanup(); reject(error) }
    const timeout = setTimeout(() => { cleanup(); reject(new Error('WebSocket 訊息逾時')) }, 10000)
    const cleanup = () => { clearTimeout(timeout); socket.off('message', onMessage); socket.off('error', onError) }
    socket.on('message', onMessage)
    socket.once('error', onError)
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
