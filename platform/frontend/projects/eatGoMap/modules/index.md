# eatGoMap Modules 規劃入口

本目錄是 `eatGoMap` 的模組收集入口；`modules/index.js` 依平台 Module Runtime 掃描並安裝 Project 宣告的模組。

## 目前模組

- `map-home`：地圖首頁與目前導覽頁面；收藏事實由 Worker API／D1 的 Place ID 清單裁決，D1 僅存 `place_id`。Store 經 `world.services.storage()` 依 Place ID 在本機 IndexedDB 保存名稱、地址、座標、電話與使用者自訂欄位／日記；缺少或超過 30 天時，使用 Place ID 重新查詢並更新，同一 Place ID 連續失敗兩次後停止再次呼叫。收藏 Marker 使用有效快取座標。現行決策見 [`D008_place_id_indexeddb_cache.md`](../decisions/D008_place_id_indexeddb_cache.md)；D006、D007 為先前階段紀錄。

規劃中的後續能力包含共同收藏、地點打卡與旅遊日誌；正式模組拆分須在對應里程碑開始前另行確認。
