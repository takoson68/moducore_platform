# 遊戲示範

由 playground 模組提供首頁。Page 建立 Game 實例，runtime 宣告 session store 與 p5 引擎服務並向遊戲容器註冊。
開始、暫停、恢復、重開與卸載透過 Game 管理，玩法狀態由模組 store 持有。
本階段是簡單互動畫面，尚未實作塔防 MVP。

遊戲 Store 不依賴 world.js。Page 注入 `game.createStore` 能力，runtime 以延遲工廠呼叫模組的 store.js，最後由遊戲容器保存實例；共用狀態工廠不代表共用狀態。

繪圖使用 p5 instance mode。`sketch.js` 持有道路、目標、繪製與命中判斷；平台公開 `gameEngines.js` 提供可選適配器，Game 與 Container 不固定依賴 p5。
整頁由單一 1040 × 840 p5 Canvas 繪製，以 CSS 等比例縮放。Vue 僅承載畫布與交接生命週期，沒有 HTML 標題、分數或按鈕。
`layout.js` 明確區分資訊 UI 區、遊戲區與操作 UI 區；遊戲區保留 720 × 440 局部座標。UI 事件先處理，不穿透遊戲命中判定。
滑鼠／觸控使用轉換後座標。Enter 開始／暫停／繼續，空白鍵得分，R 重開；暫停不允許遊戲得分但保留 UI 操作。
共用 FPS 元件顯示於左上角，專案設定 `game.diagnostics.showFps` 決定預設顯示，畫布 FPS 按鈕可切換；重開回到專案預設。
重開移除舊 sketch 並建立新狀態；離頁解除事件並呼叫 p5 remove。狀態由 draw 讀取與更新，不隨每幀重建。
