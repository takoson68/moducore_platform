# Convention Template

Title: Layout And Route Resilience
Status: candidate
Scope: platform
Statement:
- `LayoutRoot.vue` 必須是可降級容器，不得把任一模組 store、route 或 capability 視為永久存在。
- page / component 若依賴其他模組能力，必須先做存在檢查；缺席時只能降級顯示或隱藏能力，不得報錯。
- 導航顯示必須依已註冊 route 或 `meta.nav` 投影，不得硬寫成「所有模組永遠都在」。
- 移除任一非核心模組時，shell 必須仍可載入，且該模組的導航入口必須同步消失。
Evidence:
- 2026-03-03 friction：`DineCore` 的 `LayoutRoot` 直接依賴 `entry / cart / staff-auth` store，`MenuPage` 直接依賴 `cartStore`，導致模組拆卸性不足，需要回頭收斂成 route-aware 與 optional dependency 模式。
When to Promote:
- 至少兩個專案出現 shell 因模組缺席而報錯、或導航仍顯示未註冊模組入口的同型問題。
- 新專案建立流程已明確需要把「可缺席依賴檢查」納入 checklist 與 scaffold。
When to Demote:
- 若平台未來改成強制所有專案皆採固定模組集合且不允許模組拆卸，則此規範可降級。
Exceptions:
- 核心啟動必要模組可視為 required module，但仍應在 shell 或 boot 層明確宣告，不得默默假定。
Notes:
- 這條規範的目標不是禁止模組互動，而是禁止 shell 與頁面把其他模組當成硬依賴。
- 若涉及資料共享真相，仍應先確認資料責任歸屬與 API 邊界是否已經清楚。
