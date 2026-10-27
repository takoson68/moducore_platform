# Platform Chat Runtime

這是 ModuCore Platform 的可重用 Chat 前端能力，不屬於任何 Project。

## 邊界

- `Chat` 是組合與生命週期協調者；每個實例建立自己的原始 `Container`。
- `MessageStore` 保存連線狀態、有限訊息 ring buffer、錯誤與重連次數。
- `ConnectionService` 只負責 WebSocket 連線、關閉與 exponential backoff reconnect。
- `MessageService` 只負責平台契約事件、訊息去重與 ack／錯誤接收。
- UI 只能透過 `Chat.store('messages').state` 或 host adapter 讀取狀態，不直接依賴 Game Store。

## 使用方式

```js
import { Chat } from '@/chat'

const chat = new Chat({ url: 'wss://example/ws/chat', roomId: 'public' })
chat.start()
chat.service('messages').sendMessage('大家好')
// 頁面卸載時：
chat.dispose()
```

`createMockWebSocketPair()` 可在離線測試提供 WebSocket constructor；不需要 Cloudflare 網路。
