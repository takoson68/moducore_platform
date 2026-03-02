# Convention Template

Title: Project Auth Single Source Pattern
Status: candidate
Scope: platform
Statement:
- 新專案若採用平台既有登入機制，前端登入狀態必須以平台 `authStore` 作為唯一真相來源。
- 專案層不得再建立第二份平行的登入狀態來決定 `isLoggedIn`、`role`、`company_id` 或導覽可見性。
- 專案層 auth service 應沿用平台標準 auth pattern：直接包裝 `world.authApi().login()`、`restoreSession()`、`logout()`，而不是再額外建立 project-specific session 判定鏈。
- 若專案需要額外身份欄位，應先補齊 `/api/login` 與 `/api/session` 的 payload，使平台 `authStore.user` 足以支撐 UI 與權限判斷。
- project-specific session endpoint 可以存在，但其角色應限於補充資料或後端上下文驗證，不得成為前端登入真相來源。
Evidence:
- 2026-03-02 friction：`flowCenter` 額外維護 `state.context` 並依賴 `/api/flowcenter/session` 決定登入狀態，導致登入後畫面短暫成功又被舊 session / 401 流程覆蓋回未登入。
- 平台穩定模式顯示：登入邏輯若直接以 `authStore` 為準，且不再建立第二份 project-local auth truth，行為會穩定許多。
When to Promote:
- 之後新增專案再次需要基於平台登入機制建立專案 auth wrapper。
- 再次驗證此模式能穩定支撐新專案登入、還原 session、導覽可見性與 route guard。
When to Demote:
- 若未來平台正式提供新的統一 auth runtime provider，並明確取代 `authStore + authApi` 這種模式。
Exceptions:
- 專案需要獨立於平台登入的完全不同認證系統，且已明確聲明不沿用平台 `authStore`。
Notes:
- 這條規範的核心不是「禁止專案封裝 auth service」，而是禁止多重登入真相來源。
- 若 UI 權限判斷需要 `role/company_id/name`，應先修後端 payload，不要在前端補第二份 session 狀態。
- 平台標準 auth pattern 至少必須同時滿足：
- `login / restoreSession / logout` 皆經 `world.authApi()`
- `isLoggedIn` 僅由 `authStore.isLoggedIn()` 或 `authStore.state.user` 推導
- `role / company_id / name` 直接來自 `authStore.user`
- project-specific session API 不得決定前端 auth gate
