# IndexedDB 讀寫與備份能力

## 新模組的統一入口

使用 `world.iDB` 即可操作目前 Project 的 IndexedDB。租戶取自 Project 設定，呼叫端提供模組、分類、紀錄 ID 與資料。實際讀寫仍由 Container Service 執行。

```js
const entry = { module: 'notes', category: 'history', id: '42' }

await world.iDB.save({ ...entry, data: { text: '會議筆記' } })
const note = await world.iDB.get(entry)
const entries = await world.iDB.list({ module: 'notes', category: 'history' })
await world.iDB.remove(entry)

// 將此函式綁到按鈕或連結。
const backupNotes = () => world.iDB.upload({
  module: 'notes',
  categories: [{ id: 'history', label: '筆記歷史', allowCleanup: true }],
  upload: saveBackupThroughProjectApi
})
```

每個模組使用獨立資料庫 `moducore:<tenantId>:<module>`，紀錄鍵為 `<category>:<id>`。直接呼叫 `remove` 會刪除指定紀錄。備份視窗的清除選項需由分類開啟，且會比對平台自動產生的寫入版本。既有資料可用下面的分類轉接方式接入。

## 既有資料的備份入口

從 `world.services.indexedDbBackup()` 取得能力。頁面可將 `requestUpload` 綁到按鈕或連結。單一分類可用專屬按鈕，多個分類則可在同一確認視窗選擇。每次上傳一個分類。

## 資料所有權與分類

- 每個分類宣告唯一 `id`、模組識別 `owner`、顯示名稱 `label` 與 `capture`。由目前 Project 主動提供可備份的分類。
- 新寫入的可備份資料以模組識別作為最外層邏輯名稱。共用 Object Store 使用 `<module>:<category>:<id>`，例如 `notes:history:42`。模組獨佔的 Object Store 使用 `<module>:<category>`，例如 `notes:history`。資料庫本身仍須隔離 Project／租戶；既有鍵與 Store 名稱沿用，若需納入備份，先由擁有者明確映射。
- 若模組獨佔 Object Store，使用 `readStores({ database, stores })`。傳入的 Store 均須屬於同一分類。
- 若多個模組共用 Object Store，資料擁有者應在寫入時用模組命名空間或資料欄位標記歸屬。由資料擁有者的 `capture` 使用已核對的條件選取資料。缺少歸屬資訊的舊資料需要先核對來源。
- 系統資料應明確挑選可備份欄位。憑證與 Session 不應放入備份分類。

## 上傳與清除

`upload` 是 Project 自己的授權 API 方法，收到版本、分類 ID、模組識別與快照。伺服器須驗證租戶、使用者及備份分類，完成持久化後才回傳 `{ success: true }`。傳輸格式由 Project 定義。若使用 JSON，Project 必須處理 IndexedDB 可能含有的日期、二進位資料與其他 JSON 無法原樣表示的值。

分類提供 `clearUploaded(snapshot)` 時，視窗才顯示清除選項，預設不勾選。擁有者可以用 `clearUnchangedStores(snapshot, revisionField)` 清除快照裡版本相同的紀錄。使用此方法時，每筆資料每次寫入都必須產生新的非空白字串版本，同一主鍵即使刪除後重建也須使用新版本。共用 Store 的清除方法同樣須在一筆讀寫交易內確認歸屬及版本。仍在使用的資料需由擁有者排除，或在清除後同步執行中的 Store。

```js
const backup = world.services.indexedDbBackup()

async function uploadComponentBackup() {
  return backup.requestUpload({
    categories: [{
      id: 'component-history',
      owner: 'example-component',
      label: '元件歷史',
      capture: () => backup.readStores({
        database: 'project-example',
        stores: ['example-component:history']
      }),
      clearUploaded: snapshot => backup.clearUnchangedStores(snapshot, 'revision')
    }],
    upload: saveBackupThroughProjectApi
  })
}
```

取消回傳 `cancelled`。同時已有操作時回傳 `busy`。上傳完成回傳 `uploaded` 或 `uploaded-and-cleaned`。若遠端已儲存但本機清除失敗，回傳 `uploaded-cleanup-failed`，頁面應分開呈現結果。快照或上傳失敗會拋出錯誤。
