# M4-B 真實 WebSocket 負載／延遲結果

測試時間：2026-10-27 11:12（Asia/Taipei）

- Endpoint：`wss://moducore-chat-poc-staging.takoson68.workers.dev/ws/chat`
- 兩個獨立連線，發送端連續送出 20 則公共頻道訊息。
- `chat.ready` 成功提供兩個不同玩家編號：`player_004`、`player_005`。
- 廣播與 ack 均成功。

| 指標 | 數值 |
|---|---:|
| 最小延遲 | 143.46 ms |
| 中位數延遲 | 145.58 ms |
| p95 延遲 | 150.55 ms |
| 最大延遲 | 151.68 ms |

這是單次 Staging、20 則訊息、兩連線的觀測，不是容量上限或 SLA。測試訊息已使用 `m4b-*` 前綴，未改動遊戲狀態。
