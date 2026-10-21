# game-demo Release 成品瘦身紀錄

## 目的

`game-demo` 不應因 Vite 共用 `public/` 而攜帶其他 Project 的圖示、`mtk2mad` 教材圖片或舊 vendor。此紀錄固定 M8-1 的保留邊界與可重跑驗收方式。

## 瘦身前基準

基準 Release：`dep_game-demo_v0.1.1`。

- Manifest：48 個網站檔案，共 2,316,900 bytes。
- 混入項目：18 個 `assets/icons/*`、`assets/vue.svg`、24 個 `mtk2mad/*` 圖片／圖示／vendor，以及 `.assetsignore`。
- 額外雜訊：本機建置目錄曾出現 `.DS_Store`，不得進入正式成品。

## 保留與移除規則

保留：

- `index.html`。
- Vite 產生的 hashed JavaScript 與 CSS。
- `index.html` 明確引用的 `/vite.svg` favicon；其內容與既有共用 favicon 完全一致。

移除：

- `assets/icons/*` 與 `assets/vue.svg`；game-demo 程式碼沒有引用。
- `mtk2mad/**`；屬其他舊功能，遊戲沒有引用。
- `.DS_Store`、`.assetsignore` 等建置非必要檔案。
- 沒有字型檔可移除或保留；遊戲樣式使用系統字型。

實作方式：`vite.config.js` 在 `VITE_PROJECT=game-demo` 時改用 `projects/game-demo/public`，其他 Project 繼續使用共用 `public/`，避免影響 dineCore 與 project-b。

## 驗收結果

- Build：4 個檔案，共 1,284,517 bytes；比基準少 44 個檔案、1,032,383 bytes（44.6%）。
- 清單：`index.html`、`vite.svg`、一個 hashed JS、一個 hashed CSS。
- Package：manifest 4/4、ZIP `unzip -t` 無錯誤，且不存在 `mtk2mad`、共用 icons、`.DS_Store` 或 `.assetsignore`。
- HTTP Smoke：`/`、`/vite.svg`、`/playground` 均為 200，首頁只引用上述 JS／CSS／favicon。
- 瀏覽器：標題、版本標籤與 Canvas 正常；Enter、空白鍵可操作，console 無 warning／error。
- 單元測試：遊戲生命週期與 public 隔離規則共 7/7 通過。

本里程碑只驗證本機 Build 與封包，不建立 Tag、不發布 Release、不部署 Staging。
