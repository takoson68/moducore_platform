# eatGoMap 食旅共享地圖與日誌

---

## 0. 本專案的角色

本目錄為 `eatGoMap` 的前端 Project 實例入口，目前用於保存專案背景、需求探索、介面草稿與前後端合作邊界。

本目錄只負責：

- 導引本專案的閱讀順序。
- 保存本專案的規劃資料與來源。
- 宣告未來實作所需的 Project 邊界。

本目錄不負責：

- 定義或修改平台 World、Engineering 或 API 規則。
- 代表目前已有可執行的頁面、模組或路由。
- 定義合作方後端的內部架構。

## 1. 專案目的

- 解決兩位專案成員共同收藏美食與旅遊地點、記錄打卡及整理旅程足跡的需求。
- 以手機優先的地圖介面串起地點探索、收藏、打卡與日誌整理流程。
- 建立可逐步串接合作方後端 API、地圖服務與照片儲存服務的前端 Project 邊界。

## 2. 閱讀順序

1. `index.md`
2. `PROJECT_CONTEXT.md`
3. `project.config.js`
4. `docs/index.md`
5. `docs/sources/HACKMD_INITIAL_REQUIREMENTS_2026-11-04.md`
6. `docs/PROJECT_BRIEF.md`
7. `docs/SOURCE_REGISTRY.md`
8. `decisions/`
9. 未來有實作後，再進入 `layout/`、`modules/` 與 `styles/`

## 3. 專案結構

- `index.md`：本專案唯一文件入口。
- `PROJECT_CONTEXT.md`：專案背景、目標、範圍、限制與假設。
- `project.config.js`：Project 最低身分與規劃狀態宣告。
- `docs/`：需求整理、來源登錄與原始草稿備份。
- `decisions/`：已知專案邊界與後續取捨紀錄。
- `layout/`：預留的 Project 視覺殼層目錄，目前沒有實作。
- `modules/`：預留的業務模組目錄，目前沒有實作。
- `styles/`：預留的 Project 樣式目錄，目前沒有實作。

## 4. 入口與啟動點

- 預定專案選擇方式：`VITE_PROJECT=eatGoMap`。
- 主要設定來源：`project.config.js`。
- 目前入口：`/`，由 `map-home` 模組提供地圖首頁視覺原型。
- 啟動方式：`VITE_PROJECT=eatGoMap`。
- 首頁已接入 Google Maps JavaScript API 與合成地點標記；本機未設定有效 API Key 時會顯示設定提示及靜態回退。定位與後端 API 尚未完成。

## 5. 模組與頁面範圍

- 預定核心能力：地圖探索、共同收藏、地點詳情、個人打卡、美食日誌、旅遊日誌。
- 預定主要頁面：地圖、收藏、日誌。
- 預定主要互動：搜尋地點、依距離與分類篩選、收藏、評分、評論、照片、建立旅程與查看足跡。
- `map-home`：提供地圖首頁視覺原型、合成 Marker、分類切換、距離切換與地點卡片互動。
- 收藏與日誌目前只呈現底部導覽外觀，尚無對應路由或功能。

## 6. 專案限制

- 初期使用者為兩位已知成員，身分驗證不是第一階段阻塞項目。
- 後端由合作開發者維護並部署在獨立伺服器，前端只透過 API 交換資料。
- Google Maps Key 的最終網站來源限制、地點搜尋、照片儲存、CORS、API 認證與環境分流尚待確認。
- 本階段已接入 Google Maps 底圖；尚未串接合作方後端或照片服務。

## 7. 文件 Registry

- `PROJECT_CONTEXT.md`
- `project.config.js`
- `docs/index.md`
- `docs/sources/HACKMD_INITIAL_REQUIREMENTS_2026-11-04.md`
- `docs/PROJECT_BRIEF.md`
- `docs/MAP_HOME_PROTOTYPE.md`
- `docs/SOURCE_REGISTRY.md`
- `docs/assets/大阪食旅共享地圖與日誌.png`
- `decisions/D001_external_backend_boundary.md`
- `decisions/D002_identity_scope.md`
- `decisions/D003_shared_contract_repository.md`
- `layout/index.md`
- `layout/index.js`
- `layout/LayoutRoot.vue`
- `modules/index.md`
- `modules/index.js`
- `modules/map-home/index.js`
- `modules/map-home/routes.js`
- `modules/map-home/pages/index.vue`
- `modules/map-home/googleMaps.js`
- `styles/index.md`
- `styles/sass/main.sass`

## 8. 裁決聲明

- 本檔為 `eatGoMap` Project 的唯一文件入口。
- 本檔只管理本 Project 的閱讀順序、規劃範圍與文件註冊。
- 本 Project 的正式治理與工程行為仍以 `_VibeCore/` 合法導讀鏈為準。
- 若本檔與上層規則衝突，以上層規則為準。
