# Convention
本文件定義 `World` pipeline 分段（`prepare / activate / effects`）的實作規則，
用於避免 browser-only 行為與 runtime 可變狀態逐步滲透回核心能力層。

Title: Pipeline Staging Rules
Status: candidate
Scope: platform

## 適用範圍
- `src/world/*`
- `src/entry-client.*`
- `src/entry-server.*`
- 與 runtime 啟動流程直接相關的 provider / adapter

## Pipeline 定義
1. `prepare(context)`：server-safe 初始化（註冊、config、router 前置、資料準備）
2. `activate()`：啟用 runtime（SSR compose app / CSR mount 前後流程）
3. `effects()`：browser-only effects（storage hydrate、DOM hook、事件）

## `prepare()` 禁止事項
- 禁止 DOM 操作（`document`、元素查詢、直接 UI 操作）
- 禁止事件綁定與派發（`addEventListener` / `dispatchEvent` / `CustomEvent`）
- 禁止讀寫 `localStorage` / `sessionStorage`
- 禁止直接以 `window` / `location` 作為 runtime 判定來源
- 禁止建立長生命週期 singleton 狀態（不得寫入 module-global mutable state）

## `activate()` 裁決
- SSR：
  - 允許 compose app / router ready
  - 禁止 mount DOM
- CSR：
  - 負責 mount 與 router 啟動
  - 禁止重複初始化核心資源（不得雙重 bootstrap）

## `effects()` 允許事項
- 允許 storage hydrate（client-only）
- 允許 DOM hook（title / scroll / focus 等）
- 允許 event listener 綁定與解除
- 允許 client-only UI 行為（例如 reset hook 暴露）

## 裁決原則
- 流程問題優先回到 `World` pipeline 分段，不下沉到核心能力實作。
- 若某行為無法明確歸入 `prepare / activate / effects`，視為設計訊號，應先補契約再實作。

## 驗收方向
- 可對任何啟動邏輯明確說明它屬於哪一段 pipeline。
- 不需要在多處 `typeof window !== 'undefined'` 才能理解系統啟動邏輯。
- SSR/CSR 模式差異由 pipeline 分段承載，而非散落於核心檔案。
