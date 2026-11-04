# eatGoMap 地圖首頁視覺原型

## 目的

先建立可瀏覽的手機首頁，用來確認 `eatGoMap` 的視覺基線、資訊層級與主要操作節奏；使用 Google Maps JavaScript API 顯示底圖，尚未串接合作方後端。

## 已完成

- 建立 `map-home` Module 與 `/` 公開路由。
- 建立 Project `LayoutRoot.vue` 與樣式入口。
- 沿用草稿的暖白背景、深綠主色、圓角搜尋列與手機卡片語言。
- 提供美食／旅遊分類、距離切換、Marker 選取與地點卡片更新。
- 提供地圖／收藏／日誌底部導覽外觀。
- 桌面版增加視覺原型說明，手機版維持單一 App 畫面。
- 接入 Google Maps JavaScript API，在大阪難波顯示真實底圖與五個合成地點標記；點選標記會更新地點卡並移動地圖中心。
- 左上角品牌標誌與標題可點擊重新載入網站，方便安裝為主畫面捷徑後手動取得最新部署版本。
- 以 `VITE_GOOGLE_MAPS_API_KEY` 從本機環境載入 API Key，並提供無 Key 時的清楚提示與靜態視覺回退。

## 明確未完成

- 本機 `.env.local` 已設定 Google Maps API Key，實際底圖已載入；最終網域限制尚未設定。
- 未要求瀏覽器定位權限。
- 未呼叫合作方後端 API。
- 未建立收藏、打卡、日誌或身分的持久狀態。
- 未建立收藏與日誌頁面。

## 本機地圖設定

1. 複製 `platform/frontend/.env.local.example` 為 `platform/frontend/.env.local`。
2. 將 `VITE_GOOGLE_MAPS_API_KEY` 設為已啟用 Maps JavaScript API 的瀏覽器 Key。
3. 在 Google Cloud Console 將 Key 限制為 Maps JavaScript API，並將網站來源限制在實際開發／部署網域（本機 Vite 可用 `http://localhost:5173/*` 與 `http://192.168.50.113:5173/*`）。
4. 重新啟動 Vite。若使用其他區網 IP 或連接埠，需將對應來源加入 Key 的網站限制。

Vite 的 `VITE_` 變數會進入瀏覽器，因此此 Key 不是伺服器密鑰；必須用 API 與網站來源限制保護，且不可提交 `.env.local`。

公開 Staging 建置只從 GitHub `staging` Environment Secret `VITE_GOOGLE_MAPS_API_KEY` 注入 eatGoMap。Key 會包含在瀏覽器下載的前端程式中；最終網域確定後，再在 Google Cloud 限制 Maps JavaScript API 與允許來源。

## 驗證

- `VITE_PROJECT=eatGoMap npm run build:cloudflare -- --outDir /tmp/eatgomap-google-maps-check`：成功，72 modules。
- 本機 Google 地圖已載入大阪難波區域，畫面可讀到 Google 地圖圖資來源與兩個美食標記；尚未驗證所有分類下的標記、縮放與手機裝置操作。
- 尚未驗證 Key 的最終網域限制；使用者決定待網域確定後再設定 Google Cloud 限制。
- Staging `0.1.2` 已由 GitHub Environment Secret 注入 Key 並實際載入 Google 地圖；重新整理按鈕於 `0.1.3` 隨本次變更部署。
- 桌面瀏覽器：首頁、分類切換與 Marker 顯示正常。
- 390 × 844、DPR 3 手機 viewport：文件寬高等於 viewport，沒有水平溢出；首頁內容與底部導覽可見。
- 瀏覽器 Console：沒有 error 或 warning。

## 下一步

- 使用者確認最終網域後，限制 Google Maps Key 的 Maps JavaScript API 權限與網站來源。
- 再決定地點搜尋要使用 Google Places 或由合作方 API 提供。
