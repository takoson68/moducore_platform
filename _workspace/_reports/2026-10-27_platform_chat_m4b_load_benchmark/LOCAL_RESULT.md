# M4-B 本地 Chat 負載測試

生成時間：2026-10-27T03:12:12.028Z

| Chat 流量（則／秒） | 輸入數 | 保留數 | frame p95（ms） | frame 最大（ms） |
|---:|---:|---:|---:|---:|
| 0 | 0 | 0 | 0.0085 | 0.0299 |
| 5 | 5 | 5 | 0.0215 | 0.128 |
| 50 | 50 | 50 | 0.0296 | 0.0343 |
| 200 | 200 | 60 | 0.0503 | 0.0952 |

## 範圍

- 使用平台 Chat、原始 Container、MessageStore 與 MockWebSocket。
- 每個情境併行執行 60 個模擬遊戲 frame，訊息只寫入 Chat 自己的 Store。
- Ring buffer 上限為 100；超過上限的訊息不會無限累積。

## 限制

- 本測試使用 MockWebSocket 與 Node Store，沒有包含瀏覽器 DOM／p5.js render。
- ratePerSecond 以固定 60 個 frame 內注入訊息，代表本地處理成本，不代表真實網路排程。

下一步仍需以真實瀏覽器與 WebSocket 補測 FPS、DOM 更新、網路延遲及背景切回。
