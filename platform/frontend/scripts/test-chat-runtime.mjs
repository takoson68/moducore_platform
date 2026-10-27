import test from 'node:test'
import assert from 'node:assert/strict'
import { Chat, createMockWebSocketPair } from '../src/chat/index.js'

test('Chat 使用獨立 Container 並可 start／stop／dispose', async () => {
  const mock = createMockWebSocketPair()
  const chat = new Chat({ url: 'ws://mock', WebSocketImpl: mock.WebSocketImpl, reconnect: false })
  chat.start()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(chat.phase, 'running')
  assert.equal(chat.roomId, 'public')
  assert.equal(chat.store('messages').state.connectionStatus, 'connected')
  assert.equal(mock.sockets[0].url, 'ws://mock/?roomId=public')
  chat.stop()
  assert.equal(chat.store('messages').state.connectionStatus, 'stopped')
  chat.dispose()
  assert.equal(chat.phase, 'disposed')
})

test('Chat 建立 WebSocket 時會把 roomId 放入連線 URL', async () => {
  const mock = createMockWebSocketPair()
  const chat = new Chat({ url: 'wss://chat.example/ws/chat?source=game', roomId: 'game-demo', WebSocketImpl: mock.WebSocketImpl, reconnect: false })
  chat.start()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(chat.roomId, 'game-demo')
  assert.equal(mock.sockets[0].url, 'wss://chat.example/ws/chat?source=game&roomId=game-demo')
  chat.dispose()
})

test('MessageService 可驗證送出事件，MessageStore 去重並限制 ring buffer', () => {
  const mock = createMockWebSocketPair()
  const chat = new Chat({ url: 'ws://mock', WebSocketImpl: mock.WebSocketImpl, maxMessages: 2 })
  const messages = chat.store('messages')
  const event = { messageId: 'm1', sequence: 1, content: 'hello', serverTime: 1 }
  assert.equal(messages.addMessage(event), true)
  assert.equal(messages.addMessage(event), false)
  messages.addMessage({ ...event, messageId: 'm2', sequence: 2 })
  messages.addMessage({ ...event, messageId: 'm3', sequence: 3 })
  assert.deepEqual(messages.state.messages.map(item => item.messageId), ['m2', 'm3'])
  chat.dispose()
})

test('MessageStore 亂序到達仍排序正確，循序到達不整包重排', () => {
  const mock = createMockWebSocketPair()
  const chat = new Chat({ url: 'ws://mock', WebSocketImpl: mock.WebSocketImpl, maxMessages: 10 })
  const messages = chat.store('messages')
  messages.addMessage({ messageId: 'm1', sequence: 1, content: 'a' })
  messages.addMessage({ messageId: 'm2', sequence: 2, content: 'b' })
  messages.addMessage({ messageId: 'm0', sequence: 0, content: 'late-but-earlier' })
  assert.deepEqual(messages.state.messages.map(item => item.messageId), ['m0', 'm1', 'm2'])
  chat.dispose()
})

test('MessageStore.addMessages 批次合併歷史訊息並去重排序一次', () => {
  const mock = createMockWebSocketPair()
  const chat = new Chat({ url: 'ws://mock', WebSocketImpl: mock.WebSocketImpl, maxMessages: 10 })
  const messages = chat.store('messages')
  messages.addMessage({ messageId: 'm3', sequence: 3, content: 'c' })
  const added = messages.addMessages([
    { messageId: 'm1', sequence: 1, content: 'a' },
    { messageId: 'm2', sequence: 2, content: 'b' },
    { messageId: 'm3', sequence: 3, content: 'duplicate' },
  ])
  assert.equal(added, 2)
  assert.deepEqual(messages.state.messages.map(item => item.messageId), ['m1', 'm2', 'm3'])
  chat.dispose()
})

test('收到 chat.history 事件會將歷史訊息合併進 MessageStore', () => {
  const mock = createMockWebSocketPair()
  const chat = new Chat({ url: 'ws://mock', WebSocketImpl: mock.WebSocketImpl, maxMessages: 10 })
  chat.service('messages').receive({
    type: 'chat.history',
    payload: { messages: [
      { messageId: 'h1', sequence: 1, content: '歷史一' },
      { messageId: 'h2', sequence: 2, content: '歷史二' },
    ] },
  })
  assert.deepEqual(chat.store('messages').state.messages.map(item => item.messageId), ['h1', 'h2'])
  chat.dispose()
})

test('多個 Chat 實例的 Container 與 Store 彼此隔離', () => {
  const mockA = createMockWebSocketPair()
  const mockB = createMockWebSocketPair()
  const chatA = new Chat({ url: 'ws://a', WebSocketImpl: mockA.WebSocketImpl })
  const chatB = new Chat({ url: 'ws://b', WebSocketImpl: mockB.WebSocketImpl })
  assert.notEqual(chatA.container, chatB.container)
  assert.notEqual(chatA.store('messages'), chatB.store('messages'))
  chatA.store('messages').addMessage({ messageId: 'a1', sequence: 1, content: 'a' })
  assert.equal(chatB.store('messages').state.messages.length, 0)
  chatA.dispose()
  chatB.dispose()
})

test('Chat 可在閒置斷線後由使用者重新展開時重連', async () => {
  const mock = createMockWebSocketPair()
  const chat = new Chat({ url: 'ws://idle', WebSocketImpl: mock.WebSocketImpl })
  chat.start()
  await new Promise(resolve => setTimeout(resolve, 0))
  const firstSocket = mock.sockets[0]
  firstSocket._emit('close', { code: 4000, reason: 'idle_timeout' })
  assert.equal(chat.store('messages').state.connectionStatus, 'idle')
  chat.start()
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(mock.sockets.length, 2)
  assert.equal(chat.store('messages').state.connectionStatus, 'connected')
  chat.dispose()
})
