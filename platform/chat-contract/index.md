# Platform Chat Contract

## 範圍

本目錄定義 ModuCore Platform Chat 前後端共用的純 JavaScript 資料契約與執行期格式驗證。

本目錄不負責：

- Container 實作。
- WebSocket 連線。
- Durable Object 或其他後端儲存。
- Vue／DOM UI。
- 任一 Project 的商務規則。

## 閱讀順序

1. `index.md`
2. `index.js`
3. `index.test.mjs`

## 契約原則

- 客戶端事件不得提供正式 sender、message ID、server time 或 sequence。
- `projectId` 是伺服器／宿主上下文，不由訊息 payload 信任。
- `roomId` 必須通過白名單格式驗證，並與 `projectId` 組成隔離 namespace。
- 未知事件、未知版本、未知頂層欄位與超長內容必須拒絕。
- 契約驗證只負責格式與邊界，不取代伺服器授權、頻率限制或內容安全檢查。

## 狀態

M0 已建立第一版契約；Transport、儲存與身份方案保留至 M1 決定。
