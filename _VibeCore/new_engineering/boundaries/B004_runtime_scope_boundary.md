# Boundary
本文件宣告平台在「runtime scope（作用域）」上的邊界，
用於約束哪些狀態必須 request-scope，哪些能力允許 singleton。

Title: Runtime Scope Boundary
Status: candidate
Scope: platform

## 核心主張
- 只要資料會因 request / 使用者 / session / URL 改變，即不得由 module-global singleton 承載。
- `World` 是 runtime owner，必須持有 request-scope runtime 狀態。
- singleton 僅允許承載靜態描述與純函式能力，不可承載 runtime 可變資料。

## Scope 裁決表

### request-scope（SSR 併發必須）
- `container instances`（含 store / service 實例）
- `api runtime context`（`projectName` / `headers` / token）
- `uiRegistry`（`slotMap` / `version`）
- `router instance + history state`
- `routesBucket`（模組 install 結果）

### singleton（允許）
- `module manifests`（靜態描述：路由宣告、meta、權限規則）
- `pure helpers`（例如 nav projection 純函式、schema / validator）
- `compile-time config`（不含 runtime 可變欄位）

## 禁止事項
- 禁止以 module-global mutable state 暫代 request-scope runtime state（即使「先能跑」）。
- 禁止用 `window.*` bucket 作為 runtime 真實資料來源。
- 禁止將 request-specific 狀態塞入 helper / utility 模組作為隱性快取。

## 驗收方向
- 可對任一 runtime 狀態明確回答其 scope（request-scope 或 singleton）。
- 新增 SSR/runtime 模式時，不需要在多處追查 module-global state 汙染來源。
- Code review 可依本表裁決某狀態是否放錯層。

## 與 World-first 的關係
- 本文件是 `B003_world_first_integration.md` 的補充邊界。
- `B003` 定義「誰負責流程」；本文件定義「狀態應放在哪個 scope」。
