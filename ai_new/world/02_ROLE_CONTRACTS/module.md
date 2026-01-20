# Role Contract: Module

Derived From: INV-03, INV-04, INV-05, INV-06, INV-07, INV-08, INV-09

本文件整理 Module 的存在條件、互動方式與責任邊界，
內容來源為 `ai_new/world/01_WORLD_MODEL.md`、`ai_new/world/02_WORLD_BOUNDARIES.md`、`ai_new/world/03_WORLD_API_RULES.md`。

## 角色定義
- Module 是世界功能與畫面的主要來源。
- Module 可被單獨註冊、卸載與替換。

## 存在條件
- 只有完成 `container.register` 的 Module 才被世界承認。
- 未通過可見性與權限裁決者不得被註冊或初始化。

## 互動方式
- Module 僅能透過 Container 與世界互動。
- Module 可呼叫 API、處理回應，並將結果交由 Store 或自身狀態使用。

## 行為限制
- 不得假設其他 Module 必然存在。
- 不得直接 import 其他模組的業務能力。
- 不得繞過 API 取得後端事實。

---

End of Module Role Contract
