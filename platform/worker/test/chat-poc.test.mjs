import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import WebSocket from 'ws'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

const workerPath = fileURLToPath(new URL('../src/chat-poc.js', import.meta.url))
const platformRoot = fileURLToPath(new URL('../../', import.meta.url))
const contractPath = path.join(platformRoot, 'chat-contract/index.js')

async function createRuntime(projectId = 'magic-siege', extraBindings = {}) {
  const modules = [
    { type: 'ESModule', path: 'worker/src/chat-poc.js', contents: await readFile(workerPath, 'utf8') },
    { type: 'ESModule', path: 'chat-contract/index.js', contents: await readFile(contractPath, 'utf8') },
  ]
  return new Miniflare(convertV4MiniflareOptions({
    modules,
    rootPath: platformRoot,
    modulesRoot: platformRoot,
    compatibilityDate: '2026-10-19',
    durableObjects: {
      PUBLIC_CHAT: { className: 'PublicChat', useSQLite: true },
      CHAT_DIRECTORY: { className: 'ChatDirectory', useSQLite: true },
    },
    bindings: { PROJECT_ID: projectId, CHAT_NAMESPACE_VERSION: '2', ...extraBindings },
    port: 0,
  }))
}

function connect(base, roomId = 'public') {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${base}ws/chat?roomId=${roomId}`)
    const messages = []
    socket.on('message', (data) => messages.push(JSON.parse(String(data))))
    socket.once('open', () => resolve({ socket, messages }))
    socket.once('error', reject)
  })
}

async function waitFor(messages, predicate) {
  const started = Date.now()
  while (Date.now() - started < 1500) {
    const found = messages.find(predicate)
    if (found) return found
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('等待聊天事件逾時')
}

test('公共房間可建立連線、廣播訊息並回傳伺服器身分', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).toString()
    const first = await connect(base)
    const second = await connect(base)
    const firstReady = await waitFor(first.messages, (event) => event.type === 'chat.ready')
    const secondReady = await waitFor(second.messages, (event) => event.type === 'chat.ready')
    assert.equal(firstReady.payload.playerId, 'player_001')
    assert.equal(firstReady.payload.displayName, '玩家001')
    assert.equal(secondReady.payload.playerId, 'player_002')
    assert.notEqual(firstReady.payload.connectionId, secondReady.payload.connectionId)

    first.socket.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId: 'req-1',
      payload: { roomId: 'public', content: '大家好' } }))

    const created = await waitFor(second.messages, (event) => event.type === 'chat.message.created')
    const acknowledgement = await waitFor(first.messages, (event) => event.type === 'chat.message.ack')
    assert.equal(created.payload.content, '大家好')
    assert.match(created.payload.messageId, /^msg_\w+/)
    assert.equal(created.payload.sender.id, 'player_001')
    assert.equal(created.payload.sender.displayName, '玩家001')
    assert.equal(created.payload.sender.playerNumber, 1)
    assert.equal(acknowledgement.payload.messageId, created.payload.messageId)

    first.socket.close()
    second.socket.close()
  } finally {
    await mf.dispose()
  }
})

// 透過 Miniflare binding 直接取得 DO stub 讀取內部狀態，不經過公開 Worker 路由，
// 避免把 /internal/connections 變成可被外部猜中 Header 存取的公開端點。
async function readConnectionCount(mf, projectId = 'magic-siege', roomId = 'public') {
  const { PUBLIC_CHAT } = await mf.getBindings()
  const id = PUBLIC_CHAT.idFromName(`${projectId}:${roomId}:v2`)
  const response = await PUBLIC_CHAT.get(id).fetch('https://internal/internal/connections', {
    headers: { 'X-Chat-Internal': '1' },
  })
  const data = await response.json()
  return data.connections
}

test('連線關閉後不殘留可觀察的連線（PublicChat.connections 正確遞減）', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).toString()
    const first = await connect(base)
    const second = await connect(base)
    await waitFor(first.messages, (event) => event.type === 'chat.ready')
    await waitFor(second.messages, (event) => event.type === 'chat.ready')
    assert.equal(await readConnectionCount(mf), 2)

    first.socket.close()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assert.equal(await readConnectionCount(mf), 1)

    second.socket.close()
    await new Promise((resolve) => setTimeout(resolve, 100))
    assert.equal(await readConnectionCount(mf), 0)
  } finally {
    await mf.dispose()
  }
})

test('Hibernation alarm 會在閒置逾時後關閉連線並可重新排程', async () => {
  // 全量測試並行時，其他測試（例如 scrypt 雜湊）會明顯佔用 CPU、延後計時器；
  // idle timeout 與 keep-alive 間隔需要夠大的餘裕，避免在高負載下誤判 active 連線為逾時。
  const IDLE_TIMEOUT_MS = 2000
  const KEEP_ALIVE_INTERVAL_MS = 150
  const mf = await createRuntime('magic-siege', { CHAT_IDLE_TIMEOUT_MS: String(IDLE_TIMEOUT_MS) })
  try {
    const base = (await mf.ready).toString()
    const idle = await connect(base)
    const active = await connect(base)
    await waitFor(idle.messages, (event) => event.type === 'chat.ready')
    await waitFor(active.messages, (event) => event.type === 'chat.ready')
    assert.equal(await readConnectionCount(mf), 2)

    // active 持續送 ping 讓自己的 lastActiveAt 保持更新，idle 完全不動作應該先被 alarm 關閉。
    const keepAlive = setInterval(() => {
      try {
        active.socket.send(JSON.stringify({ version: 1, type: 'chat.ping', requestId: `ping-${Date.now()}`, payload: {} }))
      } catch { /* socket 可能已關閉 */ }
    }, KEEP_ALIVE_INTERVAL_MS)

    try {
      // 直接輪詢 DO 內部連線數（透過 binding），不依賴 ws client 端 close 事件的傳遞時機；
      // Miniflare 本機模擬的 DO alarm 觸發延遲明顯高於設定的 idle timeout 本身，需給足餘裕等待。
      const started = Date.now()
      let count = await readConnectionCount(mf)
      while (count !== 1 && Date.now() - started < IDLE_TIMEOUT_MS * 10) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        count = await readConnectionCount(mf)
      }
      assert.equal(count, 1)
      assert.equal(active.socket.readyState, WebSocket.OPEN)
    } finally {
      clearInterval(keepAlive)
      active.socket.close()
    }
  } finally {
    await mf.dispose()
  }
})

test('之後加入的連線會收到先前訊息的 chat.history 回放', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).toString()
    const first = await connect(base)
    await waitFor(first.messages, (event) => event.type === 'chat.ready')

    first.socket.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId: 'hist-1',
      payload: { roomId: 'public', content: '第一則' } }))
    await waitFor(first.messages, (event) => event.type === 'chat.message.ack')
    first.socket.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId: 'hist-2',
      payload: { roomId: 'public', content: '第二則' } }))
    await waitFor(first.messages, (event) => event.type === 'chat.message.created' && event.payload.content === '第二則')

    const second = await connect(base)
    const history = await waitFor(second.messages, (event) => event.type === 'chat.history')
    assert.deepEqual(history.payload.messages.map((item) => item.content), ['第一則', '第二則'])
    assert.ok(history.payload.messages[0].sequence < history.payload.messages[1].sequence)

    first.socket.close()
    second.socket.close()
  } finally {
    await mf.dispose()
  }
})

test('不同房間不會互相廣播，非法事件只回傳錯誤', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).toString()
    const publicRoom = await connect(base, 'public')
    const otherRoom = await connect(base, 'other')
    await waitFor(publicRoom.messages, (event) => event.type === 'chat.ready')
    await waitFor(otherRoom.messages, (event) => event.type === 'chat.ready')

    publicRoom.socket.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId: 'bad',
      senderId: 'forged', payload: { roomId: 'public', content: '拒絕' } }))
    const error = await waitFor(publicRoom.messages, (event) => event.type === 'chat.error')
    assert.equal(error.error.code, 'UNKNOWN_FIELD')

    publicRoom.socket.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId: 'ok',
      payload: { roomId: 'public', content: '只給同房間' } }))
    await waitFor(publicRoom.messages, (event) => event.type === 'chat.message.created')
    await new Promise((resolve) => setTimeout(resolve, 80))
    assert.equal(otherRoom.messages.some((event) => event.type === 'chat.message.created'), false)

    publicRoom.socket.close()
    otherRoom.socket.close()
  } finally {
    await mf.dispose()
  }
})

test('非 WebSocket 請求不會被當成聊天連線接受', async () => {
  const mf = await createRuntime()
  try {
    const response = await mf.dispatchFetch('http://localhost/ws/chat?roomId=public')
    assert.equal(response.status, 426)
  } finally {
    await mf.dispose()
  }
})

test('聊天室目錄可公開讀取，但建立聊天室必須是管理員', async () => {
  const mf = await createRuntime()
  try {
    const base = (await mf.ready).toString()
    const client = await connect(base, 'public')
    await waitFor(client.messages, (event) => event.type === 'chat.ready')
    const rooms = await mf.dispatchFetch(`${base}api/chat/rooms`)
    assert.equal(rooms.status, 200)
    const payload = await rooms.json()
    assert.equal(payload.success, true)
    assert.equal(payload.rooms.some(room => room.roomId === 'public'), true)

    const create = await mf.dispatchFetch(`${base}api/chat/rooms`, { method: 'POST', body: JSON.stringify({ roomId: 'admin-test', displayName: '測試房間' }) })
    assert.equal(create.status, 401)
    client.socket.close()
  } finally {
    await mf.dispose()
  }
})

test('不同 projectId 的公共頻道不會互相廣播', async () => {
  const magic = await createRuntime('magic-siege')
  const projectB = await createRuntime('project-b')
  try {
    const magicClient = await connect((await magic.ready).toString())
    const projectBClient = await connect((await projectB.ready).toString())
    await waitFor(magicClient.messages, (event) => event.type === 'chat.ready')
    await waitFor(projectBClient.messages, (event) => event.type === 'chat.ready')

    magicClient.socket.send(JSON.stringify({ version: 1, type: 'chat.message.send', requestId: 'isolated',
      payload: { roomId: 'public', content: '只屬於 magic-siege' } }))
    await waitFor(magicClient.messages, (event) => event.type === 'chat.message.created')
    await new Promise((resolve) => setTimeout(resolve, 80))
    assert.equal(projectBClient.messages.some((event) => event.type === 'chat.message.created'), false)

    magicClient.socket.close()
    projectBClient.socket.close()
  } finally {
    await Promise.all([magic.dispose(), projectB.dispose()])
  }
})
