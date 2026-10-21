# 可選繪圖引擎

平台提供適配工廠，由遊戲模組選用並註冊至遊戲容器。Container 與 Game 不依賴特定引擎。

`p5.js` 提供 `createP5Engine({ element, width, height, draw, pointer, key })`。
`prepare()` 延遲載入 p5 並等待 Canvas 就緒；`start()` 啟動 p5 原生循環，`stop()` 暫停並清除時間基準，`dispose()` 移除 sketch 與 Canvas。
`draw(p, seconds)` 在每次繪製時執行；暫停或首幀的 seconds 為零，遊戲自行決定狀態更新。pointer 使用畫布邏輯座標。繪圖與玩法回呼由遊戲模組持有。
`redraw()` 可在停止循環時重繪 UI；適配器暫停後仍傳遞輸入，是否允許遊戲操作由模組判斷。
`label` 可由遊戲提供畫布的輔助說明，鍵盤事件會交給模組判斷。
目前 Canvas 採固定邏輯解析度，使用 CSS 等比例縮放，不建立額外動畫循環。

`fpsOverlay.js` 提供可重用 `createFpsOverlay()`，由既有繪製循環量測半秒平均 FPS，支援 enabled 開關與暫停顯示，不依賴 Container 或特定遊戲。
