# Role Contract: Store

Derived From: INV-08, INV-09

本文件整理 Store 的責任邊界與事實權威關係，
內容來源為 `ai_new/world/01_WORLD_MODEL.md`、`ai_new/world/02_WORLD_BOUNDARIES.md`、`ai_new/world/03_WORLD_API_RULES.md`。

## 角色定義
- Store 用於保存 World 在前端運行所需的狀態投影。
- Store 內容通常來自後端或平台初始化結果。

## 事實權威關係
- Backend 是事實權威，Store 不是事實權威。
- Store 狀態必須可由 API 回應更新、修正或推翻。

## 行為限制
- 不得以 Store 狀態推翻後端事實。
- 不得以非 API 回應資料作為世界裁決依據。

---

End of Store Role Contract
