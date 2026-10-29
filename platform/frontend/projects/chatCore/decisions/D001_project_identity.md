# chatCore Project 與 tenant 身分

---

## Decision

- 確認 chatCore 以前端獨立 Project 和獨立 `tenant_id` 建立，不把 dineCore 的租戶登入狀態視為 chatCore 權限。

## Status

- accepted

## Context

- chatCore 需要獨立進入頁面與控制台。
- 使用者希望最終讓會員資料獨立於 dineCore，供多個 Project 使用。
- 現階段既有帳號與 Session 仍按 tenant 隔離，跨 Project 共用身分尚未建立。

## Options Considered

- 將 chatCore 直接併入 dineCore Project 與 tenant。
- 建立獨立 chatCore Project，同時沿用 dineCore token 作登入依據。
- 建立獨立 chatCore Project 與 tenant；任何身分銜接須由後端明確授權。

## Chosen Direction

- 採用獨立 `chatCore` Project 與 `tenant_id: 'chatCore'`。
- 在後端授權契約完成前，M0a 頁面保持公開且不展示會員資料；連往其他 Project 時不附帶 token 或 ticket。

## Impact

- M0a 僅增加 Project 自有頁面與模組路由，不改平台核心或其他 Project。
- dineCore 過渡身分來源與 chatCore 授權方式仍需於身分里程碑重新驗證。
- 共用帳號若建立，仍需各 Project 獨立授權 membership、角色與資料範圍。

## Follow-up

- 進入 Auth／Worker 實作前，依 `_VibeCore/world/` 與 `_VibeCore/api/` 的導讀重新檢查 tenant 邊界。
- M0a 完成後先由使用者檢討，再決定是否進入 M1。
