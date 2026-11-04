# eatGoMap 地圖首頁視覺原型

## 目的

先建立可瀏覽的手機首頁，用來確認 `eatGoMap` 的視覺基線、資訊層級與主要操作節奏，不提前串接地圖或後端服務。

## 已完成

- 建立 `map-home` Module 與 `/` 公開路由。
- 建立 Project `LayoutRoot.vue` 與樣式入口。
- 沿用草稿的暖白背景、深綠主色、圓角搜尋列與手機卡片語言。
- 提供美食／旅遊分類、距離切換、Marker 選取與地點卡片更新。
- 提供地圖／收藏／日誌底部導覽外觀。
- 桌面版增加視覺原型說明，手機版維持單一 App 畫面。

## 明確未完成

- 未使用 Google Maps 或其他地圖 SDK。
- 未要求瀏覽器定位權限。
- 未呼叫合作方後端 API。
- 未建立收藏、打卡、日誌或身分的持久狀態。
- 未建立收藏與日誌頁面。

## 驗證

- `VITE_PROJECT=eatGoMap VITE_RELEASE_VERSION=0.0.0-prototype npm run build:cloudflare -- --outDir /tmp/eatgomap-map-home-check`：成功，71 modules。
- 桌面瀏覽器：首頁、分類切換與 Marker 顯示正常。
- 390 × 844、DPR 3 手機 viewport：文件寬高等於 viewport，沒有水平溢出；首頁內容與底部導覽可見。
- 瀏覽器 Console：沒有 error 或 warning。

## 下一步

- 先由使用者檢視視覺與資訊層級。
- 視覺方向確認後，再決定先調整首頁細節，或建立第一份地圖 SDK／API 串接里程碑。
