# Role Contract: Container

Derived From: INV-03, INV-05, INV-06, INV-07

本文件整理 Container 的責任邊界與行為限制，
內容來源為 `_VibeCore/world/01_WORLD_MODEL.md` 與 `_VibeCore/world/02_WORLD_BOUNDARIES.md`。

## 角色定義
- Container 是世界中取得能力的唯一合法入口。
- 未註冊進 Container 的能力，在世界中視為不存在。

## 主要責任
- 註冊能力。
- 提供能力。
- 隔離模組之間的直接依賴。

## 不承擔的責任
- 不判斷顯示。
- 不決定權限。
- 不控制流程。
- 不裁決世界狀態。

---

End of Container Role Contract
