# M5 Room 隔離修正結果

## 問題

前端 `Chat` 只把 `roomId` 放在 `chat.message.send` payload，建立 WebSocket 時沒有把 roomId 放入 URL。Worker 會以 URL 缺少的情況採用預設 `public` 房間，因此 `magic-siege` 與 `game-demo` 實際連到同一個 Durable Object。

## 修正

- `buildChatConnectionUrl()` 會保留原有 query，並加入／覆寫 `roomId`。
- `Chat` 建立 `ConnectionService` 時使用帶 roomId 的 URL。
- 新增測試確認 `public` 與 `game-demo` URL 都正確產生。

## 驗證與發布

- Chat Runtime：4/4 通過。
- Game：9/9 通過。
- `magic-siege` build 通過。
- `game-demo` build 通過。
- `dep_game-demo_v0.1.6`／Workflow `40443860075` 成功。
- `dep_magic-siege_v0.1.47`／Workflow `40443860035` 成功。

兩個公開網址都已重新發布。使用者需重新整理兩個頁面，讓瀏覽器建立帶有正確 `roomId` 的新 WebSocket 連線；本報告未向公共房間送出額外測試訊息。
