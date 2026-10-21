# Game 平台能力

本目錄提供 `src/game.js` 使用的遊戲容器與生命週期組裝能力，不含特定遊戲玩法。

`game.js` 預設與具名匯出 `Game` 類別，不建立單例。遊戲使用 `new Game()`，或以 `class TowerDefenseGame extends Game` 延伸後再建立實例。每個實例持有獨立容器。

`game.createStore(options)` 委派共用狀態工廠，不經 World，也不註冊至平台容器。遊戲可將此建立能力注入模組工廠，再由模組反向註冊至遊戲容器。

## 導讀

1. `container.js`：建立獨立容器與模組註冊介面。
2. `lifecycle.js`：依序執行生命週期，反向停止與清理。
3. `../../game.js`：統一管理入口。
4. `engines/index.md`：可選引擎適配，由 `../../gameEngines.js` 對模組公開。

模組格式為 `{ name, setup: { stores, services }, init?, start?, pause?, resume?, stop?, dispose? }`。
`stores` 與 `services` 都是名稱到同步工廠的映射；工廠延遲解析並快取。
Hook 接收 `{ store, service }`，初始化與啟動依宣告順序，停止與卸載依反向順序。
容器只接受註冊；遊戲流程由生命週期與 Game 協調。

`game.start({ modules })` 完成註冊、初始化與啟動。`reset()` 保留模組宣告，銷毀舊實例後重新啟動；`dispose()` 清空宣告與資源。
非同步操作依呼叫順序排隊；失敗後清理並進入 `error`，可由 reset 或 dispose 回復。
模組擁有的計時器、引擎與訂閱須由其 Hook 或實例 `dispose()` 釋放，兩者不得重複擁有同一資源。

此目錄為平台工程實作，服從既有 World 與 Engineering 規則，不新增治理裁決。
