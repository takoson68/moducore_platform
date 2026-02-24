# Convention
本文件定義 V2 平台在 SSR 模式下的 payload 最小結構與序列化規則，
用於避免 payload 結構漂移、敏感資料外送與 hydration 不一致。

Title: SSR Payload Schema
Status: candidate
Scope: platform

## 適用範圍
- `src/world/*`
- `src/entry-server.*`
- `src/entry-client.*`
- 與 SSR payload 匯出 / 還原直接相關的 provider / adapter

## `SSRPayload` 最小欄位
- `version`
  - 用途：schema 版本號，避免未來破壞性變更無法辨識
- `context`
  - 用途：SSR runtime context 摘要（可裁切）
  - 限制：不得全量塞入敏感 headers
- `project`
  - 用途：專案資訊（至少 `name`）
  - 可選：feature flags（僅可序列化且無敏感資訊）
- `routesBucket`
  - 用途：模組路由結果（僅可序列化部分）
- `registry`（可選）
  - 用途：module list / ui slot manifest 等必要資訊
- `initialState`（可選）
  - 用途：client hydrate 基線狀態
  - 限制：需明確來源（stores snapshot 或 domain state）

## JSON-safe 硬規則
- payload 一律必須可 `JSON.stringify()`
- 禁止包含：
  - function
  - class instance
  - router object
  - DOM object
  - Request / Response instance
  - 非必要敏感 runtime 物件

## 資料最小化原則
- payload 僅承載 client hydrate 或首屏 render 必需資料
- 非首屏必要資料不得預設進 payload
- 涉及敏感資訊時，需先做裁切/映射，不得直接暴露原始 context

## Hydration 一致性原則
- `initialState` 必須能與 client hydrate 後狀態對齊
- 若資料無法序列化，必須明確標註為 client-only data，不得隱性 fallback

## 驗收方向
- `JSON.stringify(ssrPayload)` 必須成功
- 欄位結構可對照 schema 做驗證（至少版本與必要欄位）
- SSR / CSR 首屏資料不因 payload 結構漂移而出現明顯跳畫面
