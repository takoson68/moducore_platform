import test from 'node:test'
import assert from 'node:assert/strict'
import { createPrivateChatMessageRepository } from '../projects/chatCore/modules/private-chat-lab/messageRepository.js'
import { canMarkMessageRead } from '../projects/chatCore/modules/private-chat-lab/readEligibility.js'

function createIndexedDBMock() {
  const databases = new Map()

  return {
    open(name) {
      const request = {}
      queueMicrotask(() => {
        let database = databases.get(name)
        const isNew = !database
        if (!database) {
          const stores = new Map()
          database = {
            stores,
            objectStoreNames: { contains: storeName => stores.has(storeName) },
            createObjectStore(storeName, options) {
              const store = { keyPath: options.keyPath, records: new Map(), indexes: new Set() }
              stores.set(storeName, store)
              return { createIndex: indexName => store.indexes.add(indexName) }
            },
            transaction(storeNames) {
              const transaction = {
                objectStore(storeName) {
                  if (!storeNames.includes(storeName)) throw new Error(`Store outside transaction: ${storeName}`)
                  const store = stores.get(storeName)
                  return {
                    get(key) {
                      const result = { result: undefined, onsuccess: null }
                      queueMicrotask(() => {
                        result.result = structuredClone(store.records.get(key))
                        result.onsuccess?.()
                      })
                      return result
                    },
                    put(record) {
                      store.records.set(record[store.keyPath], structuredClone(record))
                    },
                    delete(key) {
                      store.records.delete(key)
                    },
                    index(indexName) {
                      if (!store.indexes.has(indexName)) throw new Error(`Unknown index: ${indexName}`)
                      return {
                        getAll(value) {
                          const result = { result: [], onsuccess: null }
                          queueMicrotask(() => {
                            result.result = [...store.records.values()]
                              .filter(record => record[indexName] === value)
                              .map(record => structuredClone(record))
                            result.onsuccess?.()
                          })
                          return result
                        },
                      }
                    },
                  }
                },
              }
              setTimeout(() => transaction.oncomplete?.(), 0)
              return transaction
            },
          }
          databases.set(name, database)
        }
        request.result = database
        if (isNew) request.onupgradeneeded?.()
        request.onsuccess?.()
      })
      return request
    },
  }
}

test('messageId 去重；received／persisted 分開記錄，所有 Peer persisted 後移除 outbox', async () => {
  const repository = createPrivateChatMessageRepository(createIndexedDBMock())
  const message = { id: 'out-1', roomId: 'room-1', text: '合成測試', at: 10, direction: 'outgoing', persisted: true }

  await repository.saveOutgoing(message)
  await repository.markAttempted(message, ['peer-a', 'peer-b'])
  await repository.recordAcknowledgement(message.id, 'peer-a', 'received')
  let state = await repository.loadRoom('room-1')
  assert.equal(state.outbox.length, 1)
  assert.ok(state.messages[0].recipientStatuses['peer-a'].receivedAt)
  assert.equal(state.messages[0].recipientStatuses['peer-a'].persistedAt, null)

  await repository.markTimedOut(message.id)
  state = await repository.loadRoom('room-1')
  assert.equal(state.messages[0].deliveryStatus, 'timed-out')
  await repository.recordAcknowledgement(message.id, 'peer-a', 'persisted')
  const persistedAt = (await repository.loadRoom('room-1')).messages[0].recipientStatuses['peer-a'].persistedAt
  await repository.recordAcknowledgement(message.id, 'peer-a', 'persisted')
  state = await repository.loadRoom('room-1')
  assert.equal(state.outbox.length, 1)
  assert.equal(state.messages[0].recipientStatuses['peer-a'].persistedAt, persistedAt)
  await repository.recordAcknowledgement(message.id, 'peer-outsider', 'persisted')
  state = await repository.loadRoom('room-1')
  assert.equal(state.messages[0].recipientStatuses['peer-outsider'], undefined)
  await repository.recordAcknowledgement(message.id, 'peer-b', 'persisted')
  await repository.recordAcknowledgement(message.id, 'peer-a', 'read')
  state = await repository.loadRoom('room-1')
  assert.equal(state.outbox.length, 0)
  assert.equal(state.messages[0].deliveryStatus, 'persisted')
  assert.ok(state.messages[0].recipientStatuses['peer-a'].readAt)
})

test('同一 incoming messageId 重送只保留一筆，並可在本機保存後回覆 persisted', async () => {
  const repository = createPrivateChatMessageRepository(createIndexedDBMock())
  const message = {
    id: 'incoming-1', roomId: 'room-1', senderPeerId: 'peer-a', sender: 'Peer A',
    text: '只保存一次', at: 20, direction: 'incoming', persisted: true,
  }

  assert.equal((await repository.saveIncomingIfAbsent(message)).inserted, true)
  assert.equal((await repository.saveIncomingIfAbsent({ ...message, text: '重送副本' })).inserted, false)
  const state = await repository.loadRoom('room-1')
  assert.equal(state.messages.length, 1)
  assert.equal(state.messages[0].text, '只保存一次')
  assert.equal(state.messages[0].deliveryStatus, 'persisted')
})

test('READ 必須同時符合頁面前景、聊天室可見、訊息進入可視區且已持久化', () => {
  const eligible = {
    pageVisible: true,
    chatVisible: true,
    messageVisible: true,
    persisted: true,
    alreadyRead: false,
  }
  assert.equal(canMarkMessageRead(eligible), true)
  assert.equal(canMarkMessageRead({ ...eligible, pageVisible: false }), false)
  assert.equal(canMarkMessageRead({ ...eligible, chatVisible: false }), false)
  assert.equal(canMarkMessageRead({ ...eligible, messageVisible: false }), false)
  assert.equal(canMarkMessageRead({ ...eligible, persisted: false }), false)
  assert.equal(canMarkMessageRead({ ...eligible, alreadyRead: true }), false)
})
