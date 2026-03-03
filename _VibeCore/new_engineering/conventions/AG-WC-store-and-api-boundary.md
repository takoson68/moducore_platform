# Convention Template

Title: Store And API Boundary
Status: candidate
Scope: platform
Statement:
- `world.store` 只承載前端執行期狀態，不得被當成共享事實來源。
- 模組 `service.js` 負責流程協調，不得成為隱藏的長期 state center。
- 模組 `api/` 或 backend/mock API 才是共享真相的交換邊界。
- 若資料需要跨頁、跨角色、跨模組保持一致，必須建模為 API truth，而不是 store truth。
Evidence:
- 2026-03-03 friction：`DineCore` 討論過「既然 store 掛在 world 上，是否可直接取代 service/API」，最終明確收斂為 store 僅做 runtime state，API 才承接共享真相。
When to Promote:
- 至少兩個專案在 store 與 API 邊界上出現相同誤解。
- 新專案建立流程已需要明確檢查 store 是否被當成共享真相。
When to Demote:
- 若平台未來完全改採不同的 runtime state model，則此規範可重新整理或轉併。
Exceptions:
- 純 UI 狀態，例如 modal 開關、active tab、未提交草稿。
Notes:
- 這條規範的重點不是弱化 store，而是防止 store 僭越 API truth。
