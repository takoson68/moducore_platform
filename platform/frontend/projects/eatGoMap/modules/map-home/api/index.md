# map-home API 模組入口

## 範圍

本目錄處理 `map-home` 對 eatGoMap Worker 收藏 API 的傳輸呼叫。API/D1 只同步 Place ID 收藏清單；地點詳情與使用者自訂欄位由 `store.js` 經平台 Storage capability 保存於瀏覽器。

## 閱讀順序

1. `favoritesApi.js`：Place ID 清單、建立與刪除請求。
2. `../store.js`：API 呼叫時機、ID 對應、30 日詳情更新與本機持久化。

## 邊界

- 此 API client 不呼叫 Google Places API；Place Details 由頁面按 Place ID 查詢。
- Worker API 只接收／回傳 Place ID，不接收地點名稱、地址、座標、電話或個人欄位。
- 後端收藏清單是收藏事實來源；Store 只保存 API 投影與本機逐 ID 地點記錄。
