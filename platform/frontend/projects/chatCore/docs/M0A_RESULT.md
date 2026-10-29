---
status: passed
authority: chatcore-experiment-result
updated: 2026-10-29
implemented: true
---

# M0a：chatCore 入口與控制台驗證結果

## 結果摘要

M0a 的範圍完成：`chatCore` 可作為獨立前端 Project 載入，入口頁及控制台由 Project 自有模組註冊，沒有修改平台 Router／Container 核心、dineCore、game-demo 或公開聊天室程式。

## 實作範圍

- Project 身分為 `name: 'chatCore'`、`tenant_id: 'chatCore'`，包含 `entry` 與 `console` 模組。
- `/` 顯示實驗入口；`/console` 顯示會員管理、聊天室管理、一對一私人連線的未開放狀態。
- 其他 Project 連結採 chatCore 本地明確清單，目前只登錄 Game Demo Staging；使用新分頁開啟，不附帶 token 或 ticket。
- Project 文件與本里程碑、M0 驗證結果已建立 chatCore 專屬索引。
- 本階段未建立登入、會員 API、WebSocket、WebRTC 或聊天室訊息。

## 驗證

| 項目 | 結果 | 證據 |
| --- | --- | --- |
| chatCore production build | 通過 | `VITE_PROJECT=chatCore npm run build:cloudflare -- --outDir /tmp/moducore-chatcore-m0a`，Vite 7.3.7，75 modules，build 完成；輸出留在 `/tmp`，未複製到 backend/public。 |
| 入口頁 | 通過 | 本機瀏覽器 `http://127.0.0.1:5173/` 顯示「私人聊天室實驗」及 `/console` 導覽。 |
| 控制台深層路徑 | 通過 | 直接開啟 `http://127.0.0.1:5173/console` 可載入控制台；三類功能均顯示「尚未開放」。 |
| Project 連結 | 通過 | Game Demo 連結於新分頁開啟 `https://game-demo-staging.takoson68.workers.dev/`；link URL 不包含 token、ticket 或登入 query。目標頁載入其既有 Game Demo 首頁。 |
| dineCore 既有入口 | 通過 | 以 `VITE_PROJECT=dineCore` 的本機 Vite 實例載入 `/`，顯示原桌邊點餐入口、菜單、購物車及訂單追蹤導覽。 |
| game-demo 既有入口 | 通過 | 以 `VITE_PROJECT=game-demo` 的本機 Vite 實例載入 `/`，顯示既有遊戲畫布及公開聊天室入口。 |
| 未登入資料顯示 | 通過（範圍確認） | chatCore 頁面沒有登入初始化或會員資料來源，控制台僅呈現固定能力狀態和 Project 連結。 |

本階段完成建置及瀏覽器手動檢查，沒有新增或執行測試套件。未部署。

## Gate 判定

**M0a Gate 通過。** M0a 沒有建立會員或聊天室操作功能，也沒有驗證跨 Project 登入授權；Game Demo Staging 的實際登入邊界仍由目標 Project 自行處理。本報告只記錄連結導航與頁面載入。

## 里程碑停止點

先由使用者檢討 chatCore Project 定位、入口／控制台資訊與 Project 連結方式。是否進入 M1（兩個瀏覽器建立 RTCDataChannel）需另行決定。
