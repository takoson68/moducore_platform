# Boundary
本文件宣告 Router Guard 與 Auth 判斷在多 runtime（CSR / SSR）下的邊界，
用於避免 guard 直接綁定 default singleton world，造成 request-scope 汙染與行為不一致。

Title: Guard/Auth Runtime Boundary
Status: candidate
Scope: platform

## 核心主張
- guard 不得直接 import default singleton `world`
- guard 必須依賴 world 注入的 `authContext` / `authPolicy`
- SSR 與 CSR 的 guard 行為差異若存在，必須是顯式策略，而非隱性副作用

## 邊界裁決

### Guard 層允許依賴
- router instance（當前 runtime）
- world 注入的 auth policy / auth context
- route meta / access 規則

### Guard 層禁止依賴
- default singleton `world`
- module-global auth state 作為唯一判斷來源
- browser globals（`window/location`）作為 auth 決策依據

## SSR 策略（需明確選擇）

### 策略 A：`public-only`
- SSR 路徑略過 auth guard
- 僅渲染公共頁內容
- 受保護頁改由 CSR 接手或導頁

### 策略 B：`full-auth`
- 由 `headers/session` 建立 `authContext`
- SSR guard 與 CSR guard 共用同一份 auth policy 規則

## 禁止事項
- 禁止將「SSR 不跑 guard」當作隱性預設，卻未在文件中定義策略
- 禁止在 guard 中自行推斷 runtime mode 並散落分支邏輯

## 驗收方向
- 可明確指出 guard 的 authContext 來源（World 注入）
- 可明確指出 SSR 使用 `public-only` 或 `full-auth`
- Code review 可判定 guard 是否違反 request-scope 邊界

## 與 World-first 的關係
- `B003` 定義 World 是流程整合層
- 本文件補充：guard/auth 判斷也必須受 World runtime ownership 管理
