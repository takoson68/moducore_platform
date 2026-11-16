const RECORDS = 'records'
const NAME = /^[a-zA-Z0-9_-]+$/

// 用專案與模組隔離資料庫，分類放在該模組的紀錄鍵中。
export function createIndexedDbService(backup) {
  return function indexedDb({ tenantId, module }) {
    if (![tenantId, module].every(value => typeof value === 'string' && NAME.test(value))) {
      throw new TypeError('請提供有效的租戶與模組識別。')
    }
    const database = `moducore:${tenantId}:${module}`

    // 每筆操作等待交易提交，並在完成後關閉連線。
    async function transact(mode, action) {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(database, 1)
        request.onupgradeneeded = () => request.result.createObjectStore(RECORDS)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      try {
        return await new Promise((resolve, reject) => {
          const transaction = db.transaction(RECORDS, mode)
          let request
          transaction.oncomplete = () => resolve(request?.result)
          transaction.onabort = () => reject(transaction.error || new Error('IndexedDB 交易已取消。'))
          request = action(transaction.objectStore(RECORDS))
        })
      } finally {
        db.close()
      }
    }

    // 保留分類分隔符，避免掃描到名稱相似的其他分類。
    function prefix(category) {
      if (typeof category !== 'string' || !NAME.test(category)) throw new TypeError('請提供有效的資料分類。')
      return `${category}:`
    }

    function key(category, id) {
      if (typeof id !== 'string' || !id.length) throw new TypeError('資料 ID 必須為非空字串。')
      return prefix(category) + id
    }

    // 快照保留版本資訊，供上傳成功後比對。
    async function capture(category) {
      const start = prefix(category)
      await transact('readonly', () => undefined)
      return backup.readStores({ database, stores: [RECORDS], keyPrefix: start })
    }

    return Object.freeze({
      async get(category, id) {
        const recordKey = key(category, id)
        const record = await transact('readonly', store => store.get(recordKey))
        return record?.data
      },
      async set(category, id, data) {
        const recordKey = key(category, id)
        const record = { revision: crypto.randomUUID(), data }
        await transact('readwrite', store => store.put(record, recordKey))
      },
      async remove(category, id) {
        const recordKey = key(category, id)
        await transact('readwrite', store => store.delete(recordKey))
      },
      async list(category) {
        const start = prefix(category)
        const snapshot = await capture(category)
        return snapshot.stores[0].records.map(({ key: recordKey, value }) => ({
          id: recordKey.slice(start.length),
          data: value.data
        }))
      },
      requestUpload({ categories, upload }) {
        return backup.requestUpload({
          categories: categories.map(({ id, label, allowCleanup = false }) => ({
            id,
            owner: module,
            label,
            capture: () => capture(id),
            clearUploaded: allowCleanup
              ? snapshot => backup.clearUnchangedStores(snapshot, 'revision')
              : undefined
          })),
          upload
        })
      }
    })
  }
}
