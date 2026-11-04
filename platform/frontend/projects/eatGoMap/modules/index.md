# eatGoMap Modules 規劃入口

本目錄是 `eatGoMap` 的模組收集入口；`modules/index.js` 依平台 Module Runtime 掃描並安裝 Project 宣告的模組。

## 目前模組

- `map-home`：地圖首頁原型；透過 Google Maps JavaScript API 顯示難波底圖與合成地點標記，使用者點擊定位按鈕時透過瀏覽器 Geolocation 取得目前位置，不呼叫後端 API。缺少本機 API Key 時保留靜態地圖視覺並提示設定方式。

規劃中的後續能力包含共同收藏、地點打卡與旅遊日誌；正式模組拆分須在對應里程碑開始前另行確認。
