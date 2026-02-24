# Convention
本文件定義 V2 runtime provider / runtime bridge 的命名與檔案落點規則，
用於避免 provider/resolver 邏輯散落於 container / api / router 各檔案，增加閱讀成本。

Title: Runtime Provider Naming and Placement
Status: candidate
Scope: platform

## 核心規則
- V2 的唯一入口：`src/world/index.js`
  - 必須匯出 `createWorld` 與 World contract
- 若保留 `world.js`
  - 僅作 façade
  - 不承擔 runtime bridge 細節
- runtime bridge / provider 統一放在：`src/runtime/*Provider.js`

## 命名規則
- 檔名使用 `*Provider.js`
  - 範例：`storageProvider.js`、`routesBucketProvider.js`、`eventNotifierProvider.js`
- 若同時存在 resolver 與 provider
  - 以 provider 為主命名（resolver 為 provider 內部實作細節）
- 禁止以臨時名稱長期存在
  - 例如：`tmpBridge.js`、`runtimeHack.js`、`fixSSR.js`

## 放置裁決
- world runtime ownership 細節：`src/world/*`
- provider / adapter 實作：`src/runtime/*`
- core capability 實作：`src/app/*`
- 模式入口：`src/entry-client.*` / `src/entry-server.*`

## 禁止事項
- 禁止把 provider / resolver 邏輯零散塞入 `container/api/router` 各檔案作為主路徑
- 禁止讓命名無法看出「這是 runtime bridge 還是 core capability」
- 禁止在多個資料夾重複定義同一類 provider（造成裁決不清）

## 驗收方向
- 新人可從 `src/world/index.js` 追到主要 runtime flow 與 provider 裝配位置
- provider 命名一致，不需靠全文搜尋 `resolver` 才知道系統如何運作
- Code review 可快速判定某 bridge 邏輯是否放錯目錄
