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

async function createRuntime(projectId = 'magic-siege') {
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
    bindings: { PROJECT_ID: projectId, CHAT_NAMESPACE_VERSION: '2' },
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
