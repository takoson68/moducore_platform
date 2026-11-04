# Cloudflare Workers／D1 移植研究索引

## 範圍與狀態

本目錄保存 2026-10-15 起的 Worker/D1 移植計畫、API 盤點與歷史驗收結果。這些文件描述當時觀察，部分里程碑與平台現況已被後續實作／報告取代；不可直接把報告中的「下一步」「尚未部署」當作目前狀態。

## 閱讀路由

1. 先讀本目錄 [`README.md`](./README.md) 了解報告年代與主題。
2. 架構與執行規格研究才讀 [`EXECUTION_SPEC.md`](./EXECUTION_SPEC.md)；API 舊系統盤點讀 `m2/README.md`，再按需讀 `m2/` 的 API matrix、migration inventory 或資料檔。
3. Auth、Employee、部署結果依任務讀相應 `M3_*`、`M4_*`、`STAGING_*` 報告；它們只作歷史證據。
4. 當前 Staging Tag／版本控制台里程碑以 `_workspace/_reports/2026-10-21_tag_release_version_console/index.md` 與其 Execution Plan 為準。
5. 現行操作流程以 `_VibeCore/engineering/index.md` 與其導向的 Contract／部署手冊為準；線上現況需重新查驗。

## 權限與裁決

- 本索引只裁定歷史報告的閱讀路由，不授權工程、Git 或遠端操作。
- 舊 SQL、fixture、route inventory 均不得直接視為最新 Schema、完整 API Contract 或可直接執行的資料操作。
- `m2/` 是一次性盤點資料，修改或重跑前須確認輸出範圍及是否覆蓋既有資料。
