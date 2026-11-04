# M5 第二個 Project 移植驗證（game-demo）

## 已完成

- `game-demo/project.config.js` 新增平台 Chat opt-in 設定，使用與 `magic-siege` 相同的 WebSocket endpoint，但採用獨立 `game-demo` room namespace。
- `game-demo` Page 只建立 `new Chat(...)`、掛載共用 `ChatPanel`，並在卸載時呼叫 `chat.dispose()`。
- Chat 核心仍位於 `platform/frontend/src/chat/`，沒有複製 Container、Store、Service 或後端 contract。
- `VITE_PROJECT=game-demo npm run build:cloudflare` 通過。
- 已發布 `dep_game-demo_v0.1.5`，Workflow `40443472096` 成功，公開網址為 `https://game-demo-staging.takoson68.workers.dev/`，HTTP 200。
- 部署後以兩個 WebSocket handshake 驗證 `roomId=public` 與 `roomId=game-demo`，伺服器各自回傳對應 room；未送出聊天內容。

## 仍待驗收

- 尚未在第二個公開網址完成瀏覽器／房間隔離人工測試；部署後需以 `game-demo` room 與 `public` room 各開一個連線確認不互相廣播。
