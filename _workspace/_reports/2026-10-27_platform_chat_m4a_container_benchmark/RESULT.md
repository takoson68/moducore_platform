# M4-A 純 Container 基準測試結果

生成時間：2026-11-04T05:35:41.483Z

## 測試環境

- Node：v26.0.0
- GC：可用（以 --expose-gc 執行）
- 每項樣本：30，暖身：5
- Store 更新：每個 Container 1000 次
- 建立／銷毀循環：1000 次

## 結果（毫秒）

| 測試 | 中位數 | p95 | 最大 |
|---|---:|---:|---:|
| single container create / resolve / destroy | 0.0102 | 0.0329 | 0.0341 |
| three containers create / resolve / destroy | 0.0155 | 0.0326 | 0.0837 |
| three containers isolated store updates | 4.6455 | 5.6731 | 5.9147 |
| repeated container create / destroy (1000 cycles) | 0.443 | 0.5679 | 0.7225 |

## 隔離與資源觀察

- 三個 Container 的每次更新與通知數：3000；每個更新只通知所屬 Container。
- 測試前後 heapUsed 差異：175424 bytes。這是 Node 單次執行的觀察值，不是長時間記憶體穩定性結論。
- 所有 Container 均使用原始 Container，沒有建立 Chat 專用容器實作。

## 判讀與限制

本報告只回答「原始 Container 多實例是否有明顯固定成本」；尚未涵蓋瀏覽器 DOM、p5.js、WebSocket 或真實 Game + Chat 負載。下一步是 M4-B：以本地模擬訊息與真實 WebSocket，測量 FPS、訊息延遲、DOM 更新與斷線資源釋放。
