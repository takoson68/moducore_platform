# 收藏時取得地點基本資料

## Decision

- Google 底圖 POI 仍由原生資訊窗呈現；只有使用者明確按下「加入收藏」時，才用 POI click event 的 `placeId` 查詢必要地點欄位。

## Status

- superseded by [`D006_favorites_api_and_store.md`](./D006_favorites_api_and_store.md)

## Context

- Google 原生 POI 資訊窗可顯示地點名稱與地址，但 Maps click event 只提供 `placeId` 和點擊座標，不提供資訊窗文字。
- 使用者希望收藏頁直接顯示名稱、地址與經緯度，減少自行輸入。
- 本決策取代 D004「收藏只留 `placeId`」的方案。

## Chosen Direction

- 點擊 POI 本身不呼叫 Place Details，且不呼叫 `event.stop()`，保留 Google 原生資訊窗。
- 使用者確認收藏時，才以 `placeId` 建立 `Place`，使用 `fetchFields()` 只要求 `displayName`、`formattedAddress`、`location`；不要求電話、評分、評論或照片。
- 成功後將 `placeId` 與經緯度 POST 到 eatGoMap D1 API；API 不接受名稱與地址欄位。Place ID 可長期保存，座標於保存後 30 天內清除。相同 `placeId` 已存在時先讀回資料，不重複查詢 Place Details。
- 搜尋建議選取仍依原有流程取得地點資料；收藏已選搜尋結果時沿用已取得欄位，不再額外查一次。
- Places API 名稱與地址只留在前端目前頁面的記憶體；收藏清單需要時，使用者可明確要求重新載入 Place Details。不得將 Places API 回傳欄位寫入 D1。收藏頁可由使用者點擊名稱，另行輸入自訂名稱與地址；這些欄位不從 Google 回傳值預填，並以獨立欄位保存。

## Impact

- 只有明確收藏且 D1 尚無該 `placeId` 時才新增 Place Details 請求，減少探索時反覆點地標造成的查詢；資料清單在名稱／地址需要時才重新查詢。
- D1 的經緯度供後續以收藏座標建立地圖標籤，會於 30 天內清除；Worker 每小時排程清理，到期時 API 讀取也會立即清理。本次不更動地圖 Marker 顯示流程。
- `displayName` 屬於 Place Details Pro 欄位；加入收藏時的查詢會按所要求欄位的最高適用 SKU 計費。
- 收藏頁的 Google Places 名稱與地址僅供使用者明確載入後在當次頁面記憶體顯示，搭配 Google 地圖 attribution；使用者自訂欄位與 Google 回傳欄位分開處理，不擷取原生資訊窗 DOM 或文字。

## References

- [Google Maps JavaScript API `IconMouseEvent`](https://developers.google.com/maps/documentation/javascript/reference/map#IconMouseEvent)
- [Google Maps JavaScript API Place Details](https://developers.google.com/maps/documentation/javascript/place-details)
- [Google Places API 儲存政策](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
