# 聊天備份模組

由 `index.js` 註冊 `chatCoreBackup`。頁面先檢查能力是否存在，再將共用元件 `iDB_box` 的上傳、列出及還原事件接到該 Store。
確認後由聊天室 Store 取得本機快照，再由 `api/uploadBackup.js` 呼叫 chatCore Worker 的 `/api/backups`。
下載清單與選擇還原分別由 `requestList()`、`requestRestore()` 處理。聊天室 Store 負責驗證及交易式覆蓋聊天 IndexedDB。
