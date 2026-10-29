# chatCore 私人聊天室實驗 Context

---

## 0. 文件用途

本文件記錄 chatCore 的背景、目標、範圍、限制與假設；專案里程碑詳見 `docs/P2P_CHAT_MILESTONES.md`。

## 1. 專案目標

- 建立獨立的私人聊天室實驗 Project。
- 驗證每一項即時通訊能力後再決定是否繼續。
- 保持會員身分、Project 授權及租戶資料的邊界清晰。

## 2. 成功條件

- 可透過 `VITE_PROJECT=chatCore` 獨立載入。
- 入口頁可進入控制台，深層路由可直接載入。
- 未實作能力顯示為未開放；Project 連結不攜帶其他 Project 的登入憑證。

## 3. 使用者與場景

- 主要使用者：少量實驗參與者及管理者。
- 核心場景：查看實驗狀態、進入已完成的聊天室能力、前往已登錄的其他 Project。

## 4. 商務範圍

- 涵蓋私人文字聊天室的技術可行性驗證。
- 不定位為商用產品，不承諾 SLA 或正式支援。

## 5. 功能範圍

- 現階段：入口頁與聊天室實驗頁；實驗頁提供整合視圖及專注聊天兩種版面。M1b 建立 Full Mesh 基礎；M2 加入裝置本機 IndexedDB history/outbox；M3 加入逐 Peer received／persisted ACK、messageId 去重與可視條件 READ；M4 加入 dineCore 來源驗證、ChatCore Session、一次性房間 Ticket 及 20 個在線裝置上限。
- 後續候選：逐房成員管理、離線 queue 與跨網路／TURN 驗證，均須依執行書逐階段完成 Gate。

## 6. 非目標

- 不改寫既有公開聊天室。
- 不建立獨立帳號庫或跨 Project SSO。
- 不傳送媒體／檔案，不做跨裝置歷史同步。
- M9 前只提醒備份，不實作備份上傳。

## 7. 已知限制

- M4 的 Auth 僅限 chatCore 專屬 Worker，透過 dineCore Auth Service 驗證後，按 `CHATCORE_MEMBER_USERNAMES` 帳號名稱 allowlist 發放 chatCore scope Session。真實 Staging 的 secret、allowlist 與 service binding 尚待配置和驗證。
- allowlist 內測試會員都可加入彼此知道 roomId 的實驗房間；目前沒有逐房成員清單、建立／移除房間管理 API 或管理 UI。整合視圖不授予管理權限。
- M2/M3 的訊息 history、outbox 與 READ 狀態只存於目前瀏覽器 IndexedDB；不跨裝置同步。M3 ACK 僅逐本次連線 Peer 確認，沒有離線 queue，不能視為帳號級或跨裝置送達。
- 單房最多 20 名會員及同時 20 個在線裝置是實驗上限，不是穩定性承諾。

## 8. 外部依賴

- 頁面執行依賴 ModuCore 前端 Project 載入及模組註冊機制。
- 私人 Signaling、WebRTC DataChannel、本機 IndexedDB 與 M4 實驗身分 Ticket 流程已接入；TURN 成功率／成本、服務端離線 queue 與備份上傳尚未完成。

## 9. 假設

- 第一階段以既有 dineCore 身分作來源；Worker 代驗帳密後立即撤銷上游 dineCore token，僅將 chatCore scope Session 傳給 chatCore 前端。這是實驗過渡方案，不是跨 Project SSO。
- 長期目標為會員資料與共用身分能力獨立於單一 Project；共用身分不代表自動取得各 Project 權限。
- 第一階段僅使用合成測試明文，真實私人訊息上線前另行決定 E2E 加密方案。


## M4 身分與房間准入

chatCore 專屬 Worker 透過 dineCore Auth Service 驗證來源會員，且只允許 `CHATCORE_MEMBER_USERNAMES` 實驗名單。Worker 立即撤銷登入流程產生的 dineCore token，再簽發 30 分鐘 chatCore scope Session 及 60 秒一次性房間 Ticket。每房限制 20 個會員與 20 個在線裝置；allowlist 是目前的實驗 cohort，尚無逐房管理名冊（留待 M4a）。M4 的自動測試通過，真實 Staging Auth Service、Secret 與名單設定尚待驗證。詳見 `docs/M4_RESULT.md`。
