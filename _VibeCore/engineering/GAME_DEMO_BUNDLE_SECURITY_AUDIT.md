---
status: active
updated: 2026-10-22
scope: game-demo-bundle-and-dependencies
---

# game-demo Bundle 與相依安全稽核

## 目的

本文件記錄 M8-2 的可重現基準、最佳化邊界與相依修補結果。它不改變 Tag 部署規則；普通 Branch Push 仍只保存程式碼，不會部署。

## Bundle 基準與結果

M8-1 的 `game-demo` 產物只有一個主要 JavaScript Bundle：

- 入口 JavaScript：1,279,377 bytes，gzip 約 384.34 kB。
- 問題：既有 Route 與 `import('p5')` 雖然採動態匯入，但 `inlineDynamicImports: true` 又把它們合併回入口，平板首次載入必須先下載及解析完整 p5 引擎。

M8-2 保留其他 Project 的單檔策略，只對 `game-demo` 關閉 `inlineDynamicImports`，並把 p5／其驗證相依明確命名為 `p5-engine` chunk：

| 成品 | Raw | gzip | 載入時機 |
|---|---:|---:|---|
| 初始入口 `index-*.js` | 115,211 bytes | 43,659 bytes | HTML 直接載入 |
| 遊戲 Route `index-*.js` | 10,296 bytes | 約 4.47 kB | Route 動態載入 |
| `p5-engine-*.js` | 1,151,810 bytes | 336,094 bytes | 遊戲引擎動態載入 |

初始入口 Raw 減少約 91.0%，gzip 減少約 88.6%。整份網站仍約 1,284,288 bytes；這次最佳化的目的，是降低初始下載／解析阻塞，而不是宣稱 p5 本身消失。首頁進入遊戲 Route 後仍會下載引擎；若未來需要「按下開始才下載」，應另設載入畫面與互動 Gate。

另外，Project config 從 `import.meta.glob('./*/project.config.js')` 改為建置期 alias，只產出指定 Project 的 config，不再把其他 Project 的候選 config 一起輸出。

`p5-engine` 仍超過 Vite 500 kB 警告門檻。這是已知且可解釋的單一引擎 chunk；本次沒有調高 `chunkSizeWarningLimit` 隱藏警告。若要再縮小，需評估替換／客製化 p5，而不是只改警告數字。

## 相依安全

原里程碑記錄 5 項 high，但在 2026-10-22 依當下 advisory database 重跑時已變成 9 項 high：`@vue/server-renderer`、`immutable`、`nanoid`、`picomatch`、`postcss`、`rollup`、`source-map-js`、`vite`、`vue`。其中 Vite 是直接開發相依，其餘為傳遞相依。

執行相容範圍內的 `npm audit fix`，只更新 lockfile，未使用 `--force`、未改動 manifest 的版本範圍。主要修補版本如下：

- Vite 7.3.7、Rollup 4.64.12。
- Vue／`@vue/server-renderer` 3.5.44。
- immutable 5.1.9、nanoid 3.3.20、picomatch 4.0.7。
- PostCSS 8.5.31、source-map-js 1.2.2。
- p5 維持 2.3.4。

修補後 `npm audit --json` 為 0 info／low／moderate／high／critical。

## 驗證方式

```bash
cd platform/frontend
VITE_PROJECT=game-demo MODUCORE_DEPLOY_TARGET=cloudflare npx vite build
npm audit --json
npm run test:game
```

完整驗收另包含 dineCore、project-b Build、前端相關測試與 Worker 測試；結果記錄於執行里程碑。建置輸出的 hash 檔名會隨內容改變，不應寫死於部署腳本。
