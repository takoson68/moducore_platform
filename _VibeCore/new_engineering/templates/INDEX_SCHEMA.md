# Index Schema

本文件定義 new_engineering/index.md 的固定區塊與項目格式。

## 固定分類區塊

- Notes
- Templates
- Conventions
- Boundaries
- Evolution Logs
- Promotion Proposals

## 項目格式（每筆固定欄位）

Title: <名稱>
Path: <相對於 new_engineering/ 的路徑>
Type: note | convention | template | boundary
Status: <convention 時填寫；其他類型可留空>
Scope: platform
Evidence: <依類型引用，使用逗號分隔>

## Evidence 規則

- Conventions → 必須引用 Notes
- Boundaries → 必須引用 Conventions
- Promotion Proposals → 可引用 Boundaries / Conventions / Evolution Logs

## Category / Type Mapping

- Notes → note
- Templates → template
- Conventions → convention
- Boundaries → boundary
- Evolution Logs → note
- Promotion Proposals → note
