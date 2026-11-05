# 收藏資料落地與地圖標記

## Decision

- 使用者按下收藏後，先由 eatGoMap Worker API/D1 建立收藏事實；成功後才更新 `eatGoMapFavoriteStore`，再透過 `world.services.storage()` 將 API 收藏投影寫入瀏覽器。
- 瀏覽器持久資料包含 Place ID、收藏來源、建立時間、使用者自訂名稱／地址，以及可用於標記的 Google 地圖座標與到期時間。API／D1 不接收 Google 名稱、地址或座標。
- Places API 回傳的緯經度只暫存 30 個連續日，到期後由 Store 清除；重新載入資料時會丟棄過期座標。Place ID 可長期保存。
- Google Places 回傳名稱與地址只在本次頁面記憶體顯示，不寫入瀏覽器或 D1。使用者自行輸入的名稱／地址仍可保存為 Project 自有欄位。
- 搜尋結果已取得 Places API 座標時，收藏操作將座標只寫入本機快取；底圖 POI 收藏不保存 map click event 游標座標（該點不保證為 POI 中心），也不額外呼叫 Place Details。收藏若尚無座標，使用者之後在收藏頁明確按「載入 Google 名稱與地址」時取得 Places API 位置並更新本機 30 日座標快取。
- 地圖從 Store 的未過期座標建立收藏 Marker；刪除收藏或座標到期時，相應 Marker 隨 Store 更新移除。座標不由 D1 跨瀏覽器同步，其他瀏覽器須在自己的頁面載入地點位置後才能建立 Marker。

## Context

- World 要求前端 Store 是後端事實的可更新投影；因此收藏的新增／移除由 Worker API/D1 裁決，瀏覽器的 `savedPlaces` 僅作 API 同步快取，不獨立裁決收藏是否存在。
- 使用者需要收藏在重整後仍可用，並用座標在地圖畫出收藏點。
- Google Maps Platform Service Specific Terms 允許 Places API 回傳的緯經度暫存最多 30 個連續日；Place ID 不受快取限制。Places 回傳名稱與地址不在此座標例外內。Maps JavaScript API 的 map click event 只提供游標下方座標，故不將其當成地標中心保存。

## Impact

- 收藏頁在 API 成功後立即顯示收藏；有 Places API 座標的收藏可在同一瀏覽器重整後支援地圖 Marker。
- 名稱／地址若未由使用者手動輸入，重新整理後不保留 Google 回傳文字；清單仍以 Place ID 顯示，使用者可重新載入資訊或填入自己的欄位。
- D1 Schema/API 不保存 Google 座標，故此方案不增加 D1 的 Google Places 內容留存。

## Status

- superseded by [`D008_place_id_indexeddb_cache.md`](./D008_place_id_indexeddb_cache.md); retained as history.

## Sources

- Google [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- Google Maps Platform [Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
