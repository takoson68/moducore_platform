# eatGoMap 文件索引

本目錄保存 `eatGoMap` 的需求探索、介面草稿、來源資料與後續規格整理；不承載平台共用規則。

## 閱讀順序

1. [`sources/HACKMD_INITIAL_REQUIREMENTS_2026-11-04.md`](./sources/HACKMD_INITIAL_REQUIREMENTS_2026-11-04.md)：2026 年 11 月 4 日擷取的 HackMD Markdown 原文快照。
2. [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md)：目前已知產品需求、畫面架構、資料概念、API 邊界與開發順序。
3. [`MAP_HOME_PROTOTYPE.md`](./MAP_HOME_PROTOTYPE.md)：目前可瀏覽首頁的完成範圍、未完成功能與驗證結果。
4. [`../modules/index.md`](../modules/index.md)：目前模組入口與 Google Maps 整合範圍。
5. [`../decisions/D006_favorites_api_and_store.md`](../decisions/D006_favorites_api_and_store.md)：收藏清單的瀏覽器保存方式與手動名稱／地址 API 邊界。
6. [`../decisions/D007_favorite_map_markers.md`](../decisions/D007_favorite_map_markers.md)：收藏後的本機座標快取與地圖標記規則。
7. [`../decisions/D008_place_id_indexeddb_cache.md`](../decisions/D008_place_id_indexeddb_cache.md)：目前 Place ID、IndexedDB、30 日逾期更新流程。
8. [`../decisions/D005_favorite_place_details_on_save.md`](../decisions/D005_favorite_place_details_on_save.md)：已被後續決策取代的歷史決策；D004 為更早的方案紀錄。
9. [`SOURCE_REGISTRY.md`](./SOURCE_REGISTRY.md)：外部需求文件、原始草稿圖與本地備份位置。
10. [`assets/大阪食旅共享地圖與日誌.png`](./assets/大阪食旅共享地圖與日誌.png)：手機介面草稿原圖備份。

## 文件狀態

- 本目錄內容目前屬於需求探索與規劃資料。
- Staging 目標為 `eatgomap-staging`，網址為 `https://eatgomap-staging.takoson68.workers.dev`；Worker 同源提供前端、eatGoMap 暫用收藏 API 與專用 D1，不代表合作方正式 API。Google Maps Key 從 GitHub `staging` Environment Secret 注入，最終網域的 API／來源限制待網域確定後設定。
- 未標示為正式 API 契約、資料庫 Schema 或已完成實作者，均不得視為現況證明。
- 專案方向、限制與假設的主文件仍為 [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md)。
