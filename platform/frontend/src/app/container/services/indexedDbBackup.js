// 開啟既有資料庫，避免備份操作建立空資料庫。
function openExistingDatabase(database) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database)
    request.onupgradeneeded = () => request.transaction.abort()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// 在同一筆唯讀交易中複製指定的 Object Store，保留原始主鍵。
async function readStores({ database, stores, keyPrefix }) {
  if (typeof database !== 'string' || !database || !Array.isArray(stores) ||
    !stores.length || stores.some(name => typeof name !== 'string' || !name) ||
    new Set(stores).size !== stores.length ||
    (keyPrefix !== undefined && (typeof keyPrefix !== 'string' || !keyPrefix))) {
    throw new TypeError('請指定既有的 IndexedDB 名稱與要備份的 Object Store。')
  }

  const db = await openExistingDatabase(database)
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(stores, 'readonly')
      const data = stores.map(name => ({ name, records: [] }))
      transaction.oncomplete = () => resolve({ database, databaseVersion: db.version, stores: data })
      transaction.onabort = () => reject(transaction.error || new Error('無法讀取 IndexedDB 備份。'))

      for (const entry of data) {
        const range = keyPrefix === undefined ? undefined : IDBKeyRange.lowerBound(keyPrefix)
        const request = transaction.objectStore(entry.name).openCursor(range)
        request.onsuccess = () => {
          const cursor = request.result
          if (!cursor || (keyPrefix !== undefined &&
            (typeof cursor.primaryKey !== 'string' || !cursor.primaryKey.startsWith(keyPrefix)))) return
          entry.records.push({ key: cursor.primaryKey, value: cursor.value })
          cursor.continue()
        }
      }
    })
  } finally {
    db.close()
  }
}

// 以資料擁有者提供的寫入版本識別紀錄，並在同一交易內檢查與刪除。
async function clearUnchangedStores(snapshot, revisionField) {
  if (typeof revisionField !== 'string' || !revisionField ||
    snapshot.stores.some(store => store.records.some(({ value }) =>
      !Object.hasOwn(value ?? {}, revisionField) ||
      typeof value[revisionField] !== 'string' || !value[revisionField]))) {
    throw new Error('清除本機資料需要每筆紀錄具有非空白的版本識別值。')
  }

  const db = await openExistingDatabase(snapshot.database)
  try {
    if (db.version !== snapshot.databaseVersion) throw new Error('資料庫結構已更新，保留本機資料。')
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(snapshot.stores.map(store => store.name), 'readwrite')
      let cleared = 0
      transaction.oncomplete = () => resolve(cleared)
      transaction.onabort = () => reject(transaction.error || new Error('清除本機備份資料失敗。'))

      for (const { name, records } of snapshot.stores) {
        const store = transaction.objectStore(name)
        for (const { key, value } of records) {
          const request = store.get(key)
          request.onsuccess = () => {
            const current = request.result
            if (Object.hasOwn(current ?? {}, revisionField) && current[revisionField] === value[revisionField]) {
              store.delete(key)
              cleared += 1
            }
          }
        }
      }
    })
  } finally {
    db.close()
  }
}

// 應用程式只會顯示本次明確交付的備份分類。
function chooseCategory(categories) {
  const dialog = document.createElement('dialog')
  const form = document.createElement('form')
  form.method = 'dialog'
  const heading = document.createElement('h2')
  heading.textContent = '上傳 IndexedDB 備份'
  dialog.setAttribute('aria-label', heading.textContent)

  const categoryLabel = document.createElement('label')
  categoryLabel.textContent = '資料分類 '
  const select = document.createElement('select')
  for (const [index, category] of categories.entries()) {
    const option = document.createElement('option')
    option.value = String(index)
    option.textContent = `${category.label}（${category.owner}）`
    select.append(option)
  }
  categoryLabel.append(select)

  const clearLabel = document.createElement('label')
  const clear = document.createElement('input')
  clear.type = 'checkbox'
  clearLabel.append(clear, ' 上傳成功後清除已備份且未變更的本機資料')
  const updateClearOption = () => {
    clear.checked = false
    clear.disabled = typeof categories[Number(select.value)].clearUploaded !== 'function'
    clearLabel.hidden = clear.disabled
  }
  select.addEventListener('change', updateClearOption)
  updateClearOption()

  const cancel = document.createElement('button')
  cancel.value = 'cancel'
  cancel.textContent = '取消'
  cancel.autofocus = true
  const upload = document.createElement('button')
  upload.value = 'upload'
  upload.textContent = '確認上傳'

  form.append(heading, categoryLabel, document.createElement('br'), clearLabel, document.createElement('br'), cancel, upload)
  dialog.append(form)
  document.body.append(dialog)
  return new Promise((resolve, reject) => {
    dialog.addEventListener('close', () => {
      dialog.remove()
      resolve(dialog.returnValue === 'upload' ? {
        category: categories[Number(select.value)],
        clearLocal: clear.checked && !clear.disabled
      } : null)
    }, { once: true })
    try {
      dialog.showModal()
    } catch (error) {
      dialog.remove()
      reject(error)
    }
  })
}

// 提供由使用者發起的備份操作。各專案自行提供已授權的上傳方法。
export function createIndexedDbBackup({ choose = chooseCategory } = {}) {
  let active = false

  return Object.freeze({
    readStores,
    clearUnchangedStores,
    async requestUpload({ categories, upload }) {
      if (active) return { status: 'busy' }
      if (typeof upload !== 'function' || !Array.isArray(categories) || !categories.length) {
        throw new TypeError('備份需要分類清單與上傳方法。')
      }

      const offered = categories.map(category => ({ ...category }))
      const ids = new Set()
      for (const category of offered) {
        if (![category.id, category.owner, category.label].every(value => typeof value === 'string' && value.trim()) ||
          ids.has(category.id) || typeof category.capture !== 'function' ||
          (category.clearUploaded !== undefined && typeof category.clearUploaded !== 'function')) {
          throw new TypeError('每個備份分類需要唯一 ID、資料擁有者、顯示名稱與快照方法。')
        }
        ids.add(category.id)
      }

      active = true
      try {
        const choice = await choose(offered)
        if (!choice) return { status: 'cancelled' }
        const { category, clearLocal } = choice
        const data = await category.capture()
        const payload = clearLocal && category.clearUploaded ? structuredClone(data) : data
        const receipt = await upload({ version: 1, categoryId: category.id, owner: category.owner, data: payload })
        if (receipt?.success !== true) throw new Error('伺服器尚未確認備份已儲存。')
        if (!clearLocal || !category.clearUploaded) return { status: 'uploaded', receipt }

        try {
          const cleared = await category.clearUploaded(data)
          return { status: 'uploaded-and-cleaned', receipt, cleared }
        } catch (cleanupError) {
          return { status: 'uploaded-cleanup-failed', receipt, cleanupError }
        }
      } finally {
        active = false
      }
    }
  })
}
