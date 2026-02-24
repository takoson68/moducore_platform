# Convention
本文件不宣告有效行為邊界，
僅作為 Boundary 文件的推導依據與假說來源。

Title: AI Report Output Location
Status: candidate
Scope: platform

## 目的
- 統一 AI / Codex 產出協作型報告文件的預設輸出位置。
- 避免每次產出報告時重複指定路徑。
- 讓協作紀錄可集中管理與回溯。

## 規則
- AI / Codex 產出報告、健檢、審查、分析摘要、清單或規劃文件時，
  預設輸出目錄為：`_workspace/_reports/`

## 檔名格式（建議）
- `YYYY-MM-DD_<主題>.md`

範例：
- `2026-02-24_SSR健檢建議報告.md`
- `2026-02-24_SSR_READY_CHECKLIST.md`
- `2026-02-24_CodeReview_API整合.md`

## 適用範圍
- SSR 健檢報告
- Code Review 報告
- 架構方案建議書
- 遷移計畫
- 除錯摘要

## 例外
- 若使用者明確指定其他路徑，應遵照使用者指示。
- 若輸出為臨時草稿／隨手筆記（非正式報告），可暫放 `_workspace/`。
