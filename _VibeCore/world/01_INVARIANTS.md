# World Invariants

本文件彙整世界層「不可違反的不變量」。
內容來源以 `_VibeCore/world/02_WORLD_BOUNDARIES.md` 與 `_VibeCore/world/09_WORLD_RULES.md` 為主，
並包含 `_VibeCore/world/03_WORLD_API_RULES.md` 中的硬性邊界。

## Invariants

### INV-01 單一世界實例
- 任一時間點僅允許存在一個 World 實例。
- active World 只對應一個 tenant_id。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 1；`_VibeCore/world/09_WORLD_RULES.md` Rule 2。

### INV-02 Project 隔離
- Project 之間資料、設定、狀態必須完全隔離。
- 不得共用 store，不得跨 Project 造成影響。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 2；`_VibeCore/world/09_WORLD_RULES.md` Rule 8。

### INV-03 Container 為唯一能力入口
- Container 是世界中取得能力的唯一合法入口。
- 不得跨模組直接 import 業務能力或繞過 Container。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 3；`_VibeCore/world/09_WORLD_RULES.md` Rule 4。

### INV-04 模組不得假設彼此存在
- Module 不得假設其他 Module 必然存在。
- Module 必須可在其他 Module 缺席下安全運作。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 4；`_VibeCore/world/09_WORLD_RULES.md` Rule 6。

### INV-05 註冊定義存在
- `container.register` 是模組存在的唯一判準。
- 未註冊模組在世界中視為不存在。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 5。

### INV-06 可見性與存在分離
- 不可見模組不得被註冊、不得 init、不得影響世界。
- 可見性裁決必須在註冊前完成。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 6；`_VibeCore/world/09_WORLD_RULES.md` Rule 5。

### INV-07 低耦合為強制條件
- 低耦合不是最佳實踐，而是世界存活條件。
- 禁止依賴載入順序或隱性行為。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 7。

### INV-08 後端為事實權威，Store 為投影
- 後端資料是事實權威，Store 僅保存狀態投影。
- 若 Store 與後端資料衝突，必須以後端資料為準。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 8；`_VibeCore/world/03_WORLD_API_RULES.md` Backend Authority 與 API/Store 規定；`_VibeCore/world/09_WORLD_RULES.md` Rule 7。

### INV-09 API 為唯一事實交換邊界
- API 是 World 與 Backend 之間唯一合法的事實交換邊界。
- 禁止任何形式繞過 API 取得後端事實。
來源：`_VibeCore/world/03_WORLD_API_RULES.md`。

### INV-10 Routing 為最後防線
- Routing Guard 必須阻止未授權或不合規路徑。
- Routing 不得作為模組存在判準，也不得創造能力。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 9；`_VibeCore/world/09_WORLD_RULES.md` Rule 9。

### INV-11 PlatformConfig 最高優先
- PlatformConfig 是世界誕生前藍圖，世界行為不得違反。
- 禁止 run-time 動態改寫其核心語意。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 10。

### INV-12 Reset 為世界倒帶
- Reset 清空業務模組能力與狀態，但保留 Platform 與 PlatformConfig。
- Reset 後回到未登入世界狀態。
來源：`_VibeCore/world/02_WORLD_BOUNDARIES.md` Boundary 11；`_VibeCore/world/09_WORLD_RULES.md` Rule 10。

### INV-13 世界組成需於 build-time 決定
- World 組成必須在 build-time 完全決定。
- run-time 不得新增或變更世界結構。
來源：`_VibeCore/world/09_WORLD_RULES.md` Rule 3。

---

End of World Invariants
