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
