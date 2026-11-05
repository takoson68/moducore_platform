# Google 原生 POI 資訊窗與收藏

## Decision

- 定義點選 Google 底圖 POI 時的資訊呈現與收藏資料範圍，避免為了收藏而額外查詢 Places Place Details。

## Status

- superseded by [`D005_favorite_place_details_on_save.md`](./D005_favorite_place_details_on_save.md)

## Context

- Google Maps 底圖可在使用者點選 POI 時呈現 Google 管理的原生資訊窗。
- Maps JavaScript API 的 POI click event 提供 `placeId`、點擊位置 `latLng` 與 DOM event；它不提供原生資訊窗的名稱、地址等欄位。
- `placeId` 可保存以供地點識別；若要把 Google 地點名稱、地址與精確座標讀入 eatGoMap 自訂卡片，仍須另行請求 Place Details。
- 專案希望優先控制 Google Places API 用量，同時保留兩位使用者共同收藏地圖地標的能力。

## Options Considered

- 選項 A：點 POI 後查 Place Details，將地點欄位放入 eatGoMap 自訂卡片，再收藏。
- 選項 B：保留 Google 原生 POI 資訊窗；eatGoMap 另提供收藏操作，只保存 `placeId` 與自有收藏資料。
- 選項 C：不讀 Google 地點欄位，由使用者為收藏地點自行輸入名稱或備註。

## Chosen Direction

- 採用選項 B。
- POI 點選後讓 Google 原生資訊窗顯示 Google 提供的地點資訊；eatGoMap 的收藏操作放在自有 UI 中，不嘗試讀取或複製原生資訊窗內容。
- 收藏資料以 Google `placeId` 作為外部地點識別，另存本專案需要的收藏者、收藏時間及使用者自行建立的內容。
- 收藏動作本身不呼叫 Place Details。若未來產品要求 Google 名稱、地址或精確座標出現在 eatGoMap 自有卡片，另行評估該次 Place Details 用量與 Google 資料保存政策。

## Native Info Window Capabilities

- 原生資訊窗由 Google Maps 管理；顯示名稱、地址、分類／地點屬性、輔助資訊及外連入口視 POI 可用資料而異，不保證每個地點都有相同內容。
- 原生資訊窗的版面及內容不能由 eatGoMap 直接改色、增刪欄位或插入自己的「收藏」按鈕。應在 Google 原生資訊窗以外提供收藏控制。
- Maps JavaScript API 的 `google.maps.InfoWindow` 可由應用程式自行建立，並控制 `content`、`headerContent`、`headerDisabled`、`ariaLabel`、`maxWidth`、`minWidth`、`position`、`zIndex` 與自動平移等選項；這是自訂資訊窗，不是替 Google 原生 POI 資訊窗換皮。
- 參考畫面中的學校 POI 原生資訊窗可見名稱、地址、無障礙入口資訊及開啟 Google 地圖的入口；其他 POI 可能只提供部分欄位。

## Impact

- 對 API 用量的影響：依此決策收藏底圖 POI 不新增 Place Details 請求；Maps JavaScript API 地圖載入仍依 Dynamic Maps 用量計算。
- 對資料模型的影響：可長期保存 `placeId`；不得把 Google 原生資訊窗的文字當成可由程式取得或永久保存的欄位。
- 對 UI 的影響：收藏按鈕需出現在 eatGoMap 自有操作區，Google 原生資訊窗內容與自有操作卡片分開呈現。
- 對現況的影響：2026-11-05 已完成底圖 POI 點擊流程調整：不呼叫 Place Details、不阻止 Google 預設資訊窗；eatGoMap 自有卡片只提供以 `placeId` 為識別的本機示意收藏。收藏尚未寫入後端或跨裝置同步。

## Follow-up

- 底圖 POI click handler 不呼叫 `fetchFields()`，也不呼叫 `event.stop()`；依事件 `placeId` 顯示自有「加入收藏」操作。
- Places 搜尋建議是獨立流程，目前選取搜尋建議仍呼叫 Place Details 取得名稱、地址與座標；本決策不涵蓋取消搜尋流程的 Details 查詢。
- 與後端 API 契約確認收藏端點以 `placeId` 作為唯一外部地點參照，並分開保存使用者自有欄位。
- 若要在收藏列表顯示 Google 名稱、地址或座標，先確認即時查詢方式、Places 費用與 Google Places 儲存政策。

## References

- [Google Maps JavaScript API Map click and IconMouseEvent](https://developers.google.com/maps/documentation/javascript/reference/map)
- [Google Maps JavaScript API Info Windows](https://developers.google.com/maps/documentation/javascript/infowindows)
- [Google Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)
