# 收藏 API 與前端 Store 邊界

## Decision

- 收藏清單由 eatGoMap Worker API／D1 作為事實來源；D1 保存 Place ID、收藏來源、建立時間及使用者在收藏頁手動輸入的自訂名稱與地址。D1 不保存 Google 回傳的名稱、地址或座標。
- `map-home` 模組 Store 是前端狀態投影，透過 `world.services.storage()` 將 API 回傳的收藏快取於目前瀏覽器的 IndexedDB；每次載入都以 API 清單更新 Store，快取不作為離線寫入或事實裁決來源。
- Place ID 是長期保存的 Google 地點識別值。Google Places 回傳名稱與地址只在目前頁面記憶體使用；收藏底圖 POI 時只提交 Place ID 與本專案來源，不呼叫 Place Details。座標快取另依 D007 處理。
- Worker API 不接收 Google 回傳的名稱、地址或座標。使用者手動輸入的自訂名稱與地址以 Place ID 關聯保存。若使用者沒有填任何自訂欄位，API 清除該欄位值但保留收藏事實。
- 搜尋建議選取仍會呼叫 Places API 取得當次畫面所需欄位；收藏時只將 Place ID 與專案自己的來源值送至 Worker API。Google 名稱／地址不寫入持久層；座標依 D007 暫存於瀏覽器。
- 使用者明確按下「載入 Google 名稱與地址」時，前端才以 Place ID 取得 `displayName`、`formattedAddress`、`location`，只在當次頁面顯示；不自動把其內容帶入手動編輯欄位。
- 新增、編輯或移除收藏都必須先由 Worker API 成功，再更新前端 Store／瀏覽器快取。API 不可用時不得將本機快取當成成功寫入。

## Context

- 使用者希望收藏在重新整理後仍存在；ModuCore World 規定 Backend 是事實權威，Store 只能保存其狀態投影，因此本機只能作快取，不能獨立裁決收藏存在與否。
- Platform Module Template Contract 要求模組狀態由模組 Store 持有；Storage Contract 規定狀態唯一來源是 Store，本機 I/O 必須經 `world.services.storage()`。
- Google Places 政策允許保存 Place ID；Places API 座標可依服務條款暫存最多 30 個連續日，超過期限必須刪除。其他 Places 內容不得因改存瀏覽器、D1 或其他媒介而規避保存限制。

## Impact

- 收藏清單以 API/D1 為權威，可跨瀏覽器讀取；瀏覽器 IndexedDB 僅快取 API 回傳的投影。
- D1 保存 Place ID 與 eatGoMap 自有收藏欄位，不保存 Google Place Details 名稱、地址或座標；瀏覽器座標快取依 D007 最多保存 30 日。
- 收藏底圖 POI 不再呼叫 Place Details；Place Details 僅用於搜尋選取或使用者明確要求載入 Google 資訊時。
- 規則依據：`_VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md` §4、`platform/frontend/src/app/container/services/storage.md`、Google [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)。

## Status

- superseded by [`D008_place_id_indexeddb_cache.md`](./D008_place_id_indexeddb_cache.md); retained as history.
