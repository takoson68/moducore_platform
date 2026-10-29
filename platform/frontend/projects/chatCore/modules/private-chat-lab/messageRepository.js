const DATABASE_NAME = 'chatCore_private_chat'
const DATABASE_VERSION = 1
const MESSAGE_STORE = 'messages'
const OUTBOX_STORE = 'outbox'

export function createPrivateChatMessageRepository(indexedDBFactory = globalThis.indexedDB) {
  let databasePromise

  function openDatabase() {
    if (databasePromise) return databasePromise
    databasePromise = new Promise((resolve, reject) => {
      let settled = false
      const fail = error => {
        if (settled) return
        settled = true
        reject(error)
      }
      if (!indexedDBFactory) {
        fail(new Error('此瀏覽器無法使用 IndexedDB。'))
        return
      }

      const request = indexedDBFactory.open(DATABASE_NAME, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(MESSAGE_STORE)) {
          const messages = database.createObjectStore(MESSAGE_STORE, { keyPath: 'id' })
          messages.createIndex('roomId', 'roomId', { unique: false })
        }
        if (!database.objectStoreNames.contains(OUTBOX_STORE)) {
          const outbox = database.createObjectStore(OUTBOX_STORE, { keyPath: 'id' })
          outbox.createIndex('roomId', 'roomId', { unique: false })
        }
      }
      request.onsuccess = () => {
        if (settled) {
          request.result.close()
          return
        }
        settled = true
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
      request.onerror = () => fail(request.error || new Error('無法開啟聊天室 IndexedDB。'))
      request.onblocked = () => fail(new Error('聊天室資料庫正在升級，請關閉其他 chatCore 分頁後重試。'))
    }).catch(error => {
      databasePromise = null
      throw error
    })
    return databasePromise
  }

  async function transact(stores, mode, action) {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      let result
      let transaction
      try {
        transaction = database.transaction(stores, mode)
        transaction.oncomplete = () => resolve(result)
        transaction.onerror = () => reject(transaction.error || new Error('聊天室資料寫入失敗。'))
        transaction.onabort = () => reject(transaction.error || new Error('聊天室資料交易已取消。'))
        result = action(transaction)
      } catch (error) {
        try { transaction?.abort() } catch { /* 交易可能已結束。 */ }
        reject(error)
      }
    })
  }

  function listByRoom(storeName, roomId) {
    return transact([storeName], 'readonly', transaction => {
      const result = { items: [] }
      const request = transaction.objectStore(storeName).index('roomId').getAll(roomId)
      request.onsuccess = () => { result.items = request.result }
      return result
    }).then(result => result.items.sort((left, right) => left.at - right.at || left.id.localeCompare(right.id)))
  }

  return {
    async loadRoom(roomId) {
      const [messages, outbox] = await Promise.all([
        listByRoom(MESSAGE_STORE, roomId),
        listByRoom(OUTBOX_STORE, roomId),
      ])
      const pendingIds = new Set(outbox.map(item => item.id))
      const outboxById = new Map(outbox.map(item => [item.id, item]))
      return {
        messages: messages.map(message => ({
          ...message,
          deliveryStatus: pendingIds.has(message.id)
            ? outboxById.get(message.id).state === 'pending' ? 'pending' : message.deliveryStatus || 'awaiting-confirmation'
            : message.deliveryStatus,
          persisted: true,
        })),
        outbox,
      }
    },

    saveOutgoing(message) {
      const outboxRecord = {
        id: message.id,
        roomId: message.roomId,
        text: message.text,
        at: message.at,
        state: 'pending',
        attemptCount: 0,
      }
      return transact([MESSAGE_STORE, OUTBOX_STORE], 'readwrite', transaction => {
        transaction.objectStore(MESSAGE_STORE).put(message)
        transaction.objectStore(OUTBOX_STORE).put(outboxRecord)
      })
    },

    saveMessage(message) {
      const record = { ...message }
      return transact([MESSAGE_STORE], 'readwrite', transaction => {
        transaction.objectStore(MESSAGE_STORE).put(record)
      })
    },

    saveIncomingIfAbsent(message) {
      let result
      return transact([MESSAGE_STORE], 'readwrite', transaction => {
        const store = transaction.objectStore(MESSAGE_STORE)
        const request = store.get(message.id)
        request.onsuccess = () => {
          if (request.result) {
            result = { inserted: false, message: request.result }
            return
          }
          const record = { ...message, persisted: true, deliveryStatus: 'persisted' }
          store.put(record)
          result = { inserted: true, message: record }
        }
        return { get value() { return result } }
      }).then(value => value.value)
    },

    markAttempted(message, recipientPeerIds) {
      const recipientStatuses = Object.fromEntries(recipientPeerIds.map(peerId => [peerId, { receivedAt: null, persistedAt: null, readAt: null }]))
      const record = {
        ...message,
        recipientPeerIds: [...recipientPeerIds],
        recipientStatuses,
        deliveryStatus: 'awaiting-confirmation',
        persisted: true,
      }
      return transact([MESSAGE_STORE, OUTBOX_STORE], 'readwrite', transaction => {
        transaction.objectStore(MESSAGE_STORE).put(record)
        const store = transaction.objectStore(OUTBOX_STORE)
        const request = store.get(message.id)
        request.onsuccess = () => {
          if (!request.result) return
          store.put({
            ...request.result,
            state: 'awaiting-confirmation',
            recipientPeerIds: [...recipientPeerIds],
            attemptCount: (request.result.attemptCount || 0) + 1,
            lastAttemptAt: Date.now(),
          })
        }
      })
    },

    recordAcknowledgement(messageId, peerId, stage) {
      let result
      return transact([MESSAGE_STORE, OUTBOX_STORE], 'readwrite', transaction => {
        const messages = transaction.objectStore(MESSAGE_STORE)
        const request = messages.get(messageId)
        request.onsuccess = () => {
          const current = request.result
          if (!current) return
          if (!(current.recipientPeerIds || []).includes(peerId)) {
            result = current
            return
          }
          const recipientStatuses = { ...(current.recipientStatuses || {}) }
          const status = { ...(recipientStatuses[peerId] || {}) }
          if (stage === 'received' && !status.receivedAt) status.receivedAt = Date.now()
          if (stage === 'persisted' && !status.persistedAt) status.persistedAt = Date.now()
          if (stage === 'read' && !status.readAt) status.readAt = Date.now()
          recipientStatuses[peerId] = status
          const allPersisted = (current.recipientPeerIds || []).length > 0
            && current.recipientPeerIds.every(id => recipientStatuses[id]?.persistedAt)
          const updated = {
            ...current,
            recipientStatuses,
            deliveryStatus: allPersisted ? 'persisted' : current.deliveryStatus,
          }
          messages.put(updated)
          if (allPersisted) transaction.objectStore(OUTBOX_STORE).delete(messageId)
          result = updated
        }
      }).then(() => result)
    },

    removeOutbox(messageId) {
      return transact([OUTBOX_STORE], 'readwrite', transaction => {
        transaction.objectStore(OUTBOX_STORE).delete(messageId)
      })
    },

    markTimedOut(messageId) {
      let result
      return transact([MESSAGE_STORE], 'readwrite', transaction => {
        const store = transaction.objectStore(MESSAGE_STORE)
        const request = store.get(messageId)
        request.onsuccess = () => {
          if (!request.result || request.result.deliveryStatus === 'persisted') return
          result = { ...request.result, deliveryStatus: 'timed-out' }
          store.put(result)
        }
      }).then(() => result)
    },

    markRead(messageId, readAt) {
      let result
      return transact([MESSAGE_STORE], 'readwrite', transaction => {
        const store = transaction.objectStore(MESSAGE_STORE)
        const request = store.get(messageId)
        request.onsuccess = () => {
          if (!request.result) return
          result = { ...request.result, readAt: request.result.readAt || readAt }
          store.put(result)
        }
      }).then(() => result)
    },

  }
}
