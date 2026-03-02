# 新專案啟動 Checklist

本文件用於建立新專案時的最小合法檢查清單。

目的不是提供風格建議，
而是避免再次犯下已知的邊界錯誤、auth 錯誤與資料責任錯誤。

---

## 1. 專案身份

- 已建立 `projects/<project-name>/project.config.js`
- `project.config.js` 的 `name`、`tenant_id`、`modules` 與實際專案目標一致
- `.env` 或啟動方式中的 `VITE_PROJECT` 已指向正確專案
- 專案現況描述不得與真實工程狀態脫節

## 2. 模組邊界

- 每個模組都有自己的 `index.js` 入口
- 模組資料需求落在模組自己的 `api/`、`service.js`、`store.js`
- 不得為了單一模組需求修改 `platform/frontend/src/` 共享 API helper
- 不得讓 project-level service 成為多模組共用的業務狀態中心
- page / component 的登入、資料、可見性判斷，不得跨模組偷讀其他模組內部狀態

## 3. 資料責任

- endpoint、payload、response mapping、adapter 邏輯已優先收斂在模組或 project-local API 邊界
- 共享層只承載真正跨專案、跨模組都成立的 transport 能力
- 若某項需求只服務單一專案或單一模組，不得提升為平台共用能力
- 若需要新增共享能力，必須先留下工程提案或演化記錄

## 4. Auth Pattern

- 前端登入真相來源只有一個：`authStore`
- `login / restoreSession / logout` 全部走 `world.authApi()`
- route guard 與 auth UI 只依賴 `authStore.isLoggedIn()` 或 `authStore.state.user`
- 不得建立第二份 project-local auth state 來決定是否登入
- 若需要 `role / company_id / name`，應優先補齊後端 `/api/login` 與 `/api/session` payload
- project-specific session API 若存在，只能作為補充資料或後端 context 驗證，不得成為前端 auth gate

## 5. 導覽與可見性

- 導覽顯示由 route meta 與平台既有可見性機制推導
- 未登入、已登入、不同角色的模組可見性規則已明確定義
- 不得把可見性邏輯分散到多份互相競爭的 state
- 若 layout 依登入狀態切換 sidebar / topbar / module visibility，判斷源頭必須一致

## 6. 後端對齊

- `/api/login` 可在該專案 tenant 下正確登入
- `/api/session` 可正確還原使用者身份
- 若專案需要額外身份欄位，後端登入與 session payload 已補齊
- 模組 API 的 tenant / company / role 隔離規則已定義
- 若平台 API client 遇到 `401` 會自動登出，必須事先檢查 token 傳遞策略是否穩定

## 7. 測試資料與資料庫

- 本機資料庫已建立該專案需要的 schema
- 若平台以 `users` 為統一帳號表，新專案不得私造獨立帳號模型來繞過平台
- seed 與 demo data 的引用關係必須符合平台既有資料使用方式
- 至少有一組可驗證登入與資料讀取的測試帳號

## 8. 驗證步驟

- 驗證未登入狀態下的首頁與公開模組行為
- 驗證登入後 auth UI 是否穩定維持已登入狀態
- 驗證重整頁面後 `restoreSession()` 能正確還原
- 驗證首屏 API 不會在登入後立即 `401` 並把使用者自動登出
- 驗證至少一條 employee 路徑與一條 manager 路徑
- 執行 build，確認產物可被目前部署方式載入

## 9. 文件落地

- 若本次專案建立暴露新 friction，必須記入 engineering / new_engineering / feedback 正確位置
- 已修正 issue 不得留在 `KNOWN_ISSUES.md`
- 若形成可重複使用的方法，應抽象成平台規範，不得把單一專案名稱寫成規範本體

## 10. 啟動前最後確認

- 這次設計是否新增了第二份真相來源
- 這次資料需求是否被錯誤提升到共享層
- 這次 auth 判斷是否依賴 project-specific session 鏈而不是平台 auth flow
- 這次規範是否寫成依賴單一專案名稱才能成立

若以上任一答案是「是」，
不得直接進入實作。
