# Convention Template

Title: Project Services Hard Boundary
Status: candidate
Scope: platform
Statement:
- project-level `services/` 不得直接提供 module-specific business API。
- 若函式名稱、request shape、response shape 或 state shape 已帶有模組語意，必須回到該模組自己的 `service.js` 或 `api/`。
- project-level `services/` 只能承載無模組語意能力，例如 transport、auth facade、repository primitive、pure shared transform。
- project-level `services/` 不得持有模組私有 state，也不得聚合多個模組流程成跨模組業務中心。
Evidence:
- 2026-03-03 friction：`DineCore` 曾將多個模組的 mock 業務入口集中在 project-level service，造成跨模組資料中心傾向，後續需回頭拆回各模組自己的 service / API 邊界。
When to Promote:
- 至少兩個專案出現相同的 project service 越界型問題。
- 新專案建立流程已明確需要檢查 `services/` 是否承載模組語意資料入口。
When to Demote:
- 若平台未來完全取消 project-level `services/` 目錄，則此規範可降級或轉併入更上位結構規範。
Exceptions:
- 平台正式核准的共用 transport、auth wrapper 或 repository primitive。
Notes:
- 這條規範不是禁止共享能力，而是禁止 project service 長成跨模組業務中心。
