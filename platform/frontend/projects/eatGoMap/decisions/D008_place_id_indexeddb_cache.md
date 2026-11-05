# Place ID 收藏與瀏覽器詳情快取

## 決策

- Worker API／D1 是收藏存在與否的唯一事實來源；D1 收藏表只保存 `place_id`。
- 前端以 `world.services.storage()` 將每個地點存於 IndexedDB，key 為 `eatGoMap:place:{place_id}`。內容包含 Place ID、地點名稱、地址、座標、電話、快取取得時間，以及使用者自訂名稱、地址和個人日記。
- 底圖 POI 新增收藏時，先以 Place ID 查詢並驗證名稱、地址、座標，再建立 D1 Place ID 收藏；API 成功後將完整詳情寫入本機 IndexedDB 並讀回核對。詳情查詢失敗或不完整時不建立收藏，且每個 Place ID 連續失敗最多兩次。搜尋結果已持有完整欄位時則沿用該資料，避免重複查詢。移除收藏須先由 API 成功，再移除該 ID 的本機資料。
- 地點詳情只從 Google Maps JavaScript API `Place.fetchFields()` 回傳的 `place` 物件讀取：`displayName`、`formattedAddress`、`nationalPhoneNumber` 與 `location`，再統一轉成 `{ name, address, phone, coordinates: { lat, lng } }`。`location` 同時接受具 `toJSON()` 的 `LatLng` 與可直接讀取的 `{ lat, lng }`。瀏覽器 Network 顯示的 `GetPlace` 位置式陣列是 Google SDK 內部傳輸格式，不直接交給 Store，也不作為應用程式欄位契約。
- 搜尋結果已取得的欄位直接落入該 ID 的本機記錄；底圖 POI 則在確認收藏時，以 Place ID 查詢必要詳情，確認有效後才建立 D1 收藏並寫入本機。
- 每次載入 API 收藏清單時，以 Place ID 對應 IndexedDB 記錄。缺少記錄或詳情取得時間已滿 30 天時，呼叫 Places Details 取得 `displayName`、`formattedAddress`、`location`、`nationalPhoneNumber`，更新地點欄位與取得時間；使用者自訂欄位及日記保持不變。名稱、地址與座標齊備才視為詳情取得成功並落地。相同 ID 的並行更新合併為單一請求。Place Details 請求 15 秒逾時；每個 Place ID 最多允許連續失敗兩次，失敗數與最後錯誤訊息以 IndexedDB 持久保存，達上限後不再呼叫（包括重新載入頁面），成功時清除失敗數。頁面開啟時只在收藏 hydrate 與 Places library 都完成後執行一次自動更新，並逐筆等待 Store 完成；切換底部頁籤、失敗狀態或 Store 寫回都不再觸發查詢。移除收藏不會清除失敗數，以免同一 ID 重新加入後重複呼叫。
- 地圖收藏 Marker 使用本機記錄中仍在 30 日快取期間內的座標，視覺採高辨識亮紫色星號。點擊後開啟 eatGoMap 自有地點卡，顯示本機保存的自訂名稱、地址、電話與個人日記；尚未建立資料契約的打卡、評分與照片明確標示為未建立，不偽造內容。API 清單未包含的 ID 不作為收藏顯示，且其本機記錄會清理。

## 現況

- Worker API 僅提供收藏清單 GET、Place ID POST、Place ID DELETE。
- Migration `0005_place_id_only.sql` 將既有 D1 收藏資料收斂為單欄 `place_id`，保留 ID 並移除收藏來源、時間與手動欄位。
- Staging 遠端已部署的版本會隨每次修正更新；實際發布版本與驗收狀態以 `_workspace/CURRENT_WORK.md` 為準。

## Google 資料政策註記

本決策定義產品資料流，不宣告 Google 條款允許把所有 Places 欄位快取 30 天。正式採用前須確認名稱、地址、電話與座標各自適用的條款；Place ID 長期保存與座標 30 日規則另參照 Google 官方政策及服務條款。

## 狀態

- accepted; base Place ID／IndexedDB flow and Migration 0005 are deployed to Staging. The Place Details timeout, required-field persistence, two-failure cap, error diagnostics, membership-only automatic refresh and accurate save status are included in the v0.1.11 Staging candidate.

## 來源

- [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
