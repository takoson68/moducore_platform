# eatGoMap 地圖首頁視覺原型

## 目的

先建立可瀏覽的手機首頁，用來確認 `eatGoMap` 的視覺基線、資訊層級與主要操作節奏；使用 Google Maps JavaScript API 顯示底圖，另有獨立的暫用 Worker/D1 收藏 API，尚未串接合作方後端。

## 已完成

- 建立 `map-home` Module 與 `/` 公開路由。
- 建立 Project `LayoutRoot.vue` 與樣式入口。
- 沿用草稿的暖白背景、深綠主色、圓角搜尋列與手機卡片語言。
- 提供美食／旅遊分類、距離切換、Marker 選取與地點卡片更新。
- 提供地圖／收藏／日誌底部導覽；收藏頁可查看及移除 API 收藏，日誌頁顯示尚未開放提示。
- 桌面版增加視覺原型說明，手機版維持單一 App 畫面。
- 接入 Google Maps JavaScript API，在大阪難波顯示真實底圖與五個合成地點標記；點選標記會更新地點卡並移動地圖中心。
- 搜尋欄透過 Google Maps JavaScript API 的 Places Autocomplete Data API 搜尋店家／地標與地址；結果以目前地圖視野作為排序偏好，選取後取得地點名稱、地址與座標，將地圖移至該處並放置搜尋標記。此功能使用 Places API (New)，需要 Google Cloud 啟用該 API 並使用同專案的 Maps JavaScript API Key。
- Google 底圖 POI 店家／地標可點選；點擊後保留 Google 原生資訊窗，eatGoMap 自有卡片提供收藏操作。確認收藏時先將 Place ID 送到 Worker API，再用 Place ID 查詢並保存詳情至本機 IndexedDB；自訂 Marker 點選仍開啟原有地點卡片。
- 按下收藏後，Worker API/D1 成功建立收藏，收藏頁立刻顯示該筆資料；`map-home` Store 同步更新並經平台 Storage capability 寫入瀏覽器。
- Places 搜尋建議選取會取得當次顯示所需的名稱、地址、座標與電話；收藏時將資料按 Place ID 保存於本機。使用者自訂名稱、地址與個人日記也在該筆本機資料中。
- 收藏頁中仍在快取期限內的座標會畫成高辨識亮紫色星號 Marker；點擊 Marker 會開啟 eatGoMap 自有地點卡，顯示已保存的自訂名稱、地址、電話與個人日記，尚未建立的打卡、評分與照片則顯示未建立狀態。缺少資料或超過 30 天時，以 Place ID 查詢並更新地點詳情。詳見 [`D008_place_id_indexeddb_cache.md`](../decisions/D008_place_id_indexeddb_cache.md)。
- 卡片右上角 × 會清除選取地點、搜尋建議與搜尋欄內容，並移除搜尋結果暫存 Marker。
- 選取搜尋結果後，地點卡片顯示 Google 回傳的名稱與地址；未收藏時可收藏，已收藏時主要按鈕顯示「打卡」。收藏狀態由 Worker API/D1 保存，Store 維護 API 狀態投影與瀏覽器快取；打卡尚未串接後端。
- 地圖預設中心為台北中山區；載入時即向瀏覽器請求目前位置，成功後將 Google 地圖移至目前座標並顯示藍色定位點。右側定位按鈕使用 SVG 準星圖示並可重試；定位失敗時提示檢查 GPS、瀏覽器位置權限或 HTTPS 連線。
- 首頁初始時不預選地點，也不顯示地點資訊卡；使用者選取搜尋結果或點選地圖地點標記後才顯示卡片。切換美食／旅遊篩選不會自動選取其他地點。
- 左上角品牌標誌與標題可點擊重新載入網站，方便安裝為主畫面捷徑後手動取得最新部署版本。
- 地圖首頁啟用期間停用頁面層級的捏合縮放，避免地圖手勢同時縮放整頁；離開首頁時還原原始 viewport 設定。Google Maps 仍使用地圖自身手勢縮放。
- 手機版 Header 已精簡為 Logo 與搜尋框同列，移除標題及使用者頭像；底部導覽列高度為 56px，讓地圖保留更多可視空間。Staging v0.1.4 已部署此版面。
- 以 `VITE_GOOGLE_MAPS_API_KEY` 從本機環境載入 API Key，並提供無 Key 時的清楚提示與靜態視覺回退。

## 明確未完成

- 本機 `.env.local` 已設定 Google Maps API Key，實際底圖已載入；最終網域限制尚未設定。
- 目前定位只在地圖初次載入時或使用者點擊重試時取得單次位置；不持續追蹤、不分享位置，亦不寫入後端。
- 尚未呼叫合作方後端 API；目前收藏呼叫 eatGoMap 專用 Worker API。
- 收藏由 Worker API／D1 僅保存 Place ID；Store 透過 `world.services.storage()` 逐 ID 保存地點詳情與使用者自訂欄位至 IndexedDB。缺漏或超過 30 日時，使用 Place ID 重新查詢並更新。
- 打卡、日誌與身分尚未建立持久狀態；收藏由 eatGoMap Staging D1 保存，尚未接合作方 API。
- 收藏頁讀取 API 回傳的 Place ID 並以 ID 取出本機地點詳情，可移除收藏；地點名稱可點擊編輯，自訂資料保存至 IndexedDB。日誌頁尚未提供功能。

## 本機地圖設定

1. 複製 `platform/frontend/.env.local.example` 為 `platform/frontend/.env.local`。
2. 將 `VITE_GOOGLE_MAPS_API_KEY` 設為已啟用 Maps JavaScript API 的瀏覽器 Key。
3. 在 Google Cloud Console 啟用 Maps JavaScript API 與 Places API (New)，並將 Key 的 API 限制同時允許這兩項 API；再將網站來源限制在實際開發／部署網域（本機 Vite 可用 `http://localhost:5173/*` 與 `http://192.168.50.113:5173/*`）。
4. 重新啟動 Vite。若使用其他區網 IP 或連接埠，需將對應來源加入 Key 的網站限制。

在開發電腦上可使用 `http://localhost:5173/` 測試瀏覽器定位。要在同一 Wi-Fi 的 iPhone 上測試本機修改，需使用受信任的 HTTPS 本機憑證：執行 `npm run dev:https`，再開啟 `https://192.168.50.113:5174/`；iPhone 必須安裝 `eatgomap-dev-ca.cer` 並在「設定 → 一般 → 關於本機 → 憑證信任設定」啟用完整信任。僅供本機開發，CA 私鑰與伺服器憑證不可提交至 Git。

Vite 的 `VITE_` 變數會進入瀏覽器，因此此 Key 不是伺服器密鑰；必須用 API 與網站來源限制保護，且不可提交 `.env.local`。

公開 Staging 建置只從 GitHub `staging` Environment Secret `VITE_GOOGLE_MAPS_API_KEY` 注入 eatGoMap。Key 會包含在瀏覽器下載的前端程式中；最終網域確定後，再在 Google Cloud 限制 Maps JavaScript API、Places API (New) 與允許來源。

## 驗證

- `VITE_PROJECT=eatGoMap npm run build:cloudflare -- --outDir /tmp/eatgomap-favorite-markers-final`：成功，74 modules；已確認本次程式可完成 Cloudflare 前端建置。瀏覽器收藏／重整後 Marker 的實際互動尚待驗收。
- 本機 `http://localhost:5173/` 瀏覽器確認 Places Autocomplete 可回傳店家建議；選取後成功取得店名、地址與座標並移動地圖。Google Cloud Places API (New) 已可回應目前本機 Key；最終網域 Key 限制仍待設定。
- `VITE_PROJECT=eatGoMap npm run build:cloudflare -- --outDir /tmp/eatgomap-map-poi-close-check`：成功，72 modules。本機用有效 Place ID 觸發 Maps POI click event，驗證名稱／地址載入共用卡片、搜尋欄為空；點擊 × 後卡片關閉且搜尋欄清空。實機直接點選底圖 POI 尚待驗收。
- `VITE_PROJECT=eatGoMap npm run build:cloudflare -- --outDir /tmp/eatgomap-google-maps-check`：成功，72 modules。
- 本機 Google 地圖已載入大阪難波區域，畫面可讀到 Google 地圖圖資來源與兩個美食標記；尚未驗證所有分類下的標記、縮放與手機裝置操作。
- 尚未驗證 Key 的最終網域限制；使用者決定待網域確定後再設定 Google Cloud 限制。
- Staging `0.1.2` 已由 GitHub Environment Secret 注入 Key 並實際載入 Google 地圖；`0.1.3` 已部署左上角 Logo 重新整理按鈕，`0.1.4` 已部署精簡 Header，`0.1.5` 已部署背景同色與定位按鈕定位功能，`0.1.6` 已部署首次載入即請求位置及 SVG 準星圖示。
- 桌面瀏覽器：首頁、分類切換與 Marker 顯示正常。
- 390 × 844、DPR 3 手機 viewport：文件寬高等於 viewport，沒有水平溢出；首頁內容與底部導覽可見。
- 瀏覽器 Console：沒有 error 或 warning。
- 手機頁面捏合縮放鎖定與 Google Maps 地圖內縮放尚未在實機驗收。

## 下一步

- 使用者確認最終網域後，限制 Google Maps Key 的 Maps JavaScript API 權限與網站來源。
- 確認 Google Cloud 專案已啟用 Places API (New) 及帳單；最終網域確定後再限制 API Key 的允許來源。
